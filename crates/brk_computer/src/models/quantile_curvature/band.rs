//! Pure band-building and refit-gating logic for `models.quantile_curvature`.
//!
//! Kept free of any vecdb I/O so it can be unit-tested directly: given daily
//! closes it produces the predicted price band, and given the input shape it
//! decides whether a refit is warranted.

use brk_quantile::dislocation::undershoot;
use brk_quantile::{FitSpec, TAUS, fit};
use brk_types::{Cents, StoredF32};

/// Number of quantile bands (= [`brk_quantile::TAUS`] length).
pub(crate) const BAND_COUNT: usize = TAUS.len();

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

/// Build the seven price-quantile bands (ascending, aligned with
/// [`brk_quantile::TAUS`]): one `Cents` value per day index per band.
///
/// `closes` is indexed by day (days since the genesis anchor); `None`/non-positive
/// entries are days without a positive close — excluded from the fit but still
/// assigned a band value (the fitted fan evaluated at that day). Predictions are
/// monotone-rearranged before storage, so a higher quantile is never priced
/// below a lower one. Too few positive closes yields all-zero bands.
pub(crate) fn build_bands(closes: &[Option<f64>]) -> [Vec<Cents>; BAND_COUNT] {
    let samples: Vec<(f64, f64)> = closes
        .iter()
        .enumerate()
        // t = days since genesis; t ≥ 1 so ln t is finite (day 0 is the anchor).
        .filter_map(|(i, c)| match c {
            Some(v) if *v > 0.0 && i >= 1 => Some((i as f64, v.log10())),
            _ => None,
        })
        .collect();

    // The asymmetric grouped fit needs enough points to identify 17 parameters.
    if samples.len() < 2 * BAND_COUNT {
        return std::array::from_fn(|_| vec![Cents::ZERO; closes.len()]);
    }

    let coef = fit(&samples, &FitSpec::asymmetric_grouped());
    let mut bands: [Vec<Cents>; BAND_COUNT] =
        std::array::from_fn(|_| Vec::with_capacity(closes.len()));
    for i in 0..closes.len() {
        // t = days since genesis; clamp away from ln(0) at the genesis day.
        let prices = coef.band_prices((i as f64).max(1.0));
        for (band, price) in bands.iter_mut().zip(prices) {
            band.push(Cents::from((price * 100.0).max(0.0)));
        }
    }
    bands
}

/// Per-day **fan position**: the model-implied quantile of `prices` (USD) — the
/// `τ` at which the fitted fan equals spot, interpolated across the seven bands
/// in log-price space (the fit's natural space) and clamped to the outer taus.
///
/// `≈ TAUS[0]` ⇒ spot pinned to/under the bottom band (a bottom signal); `≈
/// TAUS[last]` ⇒ pinned to/over the top band (a top signal). This is the single
/// regression-ready position feature: monotone, two-sided, and dimensionless.
/// Beyond-band *magnitude* is left to the dislocation/overshoot metrics; this
/// series saturates at the outer taus. Days with no price, a non-positive price,
/// or a degenerate (zero) top band contribute `NaN`, so they drop out of a
/// regression cleanly rather than reading as a false extreme.
pub(crate) fn build_fan_position(
    prices: &[Option<f64>],
    bands: &[Vec<Cents>; BAND_COUNT],
) -> Vec<StoredF32> {
    let nan = StoredF32::from(f32::NAN);
    (0..prices.len())
        .map(|i| {
            let Some(p) = prices[i] else { return nan };
            // No fan to position against until the fit yields a positive top band.
            if p <= 0.0 || f64::from(bands[BAND_COUNT - 1][i]) <= 0.0 {
                return nan;
            }
            // log₁₀ band price at day `i`, floored off zero so an extrapolated
            // sub-cent early band can't blow up the interpolation denominator.
            let lg = |k: usize| (f64::from(bands[k][i]) / 100.0).max(1e-9).log10();
            let lp = p.log10();
            if lp <= lg(0) {
                return StoredF32::from(TAUS[0] as f32);
            }
            if lp >= lg(BAND_COUNT - 1) {
                return StoredF32::from(TAUS[BAND_COUNT - 1] as f32);
            }
            for k in 0..BAND_COUNT - 1 {
                let (lo, hi) = (lg(k), lg(k + 1));
                if lp >= lo && lp <= hi {
                    let frac = if hi > lo { (lp - lo) / (hi - lo) } else { 0.0 };
                    let tau = TAUS[k] + frac * (TAUS[k + 1] - TAUS[k]);
                    return StoredF32::from(tau as f32);
                }
            }
            nan // monotone bands guarantee a bracket above; unreachable in practice
        })
        .collect()
}

/// Per-day relative deviation `(price − band)/band` of `prices` (USD) against a
/// stored band (cents). Negative ⇒ price below the band — an **undershoot**, used
/// as dislocation against the 1% band; positive ⇒ above — an **overshoot**, the
/// top-stretch magnitude against the 99% band. Days with no price contribute `0.0`.
pub(crate) fn build_band_deviation(prices: &[Option<f64>], band_cents: &[Cents]) -> Vec<StoredF32> {
    (0..prices.len())
        .map(|i| match prices[i] {
            Some(p) => {
                let band = f64::from(band_cents[i]) / 100.0;
                StoredF32::from(undershoot(p, band) as f32)
            }
            None => StoredF32::from(0.0f32),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use brk_quantile::MEDIAN_IDX;

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
    fn bands_are_dense_positive_and_non_crossing() {
        let closes = exp_closes(3000);
        let bands = build_bands(&closes);

        for band in &bands {
            assert_eq!(band.len(), closes.len(), "each band covers every day");
        }

        for i in 600..closes.len() {
            // Non-crossing across quantiles: q01 ≤ q10 ≤ … ≤ q99 at every day.
            for q in 1..BAND_COUNT {
                assert!(
                    u64::from(bands[q][i]) >= u64::from(bands[q - 1][i]),
                    "bands crossed at day {i}, quantile {q}"
                );
            }
            // The median band rises with time (a > 0) and stays positive.
            assert!(u64::from(bands[MEDIAN_IDX][i]) > 0, "median zero at {i}");
            assert!(
                u64::from(bands[MEDIAN_IDX][i]) >= u64::from(bands[MEDIAN_IDX][i - 1]),
                "median band must be monotone over time at {i}"
            );
        }
    }

    #[test]
    fn median_band_tracks_the_input_trend() {
        let closes = exp_closes(3000);
        let bands = build_bands(&closes);

        // On noiseless data the fan collapses onto the trend, so the median band
        // cents ≈ close × 100 at a representative day.
        let i = 2000;
        let expected_cents = closes[i].unwrap() * 100.0;
        let got = u64::from(bands[MEDIAN_IDX][i]) as f64;
        let rel_err = (got - expected_cents).abs() / expected_cents;
        assert!(rel_err < 0.02, "median {got} vs expected {expected_cents} cents");
    }

    #[test]
    fn too_few_points_yields_zero_bands() {
        let closes = vec![None, None, Some(100.0)];
        let bands = build_bands(&closes);
        for band in &bands {
            assert_eq!(*band, vec![Cents::ZERO; 3]);
        }
    }

    #[test]
    fn band_deviation_is_signed_against_the_band() {
        // Band at $100 (10_000 cents); below → negative (undershoot vs Q01),
        // above → positive (overshoot vs Q99), missing price → 0.
        let band = vec![Cents::from(10_000u64); 3];
        let prices = vec![Some(80.0), Some(120.0), None];
        let d = build_band_deviation(&prices, &band);
        assert!((f64::from(d[0]) - (-0.2)).abs() < 1e-6, "below band");
        assert!((f64::from(d[1]) - 0.2).abs() < 1e-6, "above band");
        assert_eq!(f64::from(d[2]), 0.0, "missing price → 0");
    }

    #[test]
    fn fan_position_interpolates_spot_within_the_bands() {
        // One day, ascending fan at $10,20,30,40,50,60,70 (taus 0.01…0.99).
        let bands: [Vec<Cents>; BAND_COUNT] =
            std::array::from_fn(|k| vec![Cents::from((10.0 * (k as f64 + 1.0)) * 100.0)]);

        // Spot exactly on the median band → median tau.
        let on_median = build_fan_position(&[Some(40.0)], &bands);
        assert!((f64::from(on_median[0]) - TAUS[MEDIAN_IDX]).abs() < 1e-6);

        // Between two bands → strictly between their taus and monotone in price.
        let mid_lo = f64::from(build_fan_position(&[Some(33.0)], &bands)[0]);
        let mid_hi = f64::from(build_fan_position(&[Some(37.0)], &bands)[0]);
        assert!(TAUS[2] < mid_lo && mid_lo < mid_hi && mid_hi < TAUS[4]);

        // Below the bottom / above the top band → saturates at the outer taus.
        assert!((f64::from(build_fan_position(&[Some(5.0)], &bands)[0]) - TAUS[0]).abs() < 1e-6);
        let top = build_fan_position(&[Some(100.0)], &bands);
        assert!((f64::from(top[0]) - TAUS[BAND_COUNT - 1]).abs() < 1e-6);

        // No price, non-positive price, or a degenerate (zero) fan → NaN.
        assert!(f64::from(build_fan_position(&[None], &bands)[0]).is_nan());
        assert!(f64::from(build_fan_position(&[Some(-1.0)], &bands)[0]).is_nan());
        let zero_fan: [Vec<Cents>; BAND_COUNT] = std::array::from_fn(|_| vec![Cents::ZERO]);
        assert!(f64::from(build_fan_position(&[Some(40.0)], &zero_fan)[0]).is_nan());
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
