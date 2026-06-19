use brk_error::Result;
use brk_types::{Day1, StoredF32};
use vecdb::{AnyStoredVec, AnyVec, Exit, ReadableOptionVec, ReadableVec, WritableVec};

use super::{
    Vecs,
    band::{
        Fingerprint, build_band_deviation, build_bands, build_fan_position,
        build_fan_position_extended, fan_position_extended_from_coef, should_refit,
    },
    trajectory::{fit_coef_through, fit_through},
};
use crate::{indexes, models::util::full_rewrite, prices};

/// Expanding-window fits performed per compute cycle while backfilling the
/// trajectory. Bounded so the per-block loop never stalls the watchdog; once
/// caught up to the tip, only the newest day is appended each cycle.
const TRAJECTORY_CHUNK: usize = 16;

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        // Read the daily close and intraday low/high (USD) into dense per-day vectors.
        let close = &prices.split.close.usd.day1;
        let low = &prices.split.low.usd.day1;
        let high = &prices.split.high.usd.day1;
        let day_count = indexes.day1.date.len();
        let closes: Vec<Option<f64>> = (0..day_count)
            .map(|i| close.collect_one_flat(Day1::from(i)).map(f64::from))
            .collect();

        // Fingerprint-gate the (full) band + dislocation rewrite. The trajectory
        // is append-only and may still be backfilling, so it grows every cycle
        // regardless of the gate.
        let fingerprint = Fingerprint::of(&closes);
        if should_refit(self.last_fingerprint, fingerprint, self.q50.cents.len()) {
            // Past band values move as the fit evolves, so this is a full rewrite.
            let bands = build_bands(&closes);
            let q01 = bands[0].clone();
            let q99 = bands[bands.len() - 1].clone();
            // Fan position (implied quantile of spot) is a direct transform of the
            // bands, so derive both the clamped and extended forms here before the
            // bands are consumed below.
            let fan_position = build_fan_position(&closes, &bands);
            let fan_position_extended = build_fan_position_extended(&closes, &bands);
            for (vec, values) in self.bands_mut().into_iter().zip(bands) {
                full_rewrite(vec, &values, exit)?;
            }
            full_rewrite(&mut self.fan_position, &fan_position, exit)?;
            full_rewrite(&mut self.fan_position_extended, &fan_position_extended, exit)?;

            // Per-day intraday extremes: low for the bottom wick, high for the top.
            let lows: Vec<Option<f64>> = (0..day_count)
                .map(|i| low.collect_one_at(i).map(f64::from))
                .collect();
            let highs: Vec<Option<f64>> = (0..day_count)
                .map(|i| high.collect_one_at(i).map(f64::from))
                .collect();

            // Dislocation below q01 and overshoot above q99: conservative (close)
            // and extreme (intraday wick) variants of each.
            full_rewrite(
                &mut self.dislocation_close,
                &build_band_deviation(&closes, &q01),
                exit,
            )?;
            full_rewrite(
                &mut self.dislocation_wick,
                &build_band_deviation(&lows, &q01),
                exit,
            )?;
            full_rewrite(
                &mut self.overshoot_close,
                &build_band_deviation(&closes, &q99),
                exit,
            )?;
            full_rewrite(
                &mut self.overshoot_wick,
                &build_band_deviation(&highs, &q99),
                exit,
            )?;

            self.last_fingerprint = Some(fingerprint);
        }

        self.extend_trajectory(&closes, day_count, exit)?;
        self.extend_trajectory_fan_position(&closes, day_count, exit)?;
        Ok(())
    }

    /// Grow the append-only expanding-window trajectory toward the tip, in a
    /// bounded chunk per cycle (warm-started, watchdog-safe). Each fittable day
    /// records its coefficients; pre-fittable days store NaN sentinels.
    fn extend_trajectory(
        &mut self,
        closes: &[Option<f64>],
        day_count: usize,
        exit: &Exit,
    ) -> Result<()> {
        // A reorg can shorten the day count; keep the trajectory within bounds.
        let stored = self.trajectory_mu.len();
        if stored > day_count {
            self.truncate_trajectory(day_count)?;
        }
        let start = self.trajectory_mu.len();
        let end = (start + TRAJECTORY_CHUNK).min(day_count);

        for day in start..end {
            let point = fit_through(closes, day, self.traj_seed);
            if let Some(p) = point {
                self.traj_seed = Some(p.curvatures());
                self.push_trajectory(p.mu, p.b_lo, p.b_med, p.b_hi, p.delta_b);
            } else {
                let nan = f64::NAN;
                self.push_trajectory(nan, nan, nan, nan, nan);
            }
        }

        let _lock = exit.lock();
        self.trajectory_mu.write()?;
        self.trajectory_b_lo.write()?;
        self.trajectory_b_med.write()?;
        self.trajectory_b_hi.write()?;
        self.trajectory_delta_b.write()?;
        Ok(())
    }

    /// Grow the **causal** extended-fan-position series toward the tip, in the
    /// same bounded warm-chained chunk as [`Self::extend_trajectory`] but keyed
    /// on *its own* length: it was added after the other trajectory series, which
    /// are further along, so it backfills independently from day 0 without
    /// touching them. Each fittable day records the implied quantile of that
    /// day's close under the expanding-window fit *through that day only* (no
    /// lookahead); pre-fittable days store a NaN sentinel.
    fn extend_trajectory_fan_position(
        &mut self,
        closes: &[Option<f64>],
        day_count: usize,
        exit: &Exit,
    ) -> Result<()> {
        // A reorg can shorten the day count; keep this series within bounds.
        let stored = self.trajectory_fan_position_extended.len();
        if stored > day_count {
            self.trajectory_fan_position_extended
                .truncate_if_needed_at(day_count)?;
        }
        let start = self.trajectory_fan_position_extended.len();
        let end = (start + TRAJECTORY_CHUNK).min(day_count);

        // Local warm seed: a cold fit for the chunk's first day, warm-chained
        // within the chunk. Deliberately NOT `self.traj_seed` — that tracks the
        // other trajectory loop's position, which differs from this one during
        // catch-up and would corrupt its warm starts.
        let mut seed: Option<[f64; 3]> = None;
        for day in start..end {
            let value = match fit_coef_through(closes, day, seed) {
                Some(coef) => {
                    seed = Some([coef.b_lo(), coef.b_med(), coef.b_hi()]);
                    fan_position_extended_from_coef(&coef, day as f64, closes[day])
                }
                None => StoredF32::from(f32::NAN),
            };
            self.trajectory_fan_position_extended.push(value);
        }

        let _lock = exit.lock();
        self.trajectory_fan_position_extended.write()?;
        Ok(())
    }

    fn push_trajectory(&mut self, mu: f64, b_lo: f64, b_med: f64, b_hi: f64, delta_b: f64) {
        self.trajectory_mu.push(StoredF32::from(mu as f32));
        self.trajectory_b_lo.push(StoredF32::from(b_lo as f32));
        self.trajectory_b_med.push(StoredF32::from(b_med as f32));
        self.trajectory_b_hi.push(StoredF32::from(b_hi as f32));
        self.trajectory_delta_b.push(StoredF32::from(delta_b as f32));
    }

    fn truncate_trajectory(&mut self, len: usize) -> Result<()> {
        self.trajectory_mu.truncate_if_needed_at(len)?;
        self.trajectory_b_lo.truncate_if_needed_at(len)?;
        self.trajectory_b_med.truncate_if_needed_at(len)?;
        self.trajectory_b_hi.truncate_if_needed_at(len)?;
        self.trajectory_delta_b.truncate_if_needed_at(len)?;
        // Causal fan position is grown by its own loop (extend_trajectory_fan_position),
        // which keeps itself within day_count — intentionally not truncated here.
        Ok(())
    }
}
