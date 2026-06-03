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

/// Lower-tail quantile indices (`τ ∈ {0.01, 0.10, 0.25}`), sharing `b^LO`.
pub const LO_IDX: [usize; 3] = [0, 1, 2];
/// Upper-tail quantile indices (`τ ∈ {0.75, 0.95, 0.99}`), sharing `b^HI`.
pub const HI_IDX: [usize; 3] = [4, 5, 6];

/// Functional form to fit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Variant {
    /// Per-quantile linear `Qτ(y) = cτ + aτ·x`. The Slice 1 deliverable, and the
    /// warm start for the grouped-quadratic variants.
    Linear,
    /// Quadratic with a single curvature `b` shared across all quantiles.
    SymmetricQuadratic,
    /// Quadratic with curvature shared within tail groups: `b^LO` (lower),
    /// `b^MED` (median), `b^HI` (upper). The headline model.
    AsymmetricGrouped,
}

/// Specification of what to fit. Quantile levels and the tail-group partition
/// are fixed in code, not runtime-configurable.
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

    /// Quadratic with one shared curvature.
    pub fn symmetric_quadratic() -> Self {
        Self {
            variant: Variant::SymmetricQuadratic,
        }
    }

    /// Asymmetric grouped-curvature quadratic (the headline model).
    pub fn asymmetric_grouped() -> Self {
        Self {
            variant: Variant::AsymmetricGrouped,
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

    /// Lower-tail curvature `b^LO`.
    pub fn b_lo(&self) -> f64 {
        self.quantiles[LO_IDX[0]].b
    }

    /// Median curvature `b^MED`.
    pub fn b_med(&self) -> f64 {
        self.quantiles[MEDIAN_IDX].b
    }

    /// Upper-tail curvature `b^HI`.
    pub fn b_hi(&self) -> f64 {
        self.quantiles[HI_IDX[0]].b
    }

    /// Headline asymmetry `Δb = b^HI − b^LO`.
    pub fn delta_b(&self) -> f64 {
        self.b_hi() - self.b_lo()
    }

    /// The seven predicted prices at time `t`, monotone-rearranged so a higher
    /// quantile is never priced below a lower one.
    pub fn band_prices(&self, t: f64) -> [f64; 7] {
        let mut logs: [f64; 7] = std::array::from_fn(|qi| self.predict_log10(qi, t));
        crate::rearrange::rearrange(&mut logs);
        logs.map(|l| 10f64.powf(l))
    }
}

/// Convergence tolerance on the simplex objective spread.
const FIT_TOL: f64 = 1e-10;
/// Iteration cap for each per-quantile solve. On clean data the simplex reaches
/// `FIT_TOL` well before this; the cap only bounds pathological cases (e.g. the
/// noisy resampled series in the bootstrap) so they cannot run away.
const FIT_MAX_ITER: usize = 500;

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
    fit_inner(samples, spec, None)
}

/// Like [`fit`], but warm-starting the grouped-curvature search from
/// `warm_curvatures` (`[b^LO, b^MED, b^HI]`) and skipping the grid scan. The
/// objective is convex, so this converges to the same optimum as [`fit`] while
/// being much faster when fitting a sequence of overlapping windows (e.g. the
/// expanding-window coefficient trajectory). Ignored for [`Variant::Linear`].
pub fn fit_warm(samples: &[(f64, f64)], spec: &FitSpec, warm_curvatures: [f64; 3]) -> Coefficients {
    fit_inner(samples, spec, Some(warm_curvatures))
}

fn fit_inner(samples: &[(f64, f64)], spec: &FitSpec, warm: Option<[f64; 3]>) -> Coefficients {
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
        Variant::SymmetricQuadratic => fit_grouped(&xs, &ys, true, warm),
        Variant::AsymmetricGrouped => fit_grouped(&xs, &ys, false, warm),
    };

    Coefficients { mu, quantiles }
}

/// Centered OLS warm start. With x centered (mean 0): `c₀ = mean(y)`,
/// `a₀ = Σxy / Σx²`.
fn ols_warm(xs: &[f64], ys: &[f64]) -> (f64, f64) {
    let c0 = if ys.is_empty() {
        0.0
    } else {
        ys.iter().sum::<f64>() / ys.len() as f64
    };
    let sxx: f64 = xs.iter().map(|x| x * x).sum();
    let sxy: f64 = xs.iter().zip(ys).map(|(x, y)| x * y).sum();
    let a0 = if sxx != 0.0 { sxy / sxx } else { 0.0 };
    (c0, a0)
}

/// Solve a single linear quantile regression `(c, a)` for level `tau`,
/// warm-started from `(c0, a0)`.
fn solve_linear(tau: f64, xs: &[f64], ys: &[f64], c0: f64, a0: f64) -> (f64, f64) {
    let sol = crate::optimize::nelder_mead(
        |p: &[f64]| check_loss(tau, xs, ys, p[0], p[1]),
        &[c0, a0],
        FIT_TOL,
        FIT_MAX_ITER,
    );
    (sol[0], sol[1])
}

/// Per-quantile linear fit: each `τ` solved independently for `(c, a)`.
fn fit_linear(xs: &[f64], ys: &[f64]) -> [QuantileCoef; 7] {
    let (c0, a0) = ols_warm(xs, ys);
    TAUS.map(|tau| {
        let (c, a) = solve_linear(tau, xs, ys, c0, a0);
        QuantileCoef { tau, c, a, b: 0.0 }
    })
}

/// The curvature applied to quantile index `ti` given the three group values.
#[inline]
fn group_b(ti: usize, b_lo: f64, b_med: f64, b_hi: f64) -> f64 {
    match ti {
        0 | 1 | 2 => b_lo,
        3 => b_med,
        _ => b_hi,
    }
}

/// Grouped-quadratic fit via concentration: the objective is convex, so for any
/// fixed curvatures the inner `(cτ, aτ)` are independent linear quantile
/// regressions on the curvature-adjusted response `y − b·x²`. We therefore
/// optimize only over the curvatures (1 value when `symmetric`, else 3) with a
/// deterministic grid warm start refined by Nelder–Mead.
fn fit_grouped(
    xs: &[f64],
    ys: &[f64],
    symmetric: bool,
    warm_curvatures: Option<[f64; 3]>,
) -> [QuantileCoef; 7] {
    let xs2: Vec<f64> = xs.iter().map(|x| x * x).collect();
    let (c0, a0) = ols_warm(xs, ys);
    // Linear (b = 0) solutions warm-start every inner solve.
    let warm: Vec<(f64, f64)> = TAUS.iter().map(|&t| solve_linear(t, xs, ys, c0, a0)).collect();

    // Inner solve for quantile index `ti` at curvature `b`: returns (c, a, loss).
    let inner = |b: f64, ti: usize| -> (f64, f64, f64) {
        let tau = TAUS[ti];
        let adj: Vec<f64> = ys.iter().zip(&xs2).map(|(y, x2)| y - b * x2).collect();
        let (c, a) = solve_linear(tau, xs, &adj, warm[ti].0, warm[ti].1);
        (c, a, check_loss(tau, xs, &adj, c, a))
    };

    // Pooled check-loss as a function of the curvature vector.
    let objective = |bs: &[f64]| -> f64 {
        let (b_lo, b_med, b_hi) = if symmetric {
            (bs[0], bs[0], bs[0])
        } else {
            (bs[0], bs[1], bs[2])
        };
        (0..7)
            .map(|ti| inner(group_b(ti, b_lo, b_med, b_hi), ti).2)
            .sum()
    };

    // Warm-started: skip the grid and refine from the supplied curvatures.
    // Cold: scan a deterministic grid, then refine the best point.
    let best = match warm_curvatures {
        Some(w) => {
            let start: Vec<f64> = if symmetric { vec![w[1]] } else { w.to_vec() };
            crate::optimize::nelder_mead(&objective, &start, FIT_TOL, FIT_MAX_ITER)
        }
        None => grid_then_refine(&objective, if symmetric { 1 } else { 3 }),
    };
    let (b_lo, b_med, b_hi) = if symmetric {
        (best[0], best[0], best[0])
    } else {
        (best[0], best[1], best[2])
    };

    let mut quantiles = [QuantileCoef {
        tau: 0.0,
        c: 0.0,
        a: 0.0,
        b: 0.0,
    }; 7];
    for ti in 0..7 {
        let b = group_b(ti, b_lo, b_med, b_hi);
        let (c, a, _) = inner(b, ti);
        quantiles[ti] = QuantileCoef {
            tau: TAUS[ti],
            c,
            a,
            b,
        };
    }
    quantiles
}

/// Curvature grid (per dimension) used to warm-start the outer optimizer.
const CURVATURE_GRID: [f64; 7] = [-0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1];

/// Pick the best curvature vector on a deterministic Cartesian grid, then refine
/// it with Nelder–Mead.
fn grid_then_refine<F: Fn(&[f64]) -> f64>(f: &F, dim: usize) -> Vec<f64> {
    let g = CURVATURE_GRID.len();
    let total = g.pow(dim as u32);
    let mut best = vec![0.0; dim];
    let mut best_loss = f64::INFINITY;
    for idx in 0..total {
        let mut point = vec![0.0; dim];
        let mut rem = idx;
        for slot in point.iter_mut() {
            *slot = CURVATURE_GRID[rem % g];
            rem /= g;
        }
        let loss = f(&point);
        if loss < best_loss {
            best_loss = loss;
            best = point;
        }
    }
    crate::optimize::nelder_mead(f, &best, FIT_TOL, FIT_MAX_ITER)
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

    /// Samples on a known quadratic `y = c0 + a0·x + b0·x²`.
    fn quadratic_samples(c0: f64, a0: f64, b0: f64, ts: &[f64]) -> Vec<(f64, f64)> {
        let mu0 = mean_ln(ts);
        ts.iter()
            .map(|&t| {
                let x = t.ln() - mu0;
                (t, c0 + a0 * x + b0 * x * x)
            })
            .collect()
    }

    #[test]
    fn symmetric_quadratic_recovers_known_curvature() {
        let ts: Vec<f64> = (560..=4000).map(|d| d as f64).collect();
        let samples = quadratic_samples(2.0, 1.5, -0.15, &ts);

        let coef = fit(&samples, &FitSpec::symmetric_quadratic());

        assert!(
            (coef.b_med() - (-0.15)).abs() < 1e-3,
            "curvature was {}",
            coef.b_med()
        );
    }

    #[test]
    fn grouped_fit_collapses_to_equal_curvature_on_symmetric_data() {
        // Noiseless symmetric quadratic: every tail group must recover the same
        // curvature, so Δb ≈ 0.
        let ts: Vec<f64> = (560..=4000).map(|d| d as f64).collect();
        let samples = quadratic_samples(2.0, 1.5, -0.2, &ts);

        let coef = fit(&samples, &FitSpec::asymmetric_grouped());

        assert!((coef.b_lo() - (-0.2)).abs() < 1e-3, "b_lo {}", coef.b_lo());
        assert!((coef.b_med() - (-0.2)).abs() < 1e-3, "b_med {}", coef.b_med());
        assert!((coef.b_hi() - (-0.2)).abs() < 1e-3, "b_hi {}", coef.b_hi());
        assert!(coef.delta_b().abs() < 1e-3, "delta_b {}", coef.delta_b());
    }

    #[test]
    fn warm_start_converges_to_the_cold_optimum() {
        // The objective is convex, so a warm-started fit (skipping the grid)
        // must reach the same curvatures as the cold fit.
        let ts: Vec<f64> = (560..=5000).map(|d| d as f64).collect();
        let samples = quadratic_samples(3.0, 1.4, -0.22, &ts);

        let cold = fit(&samples, &FitSpec::asymmetric_grouped());
        let warm = fit_warm(
            &samples,
            &FitSpec::asymmetric_grouped(),
            [-0.05, -0.05, -0.05],
        );

        eprintln!(
            "cold b=({:.5},{:.5},{:.5}) warm b=({:.5},{:.5},{:.5})",
            cold.b_lo(), cold.b_med(), cold.b_hi(), warm.b_lo(), warm.b_med(), warm.b_hi()
        );
        // Both recover the injected curvature (-0.22); warm-start trades a little
        // precision for speed, so allow a small gap.
        for (w, c) in [
            (warm.b_lo(), cold.b_lo()),
            (warm.b_med(), cold.b_med()),
            (warm.b_hi(), cold.b_hi()),
        ] {
            assert!((w - c).abs() < 5e-3, "warm {w} vs cold {c}");
            assert!((w - (-0.22)).abs() < 5e-3, "warm {w} should recover -0.22");
        }
    }

    #[test]
    fn bands_are_non_crossing_through_2035() {
        // Fit a real-ish curved fan, then check the rearranged band never
        // crosses out to ~2035 (day index ≈ 9500).
        let ts: Vec<f64> = (592..=6360).map(|d| d as f64).collect();
        let samples = quadratic_samples(3.5, 1.6, -0.25, &ts);
        let coef = fit(&samples, &FitSpec::asymmetric_grouped());

        for day in (592..=9500).step_by(50) {
            let band = coef.band_prices(day as f64);
            assert!(
                crate::rearrange::is_non_crossing(&band),
                "band crossed at day {day}: {band:?}"
            );
        }
    }
}
