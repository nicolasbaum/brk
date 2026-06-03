//! Expanding-window coefficient trajectory.
//!
//! For each day `i`, the fit on data through day `i` is recorded, so the
//! headline asymmetry (`Δb`, the curvatures, `μ`) can be seen evolving as the
//! window grows — making the point that the asymmetry is persistent across
//! cycles, not an artifact of any single one. Each fit warm-starts from the
//! previous day's curvatures (the convex objective makes this exact but fast),
//! which keeps the one-time historical backfill cheap enough to run in bounded
//! chunks without stalling the per-block compute loop.

use brk_quantile::{FitSpec, TAUS, fit, fit_warm};

/// Minimum positive closes needed to identify the 17-parameter grouped fit.
pub(crate) const MIN_SAMPLES: usize = 2 * TAUS.len();

/// One expanding-window fit's headline coefficients.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct TrajectoryPoint {
    pub mu: f64,
    pub b_lo: f64,
    pub b_med: f64,
    pub b_hi: f64,
    pub delta_b: f64,
}

impl TrajectoryPoint {
    /// The curvatures, for warm-starting the next (adjacent-window) fit.
    pub(crate) fn curvatures(&self) -> [f64; 3] {
        [self.b_lo, self.b_med, self.b_hi]
    }
}

/// Fit the expanding window of closes through `up_to_day` (inclusive),
/// warm-starting from `seed` curvatures when available. Returns `None` when
/// there are too few positive closes to identify the model.
pub(crate) fn fit_through(
    closes: &[Option<f64>],
    up_to_day: usize,
    seed: Option<[f64; 3]>,
) -> Option<TrajectoryPoint> {
    let samples: Vec<(f64, f64)> = closes[..=up_to_day]
        .iter()
        .enumerate()
        // t = days since genesis; t ≥ 1 so ln t is finite (day 0 is the anchor).
        .filter_map(|(i, c)| match c {
            Some(v) if *v > 0.0 && i >= 1 => Some((i as f64, v.log10())),
            _ => None,
        })
        .collect();

    if samples.len() < MIN_SAMPLES {
        return None;
    }

    let spec = FitSpec::asymmetric_grouped();
    let coef = match seed {
        Some(s) => fit_warm(&samples, &spec, s),
        None => fit(&samples, &spec),
    };
    Some(TrajectoryPoint {
        mu: coef.mu,
        b_lo: coef.b_lo(),
        b_med: coef.b_med(),
        b_hi: coef.b_hi(),
        delta_b: coef.delta_b(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Per-day closes on a known quadratic, with `t = day index` (matching how
    /// `fit_through` reads them). The first 60 days have no close, so the fit
    /// window starts at `t = 60` (finite `ln t`), as in the real data.
    fn quadratic_closes(n: usize, b: f64) -> Vec<Option<f64>> {
        const FIRST: usize = 60;
        let mu = (FIRST..n).map(|i| (i as f64).ln()).sum::<f64>() / (n - FIRST) as f64;
        (0..n)
            .map(|i| {
                (i >= FIRST).then(|| {
                    let x = (i as f64).ln() - mu;
                    10f64.powf(2.0 + 1.5 * x + b * x * x)
                })
            })
            .collect()
    }

    #[test]
    fn expanding_windows_recover_injected_curvature() {
        let closes = quadratic_closes(400, -0.2);

        // Two windows; the later one warm-started from the earlier curvatures.
        let early = fit_through(&closes, 250, None).unwrap();
        let late = fit_through(&closes, 399, Some(early.curvatures())).unwrap();

        for p in [early, late] {
            assert!((p.b_med - (-0.2)).abs() < 5e-3, "curvature {}", p.b_med);
            // Symmetric data ⇒ asymmetry ≈ 0.
            assert!(p.delta_b.abs() < 5e-3, "delta_b {}", p.delta_b);
        }
    }

    #[test]
    fn too_few_points_yields_none() {
        // Fewer than MIN_SAMPLES positive closes ⇒ the model is unidentifiable.
        let mut closes = vec![None; 50];
        for (offset, slot) in closes.iter_mut().skip(10).take(MIN_SAMPLES - 1).enumerate() {
            *slot = Some(100.0 + offset as f64);
        }
        assert!(fit_through(&closes, 49, None).is_none());
    }
}
