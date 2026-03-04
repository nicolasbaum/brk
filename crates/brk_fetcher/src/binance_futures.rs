use std::collections::BTreeMap;

use brk_error::{Error, Result};
use brk_types::Date;
use tracing::info;

use crate::{check_response, default_retry, ohlc::{date_from_timestamp, timestamp_from_ms}};

/// Fetcher for Binance Futures API (perpetual funding rates).
pub struct BinanceFutures;

impl BinanceFutures {
    /// Fetch all historical funding rates for BTCUSDT and return daily average 8h rates.
    ///
    /// The Binance Futures API returns funding rates every 8 hours (3 per day).
    /// We average the 3 daily 8h readings to produce a single representative 8h rate per day.
    ///
    /// Returns `BTreeMap<Date, f32>` where the value is the average 8h funding rate (raw, not annualized).
    pub fn fetch_daily_funding_rates(start_date: Option<Date>) -> Result<BTreeMap<Date, f32>> {
        let mut all_rates: BTreeMap<Date, Vec<f32>> = BTreeMap::new();

        // Start from Sept 2019 (when Binance futures launched) or the given date
        let mut start_time_ms: u64 = if let Some(date) = start_date {
            // Convert Date → Timestamp via brk_types
            let ts: brk_types::Timestamp = date.into();
            let secs: f64 = ts.into();
            (secs as u64) * 1000
        } else {
            // 2019-09-01 00:00:00 UTC
            1567296000000
        };

        loop {
            let batch = Self::fetch_batch(start_time_ms)?;

            if batch.is_empty() {
                break;
            }

            let last_time = batch.last().map(|(t, _)| *t).unwrap_or(0);

            for (timestamp_ms, rate) in &batch {
                let ts = timestamp_from_ms(*timestamp_ms);
                let date = date_from_timestamp(ts);
                all_rates.entry(date).or_default().push(*rate);
            }

            // Move past the last record
            start_time_ms = last_time + 1;

            // If we got fewer than 1000 records, we've reached the end
            if batch.len() < 1000 {
                break;
            }
        }

        // Average the 8h rates per day (store raw 8h rate)
        let daily_avg: BTreeMap<Date, f32> = all_rates
            .into_iter()
            .map(|(date, rates)| {
                let avg = rates.iter().sum::<f32>() / rates.len() as f32;
                (date, avg)
            })
            .collect();

        info!(
            "Fetched {} daily funding rate observations",
            daily_avg.len()
        );

        Ok(daily_avg)
    }

    /// Fetch a single batch of up to 1000 funding rate records.
    fn fetch_batch(start_time_ms: u64) -> Result<Vec<(u64, f32)>> {
        default_retry(|_| {
            let url = format!(
                "https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&startTime={}&limit=1000",
                start_time_ms
            );
            info!("Fetching Binance funding rates from {} ...", start_time_ms);
            let bytes = check_response(minreq::get(&url).with_timeout(30).send()?, &url)?;
            let json: serde_json::Value = serde_json::from_slice(&bytes)?;

            let arr = json
                .as_array()
                .ok_or_else(|| Error::Parse("Expected JSON array for funding rates".into()))?;

            let mut results = Vec::with_capacity(arr.len());
            for item in arr {
                let obj = item
                    .as_object()
                    .ok_or_else(|| Error::Parse("Expected object in funding rate array".into()))?;

                let funding_time = obj
                    .get("fundingTime")
                    .and_then(|v| v.as_u64())
                    .ok_or_else(|| Error::Parse("Missing fundingTime".into()))?;

                let funding_rate = obj
                    .get("fundingRate")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| Error::Parse("Missing fundingRate".into()))?
                    .parse::<f32>()
                    .map_err(|e| Error::Parse(format!("Invalid fundingRate: {e}")))?;

                results.push((funding_time, funding_rate));
            }

            Ok(results)
        })
    }
}
