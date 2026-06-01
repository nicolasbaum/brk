//! Grouped quantile regression in centered log-time.
//!
//! The model fits, for each quantile level `τ`,
//!
//! ```text
//! Qτ(y) = cτ + aτ·x + b(τ)·x²,   x = ln(t) − μ
//! ```
//!
//! where `t` is days since the genesis anchor, `y = log10(close)`, and `μ` is
//! the mean of `ln t` over the fit window. Slice 1 implements the [`Variant::Linear`]
//! form (`b ≡ 0`), which also supplies the warm start for the later grouped
//! quadratic fits.

/// The seven quantile levels `τ` the model targets, ascending.
pub const TAUS: [f64; 7] = [0.01, 0.10, 0.25, 0.50, 0.75, 0.95, 0.99];

/// Index of the median (`τ = 0.50`) within [`TAUS`].
pub const MEDIAN_IDX: usize = 3;

/// Functional form to fit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Variant {
    /// Per-quantile linear `Qτ(y) = cτ + aτ·x`. The Slice 1 deliverable, and the
    /// warm start for the later grouped-quadratic variants.
    Linear,
}

/// Specification of what to fit. Quantile levels and (later) tail-group
/// partition are fixed in code, not runtime-configurable.
#[derive(Debug, Clone)]
pub struct FitSpec {
    pub variant: Variant,
}

impl FitSpec {
    /// Per-quantile linear fit.
    pub fn linear() -> Self {
        Self {
            variant: Variant::Linear,
        }
    }
}

/// Fitted coefficients for a single quantile level.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct QuantileCoef {
    pub tau: f64,
    pub c: f64,
    pub a: f64,
    /// Curvature. Zero for [`Variant::Linear`].
    pub b: f64,
}

/// The full fitted model: the centering constant `μ` plus one coefficient row
/// per quantile level (ascending, aligned with [`TAUS`]).
#[derive(Debug, Clone, PartialEq)]
pub struct Coefficients {
    pub mu: f64,
    pub quantiles: [QuantileCoef; 7],
}

impl Coefficients {
    /// Predicted `log10(price)` for quantile index `qi` at time `t` (days since
    /// genesis).
    pub fn predict_log10(&self, qi: usize, t: f64) -> f64 {
        let q = &self.quantiles[qi];
        let x = t.ln() - self.mu;
        q.c + q.a * x + q.b * x * x
    }

    /// Predicted price for quantile index `qi` at time `t`.
    pub fn predict_price(&self, qi: usize, t: f64) -> f64 {
        10f64.powf(self.predict_log10(qi, t))
    }

    /// The median (`τ = 0.50`) coefficient row.
    pub fn median(&self) -> &QuantileCoef {
        &self.quantiles[MEDIAN_IDX]
    }
}

/// Convergence tolerance on the simplex objective spread.
const FIT_TOL: f64 = 1e-10;
/// Iteration cap for each per-quantile solve.
const FIT_MAX_ITER: usize = 2000;

/// The pooled check-loss `Σ ρτ(yᵢ − ŷᵢ)`, `ρτ(u) = u·(τ − 𝟙{u<0})`.
fn check_loss(tau: f64, xs: &[f64], ys: &[f64], c: f64, a: f64) -> f64 {
    let mut sum = 0.0;
    for (&x, &y) in xs.iter().zip(ys) {
        let u = y - (c + a * x);
        sum += u * (tau - if u < 0.0 { 1.0 } else { 0.0 });
    }
    sum
}

/// Fit the model to `(t, y)` samples (`t` = days since genesis, `y = log10(close)`).
pub fn fit(samples: &[(f64, f64)], spec: &FitSpec) -> Coefficients {
    // Center log-time: x = ln(t) − μ, μ = mean(ln t) over the fit window.
    let xs_raw: Vec<f64> = samples.iter().map(|&(t, _)| t.ln()).collect();
    let ys: Vec<f64> = samples.iter().map(|&(_, y)| y).collect();
    let n = samples.len() as f64;
    let mu = if samples.is_empty() {
        0.0
    } else {
        xs_raw.iter().sum::<f64>() / n
    };
    let xs: Vec<f64> = xs_raw.iter().map(|x| x - mu).collect();

    let quantiles = match spec.variant {
        Variant::Linear => fit_linear(&xs, &ys),
    };

    Coefficients { mu, quantiles }
}

/// Per-quantile linear fit: each `τ` solved independently for `(c, a)`,
/// warm-started from the centered OLS line and refined by check-loss descent.
fn fit_linear(xs: &[f64], ys: &[f64]) -> [QuantileCoef; 7] {
    // OLS warm start. With x centered (mean 0): c₀ = mean(y), a₀ = Σxy / Σx².
    let c0 = if ys.is_empty() {
        0.0
    } else {
        ys.iter().sum::<f64>() / ys.len() as f64
    };
    let sxx: f64 = xs.iter().map(|x| x * x).sum();
    let sxy: f64 = xs.iter().zip(ys).map(|(x, y)| x * y).sum();
    let a0 = if sxx != 0.0 { sxy / sxx } else { 0.0 };

    TAUS.map(|tau| {
        let sol = crate::optimize::nelder_mead(
            |p: &[f64]| check_loss(tau, xs, ys, p[0], p[1]),
            &[c0, a0],
            FIT_TOL,
            FIT_MAX_ITER,
        );
        QuantileCoef {
            tau,
            c: sol[0],
            a: sol[1],
            b: 0.0,
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mean_ln(ts: &[f64]) -> f64 {
        ts.iter().map(|t| t.ln()).sum::<f64>() / ts.len() as f64
    }

    /// Samples lying exactly on a known median line `y = c0 + a0·(ln t − μ0)`.
    fn linear_samples(c0: f64, a0: f64, ts: &[f64]) -> Vec<(f64, f64)> {
        let mu0 = mean_ln(ts);
        ts.iter().map(|&t| (t, c0 + a0 * (t.ln() - mu0))).collect()
    }

    #[test]
    fn recovers_known_linear_median() {
        // ~July 2010 onward (first days with a positive close) through ~mid-2025.
        let ts: Vec<f64> = (560..=6000).map(|d| d as f64).collect();
        let samples = linear_samples(2.0, 1.5, &ts);

        let coef = fit(&samples, &FitSpec::linear());
        let m = coef.median();

        assert!((m.c - 2.0).abs() < 1e-6, "intercept c was {}", m.c);
        assert!((m.a - 1.5).abs() < 1e-6, "slope a was {}", m.a);
        assert!(m.b.abs() < 1e-12, "linear fit must have b = 0, was {}", m.b);
    }

    #[test]
    fn mu_is_mean_of_log_time() {
        let ts: Vec<f64> = (560..=6000).map(|d| d as f64).collect();
        let samples = linear_samples(2.0, 1.5, &ts);

        let coef = fit(&samples, &FitSpec::linear());

        assert!(
            (coef.mu - mean_ln(&ts)).abs() < 1e-12,
            "mu should be mean(ln t), was {}",
            coef.mu
        );
    }

    #[test]
    fn higher_quantiles_predict_higher_prices() {
        // At each time, prices are spread symmetrically around a linear trend.
        let ts: Vec<f64> = (1..=60).map(|k| 560.0 + (k as f64) * 90.0).collect();
        let offsets: Vec<f64> = (0..=100).map(|k| -1.0 + 0.02 * k as f64).collect();
        let mu0 = mean_ln(&ts);
        let mut samples = Vec::new();
        for &t in &ts {
            let base = 2.0 + 1.5 * (t.ln() - mu0);
            for &o in &offsets {
                samples.push((t, base + o));
            }
        }

        let coef = fit(&samples, &FitSpec::linear());

        let t_eval = ts[ts.len() / 2];
        let q01 = coef.predict_log10(0, t_eval); // τ = 0.01
        let q50 = coef.predict_log10(MEDIAN_IDX, t_eval); // τ = 0.50
        let q95 = coef.predict_log10(5, t_eval); // τ = 0.95
        assert!(q01 < q50, "q01 {q01} should sit below the median {q50}");
        assert!(q50 < q95, "median {q50} should sit below q95 {q95}");
    }

    #[test]
    fn fit_is_deterministic() {
        let ts: Vec<f64> = (560..=3000).map(|d| d as f64).collect();
        let samples = linear_samples(2.0, 1.5, &ts);

        let first = fit(&samples, &FitSpec::linear());
        let second = fit(&samples, &FitSpec::linear());

        assert_eq!(first, second, "same input must give bit-identical output");
    }

    #[test]
    fn predict_price_is_ten_pow_log10() {
        let ts: Vec<f64> = (560..=3000).map(|d| d as f64).collect();
        let samples = linear_samples(2.0, 1.5, &ts);
        let coef = fit(&samples, &FitSpec::linear());

        let t = 2000.0;
        let expected = 10f64.powf(coef.predict_log10(MEDIAN_IDX, t));
        assert_eq!(coef.predict_price(MEDIAN_IDX, t), expected);
    }
}
