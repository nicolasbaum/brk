#![doc = include_str!("../README.md")]

use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
    thread,
    time::{Duration, Instant},
};

use brk_error::{Error, Result};
use brk_reader::{Reader, XORBytes};
use brk_rpc::Client;
use brk_types::{BlockHash, Height};
use fjall::PersistMode;
use parking_lot::RwLock;
use tracing::{debug, error, info, warn};
use vecdb::{
    Exit, RawDBError, ReadOnlyClone, ReadableVec, Ro, Rw, StorageMode, WritableVec, unlikely,
};

/// Maximum number of blocks to walk back looking for a self-consistent
/// state during recovery. A legitimate tip reorg is a handful of blocks;
/// a partial-write artifact resolves within a few too. If the limit is
/// exceeded the on-disk state is genuinely corrupt and requires operator
/// intervention — surface a fatal error instead of silently wiping weeks
/// of indexed data via `full_reset()` (see May 2026 incident where a
/// 1-block reorg colliding with a transient inconsistency triggered a
/// 945k-block reset).
const RECOVERY_WALKBACK_LIMIT: u32 = 1000;

mod constants;
mod lengths;
mod processor;
mod readers;
mod safe_lengths;
mod stores;
mod vecs;

use constants::*;
use processor::{BlockBuffers, BlockProcessor};
use readers::Readers;

pub use lengths::Lengths;
pub use safe_lengths::SafeLengths;
pub use stores::Stores;
pub use vecs::*;

pub struct Indexer<M: StorageMode = Rw> {
    path: PathBuf,
    pub vecs: Vecs<M>,
    pub stores: Stores,
    tip_blockhash: Arc<RwLock<BlockHash>>,
    safe_lengths: SafeLengths,
}

impl<M: StorageMode> Indexer<M> {
    pub fn tip_blockhash(&self) -> BlockHash {
        *self.tip_blockhash.read()
    }

    /// Pipeline-safe `Lengths` snapshot shared with `Query`. Writers
    /// advance and lower this internally; readers clamp non-series
    /// answers against this loaded snapshot.
    pub fn safe_lengths(&self) -> Lengths {
        self.safe_lengths.load()
    }
}

impl Indexer<Ro> {
    /// Live indexer stamp for diagnostics. For data reads use
    /// [`crate::SafeLengths::load`] (via `Query::height`).
    pub fn indexed_height(&self) -> Height {
        Height::from(self.vecs.blocks.blockhash.inner.stamp())
    }
}

impl Indexer {
    pub fn forced_import(outputs_dir: &Path) -> Result<Self> {
        info!("Importing indexer...");

        let indexed_path = outputs_dir.join("indexed");

        let i = Instant::now();
        let vecs = Vecs::forced_import(&indexed_path, VERSION)?;
        info!("Imported vecs in {:?}", i.elapsed());

        let i = Instant::now();
        // Refuse to silently wipe brk-data on a Stores import error. A version
        // mismatch or fjall checksum/journal error here previously triggered
        // `fs::remove_dir_all(&indexed_path)` and a from-genesis reindex; that
        // is the destructive path the walkback guard at index_() refuses, and
        // it must be refused here too. Operator must `rm -rf` the indexed dir
        // explicitly to opt into a reset.
        let stores = Stores::forced_import(&indexed_path, VERSION).map_err(|err| {
            error!(
                "Failed to import stores at {indexed_path:?}: {err:?}. Refusing to wipe brk-data; operator must investigate (delete the directory manually to opt into a from-genesis reindex)."
            );
            err
        })?;
        info!("Imported stores in {:?}", i.elapsed());

        let tip_blockhash = vecs.blocks.blockhash.collect_last().unwrap_or_default();

        let safe_lengths = SafeLengths::new();
        if let Some(lengths) = Lengths::from_local(&vecs, &stores) {
            safe_lengths.advance(lengths);
        }

        Ok(Self {
            path: indexed_path.clone(),
            vecs,
            stores,
            tip_blockhash: Arc::new(RwLock::new(tip_blockhash)),
            safe_lengths,
        })
    }

    pub fn index(&mut self, reader: &Reader, client: &Client, exit: &Exit) -> Result<()> {
        self.index_(reader, client, exit, false)
    }

    pub fn checked_index(&mut self, reader: &Reader, client: &Client, exit: &Exit) -> Result<()> {
        self.index_(reader, client, exit, true)
    }

    fn index_(
        &mut self,
        reader: &Reader,
        client: &Client,
        exit: &Exit,
        check_collisions: bool,
    ) -> Result<()> {
        self.vecs.db.sync_bg_tasks()?;

        self.check_xor_bytes(reader)?;

        debug!("Starting indexing...");

        let last_blockhash = self.vecs.blocks.blockhash.collect_last();
        // Rollback sim
        // let last_blockhash = self
        //     .vecs
        //     .blocks
        //     .blockhash
        //     .collect_one_at(self.vecs.blocks.blockhash.len() - 2);
        debug!("Last block hash found.");

        let starting_lengths = if let Some(hash) = last_blockhash {
            let (height, _) = client.get_closest_valid_height(hash)?;
            // Bounded walkback: if Lengths::resume_at fails at the target
            // height, walk back one block at a time and retry. Defends
            // against partial writes / off-by-one stamp/len mismatches in
            // auxiliary vecs that historically triggered full_reset() and
            // threw away the entire indexed directory in response to a
            // trivially-recoverable inconsistency. If the walkback exhausts
            // RECOVERY_WALKBACK_LIMIT without finding a self-consistent
            // state, surface a fatal error instead of silently destroying
            // data.
            let mut target = height.incremented();
            // Operator escape hatch: BRK_FORCE_WALKBACK_BLOCKS pre-decrements
            // the recovery target before the consistency loop runs. Use when
            // resume_at reports consistency at a height where processing
            // then fails (e.g. UnknownTxid because the txid-prefix store is
            // silently behind some auxiliary vecs). Capped at
            // RECOVERY_WALKBACK_LIMIT so it can't be used to silently wipe
            // weeks of data — the bounded retry guarantees still apply.
            if let Some(force) = std::env::var("BRK_FORCE_WALKBACK_BLOCKS")
                .ok()
                .and_then(|s| s.parse::<u32>().ok())
            {
                let force = force.min(RECOVERY_WALKBACK_LIMIT);
                let mut forced: u32 = 0;
                while forced < force {
                    match target.decremented() {
                        Some(prev) => {
                            target = prev;
                            forced += 1;
                        }
                        None => break,
                    }
                }
                warn!(
                    "BRK_FORCE_WALKBACK_BLOCKS={force} applied; recovery loop starts at {target:?} (pre-decremented {forced} block(s))",
                );
            }
            let mut walked_back: u32 = 0;
            let resolved = loop {
                if let Some(lengths) =
                    Lengths::resume_at(target, &self.vecs, &self.stores)
                {
                    if walked_back > 0 {
                        warn!(
                            "Recovered from auxiliary-vec inconsistency by walking back {walked_back} block(s); resuming from {target:?}",
                        );
                    }
                    break Some(lengths);
                }
                if walked_back >= RECOVERY_WALKBACK_LIMIT {
                    break None;
                }
                match target.decremented() {
                    Some(prev) => {
                        target = prev;
                        walked_back += 1;
                    }
                    None => break None,
                }
            };

            match resolved {
                Some(starting_lengths) => {
                    if starting_lengths.height > client.get_last_height()? {
                        info!("Up to date, nothing to index.");
                        return Ok(());
                    }
                    starting_lengths
                }
                None => {
                    error!(
                        "Indexer recovery failed: walked back {walked_back} block(s) without finding a self-consistent state. Refusing to wipe brk-data via full_reset(); operator must investigate.",
                    );
                    return Err(Error::Internal(
                        "indexer recovery exhausted walkback limit without a self-consistent state",
                    ));
                }
            }
        } else {
            Lengths::default()
        };
        debug!("Starting lengths set.");

        let lock = exit.lock();
        self.safe_lengths.lower_before(&starting_lengths);
        self.stores
            .rollback_if_needed(&mut self.vecs, &starting_lengths)?;
        debug!("Rollback stores done.");
        self.vecs.rollback_if_needed(&starting_lengths)?;
        debug!("Rollback vecs done.");
        // Derive prev_hash from the rolled-back vec rather than reusing the
        // hash returned by `get_closest_valid_height` above. The walkback
        // can resume at a height earlier than `closest_valid_height + 1`;
        // the pre-walkback hash would then make `reader.after(prev_hash)`
        // yield blocks starting one or more heights past
        // `starting_lengths.height`, skipping the blocks the truncated
        // vecs are now expecting.
        let prev_hash = self.vecs.blocks.blockhash.collect_last();
        if let Some(hash) = prev_hash.as_ref() {
            *self.tip_blockhash.write() = *hash;
        }
        drop(lock);

        let mut lengths = starting_lengths;

        let is_export_height =
            |height: Height| -> bool { height != 0 && height % SNAPSHOT_BLOCK_RANGE == 0 };

        let export = move |stores: &mut Stores, vecs: &mut Vecs, height: Height| -> Result<()> {
            info!("Exporting...");
            let i = Instant::now();
            let _lock = exit.lock();
            thread::scope(|s| -> Result<()> {
                let stores_res = s.spawn(|| -> Result<()> {
                    let i = Instant::now();
                    stores.commit(height)?;
                    debug!("Stores exported in {:?}", i.elapsed());
                    Ok(())
                });
                let vecs_res = s.spawn(|| -> Result<()> {
                    let i = Instant::now();
                    vecs.flush(height)?;
                    debug!("Vecs exported in {:?}", i.elapsed());
                    Ok(())
                });
                stores_res.join().unwrap()?;
                vecs_res.join().unwrap()?;
                Ok(())
            })?;
            info!("Exported in {:?}", i.elapsed());
            Ok(())
        };

        let mut readers = Readers::new(&self.vecs);
        let mut buffers = BlockBuffers::default();

        let vecs = &mut self.vecs;
        let stores = &mut self.stores;

        for block in reader.after(prev_hash)?.iter() {
            let block = match block {
                Ok(block) => block,
                Err(e) => {
                    // The reader hit an unrecoverable mid-stream issue
                    // (chain break, parse failure, missing blocks).
                    // Stop cleanly so what we've already indexed gets
                    // flushed in the post-loop export — the next
                    // `index` call will resume from the new tip.
                    error!("Reader stream stopped early: {e}");
                    break;
                }
            };
            let height = block.height();

            if unlikely(height.is_multiple_of(100)) {
                info!("Indexing block {height}...");
            } else {
                debug!("Indexing block {height}...");
            }

            lengths.height = height;

            vecs.blocks.position.push(block.metadata().position());
            block.tx_metadata().iter().for_each(|m| {
                vecs.transactions.position.push(m.position());
            });

            let mut processor = BlockProcessor {
                block: &block,
                height,
                check_collisions,
                lengths: &mut lengths,
                vecs,
                stores,
                readers: &readers,
            };

            processor.process_block_metadata()?;

            let txs = processor.compute_txids()?;

            processor.push_block_size_and_weight(&txs)?;

            let (txins_result, txouts_result) = rayon::join(
                || processor.process_inputs(&txs, &mut buffers.txid_prefix_map),
                || processor.process_outputs(),
            );
            let txins = txins_result?;
            let txouts = txouts_result?;

            let tx_count = block.txdata.len();
            let input_count = txins.len();
            let output_count = txouts.len();

            BlockProcessor::collect_same_block_spent_outpoints(
                &txins,
                &mut buffers.same_block_spent,
            );

            processor.check_txid_collisions(&txs)?;

            let sigops = processor.compute_sigops(&txins, &txouts);

            processor.finalize_and_store_metadata(
                txs,
                txouts,
                txins,
                sigops,
                &buffers.same_block_spent,
                &mut buffers.already_added_addrs,
                &mut buffers.same_block_output_info,
            )?;

            processor
                .lengths
                .add_block(tx_count, input_count, output_count);

            if is_export_height(height) {
                drop(readers);
                export(stores, vecs, height)?;
                readers = Readers::new(vecs);
            }

            *self.tip_blockhash.write() = block.block_hash().into();
        }

        drop(readers);

        let lock = exit.lock();
        let tasks = self.stores.take_all_pending_ingests(lengths.height)?;
        self.vecs.stamped_write(lengths.height)?;
        let fjall_db = self.stores.db.clone();

        self.vecs.db.run_bg(move |db| {
            let _lock = lock;

            db.bg_sleep(Duration::from_secs(3));

            info!("Exporting...");
            let total_start = Instant::now();

            // Three-phase ordering invariant: store data lands in fjall
            // first, then the journal is fsynced, then the on-disk stamp
            // files advance. A kill at any point leaves disk stamps
            // lagging data, never ahead of it — which is what the
            // bounded walkback recovery in `index_` can clean up safely.
            // The earlier design wrote stamps inside `take_pending_ingest`
            // *before* the bg ingest ran, which meant a process kill
            // mid-bg left the store claiming coverage of fjall data that
            // had never landed; the next cycle then hit
            // `UnknownTxid: store_result=None` on replay.
            let mut ingests = Vec::with_capacity(tasks.len());
            let mut finalizers = Vec::with_capacity(tasks.len());
            let mut any_data = false;
            for t in tasks {
                any_data |= t.has_data;
                ingests.push(t.ingest);
                finalizers.push(t.finalize_stamp);
            }

            let ingest_start = Instant::now();
            for ingest in ingests {
                ingest().map_err(vecdb::RawDBError::other)?;
            }
            debug!("Stores ingested in {:?}", ingest_start.elapsed());

            if any_data {
                let persist_start = Instant::now();
                fjall_db
                    .persist(PersistMode::SyncData)
                    .map_err(RawDBError::other)?;
                debug!("Stores persisted in {:?}", persist_start.elapsed());
            }

            let stamp_start = Instant::now();
            for finalize in finalizers {
                finalize().map_err(vecdb::RawDBError::other)?;
            }
            debug!("Stores stamped in {:?}", stamp_start.elapsed());

            db.compact()?;

            info!("Exported in {:?}", total_start.elapsed());
            Ok(())
        });

        Ok(())
    }

    fn check_xor_bytes(&mut self, reader: &Reader) -> Result<()> {
        let current = reader.xor_bytes();
        let xor_path = self.path.join("xor.dat");

        if xor_path.exists() {
            let cached = XORBytes::from(self.path.as_path());
            if cached != current {
                error!(
                    "Reader xor.dat mismatch (cached={:?}, current={:?}). Refusing to wipe brk-data; if you intentionally changed bitcoind, delete the indexed dir manually to opt into a from-genesis reindex.",
                    *cached, *current,
                );
                return Err(Error::Internal(
                    "xor.dat mismatch — operator must investigate",
                ));
            }
            return Ok(());
        }

        // No prior xor.dat: record the current mask. Either a fresh install
        // or data indexed by a pre-mask-recording binary — historical decoded
        // bytes are independent of the mask, so no wipe is required.
        fs::write(xor_path, *current)?;
        Ok(())
    }

    /// Publish disk state as the new safe-lengths snapshot. Drains pending
    /// bg ingest first so stores are queryable at the new bound.
    pub fn advance_safe_lengths(&mut self) -> Result<()> {
        self.vecs.db.sync_bg_tasks()?;
        if let Some(lengths) = Lengths::from_local(&self.vecs, &self.stores) {
            self.safe_lengths.advance(lengths);
        }
        Ok(())
    }
}

impl ReadOnlyClone for Indexer {
    type ReadOnly = Indexer<Ro>;

    fn read_only_clone(&self) -> Indexer<Ro> {
        Indexer {
            path: self.path.clone(),
            vecs: self.vecs.read_only_clone(),
            stores: self.stores.clone(),
            tip_blockhash: self.tip_blockhash.clone(),
            safe_lengths: self.safe_lengths.clone(),
        }
    }
}
