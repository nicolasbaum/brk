use std::ops::Range;

use std::cmp::Ordering;

use brk_error::{Error, Result};
use brk_indexer::{Indexer, Lengths};
use brk_oracle::{Config, NUM_BINS, Oracle, START_HEIGHT, bin_to_cents, cents_to_bin};
use brk_types::{Cents, Height, OutputType, Sats, TxIndex, TxOutIndex, Version};
use tracing::info;
use vecdb::{
    AnyStoredVec, AnyVec, EagerVec, Exit, PcoVec, ReadableVec, StorageMode, VecIndex, WritableVec,
};

use super::Vecs;
use crate::indexes;

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        indexer: &Indexer,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        self.db.sync_bg_tasks()?;

        let starting_lengths = indexer.safe_lengths();

        self.compute_prices(indexer, exit)?;

        // Repair transient oracle mis-locks before aggregating into candles, so
        // a rare multi-block excursion can't render as a deep wick. Open/high/low
        // (and close, lazily) all read the robust series instead of raw spot.
        compute_robust_price(&mut self.robust_cents, &self.spot.cents.height, exit)?;

        // The robust series refines its trailing window as later blocks arrive
        // (a centered filter near the tip is provisional). Rewind the OHLC
        // recompute by the same window so any period whose tail blocks were
        // still provisional on the previous cycle is refreshed.
        let mut robust_lengths = starting_lengths.clone();
        robust_lengths.height = Height::from(
            starting_lengths
                .height
                .to_usize()
                .saturating_sub(ROBUST_HALF_WINDOW),
        );

        self.split
            .open
            .cents
            .compute_first(&robust_lengths, &self.robust_cents, indexes, exit)?;
        self.split
            .high
            .cents
            .compute_max(&robust_lengths, &self.robust_cents, indexes, exit)?;
        self.split
            .low
            .cents
            .compute_min(&robust_lengths, &self.robust_cents, indexes, exit)?;
        self.ohlc.cents.compute_from_split(
            &robust_lengths,
            indexes,
            &self.split.open.cents,
            &self.split.high.cents,
            &self.split.low.cents,
            &self.split.close.cents,
            exit,
        )?;

        let exit = exit.clone();
        self.db.run_bg(move |db| {
            let _lock = exit.lock();
            db.compact_deferred_default()
        });
        Ok(())
    }

    fn compute_prices(&mut self, indexer: &Indexer, exit: &Exit) -> Result<()> {
        let starting_height = indexer.safe_lengths().height;

        let source_version =
            indexer.vecs.outputs.value.version() + indexer.vecs.outputs.output_type.version();
        self.spot
            .cents
            .height
            .inner
            .validate_computed_version_or_reset(source_version)?;

        let total_heights = indexer.vecs.blocks.timestamp.len();

        if total_heights <= START_HEIGHT {
            return Ok(());
        }

        // Reorg: truncate to starting_lengths
        let truncate_to = self.spot.cents.height.len().min(starting_height.to_usize());
        self.spot
            .cents
            .height
            .inner
            .truncate_if_needed_at(truncate_to)?;

        if self.spot.cents.height.len() < START_HEIGHT {
            for line in brk_oracle::PRICES
                .lines()
                .skip(self.spot.cents.height.len())
            {
                if self.spot.cents.height.len() >= START_HEIGHT {
                    break;
                }
                let dollars: f64 = line.parse().unwrap_or(0.0);
                let cents = (dollars * 100.0).round() as u64;
                self.spot.cents.height.inner.push(Cents::new(cents));
            }
        }

        if self.spot.cents.height.len() >= total_heights {
            return Ok(());
        }

        let config = Config::default();
        let committed = self.spot.cents.height.len();
        let prev_cents = self
            .spot
            .cents
            .height
            .collect_one_at(committed - 1)
            .unwrap();
        let seed_bin = cents_to_bin(prev_cents.inner() as f64);
        let warmup = config.window_size.min(committed - START_HEIGHT);
        let mut oracle = Oracle::from_checkpoint(seed_bin, config, |o| {
            Self::feed_blocks(o, indexer, (committed - warmup)..committed);
        });

        let num_new = total_heights - committed;
        info!(
            "Computing oracle prices: {} to {} ({warmup} warmup)",
            committed, total_heights
        );

        let ref_bins = Self::feed_blocks(&mut oracle, indexer, committed..total_heights);

        for (i, ref_bin) in ref_bins.into_iter().enumerate() {
            self.spot
                .cents
                .height
                .inner
                .push(Cents::new(bin_to_cents(ref_bin)));

            let progress = ((i + 1) * 100 / num_new) as u8;
            if i > 0 && progress > ((i * 100 / num_new) as u8) {
                info!("Oracle price computation: {}%", progress);
            }
        }

        {
            let _lock = exit.lock();
            self.spot.cents.height.inner.write()?;
        }

        info!(
            "Oracle prices complete: {} committed",
            self.spot.cents.height.len()
        );

        Ok(())
    }

    /// Feed a range of blocks from the indexer into an Oracle (skipping coinbase),
    /// returning per-block ref_bin values. Uncapped: derives boundaries from
    /// raw indexer vec lengths. Use during compute, when the indexer is
    /// quiescent and `safe_lengths` is still pinned at the pre-pass value.
    fn feed_blocks<M: StorageMode>(
        oracle: &mut Oracle,
        indexer: &Indexer<M>,
        range: Range<usize>,
    ) -> Vec<f64> {
        Self::feed_blocks_inner(oracle, indexer, range, None)
    }

    /// Capped variant: derives boundaries from `cap` instead of raw vec
    /// lengths, so concurrent writer pushes past `cap` are invisible.
    /// Reader paths (live_oracle) use this with the current `safe_lengths`.
    fn feed_blocks_capped<M: StorageMode>(
        oracle: &mut Oracle,
        indexer: &Indexer<M>,
        range: Range<usize>,
        cap: &Lengths,
    ) -> Vec<f64> {
        Self::feed_blocks_inner(oracle, indexer, range, Some(cap))
    }

    fn feed_blocks_inner<M: StorageMode>(
        oracle: &mut Oracle,
        indexer: &Indexer<M>,
        range: Range<usize>,
        cap: Option<&Lengths>,
    ) -> Vec<f64> {
        let (total_txs, total_outputs, height_len) = match cap {
            Some(c) => (
                c.tx_index.to_usize(),
                c.txout_index.to_usize(),
                c.height.to_usize(),
            ),
            None => (
                indexer.vecs.transactions.txid.len(),
                indexer.vecs.outputs.value.len(),
                indexer.vecs.transactions.first_tx_index.len(),
            ),
        };

        // Pre-collect height-indexed data for the range (plus one extra for next-block lookups)
        let collect_end = (range.end + 1).min(height_len);
        let first_tx_indexes: Vec<TxIndex> = indexer
            .vecs
            .transactions
            .first_tx_index
            .collect_range_at(range.start, collect_end);

        let out_firsts: Vec<TxOutIndex> = indexer
            .vecs
            .outputs
            .first_txout_index
            .collect_range_at(range.start, collect_end);

        let mut ref_bins = Vec::with_capacity(range.len());

        // Cursor avoids per-block PcoVec page decompression for
        // the tx-indexed first_txout_index lookup.  The accessed
        // tx_index values (first_tx_index + 1) are strictly increasing
        // across blocks, so the cursor only advances forward.
        let mut txout_cursor = indexer.vecs.transactions.first_txout_index.cursor();

        // Reusable buffers — avoid per-block allocation
        let mut values: Vec<Sats> = Vec::new();
        let mut output_types: Vec<OutputType> = Vec::new();

        for (idx, _h) in range.enumerate() {
            // Auxiliary-vec inconsistency safety: the collected height-indexed
            // buffers can be shorter than the requested range after a
            // "Reader stream stopped early" walkback truncates first_tx_index
            // or outputs.first_txout_index out from under us. Stop the batch
            // cleanly rather than SIGABRT — the next compute cycle resumes
            // once the vecs are back in sync. Same philosophy as the vendor
            // -vecdb indirect-sequential guard (commit 40b65dc0).
            let Some(&first_tx_index) = first_tx_indexes.get(idx) else {
                break;
            };
            let next_first_tx_index = first_tx_indexes
                .get(idx + 1)
                .copied()
                .unwrap_or(TxIndex::from(total_txs));

            let next_out_first = out_firsts
                .get(idx + 1)
                .copied()
                .unwrap_or(TxOutIndex::from(total_outputs))
                .to_usize();
            let out_start = if first_tx_index.to_usize() + 1 < next_first_tx_index.to_usize() {
                let target = first_tx_index.to_usize() + 1;
                txout_cursor.advance(target - txout_cursor.position());
                let Some(v) = txout_cursor.next() else { break };
                v.to_usize()
            } else {
                next_out_first
            };
            let out_end = next_out_first;

            indexer
                .vecs
                .outputs
                .value
                .collect_range_into_at(out_start, out_end, &mut values);
            indexer.vecs.outputs.output_type.collect_range_into_at(
                out_start,
                out_end,
                &mut output_types,
            );

            let mut hist = [0u32; NUM_BINS];
            for i in 0..values.len() {
                if let Some(bin) = oracle.output_to_bin(values[i], output_types[i]) {
                    hist[bin] += 1;
                }
            }

            ref_bins.push(oracle.process_histogram(&hist));
        }

        ref_bins
    }
}

impl<M: StorageMode> Vecs<M> {
    /// Returns an Oracle seeded from the last committed price, with the last
    /// window_size blocks already processed. Ready for additional blocks (e.g. mempool).
    pub fn live_oracle<IM: StorageMode>(&self, indexer: &Indexer<IM>) -> Result<Oracle> {
        let config = Config::default();
        let safe_lengths = indexer.safe_lengths();
        let height = safe_lengths.height.to_usize();
        let last_idx = self
            .spot
            .cents
            .height
            .len()
            .checked_sub(1)
            .ok_or(Error::NotFound(
                "oracle prices not yet computed".to_string(),
            ))?;
        let last_cents = self
            .spot
            .cents
            .height
            .collect_one_at(last_idx)
            .ok_or(Error::NotFound(
                "oracle prices not yet computed".to_string(),
            ))?;
        let seed_bin = cents_to_bin(last_cents.inner() as f64);
        let window_size = config.window_size;
        let oracle = Oracle::from_checkpoint(seed_bin, config, |o| {
            Vecs::feed_blocks_capped(
                o,
                indexer,
                height.saturating_sub(window_size)..height,
                &safe_lengths,
            );
        });

        Ok(oracle)
    }
}

/// Half-width (in blocks) of the centered median window. ±15 blocks ≈ ±2.5h,
/// chosen wider than the longest observed oracle mis-lock so the window median
/// stays anchored to the surrounding true price even mid-excursion.
const ROBUST_HALF_WINDOW: usize = 15;
/// Relative gate: a block is repaired to the window median only if it deviates
/// from that median by more than this fraction. Clean blocks sit well within it
/// (oracle per-block noise is ~0.35%, and a clean block's deviation from its
/// *centered* median stays under ~2% even across volatile windows), while
/// mis-lock excursions — the only thing that renders as a deep wick — run 5–47%.
/// A MAD-based gate was tried and rejected: legitimate ~3.5% price drift across
/// the window inflates MAD enough to miss the shallower shoulders of an episode.
const ROBUST_MAX_DEV: f64 = 0.04;

/// Centered median filter: repair transient per-block oracle mis-locks while
/// leaving clean blocks bit-identical and following genuine sustained moves.
///
/// For each block, take the median over `[h-W, h+W]` of the raw oracle price and
/// replace the block with it only when the block deviates by more than
/// `ROBUST_MAX_DEV`. A sustained real move is preserved because the centered
/// median tracks it; only transient excursions that revert within the window are
/// repaired. The window reads *ahead* in the (already fully computed) source, so
/// the trailing `W` blocks near the tip use a truncated window and are
/// provisional — they are recomputed each cycle by truncating the output back by
/// `W` before resuming.
fn compute_robust_price(
    out: &mut EagerVec<PcoVec<Height, Cents>>,
    source: &impl ReadableVec<Height, Cents>,
    exit: &Exit,
) -> Result<()> {
    let src_len = source.len();
    // Recompute the trailing window (provisional centered values) and, after a
    // reorg, drop any robust entries past the now-shorter source by clamping the
    // truncation point to `src_len` before backing off by the window.
    let start = out.len().min(src_len).saturating_sub(ROBUST_HALF_WINDOW);
    // Algo version (bump on parameter/logic changes) + source version, so the
    // series recomputes when the oracle prices or this filter change.
    out.validate_and_truncate(Version::new(1) + source.version(), Height::from(start))?;

    out.repeat_until_complete(exit, |this| {
        let skip = this.len();
        let end = this.batch_end(src_len);
        if skip >= end {
            return Ok(());
        }

        // One read covering every block's centered window in this batch.
        let lo = skip.saturating_sub(ROBUST_HALF_WINDOW);
        let hi = (end + ROBUST_HALF_WINDOW).min(src_len);
        let buf: Vec<f64> = source
            .collect_range_at(lo, hi)
            .into_iter()
            .map(|c| c.inner() as f64)
            .collect();

        let mut window: Vec<f64> = Vec::with_capacity(2 * ROBUST_HALF_WINDOW + 1);
        for i in skip..end {
            let wlo = i.saturating_sub(ROBUST_HALF_WINDOW);
            let whi = (i + ROBUST_HALF_WINDOW + 1).min(src_len);
            window.clear();
            window.extend_from_slice(&buf[(wlo - lo)..(whi - lo)]);
            let repaired = repair_to_median(&mut window, buf[i - lo]);
            this.checked_push_at(i, Cents::new(repaired.round().max(0.0) as u64))?;
        }
        Ok(())
    })?;

    Ok(())
}

#[inline]
fn median_sorted(sorted: &[f64]) -> f64 {
    let n = sorted.len();
    if n == 0 {
        return 0.0;
    }
    if n % 2 == 1 {
        sorted[n / 2]
    } else {
        (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
    }
}

/// Returns `x` repaired to the median of `window` when it deviates by more than
/// [`ROBUST_MAX_DEV`], otherwise `x` unchanged. `window` (the surrounding
/// context, including `x`) is sorted in place as scratch.
fn repair_to_median(window: &mut [f64], x: f64) -> f64 {
    window.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal));
    let med = median_sorted(window);
    if med > 0.0 && (x - med).abs() / med > ROBUST_MAX_DEV {
        med
    } else {
        x
    }
}

#[cfg(test)]
mod robust_tests {
    use super::{ROBUST_HALF_WINDOW, repair_to_median};

    fn window(center: f64) -> Vec<f64> {
        let mut w = vec![62_000_00.0; 2 * ROBUST_HALF_WINDOW + 1];
        w[ROBUST_HALF_WINDOW] = center;
        w
    }

    /// A clean, slowly-varying window leaves the point untouched.
    #[test]
    fn leaves_clean_value_unchanged() {
        let mut w: Vec<f64> = (0..2 * ROBUST_HALF_WINDOW as i64 + 1)
            .map(|i| 62_000_00.0 + (i as f64) * 100.0) // gentle ramp, cents
            .collect();
        let x = w[ROBUST_HALF_WINDOW];
        assert_eq!(repair_to_median(&mut w, x), x);
    }

    /// A deep downward excursion (a mis-lock) is replaced by the median.
    #[test]
    fn repairs_deep_outlier() {
        let x = 55_000_00.0; // ~11% below the surrounding price
        let out = repair_to_median(&mut window(x), x);
        assert!(
            (out - 62_000_00.0).abs() < 1.0,
            "deep outlier should snap to the median, got {out}"
        );
    }

    /// An episode "shoulder" just past the gate is still repaired.
    #[test]
    fn repairs_shoulder() {
        let x = 59_000_00.0; // ~4.8% below — past ROBUST_MAX_DEV (4%)
        let out = repair_to_median(&mut window(x), x);
        assert!((out - 62_000_00.0).abs() < 1.0, "shoulder should repair, got {out}");
    }

    /// A move within the gate is kept (no over-correction of ordinary noise).
    #[test]
    fn keeps_small_deviation() {
        let x = 62_500_00.0; // ~0.8% — below ROBUST_MAX_DEV (4%)
        assert_eq!(repair_to_median(&mut window(x), x), x);
    }
}
