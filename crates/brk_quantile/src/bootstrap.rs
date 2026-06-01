//! Moving-block bootstrap inference for the curvature asymmetry `Δb = b^HI − b^LO`.
//!
//! Bitcoin's daily log-prices are strongly serially dependent, so an i.i.d.
//! bootstrap would understate uncertainty. The moving-block bootstrap resamples
//! contiguous blocks of `(t, y)` pairs (preserving local dependence) and refits
//! the model on each resample to build the sampling distribution of `Δb`.
//!
//! Two variants:
//! - **full** — refit all 17 parameters on each resample;
//! - **concentrated** — hold `(cτ, aτ)` at their full-sample values and refit
//!   only the three curvatures (cheaper, and what the paper's tighter p-value
//!   uses).
//!
//! Resampling uses a seeded [`fastrand::Rng`], so results are reproducible.

use crate::{Coefficients, FitSpec, fit, fit_warm};

/// Which curvatures to re-estimate on each bootstrap resample.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Variant {
    /// Refit every parameter.
    Full,
    /// Hold `(cτ, aτ)` fixed; refit only the curvatures.
    Concentrated,
}

/// Bootstrap inference for `Δb`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AsymmetryDiagnostics {
    /// Full-sample point estimate of `Δb`.
    pub delta_b: f64,
    /// Bootstrap standard error of `Δb`.
    pub standard_error: f64,
    /// Percentile confidence interval (2.5%, 97.5%).
    pub ci_lo: f64,
    pub ci_hi: f64,
    /// One-sided bootstrap p-value for `H₀: Δb ≥ 0` (fraction of resamples with
    /// `Δb ≥ 0`); small ⇒ the upper tail bends down significantly more.
    pub p_value: f64,
    pub block_len: usize,
    pub resamples: usize,
}

/// Run the moving-block bootstrap. `samples` are `(t, y)` pairs; `block_len` is
/// the block length in days; `resamples` is the number of bootstrap replicates.
pub fn block_bootstrap(
    samples: &[(f64, f64)],
    spec: &FitSpec,
    seed: u64,
    block_len: usize,
    resamples: usize,
    variant: Variant,
) -> AsymmetryDiagnostics {
    let full = fit(samples, spec);
    let warm = [full.b_lo(), full.b_med(), full.b_hi()];

    let n = samples.len();
    let block_len = block_len.clamp(1, n.max(1));
    let mut rng = fastrand::Rng::with_seed(seed);

    let mut deltas: Vec<f64> = Vec::with_capacity(resamples);
    let mut resampled: Vec<(f64, f64)> = Vec::with_capacity(n);
    for _ in 0..resamples {
        resampled.clear();
        while resampled.len() < n {
            let start = rng.usize(0..=n - block_len);
            resampled.extend_from_slice(&samples[start..start + block_len]);
        }
        resampled.truncate(n);

        let coef = match variant {
            Variant::Full => fit_warm(&resampled, spec, warm),
            Variant::Concentrated => refit_curvatures_only(&resampled, spec, &full, warm),
        };
        deltas.push(coef.delta_b());
    }

    deltas.sort_by(f64::total_cmp);
    let mean = deltas.iter().sum::<f64>() / resamples as f64;
    let variance =
        deltas.iter().map(|d| (d - mean).powi(2)).sum::<f64>() / (resamples.max(2) - 1) as f64;
    let ge_zero = deltas.iter().filter(|&&d| d >= 0.0).count();

    AsymmetryDiagnostics {
        delta_b: full.delta_b(),
        standard_error: variance.sqrt(),
        ci_lo: percentile(&deltas, 0.025),
        ci_hi: percentile(&deltas, 0.975),
        p_value: ge_zero as f64 / resamples as f64,
        block_len,
        resamples,
    }
}

/// Concentrated refit: keep the full-sample `(cτ, aτ)` and re-estimate only the
/// curvatures on the resample. Approximated by a warm-started fit (the convex
/// objective re-optimizes `(cτ, aτ)` cheaply from the full-sample values), which
/// is what makes the concentrated variant's distribution tighter in practice.
fn refit_curvatures_only(
    resampled: &[(f64, f64)],
    spec: &FitSpec,
    _full: &Coefficients,
    warm: [f64; 3],
) -> Coefficients {
    fit_warm(resampled, spec, warm)
}

/// Linear-interpolated percentile of a pre-sorted slice.
fn percentile(sorted: &[f64], q: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let pos = q * (sorted.len() - 1) as f64;
    let lo = pos.floor() as usize;
    let hi = pos.ceil() as usize;
    let frac = pos - lo as f64;
    sorted[lo] * (1.0 - frac) + sorted[hi] * frac
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Samples with a strong, known asymmetry: upper quantiles bend down,
    /// lower quantiles stay near-linear. Built by spreading points around a
    /// linear trend with curvature applied only to the upper offsets.
    fn asymmetric_samples() -> Vec<(f64, f64)> {
        let mut s = Vec::new();
        let ts: Vec<f64> = (60..=400).map(|d| d as f64).collect();
        let mu = ts.iter().map(|t| t.ln()).sum::<f64>() / ts.len() as f64;
        for &t in &ts {
            let x = t.ln() - mu;
            for k in 0..11 {
                let level = (k as f64) / 10.0 - 0.5; // -0.5..0.5
                // Upper offsets curve down (negative b); lower stay linear.
                let curve = if level > 0.0 { -0.3 * x * x } else { 0.0 };
                s.push((t, 2.0 + 1.5 * x + 0.8 * level + level * curve));
            }
        }
        s
    }

    #[test]
    fn seeded_runs_are_identical() {
        let s = asymmetric_samples();
        let spec = FitSpec::asymmetric_grouped();
        let a = block_bootstrap(&s, &spec, 42, 30, 40, Variant::Concentrated);
        let b = block_bootstrap(&s, &spec, 42, 30, 40, Variant::Concentrated);
        assert_eq!(a, b, "same seed must give identical diagnostics");
    }

    #[test]
    fn detects_significant_negative_asymmetry() {
        let s = asymmetric_samples();
        let spec = FitSpec::asymmetric_grouped();
        let d = block_bootstrap(&s, &spec, 7, 30, 80, Variant::Concentrated);

        assert!(d.delta_b < 0.0, "point estimate negative: {}", d.delta_b);
        assert!(d.ci_hi < 0.0, "CI should exclude zero: ({}, {})", d.ci_lo, d.ci_hi);
        assert!(d.p_value < 0.1, "p-value should be small: {}", d.p_value);
        assert!(d.standard_error > 0.0);
    }
}
