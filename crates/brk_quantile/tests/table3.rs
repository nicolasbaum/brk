//! Table-3 reproduction (HITL gate).
//!
//! Fits the asymmetric grouped-curvature model on a committed frozen daily-close
//! fixture and checks it reproduces the working paper's headline coefficients
//! within tolerance. Tolerances are deliberately loose to absorb fixture-vintage
//! drift (the fixture extends past the paper's cutoff).

use brk_quantile::{FitSpec, fit};

/// Parse the `t,close` fixture (skipping `#` comment lines and the header) into
/// `(t, log10(close))` samples.
fn load_samples() -> Vec<(f64, f64)> {
    let csv = include_str!("fixtures/btc_daily_close.csv");
    csv.lines()
        .filter(|l| !l.starts_with('#') && !l.starts_with('t'))
        .filter_map(|l| {
            let (t, close) = l.split_once(',')?;
            let t: f64 = t.trim().parse().ok()?;
            let close: f64 = close.trim().parse().ok()?;
            (close > 0.0).then_some((t, close.log10()))
        })
        .collect()
}

#[test]
fn reproduces_table_3_coefficients() {
    let samples = load_samples();
    assert!(samples.len() > 5000, "fixture too small: {}", samples.len());

    let coef = fit(&samples, &FitSpec::asymmetric_grouped());

    // Print actuals for the HITL reviewer (`cargo test -- --nocapture`).
    eprintln!("Table-3 reproduction (n = {} samples):", samples.len());
    eprintln!("  mu     = {:.4}  (paper ≈ 7.99)", coef.mu);
    eprintln!("  b^LO   = {:.4}  (paper ≈ -0.024)", coef.b_lo());
    eprintln!("  b^MED  = {:.4}  (paper ≈ -0.113)", coef.b_med());
    eprintln!("  b^HI   = {:.4}  (paper ≈ -0.326)", coef.b_hi());
    eprintln!("  Δb     = {:.4}  (paper ≈ -0.302)", coef.delta_b());
    for q in &coef.quantiles {
        eprintln!(
            "  τ={:.2}: c={:.4} a={:.4} b={:.4}",
            q.tau, q.c, q.a, q.b
        );
    }

    // Direction-of-asymmetry must hold regardless of vintage: upper tail bends
    // down more than the (near-zero) lower tail.
    assert!(
        coef.b_hi() < coef.b_lo(),
        "upper curvature {} should be below lower {}",
        coef.b_hi(),
        coef.b_lo()
    );
    assert!(coef.delta_b() < 0.0, "Δb should be negative: {}", coef.delta_b());

    // Magnitudes within tolerance of the paper. Headroom (~3× the observed
    // ~0.015 vintage drift) guards against regressions without flaking if the
    // fixture is later refreshed with more data.
    assert!((coef.mu - 7.99).abs() < 0.05, "mu = {}", coef.mu);
    assert!((coef.b_lo() - (-0.024)).abs() < 0.04, "b^LO = {}", coef.b_lo());
    assert!((coef.b_med() - (-0.113)).abs() < 0.04, "b^MED = {}", coef.b_med());
    assert!((coef.b_hi() - (-0.326)).abs() < 0.05, "b^HI = {}", coef.b_hi());
    assert!((coef.delta_b() - (-0.302)).abs() < 0.05, "Δb = {}", coef.delta_b());
}
