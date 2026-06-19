//! Pure band-building and refit-gating logic for `models.quantile_curvature`.
//!
//! Kept free of any vecdb I/O so it can be unit-tested directly: given daily
//! closes it produces the predicted price band, and given the input shape it
//! decides whether a refit is warranted.

use brk_quantile::dislocation::undershoot;
use brk_quantile::{Coefficients, FitSpec, TAUS, fit};
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

/// Inverse-normal (probit) of each [`TAUS`] level — the z-score the fitted fan
/// places each band at. Hardcoded because `TAUS` is fixed; the
/// `band_z_matches_taus` test guards against `TAUS` drifting out of sync.
const BAND_Z: [f64; BAND_COUNT] = [
    -2.326_347_874_041, // τ = 0.01
    -1.281_551_559_461, // τ = 0.10
    -0.674_489_750_196, // τ = 0.25
    0.0,                // τ = 0.50
    0.674_489_750_196,  // τ = 0.75
    1.644_853_626_951,  // τ = 0.95
    2.326_347_874_041,  // τ = 0.99
];

/// Widest z (model-implied standard deviations) the extended fan position
/// reports. Spot beyond this maps to a finite, f32-representable percentile
/// (`Φ(±4) ≈ 3.2e-5 / 0.999_968`) instead of collapsing onto 0/1 — ~1.7× the
/// outer band's z (±2.33), so genuine capitulation/euphoria past the bands still
/// separate by magnitude rather than all reading as the same extreme.
const Z_CLAMP: f64 = 4.0;

/// Per-day **extended fan position**: like [`build_fan_position`], the
/// model-implied quantile `τ` at which the fitted fan equals spot — but mapped
/// through probit (z-score) space and *not* clamped to the outer bands. Spot is
/// linearly interpolated across the seven `(log-price, BAND_Z)` knots and
/// extrapolated along the outer segment when it sits beyond q01/q99, so a deep
/// capitulation reads `< 0.01` and a blow-off top reads `> 0.99` (up to
/// `Φ(±Z_CLAMP)`), where the plain [`build_fan_position`] saturates. Same NaN
/// rules: no price, a non-positive price, or a degenerate (zero) top band → `NaN`.
pub(crate) fn build_fan_position_extended(
    prices: &[Option<f64>],
    bands: &[Vec<Cents>; BAND_COUNT],
) -> Vec<StoredF32> {
    let nan = StoredF32::from(f32::NAN);
    (0..prices.len())
        .map(|i| {
            let Some(p) = prices[i] else { return nan };
            if p <= 0.0 || f64::from(bands[BAND_COUNT - 1][i]) <= 0.0 {
                return nan;
            }
            // Stored bands are cents; convert to USD log-price (floored off zero).
            let log_bands: [f64; BAND_COUNT] =
                std::array::from_fn(|k| (f64::from(bands[k][i]) / 100.0).max(1e-9).log10());
            let tau = extended_position_from_log_bands(&log_bands, p.log10());
            if tau.is_nan() {
                return nan; // monotone bands guarantee a bracket; unreachable in practice
            }
            StoredF32::from(tau as f32)
        })
        .collect()
}

/// **Causal** extended fan position from a single fitted [`Coefficients`] at day
/// `t` (days since genesis). The model-implied (probit, unclamped) quantile of
/// `price` under the bands the fit predicts for day `t` — identical mapping to
/// [`build_fan_position_extended`], but reading bands straight from
/// `coef.band_prices(t)` instead of stored cents. Feeding it a *point-in-time*
/// expanding-window fit (one trained only on data through day `t`) yields a
/// lookahead-free fan position, unlike the single global fit behind the stored
/// `fan_position*` series. `NaN` for no/non-positive price or a degenerate
/// (zero) top band — same rules as the stored-band path.
pub(crate) fn fan_position_extended_from_coef(
    coef: &Coefficients,
    t: f64,
    price: Option<f64>,
) -> StoredF32 {
    let nan = StoredF32::from(f32::NAN);
    let Some(p) = price else { return nan };
    if p <= 0.0 {
        return nan;
    }
    // `t.max(1.0)` mirrors `build_bands`' genesis-day clamp so ln(t) stays finite.
    let bp = coef.band_prices(t.max(1.0));
    if bp[BAND_COUNT - 1] <= 0.0 {
        return nan;
    }
    // `band_prices` are USD (already monotone-rearranged), so no cents division.
    let log_bands: [f64; BAND_COUNT] = std::array::from_fn(|k| bp[k].max(1e-9).log10());
    let tau = extended_position_from_log_bands(&log_bands, p.log10());
    if tau.is_nan() {
        return nan;
    }
    StoredF32::from(tau as f32)
}

/// Shared core of the *extended* fan position: map a log-price `lp` to a
/// percentile given the seven ascending log10 band prices. Interpolates the
/// z-score within the bands and extrapolates along the nearest outer segment
/// beyond them (so tails keep their magnitude), clamps to ±[`Z_CLAMP`], and
/// pushes through Φ. Returns `NaN` only if the bracket search fails — which
/// monotone bands make unreachable in practice.
fn extended_position_from_log_bands(log_bands: &[f64; BAND_COUNT], lp: f64) -> f64 {
    let z = if lp <= log_bands[0] {
        interp_z(lp, log_bands[0], log_bands[1], BAND_Z[0], BAND_Z[1])
    } else if lp >= log_bands[BAND_COUNT - 1] {
        let (a, b) = (BAND_COUNT - 2, BAND_COUNT - 1);
        interp_z(lp, log_bands[a], log_bands[b], BAND_Z[a], BAND_Z[b])
    } else {
        let mut found = f64::NAN;
        for k in 0..BAND_COUNT - 1 {
            let (lo, hi) = (log_bands[k], log_bands[k + 1]);
            if lp >= lo && lp <= hi {
                found = interp_z(lp, lo, hi, BAND_Z[k], BAND_Z[k + 1]);
                break;
            }
        }
        found
    };
    if z.is_nan() {
        return f64::NAN;
    }
    normal_cdf(z.clamp(-Z_CLAMP, Z_CLAMP))
}

/// Linearly map `lp` from the `[lo, hi]` log-price segment onto the
/// `[z_lo, z_hi]` z-score segment, extrapolating when `lp` is outside `[lo, hi]`.
/// A degenerate (zero-width) segment yields `z_lo` rather than dividing by zero.
fn interp_z(lp: f64, lo: f64, hi: f64, z_lo: f64, z_hi: f64) -> f64 {
    if hi <= lo {
        return z_lo;
    }
    z_lo + (lp - lo) / (hi - lo) * (z_hi - z_lo)
}

/// Standard-normal CDF `Φ(z)` via the Abramowitz & Stegun 7.1.26 `erf`
/// approximation (`|error| < 1.5e-7` — ample for an f32 percentile).
fn normal_cdf(z: f64) -> f64 {
    0.5 * (1.0 + erf(z / std::f64::consts::SQRT_2))
}

fn erf(x: f64) -> f64 {
    let sign = if x < 0.0 { -1.0 } else { 1.0 };
    let x = x.abs();
    let t = 1.0 / (1.0 + 0.327_591_1 * x);
    let poly = ((((1.061_405_429 * t - 1.453_152_027) * t + 1.421_413_741) * t - 0.284_496_736)
        * t
        + 0.254_829_592)
        * t;
    sign * (1.0 - poly * (-x * x).exp())
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
    use brk_quantile::{MEDIAN_IDX, QuantileCoef};

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
    fn band_z_matches_taus() {
        // The hardcoded probit knots must stay the inverse-normal of TAUS, or the
        // extended fan position would mislabel each band's z-score.
        for (z, &tau) in BAND_Z.iter().zip(TAUS.iter()) {
            assert!(
                (normal_cdf(*z) - tau).abs() < 1e-3,
                "Φ({z}) = {} ≠ τ {tau}",
                normal_cdf(*z)
            );
        }
    }

    #[test]
    fn extended_fan_position_unclamps_beyond_the_bands() {
        // Same ascending fan at $10..$70 (taus 0.01…0.99) as the clamped test.
        let bands: [Vec<Cents>; BAND_COUNT] =
            std::array::from_fn(|k| vec![Cents::from((10.0 * (k as f64 + 1.0)) * 100.0)]);
        let ext = |p: f64| f64::from(build_fan_position_extended(&[Some(p)], &bands)[0]);

        // On the median band → ≈ 0.50, same as the clamped variant.
        assert!((ext(40.0) - 0.50).abs() < 1e-3);

        // Below the bottom / above the top band → escapes [0.01, 0.99] (where the
        // plain fan_position saturates) and stays monotone in price.
        assert!(ext(5.0) < TAUS[0], "deep capitulation must read below q01");
        assert!(ext(100.0) > TAUS[BAND_COUNT - 1], "blow-off top must read above q99");
        assert!(ext(1.0) <= ext(5.0) && ext(5.0) < ext(40.0) && ext(40.0) < ext(100.0));

        // Extremes stay finite and strictly inside (0, 1) — never collapse to 0/1.
        let hi = ext(100_000_000.0);
        let lo = ext(0.000_001);
        assert!(lo > 0.0 && hi < 1.0, "clamped to Φ(±{Z_CLAMP}), not 0/1: lo={lo} hi={hi}");

        // Same NaN rules as the clamped variant.
        assert!(f64::from(build_fan_position_extended(&[None], &bands)[0]).is_nan());
        assert!(f64::from(build_fan_position_extended(&[Some(-1.0)], &bands)[0]).is_nan());
        let zero_fan: [Vec<Cents>; BAND_COUNT] = std::array::from_fn(|_| vec![Cents::ZERO]);
        assert!(f64::from(build_fan_position_extended(&[Some(40.0)], &zero_fan)[0]).is_nan());
    }

    /// Day index at which `μ = ln(T_FLAT)` centers `x = ln(t) − μ` to 0, so each
    /// band's `predict_log10` collapses to its intercept `c = log10(price)` —
    /// letting [`flat_coef`] pin `band_prices(T_FLAT)` to exact USD values.
    const T_FLAT: f64 = 1000.0;

    fn flat_coef(prices: [f64; BAND_COUNT]) -> Coefficients {
        Coefficients {
            mu: T_FLAT.ln(),
            quantiles: std::array::from_fn(|k| QuantileCoef {
                tau: TAUS[k],
                c: prices[k].log10(),
                a: 0.0,
                b: 0.0,
            }),
        }
    }

    #[test]
    fn causal_fan_position_from_coef_matches_stored_band_path() {
        // Same ascending fan at $10..$70 (taus 0.01…0.99) as the stored-band
        // tests, but reconstructed from a fitted Coefficients at T_FLAT.
        let prices: [f64; BAND_COUNT] = std::array::from_fn(|k| 10.0 * (k as f64 + 1.0));
        let coef = flat_coef(prices);
        let fc = |p: f64| f64::from(fan_position_extended_from_coef(&coef, T_FLAT, Some(p)));

        // On the median band → ≈ 0.50.
        assert!((fc(40.0) - 0.50).abs() < 1e-3);

        // The coef path and the stored-cents path are the same mapping, so they
        // must agree on the same fan across the bands.
        let bands: [Vec<Cents>; BAND_COUNT] =
            std::array::from_fn(|k| vec![Cents::from(prices[k] * 100.0)]);
        for p in [12.0, 25.0, 40.0, 63.0] {
            let stored = f64::from(build_fan_position_extended(&[Some(p)], &bands)[0]);
            assert!(
                (fc(p) - stored).abs() < 1e-4,
                "coef {} vs stored {} at price {p}",
                fc(p),
                stored
            );
        }

        // Extended/unclamped: escapes [q01, q99] beyond the outer bands, monotone.
        assert!(fc(5.0) < TAUS[0], "deep capitulation reads below q01");
        assert!(fc(100.0) > TAUS[BAND_COUNT - 1], "blow-off top reads above q99");
        assert!(fc(1.0) <= fc(5.0) && fc(5.0) < fc(40.0) && fc(40.0) < fc(100.0));

        // Extremes stay strictly inside (0, 1) — clamped to Φ(±Z_CLAMP), not 0/1.
        assert!(fc(0.000_001) > 0.0 && fc(100_000_000.0) < 1.0);

        // NaN rules: no price, non-positive price, degenerate (zero) top band.
        assert!(f64::from(fan_position_extended_from_coef(&coef, T_FLAT, None)).is_nan());
        assert!(f64::from(fan_position_extended_from_coef(&coef, T_FLAT, Some(-1.0))).is_nan());
        let zero_coef = flat_coef([0.0; BAND_COUNT]);
        assert!(f64::from(fan_position_extended_from_coef(&zero_coef, T_FLAT, Some(40.0))).is_nan());
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
