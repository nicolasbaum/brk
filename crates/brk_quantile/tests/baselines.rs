//! Prior-model bias reproduction (Tables 1 / 2 / 2b).
//!
//! Evaluates the published OLS power-law, S2F, and S2FX models against the
//! realized close over a committed frozen fixture, and checks the systematic
//! optimistic bias the working paper documents.
//!
//! The fixture spans the full price history, so the *magnitudes* are smaller
//! than the paper's window-specific headline figures (+32% / +295% / +1699%) —
//! that dilution is expected. What reproduces robustly, and is asserted here, is
//! the qualitative finding: all three models are systematically optimistic and
//! the bias worsens monotonically OLS → S2F → S2FX.

use brk_quantile::baselines::{bias_summary, ols_power_law_log10, s2f_log10, s2fx_ln_market_cap};

struct Row {
    t: f64,
    close: f64,
    sf: f64,
    supply: f64,
}

fn load_rows() -> Vec<Row> {
    let csv = include_str!("fixtures/btc_daily_model_inputs.csv");
    csv.lines()
        .filter(|l| !l.starts_with('#') && !l.starts_with('t'))
        .filter_map(|l| {
            let mut it = l.split(',');
            let t = it.next()?.trim().parse().ok()?;
            let close = it.next()?.trim().parse().ok()?;
            let sf = it.next()?.trim().parse().ok()?;
            let supply = it.next()?.trim().parse().ok()?;
            Some(Row {
                t,
                close,
                sf,
                supply,
            })
        })
        .collect()
}

#[test]
fn reproduces_systematic_optimistic_bias() {
    let rows = load_rows();
    assert!(rows.len() > 5000, "fixture too small: {}", rows.len());

    let actual: Vec<f64> = rows.iter().map(|r| r.close.log10()).collect();
    let ols: Vec<f64> = rows.iter().map(|r| ols_power_law_log10(r.t)).collect();
    let s2f: Vec<f64> = rows.iter().map(|r| s2f_log10(r.sf)).collect();
    // S2FX predicts market cap; divide by supply to get a comparable price.
    let s2fx: Vec<f64> = rows
        .iter()
        .map(|r| (s2fx_ln_market_cap(r.sf).exp() / r.supply).log10())
        .collect();

    let b_ols = bias_summary(&ols, &actual);
    let b_s2f = bias_summary(&s2f, &actual);
    let b_s2fx = bias_summary(&s2fx, &actual);

    for (name, b, paper) in [
        ("OLS", b_ols, "+32%"),
        ("S2F", b_s2f, "+295%"),
        ("S2FX", b_s2fx, "+1699%"),
    ] {
        eprintln!(
            "{name}: geomean price error {:+.1}%  optimistic {:.0}%  (paper {paper})",
            b.geometric_mean_price_error * 100.0,
            b.fraction_optimistic * 100.0
        );
    }

    // All three are systematically optimistic.
    for b in [b_ols, b_s2f, b_s2fx] {
        assert!(b.geometric_mean_price_error > 0.0, "should be optimistic");
        assert!(b.fraction_optimistic > 0.5, "optimistic most days");
    }

    // Bias worsens monotonically OLS → S2F → S2FX (the paper's central claim).
    assert!(
        b_ols.geometric_mean_price_error < b_s2f.geometric_mean_price_error,
        "S2F should be more optimistic than OLS"
    );
    assert!(
        b_s2f.geometric_mean_price_error < b_s2fx.geometric_mean_price_error,
        "S2FX should be the most optimistic"
    );

    // Fixture-vintage magnitudes, locked as a regression guard (window-dependent,
    // hence looser than the paper's headline figures).
    assert!((b_ols.geometric_mean_price_error - 0.14).abs() < 0.10, "OLS magnitude");
    assert!((b_s2f.geometric_mean_price_error - 0.98).abs() < 0.30, "S2F magnitude");
    assert!((b_s2fx.geometric_mean_price_error - 3.80).abs() < 1.00, "S2FX magnitude");
}
