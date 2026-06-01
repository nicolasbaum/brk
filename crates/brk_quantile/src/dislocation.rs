//! Liquidity-dislocation metric `U(t)` and clustered dislocation events.
//!
//! `U(t) = (price − Q₀.₀₁) / Q₀.₀₁` measures how far the realized price fell
//! below the model's 1% band (negative ⇒ below). Consecutive below-band days
//! separated by less than the clustering window are merged into a single
//! *event* carrying its peak undershoot, days-below, and recovery time.
//!
//! The 1% band is a historical conditional quantile, not a guaranteed floor;
//! identified events are historical.

/// Days within which two below-band stretches are treated as one episode.
pub const CLUSTER_WINDOW_DAYS: usize = 30;

/// A clustered below-band dislocation episode (day indices are days since the
/// genesis anchor).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DislocationEvent {
    /// First day the price closed below the 1% band.
    pub start_day: usize,
    /// Day of the deepest (most negative) undershoot.
    pub trough_day: usize,
    /// Deepest undershoot `U` reached (most negative value).
    pub peak_undershoot: f64,
    /// Count of days below the band within the episode.
    pub days_below: usize,
    /// Days from the trough until the price first recovered to/above the band
    /// (0 if it recovered the next observation; spans to the last day if it
    /// never recovered within the data).
    pub recovery_days: usize,
}

/// Undershoot of a single observation against the 1% band.
#[inline]
pub fn undershoot(price: f64, q01: f64) -> f64 {
    if q01 > 0.0 { (price - q01) / q01 } else { 0.0 }
}

/// Compute the per-day undershoot series and the clustered dislocation events.
///
/// `prices` is indexed by day (`None` = no price that day); `q01_band` is the
/// fitted 1% band price at each day index. Days with no price contribute `0.0`
/// to the series and are not below-band.
pub fn dislocation(
    prices: &[Option<f64>],
    q01_band: &[f64],
) -> (Vec<f64>, Vec<DislocationEvent>) {
    let n = prices.len().min(q01_band.len());
    let mut series = vec![0.0; prices.len()];
    let mut below: Vec<bool> = vec![false; prices.len()];

    for i in 0..n {
        if let Some(p) = prices[i] {
            let u = undershoot(p, q01_band[i]);
            series[i] = u;
            below[i] = u < 0.0;
        }
    }

    let events = cluster_events(&series, &below);
    (series, events)
}

/// Merge below-band days into events, clustering stretches less than
/// [`CLUSTER_WINDOW_DAYS`] apart.
fn cluster_events(series: &[f64], below: &[bool]) -> Vec<DislocationEvent> {
    let mut events = Vec::new();
    let n = below.len();
    let mut i = 0;
    while i < n {
        if !below[i] {
            i += 1;
            continue;
        }

        // Start of an episode. Extend across below-days, tolerating gaps of up
        // to CLUSTER_WINDOW_DAYS non-below days.
        let start = i;
        let mut last_below = i;
        let mut j = i + 1;
        while j < n {
            if below[j] {
                last_below = j;
            } else if j - last_below > CLUSTER_WINDOW_DAYS {
                break;
            }
            j += 1;
        }

        // Episode spans [start, last_below]. Summarize it.
        let mut trough_day = start;
        let mut peak_undershoot = series[start];
        let mut days_below = 0;
        for (day, &is_below) in below.iter().enumerate().take(last_below + 1).skip(start) {
            if is_below {
                days_below += 1;
                if series[day] < peak_undershoot {
                    peak_undershoot = series[day];
                    trough_day = day;
                }
            }
        }

        // Recovery: first non-below day at/after the trough.
        let recovery_day = (trough_day..n)
            .find(|&d| !below[d])
            .unwrap_or(n.saturating_sub(1));

        events.push(DislocationEvent {
            start_day: start,
            trough_day,
            peak_undershoot,
            days_below,
            recovery_days: recovery_day.saturating_sub(trough_day),
        });

        i = last_below + 1;
    }
    events
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn undershoot_sign_and_magnitude() {
        assert!((undershoot(80.0, 100.0) - (-0.2)).abs() < 1e-12);
        assert!(undershoot(120.0, 100.0) > 0.0);
        assert_eq!(undershoot(50.0, 0.0), 0.0);
    }

    #[test]
    fn single_dip_becomes_one_event() {
        // Band flat at 100; price dips below for 3 days, deepest on day 6.
        let band = vec![100.0; 12];
        let mut prices: Vec<Option<f64>> = vec![Some(110.0); 12];
        prices[5] = Some(90.0);
        prices[6] = Some(70.0); // trough: U = -0.30
        prices[7] = Some(95.0);

        let (series, events) = dislocation(&prices, &band);

        assert_eq!(events.len(), 1);
        let e = events[0];
        assert_eq!(e.start_day, 5);
        assert_eq!(e.trough_day, 6);
        assert_eq!(e.days_below, 3);
        assert!((e.peak_undershoot - (-0.30)).abs() < 1e-9);
        assert_eq!(e.recovery_days, 2); // day 6 trough → day 8 first ≥ band
        assert!((series[6] - (-0.30)).abs() < 1e-9);
    }

    #[test]
    fn nearby_dips_cluster_distant_dips_split() {
        let band = vec![100.0; 120];
        let mut prices: Vec<Option<f64>> = vec![Some(150.0); 120];
        prices[10] = Some(80.0); // dip A
        prices[30] = Some(70.0); // 20 days later → same cluster as A
        prices[100] = Some(60.0); // 70 days later → separate event

        let (_series, events) = dislocation(&prices, &band);

        assert_eq!(events.len(), 2, "two clusters expected");
        assert_eq!(events[0].start_day, 10);
        assert_eq!(events[0].days_below, 2);
        assert_eq!(events[1].start_day, 100);
        assert_eq!(events[1].days_below, 1);
    }

    #[test]
    fn no_dislocation_when_always_above_band() {
        let band = vec![100.0; 10];
        let prices: Vec<Option<f64>> = vec![Some(101.0); 10];
        let (_series, events) = dislocation(&prices, &band);
        assert!(events.is_empty());
    }
}
