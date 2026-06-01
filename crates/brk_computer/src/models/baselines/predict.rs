//! Pure prior-model predicted-price / forecast-error construction.
//!
//! Applies `brk_quantile::baselines` published coefficients to per-day inputs to
//! produce, for each prior model, a predicted-price series (cents) and a per-day
//! `log₁₀` forecast-error series (predicted − actual). Kept free of vecdb I/O so
//! it can be unit-tested directly.

use brk_quantile::baselines::{ols_power_law_log10, s2f_log10, s2fx_ln_market_cap};
use brk_types::{Cents, StoredF32};

/// Per-day inputs for the prior-model baselines. `None` marks a day whose input
/// is unavailable (the model emits zeros there).
#[derive(Debug, Clone, Copy)]
pub(crate) struct DayInput {
    /// Days since the genesis anchor.
    pub t: f64,
    /// Realized close (USD).
    pub close: Option<f64>,
    /// Stock-to-flow ratio.
    pub sf: Option<f64>,
    /// Circulating supply (BTC).
    pub supply: Option<f64>,
}

/// A prior model's stored output: predicted price (cents) and `log₁₀` forecast
/// error (predicted − actual), one value per day.
pub(crate) struct ModelSeries {
    pub price: Vec<Cents>,
    pub error: Vec<StoredF32>,
}

impl ModelSeries {
    fn with_capacity(n: usize) -> Self {
        Self {
            price: Vec::with_capacity(n),
            error: Vec::with_capacity(n),
        }
    }

    /// Append one day from a predicted `log₁₀(price)` (or `None` to emit zeros).
    fn push(&mut self, predicted_log10: Option<f64>, close: Option<f64>) {
        match predicted_log10 {
            Some(p) if p.is_finite() => {
                self.price.push(Cents::from((10f64.powf(p) * 100.0).max(0.0)));
                self.error.push(match close {
                    Some(c) if c > 0.0 => StoredF32::from((p - c.log10()) as f32),
                    _ => StoredF32::from(0.0f32),
                });
            }
            _ => {
                self.price.push(Cents::ZERO);
                self.error.push(StoredF32::from(0.0f32));
            }
        }
    }
}

/// The three prior-model output series.
pub(crate) struct Baselines {
    pub ols_power_law: ModelSeries,
    pub s2f: ModelSeries,
    pub s2fx: ModelSeries,
}

/// Build the OLS / S2F / S2FX predicted-price and error series from per-day inputs.
pub(crate) fn build_baselines(inputs: &[DayInput]) -> Baselines {
    let n = inputs.len();
    let mut ols = ModelSeries::with_capacity(n);
    let mut s2f = ModelSeries::with_capacity(n);
    let mut s2fx = ModelSeries::with_capacity(n);

    for d in inputs {
        // OLS power law: needs only time.
        ols.push((d.t > 0.0).then(|| ols_power_law_log10(d.t)), d.close);

        // S2F: needs a positive stock-to-flow.
        s2f.push(d.sf.filter(|&s| s > 0.0).map(s2f_log10), d.close);

        // S2FX predicts market cap; divide by supply to get a comparable price.
        let s2fx_log10 = match (d.sf, d.supply) {
            (Some(sf), Some(sup)) if sf > 0.0 && sup > 0.0 => {
                Some((s2fx_ln_market_cap(sf).exp() / sup).log10())
            }
            _ => None,
        };
        s2fx.push(s2fx_log10, d.close);
    }

    Baselines {
        ols_power_law: ols,
        s2f,
        s2fx,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn day(t: f64, close: f64, sf: f64, supply: f64) -> DayInput {
        DayInput {
            t,
            close: Some(close),
            sf: Some(sf),
            supply: Some(supply),
        }
    }

    #[test]
    fn predicted_prices_are_positive_and_errors_signed() {
        // A day where every model massively over-predicts a tiny close.
        let inputs = vec![day(3000.0, 1.0, 60.0, 19_000_000.0)];
        let b = build_baselines(&inputs);

        for series in [&b.ols_power_law, &b.s2f, &b.s2fx] {
            assert!(u64::from(series.price[0]) > 0, "predicted price positive");
            // Predicted ≫ actual (1.0) ⇒ positive (optimistic) log error.
            assert!(f64::from(series.error[0]) > 0.0, "error should be optimistic");
        }
    }

    #[test]
    fn missing_inputs_emit_zeros() {
        let inputs = vec![DayInput {
            t: 0.0,
            close: None,
            sf: None,
            supply: None,
        }];
        let b = build_baselines(&inputs);
        assert_eq!(b.s2f.price[0], Cents::ZERO);
        assert_eq!(f64::from(b.s2f.error[0]), 0.0);
        assert_eq!(b.s2fx.price[0], Cents::ZERO);
    }

    #[test]
    fn ols_matches_published_formula() {
        let t = (8.0f64).exp();
        let inputs = vec![day(t, 100.0, 50.0, 18_000_000.0)];
        let b = build_baselines(&inputs);
        // 10^(2.5535*8 - 17.1156) dollars → cents.
        let expected = Cents::from((10f64.powf(3.3124) * 100.0).max(0.0));
        assert_eq!(b.ols_power_law.price[0], expected);
    }
}
