use std::collections::BTreeMap;

use brk_error::{Error, Result};
use brk_types::Date;
use serde_json::Value;
use tracing::info;

use crate::{check_response, default_retry};

const FRED_BASE_URL: &str = "https://api.stlouisfed.org/fred/series/observations";

/// All FRED series we track
pub const FRED_SERIES: &[FredSeries] = &[
    // Interest Rates
    FredSeries::new("DFF", "Federal Funds Rate", FredFrequency::Daily),
    FredSeries::new("DGS2", "2-Year Treasury Yield", FredFrequency::Daily),
    FredSeries::new("DGS10", "10-Year Treasury Yield", FredFrequency::Daily),
    FredSeries::new("DGS30", "30-Year Treasury Yield", FredFrequency::Daily),
    // Money Supply
    FredSeries::new("M1SL", "M1 Money Supply", FredFrequency::Monthly),
    FredSeries::new("WM2NS", "M2 Money Supply", FredFrequency::Weekly),
    // Employment
    FredSeries::new("UNRATE", "Unemployment Rate", FredFrequency::Monthly),
    FredSeries::new("ICSA", "Initial Jobless Claims", FredFrequency::Weekly),
    FredSeries::new("PAYEMS", "Non-farm Payrolls", FredFrequency::Monthly),
    // Inflation
    FredSeries::new("CPIAUCSL", "CPI", FredFrequency::Monthly),
    FredSeries::new("CPILFESL", "Core CPI", FredFrequency::Monthly),
    FredSeries::new("PCEPI", "PCE Price Index", FredFrequency::Monthly),
    FredSeries::new("PCEPILFE", "Core PCE", FredFrequency::Monthly),
    FredSeries::new("PPIACO", "PPI All Commodities", FredFrequency::Monthly),
    // Growth & Sentiment
    FredSeries::new("GDP", "GDP", FredFrequency::Quarterly),
    FredSeries::new("UMCSENT", "Consumer Confidence", FredFrequency::Monthly),
    FredSeries::new("RSXFS", "Retail Sales ex Food", FredFrequency::Monthly),
    // Other
    FredSeries::new("VIXCLS", "VIX", FredFrequency::Daily),
    FredSeries::new("DTWEXBGS", "Dollar Index", FredFrequency::Daily),
    FredSeries::new("WALCL", "Fed Balance Sheet", FredFrequency::Weekly),
];

#[derive(Debug, Clone, Copy)]
pub enum FredFrequency {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
}

#[derive(Debug, Clone)]
pub struct FredSeries {
    pub id: &'static str,
    pub name: &'static str,
    pub frequency: FredFrequency,
}

impl FredSeries {
    pub const fn new(id: &'static str, name: &'static str, frequency: FredFrequency) -> Self {
        Self {
            id,
            name,
            frequency,
        }
    }
}

/// FRED API client for fetching macroeconomic data series.
#[derive(Clone)]
pub struct Fred {
    api_key: String,
}

impl Fred {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// Fetch all observations for a FRED series.
    /// If `start_date` is provided, only fetches observations from that date onward.
    /// Returns a sorted BTreeMap of (Date, f32) pairs, skipping missing values (".").
    pub fn fetch_series(
        &self,
        series_id: &str,
        start_date: Option<Date>,
    ) -> Result<BTreeMap<Date, f32>> {
        let api_key = self.api_key.clone();
        let series_id = series_id.to_string();

        default_retry(move |_| {
            let mut url = format!(
                "{FRED_BASE_URL}?series_id={series_id}&api_key={api_key}&file_type=json"
            );

            if let Some(date) = start_date {
                url.push_str(&format!("&observation_start={date}"));
            }

            info!("Fetching FRED series {series_id}...");
            let bytes = check_response(minreq::get(&url).with_timeout(60).send()?, &url)?;

            let json: Value = serde_json::from_slice(&bytes).map_err(|e| {
                Error::Parse(format!("Failed to parse FRED response for {series_id}: {e}"))
            })?;

            let observations = json
                .get("observations")
                .and_then(|v| v.as_array())
                .ok_or_else(|| {
                    Error::Parse(format!(
                        "FRED response missing 'observations' array for {series_id}"
                    ))
                })?;

            let mut result = BTreeMap::new();

            for obs in observations {
                let date_str = obs
                    .get("date")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        Error::Parse(format!("FRED observation missing 'date' for {series_id}"))
                    })?;

                let value_str = obs
                    .get("value")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        Error::Parse(format!("FRED observation missing 'value' for {series_id}"))
                    })?;

                // Skip missing values (FRED uses "." for missing data)
                if value_str == "." {
                    continue;
                }

                let value: f32 = value_str.parse().map_err(|e| {
                    Error::Parse(format!(
                        "Failed to parse value '{value_str}' for {series_id}: {e}"
                    ))
                })?;

                let date = parse_fred_date(date_str)?;
                result.insert(date, value);
            }

            info!("Fetched {} observations for {series_id}", result.len());

            Ok(result)
        })
    }

    /// Fetch a specific series and return observations as Vec<(Date, f32)> sorted by date.
    pub fn fetch_series_vec(
        &self,
        series_id: &str,
        start_date: Option<Date>,
    ) -> Result<Vec<(Date, f32)>> {
        let map = self.fetch_series(series_id, start_date)?;
        Ok(map.into_iter().collect())
    }
}

/// Parse a FRED date string "YYYY-MM-DD" into a BRK Date.
fn parse_fred_date(s: &str) -> Result<Date> {
    if s.len() != 10 {
        return Err(Error::Parse(format!("Invalid FRED date length: {s}")));
    }

    let year: u16 = s[0..4]
        .parse()
        .map_err(|_| Error::Parse(format!("Invalid year in FRED date: {s}")))?;
    let month: u8 = s[5..7]
        .parse()
        .map_err(|_| Error::Parse(format!("Invalid month in FRED date: {s}")))?;
    let day: u8 = s[8..10]
        .parse()
        .map_err(|_| Error::Parse(format!("Invalid day in FRED date: {s}")))?;

    Ok(Date::new(year, month, day))
}
