//! Out-of-sample, expanding-window comparison of the asymmetric model against a
//! linear baseline, with a Diebold–Mariano statistic on the check-loss
//! differential.
//!
//! The paper's point is nuanced: the asymmetric model genuinely improves
//! out-of-sample prediction in the *upper* tail, but not necessarily in the
//! lower tail / median (which are sensitive to training-window composition).
//! These helpers expose that rather than asserting uniform improvement.

use crate::{FitSpec, MEDIAN_IDX, fit, fit_warm};

/// Check-loss `ρτ(actual − predicted)` for a single one-step-ahead forecast.
pub fn pinball(tau: f64, predicted: f64, actual: f64) -> f64 {
    let u = actual - predicted;
    u * (tau - if u < 0.0 { 1.0 } else { 0.0 })
}

/// Diebold–Mariano statistic for loss differentials `dᵢ = lossₐ − loss_b`.
/// Positive ⇒ model B has the lower expected loss. Uses the simple (no-HAC)
/// variance; with serially-correlated differentials treat it as indicative.
pub fn diebold_mariano(loss_a: &[f64], loss_b: &[f64]) -> f64 {
    let n = loss_a.len();
    if n < 2 {
        return 0.0;
    }
    let d: Vec<f64> = loss_a.iter().zip(loss_b).map(|(a, b)| a - b).collect();
    let mean = d.iter().sum::<f64>() / n as f64;
    let var = d.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64;
    if var <= 0.0 {
        return 0.0;
    }
    mean / (var / n as f64).sqrt()
}

/// Expanding-window OOS comparison at quantile index `qi`.
#[derive(Debug, Clone)]
pub struct OosComparison {
    /// One-step-ahead check-loss of the asymmetric model at each cutpoint.
    pub asymmetric_loss: Vec<f64>,
    /// One-step-ahead check-loss of the linear baseline at each cutpoint.
    pub linear_loss: Vec<f64>,
    /// Diebold–Mariano statistic (linear − asymmetric); positive ⇒ asymmetric wins.
    pub dm_stat: f64,
}

impl OosComparison {
    /// Mean check-loss improvement of the asymmetric model over the baseline.
    pub fn mean_improvement(&self) -> f64 {
        let n = self.asymmetric_loss.len().max(1) as f64;
        let a: f64 = self.asymmetric_loss.iter().sum::<f64>() / n;
        let l: f64 = self.linear_loss.iter().sum::<f64>() / n;
        l - a
    }
}

/// Run the expanding-window OOS comparison at quantile index `qi`: at each
/// cutpoint `k` (from `start`, stepping by `stride`), fit both models on
/// `samples[..k]` and score the one-step-ahead forecast of `samples[k]`. Fits
/// are warm-chained for speed.
pub fn expanding_window_oos(
    samples: &[(f64, f64)],
    qi: usize,
    start: usize,
    stride: usize,
) -> OosComparison {
    let asym = FitSpec::asymmetric_grouped();
    let lin = FitSpec::linear();
    let tau = crate::TAUS[qi];
    let stride = stride.max(1);

    let mut asymmetric_loss = Vec::new();
    let mut linear_loss = Vec::new();
    let mut warm: Option<[f64; 3]> = None;

    let mut k = start;
    while k < samples.len() {
        let (t, y) = samples[k];
        let train = &samples[..k];

        let a_coef = match warm {
            Some(w) => fit_warm(train, &asym, w),
            None => fit(train, &asym),
        };
        warm = Some([a_coef.b_lo(), a_coef.b_med(), a_coef.b_hi()]);
        let l_coef = fit(train, &lin);

        asymmetric_loss.push(pinball(tau, a_coef.predict_log10(qi, t), y));
        linear_loss.push(pinball(tau, l_coef.predict_log10(qi, t), y));
        k += stride;
    }

    let dm_stat = diebold_mariano(&linear_loss, &asymmetric_loss);
    OosComparison {
        asymmetric_loss,
        linear_loss,
        dm_stat,
    }
}

/// Convenience: OOS comparison at the median quantile.
pub fn expanding_window_oos_median(samples: &[(f64, f64)], start: usize, stride: usize) -> OosComparison {
    expanding_window_oos(samples, MEDIAN_IDX, start, stride)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pinball_penalizes_asymmetrically() {
        // τ=0.9: under-prediction (actual above) penalized 0.9, over-prediction 0.1.
        assert!((pinball(0.9, 0.0, 1.0) - 0.9).abs() < 1e-12);
        assert!((pinball(0.9, 1.0, 0.0) - 0.1).abs() < 1e-12);
    }

    #[test]
    fn diebold_mariano_sign_tracks_lower_loss() {
        // Model B (second arg) uniformly lower loss ⇒ positive statistic.
        let loss_a = [1.0, 1.2, 0.9, 1.1, 1.05];
        let loss_b = [0.5, 0.6, 0.4, 0.55, 0.5];
        assert!(diebold_mariano(&loss_a, &loss_b) > 0.0);
        assert!(diebold_mariano(&loss_b, &loss_a) < 0.0);
        assert_eq!(diebold_mariano(&loss_a, &loss_a), 0.0);
    }
}
