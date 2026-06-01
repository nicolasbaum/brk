//! Table-8 dislocation reproduction.
//!
//! Fits the fan on the frozen fixture, evaluates the 1% band, and checks the
//! major historical below-band dislocations surface as clustered events — both
//! conservative (close-based) and extreme (intraday-wick-based). The deep
//! liquidity events (Sept 2010, the FTX collapse late 2022) breach the band on
//! the close; the 2015 bear-market bottom only breaches it on the wick.

use brk_quantile::dislocation::{DislocationEvent, dislocation};
use brk_quantile::{FitSpec, fit};

struct Row {
    t: usize,
    close: f64,
    low: f64,
}

fn load_rows() -> Vec<Row> {
    let csv = include_str!("fixtures/btc_daily_close_low.csv");
    csv.lines()
        .filter(|l| !l.starts_with('#') && !l.starts_with('t'))
        .filter_map(|l| {
            let mut it = l.split(',');
            Some(Row {
                t: it.next()?.trim().parse().ok()?,
                close: it.next()?.trim().parse().ok()?,
                low: it.next()?.trim().parse().ok()?,
            })
        })
        .collect()
}

fn year_of(day: usize) -> i32 {
    2009 + (day as f64 / 365.25) as i32
}

fn has_event_in(events: &[DislocationEvent], lo: usize, hi: usize) -> bool {
    events.iter().any(|e| e.trough_day >= lo && e.trough_day <= hi)
}

fn print_events(label: &str, events: &[DislocationEvent]) {
    eprintln!("{label} dislocations (deepest first):");
    let mut sorted = events.to_vec();
    sorted.sort_by(|a, b| a.peak_undershoot.total_cmp(&b.peak_undershoot));
    for e in sorted.iter().take(6) {
        eprintln!(
            "  ~{} (day {}): peak {:+.1}%  days_below {}  recovery {}d",
            year_of(e.trough_day),
            e.trough_day,
            e.peak_undershoot * 100.0,
            e.days_below,
            e.recovery_days
        );
    }
}

#[test]
fn reproduces_major_historical_dislocations() {
    let rows = load_rows();
    let max_day = rows.last().unwrap().t;

    let mut close: Vec<Option<f64>> = vec![None; max_day + 1];
    let mut low: Vec<Option<f64>> = vec![None; max_day + 1];
    for r in &rows {
        close[r.t] = Some(r.close);
        low[r.t] = Some(r.low);
    }

    // Fit on closes, evaluate the rearranged 1% band per day.
    let samples: Vec<(f64, f64)> = rows.iter().map(|r| (r.t as f64, r.close.log10())).collect();
    let coef = fit(&samples, &FitSpec::asymmetric_grouped());
    let q01: Vec<f64> = (0..=max_day)
        .map(|t| coef.band_prices((t as f64).max(1.0))[0])
        .collect();

    let (_, close_events) = dislocation(&close, &q01);
    let (_, wick_events) = dislocation(&low, &q01);
    print_events("Close-based", &close_events);
    print_events("Wick-based", &wick_events);

    assert!(!close_events.is_empty() && !wick_events.is_empty());

    // The extreme (wick) series is at least as sensitive as the conservative one.
    assert!(
        wick_events.iter().map(|e| e.days_below).sum::<usize>()
            >= close_events.iter().map(|e| e.days_below).sum::<usize>(),
        "wick undershoots should be at least as frequent as close undershoots"
    );

    // Deep liquidity events breach the band on the close (day index since genesis).
    assert!(
        has_event_in(&close_events, 580, 700),
        "missing the Sept 2010 close dislocation"
    );
    assert!(
        has_event_in(&close_events, 4950, 5200),
        "missing the FTX 2022 close dislocation"
    );

    // The 2015 bear bottom breaches the band on the wick.
    assert!(
        has_event_in(&wick_events, 2150, 2600),
        "missing the 2015 wick dislocation"
    );
}
