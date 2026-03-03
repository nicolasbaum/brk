use std::collections::BTreeMap;

use brk_error::{Error, Result};
use brk_types::{Date, Timestamp};
use tracing::info;

use crate::{
    checked_get, default_retry,
    ohlc::{date_from_timestamp, timestamp_from_ms},
};

/// Fetcher for Binance Futures API (perpetual funding rates).
pub struct BinanceFutures;

impl BinanceFutures {
    /// Fetch all historical funding rates for BTCUSDT and return daily averages.
    pub fn fetch_daily_funding_rates(start_date: Option<Date>) -> Result<BTreeMap<Date, f32>> {
        let mut all_rates: BTreeMap<Date, Vec<f32>> = BTreeMap::new();

        let mut start_time_ms = if let Some(date) = start_date {
            let timestamp: Timestamp = date.into();
            let seconds: f64 = timestamp.into();
            seconds as u64 * 1000
        } else {
            1_567_296_000_000
        };

        loop {
            let batch = Self::fetch_batch(start_time_ms)?;

            if batch.is_empty() {
                break;
            }

            let last_time = batch.last().map(|(time_ms, _)| *time_ms).unwrap_or(0);

            for (timestamp_ms, rate) in &batch {
                let timestamp = timestamp_from_ms(*timestamp_ms);
                let date = date_from_timestamp(timestamp);
                all_rates.entry(date).or_default().push(*rate);
            }

            start_time_ms = last_time + 1;

            if batch.len() < 1000 {
                break;
            }
        }

        let daily_avg = all_rates
            .into_iter()
            .map(|(date, rates)| {
                let avg = rates.iter().sum::<f32>() / rates.len() as f32;
                (date, avg)
            })
            .collect();

        info!("Fetched {} daily funding rate observations", daily_avg.len());

        Ok(daily_avg)
    }

    fn fetch_batch(start_time_ms: u64) -> Result<Vec<(u64, f32)>> {
        default_retry(|_| {
            let url = format!(
                "https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&startTime={start_time_ms}&limit=1000"
            );
            let agent = crate::new_agent(30);
            info!("Fetching Binance funding rates from {start_time_ms} ...");
            let bytes = checked_get(&agent, &url)?;
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
