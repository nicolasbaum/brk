//! Prior public Bitcoin price models, evaluated from their *published*
//! coefficients (not re-estimated), so BRK can show — directly against realized
//! price — the systematic optimistic bias documented in the working paper.
//!
//! - OLS power law: `log₁₀P = 2.5535·ln t − 17.1156`
//! - Stock-to-flow (S2F): `log₁₀P = 3.4012·log₁₀(SF) − 1.0456`
//! - S2FX: `ln(mktcap) = 12.7598 + 4.1167·ln(SF)`

/// OLS power-law predicted `log₁₀(price)`. `t` = days since the genesis anchor.
pub fn ols_power_law_log10(t: f64) -> f64 {
    2.5535 * t.ln() - 17.1156
}

/// Stock-to-flow (S2F) predicted `log₁₀(price)`. `sf` = stock-to-flow ratio.
pub fn s2f_log10(sf: f64) -> f64 {
    3.4012 * sf.log10() - 1.0456
}

/// S2FX predicted natural-log market capitalization (USD). `sf` = stock-to-flow.
pub fn s2fx_ln_market_cap(sf: f64) -> f64 {
    12.7598 + 4.1167 * sf.ln()
}

/// Per-model forecast bias over aligned `(predicted, actual)` `log₁₀`-price series.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BiasSummary {
    /// Mean `log₁₀` error (predicted − actual). Positive ⇒ optimistic.
    pub mean_log_error: f64,
    /// Fraction of days the model priced strictly above the realized close.
    pub fraction_optimistic: f64,
    /// Geometric-mean price error: `geomean(P̂ / P) − 1` (e.g. 0.32 = +32%).
    pub geometric_mean_price_error: f64,
}

/// Summarize forecast bias from aligned predicted/actual `log₁₀`-price series.
pub fn bias_summary(predicted_log10: &[f64], actual_log10: &[f64]) -> BiasSummary {
    assert_eq!(
        predicted_log10.len(),
        actual_log10.len(),
        "predicted and actual series must align"
    );
    let n = predicted_log10.len();
    if n == 0 {
        return BiasSummary {
            mean_log_error: 0.0,
            fraction_optimistic: 0.0,
            geometric_mean_price_error: 0.0,
        };
    }

    let mut sum_err = 0.0;
    let mut optimistic = 0usize;
    for (&p, &a) in predicted_log10.iter().zip(actual_log10) {
        sum_err += p - a;
        if p > a {
            optimistic += 1;
        }
    }
    let mean_log_error = sum_err / n as f64;
    BiasSummary {
        mean_log_error,
        fraction_optimistic: optimistic as f64 / n as f64,
        geometric_mean_price_error: 10f64.powf(mean_log_error) - 1.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn published_formulas_match_known_points() {
        // OLS at t = e^8 days: 2.5535*8 - 17.1156 = 3.3124.
        assert!((ols_power_law_log10((8.0f64).exp()) - 3.3124).abs() < 1e-9);
        // S2F at SF = 10: 3.4012*1 - 1.0456 = 2.3556.
        assert!((s2f_log10(10.0) - 2.3556).abs() < 1e-9);
        // S2FX at SF = e: 12.7598 + 4.1167 = 16.8765.
        assert!((s2fx_ln_market_cap(std::f64::consts::E) - 16.8765).abs() < 1e-9);
    }

    #[test]
    fn bias_summary_flags_uniform_optimism() {
        // Predicted = 2× actual everywhere ⇒ +100% geometric price error.
        let actual = [1.0, 2.0, 3.0];
        let predicted: Vec<f64> = actual.iter().map(|a| a + 2.0f64.log10()).collect();

        let s = bias_summary(&predicted, &actual);

        assert!((s.mean_log_error - 2.0f64.log10()).abs() < 1e-12);
        assert_eq!(s.fraction_optimistic, 1.0);
        assert!((s.geometric_mean_price_error - 1.0).abs() < 1e-12);
    }

    #[test]
    fn bias_summary_is_neutral_when_predictions_match() {
        let actual = [1.0, 2.0, 3.0, 4.0];
        let s = bias_summary(&actual, &actual);
        assert_eq!(s.mean_log_error, 0.0);
        assert_eq!(s.fraction_optimistic, 0.0);
        assert_eq!(s.geometric_mean_price_error, 0.0);
    }
}
