//! Pure band-building and refit-gating logic for `models.quantile_curvature`.
//!
//! Kept free of any vecdb I/O so it can be unit-tested directly: given daily
//! closes it produces the predicted price band, and given the input shape it
//! decides whether a refit is warranted.

use brk_quantile::{FitSpec, MEDIAN_IDX, fit};
use brk_types::Cents;

/// Fingerprint of the daily-close input. The model is refit only when this
/// changes, so band vecs are not rewritten on every block batch.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct Fingerprint {
    /// Number of day indices considered (the dense band length).
    pub day_count: usize,
    /// Close (in cents) of the last positive-close day; 0 if there is none.
    pub last_close_cents: u64,
}

impl Fingerprint {
    /// Derive the fingerprint from per-day closes (USD; `None`/non-positive
    /// means no positive close that day).
    pub(crate) fn of(closes: &[Option<f64>]) -> Self {
        let last_close_cents = closes
            .iter()
            .rev()
            .find_map(|c| match c {
                Some(v) if *v > 0.0 => Some((v * 100.0).round() as u64),
                _ => None,
            })
            .unwrap_or(0);
        Self {
            day_count: closes.len(),
            last_close_cents,
        }
    }
}

/// Whether the band should be refit, given the previous fingerprint (if any),
/// the current one, and the currently-stored band length.
pub(crate) fn should_refit(
    previous: Option<Fingerprint>,
    current: Fingerprint,
    stored_len: usize,
) -> bool {
    match previous {
        Some(prev) => prev != current || stored_len != current.day_count,
        None => true,
    }
}

/// Build the median (q50) price band: one `Cents` value per day index.
///
/// `closes` is indexed by day (days since the genesis anchor); `None`/non-positive
/// entries are days without a positive close — excluded from the fit but still
/// assigned a band value (the fitted median evaluated at that day). Fewer than
/// two positive closes yields an all-zero band (nothing to fit).
pub(crate) fn build_q50_band(closes: &[Option<f64>]) -> Vec<Cents> {
    let samples: Vec<(f64, f64)> = closes
        .iter()
        .enumerate()
        .filter_map(|(i, c)| match c {
            Some(v) if *v > 0.0 => Some((i as f64, v.log10())),
            _ => None,
        })
        .collect();

    if samples.len() < 2 {
        return vec![Cents::ZERO; closes.len()];
    }

    let coef = fit(&samples, &FitSpec::linear());
    (0..closes.len())
        .map(|i| {
            // t = days since genesis; clamp away from ln(0) at the genesis day.
            let t = (i as f64).max(1.0);
            Cents::from((coef.predict_price(MEDIAN_IDX, t) * 100.0).max(0.0))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Daily closes following a clean exponential trend in log-time, so the
    /// median band should recover a smooth, strictly increasing curve.
    fn exp_closes(n: usize) -> Vec<Option<f64>> {
        (0..n)
            .map(|i| {
                if i < 592 {
                    None
                } else {
                    let t = i as f64;
                    Some(10f64.powf(-3.0 + 2.0 * t.ln()))
                }
            })
            .collect()
    }

    #[test]
    fn band_is_dense_positive_and_increasing() {
        let closes = exp_closes(3000);
        let band = build_q50_band(&closes);

        assert_eq!(band.len(), closes.len(), "band must cover every day index");

        // Increasing trend (a > 0): each value at/above the previous, all positive.
        for i in 600..band.len() {
            assert!(u64::from(band[i]) > 0, "band[{i}] should be positive");
            assert!(
                u64::from(band[i]) >= u64::from(band[i - 1]),
                "band must be monotone non-decreasing at {i}"
            );
        }
    }

    #[test]
    fn band_tracks_the_input_trend() {
        let closes = exp_closes(3000);
        let band = build_q50_band(&closes);

        // On noiseless data the median lands on the trend, so the band cents
        // ≈ close × 100 at a representative day.
        let i = 2000;
        let expected_cents = closes[i].unwrap() * 100.0;
        let got = u64::from(band[i]) as f64;
        let rel_err = (got - expected_cents).abs() / expected_cents;
        assert!(rel_err < 0.01, "band {got} vs expected {expected_cents} cents");
    }

    #[test]
    fn too_few_points_yields_zero_band() {
        let closes = vec![None, None, Some(100.0)];
        let band = build_q50_band(&closes);
        assert_eq!(band, vec![Cents::ZERO; 3]);
    }

    #[test]
    fn fingerprint_changes_when_data_grows_or_last_close_moves() {
        let base = vec![None, Some(10.0), Some(20.0)];
        let grown = vec![None, Some(10.0), Some(20.0), Some(30.0)];
        let moved = vec![None, Some(10.0), Some(25.0)];

        assert_ne!(Fingerprint::of(&base), Fingerprint::of(&grown));
        assert_ne!(Fingerprint::of(&base), Fingerprint::of(&moved));
        assert_eq!(Fingerprint::of(&base), Fingerprint::of(&base.clone()));
    }

    #[test]
    fn refit_skipped_only_when_fingerprint_and_length_match() {
        let fp = Fingerprint::of(&[None, Some(10.0), Some(20.0)]);

        // First ever fit (no previous) always refits.
        assert!(should_refit(None, fp, 0));
        // Unchanged input and matching stored length → skip.
        assert!(!should_refit(Some(fp), fp, fp.day_count));
        // Stored band length drifted from the day count → refit anyway.
        assert!(should_refit(Some(fp), fp, fp.day_count - 1));
    }
}
