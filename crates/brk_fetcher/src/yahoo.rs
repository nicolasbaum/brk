use std::collections::BTreeMap;

use brk_error::{Error, Result};
use brk_types::Date;
use serde_json::Value;
use tracing::info;

use crate::{check_response, default_retry};

/// Yahoo Finance series definitions for commodities and indices.
pub const YAHOO_SERIES: &[YahooSeries] = &[
    YahooSeries::new("GC=F", "Gold Futures (USD/oz)"),
    YahooSeries::new("SI=F", "Silver Futures (USD/oz)"),
    YahooSeries::new("^GSPC", "S&P 500 Index"),
];

#[derive(Debug, Clone)]
pub struct YahooSeries {
    pub symbol: &'static str,
    pub name: &'static str,
}

impl YahooSeries {
    pub const fn new(symbol: &'static str, name: &'static str) -> Self {
        Self { symbol, name }
    }
}

/// Yahoo Finance client for fetching commodity and index data.
#[derive(Clone)]
pub struct Yahoo;

impl Yahoo {
    pub fn new() -> Self {
        Self
    }

    /// Fetch daily close prices for a Yahoo Finance symbol.
    /// If `start_date` is provided, only fetches from that date onward.
    /// Returns a sorted BTreeMap of (Date, f32) pairs.
    pub fn fetch_series(
        &self,
        symbol: &str,
        start_date: Option<Date>,
    ) -> Result<BTreeMap<Date, f32>> {
        let symbol = symbol.to_string();

        default_retry(move |_| {
            // Bitcoin genesis is 2009-01-03; use 2009-01-01 as default start
            let period1 = if let Some(date) = start_date {
                date_to_unix(date)
            } else {
                1230768000 // 2009-01-01
            };
            let period2 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;

            // URL-encode the symbol (^ → %5E)
            let encoded_symbol = symbol.replace('^', "%5E");
            let url = format!(
                "https://query1.finance.yahoo.com/v8/finance/chart/{encoded_symbol}?period1={period1}&period2={period2}&interval=1d"
            );

            info!("Fetching Yahoo Finance {symbol}...");
            let bytes = check_response(
                minreq::get(&url)
                    .with_header("User-Agent", "Mozilla/5.0")
                    .with_timeout(60)
                    .send()?,
                &url,
            )?;

            let json: Value = serde_json::from_slice(&bytes).map_err(|e| {
                Error::Parse(format!(
                    "Failed to parse Yahoo Finance response for {symbol}: {e}"
                ))
            })?;

            let result_obj = json
                .pointer("/chart/result/0")
                .ok_or_else(|| {
                    Error::Parse(format!(
                        "Yahoo Finance response missing chart.result for {symbol}"
                    ))
                })?;

            let timestamps = result_obj
                .get("timestamp")
                .and_then(|v| v.as_array())
                .ok_or_else(|| {
                    Error::Parse(format!("Yahoo Finance missing timestamps for {symbol}"))
                })?;

            let closes = result_obj
                .pointer("/indicators/quote/0/close")
                .and_then(|v| v.as_array())
                .ok_or_else(|| {
                    Error::Parse(format!("Yahoo Finance missing close prices for {symbol}"))
                })?;

            let mut result = BTreeMap::new();

            for (ts, close) in timestamps.iter().zip(closes.iter()) {
                let Some(unix_ts) = ts.as_i64() else {
                    continue;
                };
                let Some(price) = close.as_f64() else {
                    continue; // null/missing close price
                };

                let date = unix_to_date(unix_ts);
                result.insert(date, price as f32);
            }

            info!("Fetched {} observations for {symbol}", result.len());
            Ok(result)
        })
    }
}

impl Default for Yahoo {
    fn default() -> Self {
        Self::new()
    }
}

/// Convert a BRK Date to a Unix timestamp (midnight UTC).
fn date_to_unix(date: Date) -> i64 {
    let y = date.year() as i64;
    let m = date.month() as i64;
    let d = date.day() as i64;

    // Adjust for months (Jan/Feb treated as months 13/14 of previous year)
    let (y, m) = if m <= 2 { (y - 1, m + 12) } else { (y, m) };

    // Julian Day Number calculation, then convert to Unix timestamp
    let jdn = 365 * y + y / 4 - y / 100 + y / 400 + (153 * (m - 3) + 2) / 5 + d - 719469;
    jdn * 86400
}

/// Convert a Unix timestamp to a BRK Date.
fn unix_to_date(ts: i64) -> Date {
    // Convert Unix timestamp to days since epoch
    let days = if ts >= 0 { ts / 86400 } else { (ts - 86399) / 86400 };

    // Convert days since 1970-01-01 to (year, month, day)
    // Using the algorithm from http://howardhinnant.github.io/date_algorithms.html
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32; // day of era [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // year of era
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // day of year
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    Date::new(y as u16, m as u8, d as u8)
}
