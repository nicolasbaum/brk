//! MVRV Z-Score: `(market_cap − realized_cap) / σ(market_cap)`, where σ is the
//! population standard deviation of market cap over the whole history up to
//! the block being scored (an expanding window, Welford recurrence).
//!
//! The expanding statistics are state that spans the whole series, while
//! [`EagerVec::compute_to`] resumes from the last stored height on every
//! incremental run. The first version of this indicator rebuilt the state
//! inside the run: each new block was scored against only the blocks appended
//! by that same run. With fewer than [`MIN_OBSERVATIONS`] new blocks the score
//! was pinned to 0.0 (every day from 2026-07-01), and a larger catch-up batch
//! scored against a near-zero σ (74.67 on 2026-05-29). The prefix is now
//! replayed before the first new block so the statistics always cover the
//! entire history.

use brk_error::Result;
use brk_types::{Dollars, Height, StoredF32, Version};
use vecdb::{EagerVec, Exit, PcoVec, ReadableVec};

/// Bump when the formula changes; the stored series is rebuilt from genesis.
const FORMULA_VERSION: Version = Version::new(1);

/// Blocks needed before σ is considered defined; scores are 0.0 before that.
pub(super) const MIN_OBSERVATIONS: u64 = 30;

/// Welford running mean and population variance over an expanding window.
#[derive(Debug, Default, Clone, Copy, PartialEq)]
pub(super) struct ExpandingStats {
    count: u64,
    mean: f64,
    m2: f64,
}

impl ExpandingStats {
    pub(super) fn push(&mut self, x: f64) {
        self.count += 1;
        let delta = x - self.mean;
        self.mean += delta / self.count as f64;
        self.m2 += delta * (x - self.mean);
    }

    pub(super) fn count(&self) -> u64 {
        self.count
    }

    #[cfg(test)]
    pub(super) fn mean(&self) -> f64 {
        self.mean
    }

    /// Population standard deviation, or `None` while it is undefined
    /// (fewer than [`MIN_OBSERVATIONS`] values) or zero.
    pub(super) fn std_dev(&self) -> Option<f64> {
        if self.count < MIN_OBSERVATIONS || self.m2 <= 0.0 {
            return None;
        }
        let sd = (self.m2 / self.count as f64).sqrt();
        (sd > 0.0).then_some(sd)
    }
}

/// Folds this block's market cap into `stats`, then scores the block.
pub(super) fn z_score(stats: &mut ExpandingStats, market_cap: f64, realized_cap: f64) -> f32 {
    stats.push(market_cap);
    match stats.std_dev() {
        Some(sd) => ((market_cap - realized_cap) / sd) as f32,
        None => 0.0,
    }
}

/// Computes the z-score for every height in `[target.len(), min(len))`,
/// seeding the expanding statistics from the already-scored prefix.
pub(super) fn compute(
    target: &mut EagerVec<PcoVec<Height, StoredF32>>,
    max_from: Height,
    market_cap: &impl ReadableVec<Height, Dollars>,
    realized_cap: &impl ReadableVec<Height, Dollars>,
    exit: &Exit,
) -> Result<()> {
    let version = market_cap.version() + realized_cap.version() + FORMULA_VERSION;
    let to = market_cap.len().min(realized_cap.len());
    let mut stats = ExpandingStats::default();
    let mut seeded = false;

    target.compute_to(
        max_from,
        to,
        version,
        |height| {
            if !seeded {
                // Resuming mid-series: the statistics must cover every block
                // before this one, not just the ones appended by this run.
                seeded = true;
                let first = usize::from(height);
                if first > 0 {
                    market_cap
                        .collect_range_at(0, first)
                        .into_iter()
                        .for_each(|cap| stats.push(f64::from(cap)));
                }
            }

            let market = market_cap
                .collect_one(height)
                .map(f64::from)
                .unwrap_or_default();
            let realized = realized_cap
                .collect_one(height)
                .map(f64::from)
                .unwrap_or_default();

            (
                height,
                StoredF32::from(z_score(&mut stats, market, realized)),
            )
        },
        exit,
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use vecdb::{AnyStoredVec, AnyVec, Database, ImportableVec, WritableVec};

    type Caps = EagerVec<PcoVec<Height, Dollars>>;
    type Scores = EagerVec<PcoVec<Height, StoredF32>>;

    /// A market cap that trends up with a wobble and a realized cap that lags it.
    fn caps(n: usize) -> (Vec<f64>, Vec<f64>) {
        let market = (0..n)
            .map(|i| {
                let i = i as f64;
                1000.0 * (1.0 + 0.01 * i) * (1.0 + 0.1 * (i * 0.7).sin())
            })
            .collect();
        let realized = (0..n).map(|i| 900.0 * (1.0 + 0.008 * i as f64)).collect();
        (market, realized)
    }

    fn push_from(vec: &mut Caps, values: &[f64], from: usize) {
        for (i, v) in values.iter().enumerate().skip(from) {
            vec.checked_push(Height::from(i), Dollars::from(*v)).unwrap();
        }
        vec.flush().unwrap();
    }

    fn scores(vec: &Scores) -> Vec<f32> {
        (0..vec.len())
            .map(|h| f32::from(vec.collect_one(Height::from(h)).unwrap()))
            .collect()
    }

    #[test]
    fn welford_matches_the_two_pass_population_formula() {
        let values: Vec<f64> = (1..=100).map(|i| (i as f64).powi(2) * 0.37).collect();
        let mut stats = ExpandingStats::default();
        values.iter().for_each(|&v| stats.push(v));

        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let var = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / values.len() as f64;

        assert_eq!(stats.count(), 100);
        assert!((stats.mean() - mean).abs() < 1e-9);
        assert!((stats.std_dev().unwrap() - var.sqrt()).abs() < 1e-9);
    }

    #[test]
    fn score_is_zero_until_min_observations_then_a_real_z() {
        let mut stats = ExpandingStats::default();
        for i in 0..MIN_OBSERVATIONS - 1 {
            assert_eq!(z_score(&mut stats, 100.0 + i as f64, 50.0), 0.0);
        }
        let z = z_score(&mut stats, 200.0, 50.0);
        assert!(z > 0.0 && z.is_finite(), "z = {z}");
        assert!(stats.std_dev().is_some());
    }

    #[test]
    fn constant_market_cap_has_no_std_dev_and_scores_zero() {
        let mut stats = ExpandingStats::default();
        for _ in 0..MIN_OBSERVATIONS + 5 {
            assert_eq!(z_score(&mut stats, 1000.0, 400.0), 0.0);
        }
        assert_eq!(stats.std_dev(), None);
    }

    /// The regression: an incremental run that appends a batch of blocks
    /// must score them exactly as a single pass over the whole series would.
    #[test]
    fn resuming_mid_series_matches_a_single_pass() {
        let temp = TempDir::new().unwrap();
        let db = Database::open(temp.path()).unwrap();
        let exit = Exit::new();
        let n = 200;
        let split = 150; // the second run sees 50 new blocks (> MIN_OBSERVATIONS)
        let (market, realized) = caps(n);

        let mut market_vec: Caps = EagerVec::forced_import(&db, "market_cap", Version::ONE).unwrap();
        let mut realized_vec: Caps =
            EagerVec::forced_import(&db, "realized_cap", Version::ONE).unwrap();
        push_from(&mut market_vec, &market[..split], 0);
        push_from(&mut realized_vec, &realized[..split], 0);

        let mut resumed: Scores = EagerVec::forced_import(&db, "resumed", Version::ONE).unwrap();
        compute(&mut resumed, Height::ZERO, &market_vec, &realized_vec, &exit).unwrap();
        assert_eq!(resumed.len(), split);

        push_from(&mut market_vec, &market, split);
        push_from(&mut realized_vec, &realized, split);
        compute(&mut resumed, Height::from(split), &market_vec, &realized_vec, &exit).unwrap();
        assert_eq!(resumed.len(), n);

        let mut single: Scores = EagerVec::forced_import(&db, "single", Version::ONE).unwrap();
        compute(&mut single, Height::ZERO, &market_vec, &realized_vec, &exit).unwrap();

        let resumed = scores(&resumed);
        let single = scores(&single);
        assert_eq!(resumed, single);
        assert!(resumed[n - 1] != 0.0, "tail must be a real score, not a reset");
    }

    /// A one-block catch-up (the steady state between blocks) must not pin
    /// the new block to 0.0 — that is exactly the production failure.
    #[test]
    fn a_single_new_block_gets_a_real_score() {
        let temp = TempDir::new().unwrap();
        let db = Database::open(temp.path()).unwrap();
        let exit = Exit::new();
        let n = 120;
        let (market, realized) = caps(n);

        let mut market_vec: Caps = EagerVec::forced_import(&db, "market_cap", Version::ONE).unwrap();
        let mut realized_vec: Caps =
            EagerVec::forced_import(&db, "realized_cap", Version::ONE).unwrap();
        push_from(&mut market_vec, &market[..n - 1], 0);
        push_from(&mut realized_vec, &realized[..n - 1], 0);

        let mut target: Scores = EagerVec::forced_import(&db, "z", Version::ONE).unwrap();
        compute(&mut target, Height::ZERO, &market_vec, &realized_vec, &exit).unwrap();

        push_from(&mut market_vec, &market, n - 1);
        push_from(&mut realized_vec, &realized, n - 1);
        compute(&mut target, Height::from(n - 1), &market_vec, &realized_vec, &exit).unwrap();

        let tail = scores(&target)[n - 1];
        assert!(tail != 0.0 && tail.is_finite(), "tail = {tail}");
    }
}
