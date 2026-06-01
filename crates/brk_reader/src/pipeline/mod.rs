use std::{fs::File, ops::ControlFlow, os::unix::fs::FileExt, path::Path, sync::Arc, thread};

use brk_error::Result;
use brk_rpc::Client;
use brk_types::{Height, ReadBlock};
use crossbeam::channel::{Receiver, bounded};
use tracing::info;

use crate::{
    BlkIndexToBlkPath, ReaderInner, XORBytes, bisect, canonical::CanonicalRange,
    parse::peek_canonical, scan::scan_bytes,
};

mod forward;
mod reorder;
mod tail;

pub(crate) const CHANNEL_CAPACITY: usize = 50;

/// Forward pays the bisection + 21-file backoff (~2.7 GB of reads)
/// regardless of how few canonical blocks live in the window, so
/// tail wins for any catchup within this many files of the tip.
const TAIL_DISTANCE_FILES: usize = 8;

/// Matches `tail::TAIL_CHUNK`: 8 MiB reverse-reads keep the cost of the
/// pre-trim probe bounded while still finding the tip block in a single
/// chunk in the common (no-race) case.
const TRIM_PROBE_CHUNK: usize = 8 * 1024 * 1024;

/// The indexer is CPU-bound on the consumer side, so 1 reader + 1
/// parser leaves the rest of the cores for it.
pub(crate) const DEFAULT_PARSER_THREADS: usize = 1;

enum Strategy {
    Tail,
    Forward { first_blk_index: u16 },
}

pub(crate) fn spawn(
    reader: Arc<ReaderInner>,
    canonical: CanonicalRange,
    parser_threads: usize,
) -> Result<Receiver<Result<ReadBlock>>> {
    let parser_threads = parser_threads.clamp(1, CHANNEL_CAPACITY);

    if canonical.is_empty() {
        return Ok(bounded(0).1);
    }

    let paths = reader.refresh_paths()?;
    let xor_bytes = reader.xor_bytes;

    // Bitcoind advertises blocks through `getblockcount` /
    // `getblockhash` before flushing them to `blk*.dat`, so the
    // canonical window built from RPC can contain heights whose bytes
    // are not yet on disk. Clip it to whatever the active write file
    // has persisted; the next index() pass will pick up the rest once
    // bitcoind catches up. This prevents the tail pipeline from
    // erroring out with "walked past the canonical window" and
    // cascading into the distribution-rollback fresh-start path.
    let canonical = trim_to_persisted_tip(&paths, xor_bytes, canonical);
    if canonical.is_empty() {
        return Ok(bounded(0).1);
    }

    let strategy = pick_strategy(&reader.client, &paths, xor_bytes, canonical.start);

    let (send, recv) = bounded(CHANNEL_CAPACITY);

    thread::spawn(move || {
        let result = match strategy {
            Strategy::Tail => {
                tail::pipeline_tail(&reader.client, &paths, xor_bytes, &canonical, &send)
            }
            Strategy::Forward { first_blk_index } => forward::pipeline_forward(
                &paths,
                first_blk_index,
                xor_bytes,
                &canonical,
                &send,
                parser_threads,
            ),
        };
        if let Err(e) = result {
            let _ = send.send(Err(e));
        }
    });

    Ok(recv)
}

fn pick_strategy(
    client: &Client,
    paths: &BlkIndexToBlkPath,
    xor_bytes: XORBytes,
    canonical_start: Height,
) -> Strategy {
    if canonical_start != Height::ZERO
        && paths
            .iter()
            .rev()
            .take(TAIL_DISTANCE_FILES)
            .any(|(_, path)| {
                bisect::first_block_height(client, path, xor_bytes)
                    .is_ok_and(|h| h <= canonical_start)
            })
    {
        return Strategy::Tail;
    }
    Strategy::Forward {
        first_blk_index: bisect::find_start_blk_index(client, canonical_start, paths, xor_bytes),
    }
}

/// Returns `canonical` trimmed down to the highest offset that the
/// active blk file actually contains. The scan walks the file in
/// reverse and exits as soon as it finds the canonical tip, so the
/// common (no-race) case costs one `TRIM_PROBE_CHUNK` read.
///
/// If the active file contains no canonical hashes at all (canonical
/// fits entirely in earlier, already-flushed files) the range is left
/// unchanged — the race only affects the file bitcoind is currently
/// writing.
fn trim_to_persisted_tip(
    paths: &BlkIndexToBlkPath,
    xor_bytes: XORBytes,
    mut canonical: CanonicalRange,
) -> CanonicalRange {
    let canonical_len = canonical.len();
    if canonical_len == 0 {
        return canonical;
    }
    let top_offset = (canonical_len - 1) as u32;

    let Some((_, last_path)) = paths.iter().next_back() else {
        return canonical;
    };

    let highest = match scan_file_for_highest_canonical_offset(
        last_path, xor_bytes, &canonical, top_offset,
    ) {
        Ok(Some(off)) => off,
        // Active file has no canonical block: assume canonical lives in
        // older, already-flushed files. Don't trim.
        Ok(None) => return canonical,
        // Read error: same fallback. Tail pipeline will surface its own
        // error if reads keep failing.
        Err(_) => return canonical,
    };

    if highest < top_offset {
        info!(
            "trim_to_persisted_tip: bitcoind RPC reports canonical up to offset {top_offset} (height {}) but only {highest} (height {}) is on disk; trimming (blk-flush race)",
            *canonical.start + top_offset,
            *canonical.start + highest,
        );
        canonical.truncate_above_offset(highest);
    }
    canonical
}

/// Reverse-scans `path` looking for canonical block hashes. Returns the
/// highest offset found, or `None` if no canonical block is present.
/// Early-exits once `top_offset` is found so the no-race case stays
/// cheap.
fn scan_file_for_highest_canonical_offset(
    path: &Path,
    xor_bytes: XORBytes,
    canonical: &CanonicalRange,
    top_offset: u32,
) -> Result<Option<u32>> {
    let file = File::open(path)?;
    let file_len = file.metadata()?.len() as usize;
    if file_len == 0 {
        return Ok(None);
    }

    let mut end = file_len;
    let mut spillover: Vec<u8> = Vec::new();
    let mut highest: Option<u32> = None;

    while end > 0 {
        let start = end.saturating_sub(TRIM_PROBE_CHUNK);
        let chunk_len = end - start;
        let mut buf = vec![0u8; chunk_len + spillover.len()];
        file.read_exact_at(&mut buf[..chunk_len], start as u64)?;
        buf[chunk_len..].copy_from_slice(&spillover);
        spillover.clear();

        let mut found_top = false;
        let result = scan_bytes(
            &mut buf,
            0, // blk_index unused: we only need offsets, not BlkPosition
            start,
            xor_bytes,
            |_metadata, block_bytes, xor_state| {
                if let Some((offset, _header)) =
                    peek_canonical(block_bytes, xor_state, xor_bytes, canonical)
                {
                    highest = Some(highest.map_or(offset, |m| m.max(offset)));
                    if offset == top_offset {
                        found_top = true;
                        return ControlFlow::Break(());
                    }
                }
                ControlFlow::Continue(())
            },
        );

        if found_top {
            return Ok(highest);
        }

        end = start;
        if end > 0 {
            let prefix_len = result.first_magic.unwrap_or(buf.len());
            spillover.extend_from_slice(&buf[..prefix_len]);
        }
    }

    Ok(highest)
}
