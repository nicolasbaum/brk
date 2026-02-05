use std::collections::BTreeMap;

use brk_error::Result;
use brk_fetcher::{Fred, Yahoo};
use brk_types::{Date, DateIndex, StoredF32};
use tracing::info;
use vecdb::{AnyStoredVec, AnyVec, Exit, GenericStoredVec, IterableVec};

use super::Vecs;
use crate::{indexes, ComputeIndexes};

/// Mapping from FRED series ID to the field name in our vecs.
/// Each entry is (series_id, vec_field_name).
const SERIES_MAP: &[(&str, SeriesTarget)] = &[
    // Interest Rates
    ("DFF", SeriesTarget::InterestRates(InterestRateField::FedFundsRate)),
    ("DGS2", SeriesTarget::InterestRates(InterestRateField::TreasuryYield2y)),
    ("DGS10", SeriesTarget::InterestRates(InterestRateField::TreasuryYield10y)),
    ("DGS30", SeriesTarget::InterestRates(InterestRateField::TreasuryYield30y)),
    // Money Supply
    ("M1SL", SeriesTarget::MoneySupply(MoneySupplyField::M1)),
    ("WM2NS", SeriesTarget::MoneySupply(MoneySupplyField::M2)),
    // Employment
    ("UNRATE", SeriesTarget::Employment(EmploymentField::UnemploymentRate)),
    ("ICSA", SeriesTarget::Employment(EmploymentField::InitialClaims)),
    ("PAYEMS", SeriesTarget::Employment(EmploymentField::NonfarmPayrolls)),
    // Inflation
    ("CPIAUCSL", SeriesTarget::Inflation(InflationField::Cpi)),
    ("CPILFESL", SeriesTarget::Inflation(InflationField::CoreCpi)),
    ("PCEPI", SeriesTarget::Inflation(InflationField::Pce)),
    ("PCEPILFE", SeriesTarget::Inflation(InflationField::CorePce)),
    ("PPIACO", SeriesTarget::Inflation(InflationField::Ppi)),
    // Growth
    ("GDP", SeriesTarget::Growth(GrowthField::Gdp)),
    ("UMCSENT", SeriesTarget::Growth(GrowthField::ConsumerConfidence)),
    ("RSXFS", SeriesTarget::Growth(GrowthField::RetailSales)),
    // Other
    ("VIXCLS", SeriesTarget::Other(OtherField::Vix)),
    ("DTWEXBGS", SeriesTarget::Other(OtherField::DollarIndex)),
    ("WALCL", SeriesTarget::Other(OtherField::FedBalanceSheet)),
];

#[derive(Clone, Copy)]
enum SeriesTarget {
    InterestRates(InterestRateField),
    MoneySupply(MoneySupplyField),
    Employment(EmploymentField),
    Inflation(InflationField),
    Growth(GrowthField),
    Commodities(CommodityField),
    Other(OtherField),
}

#[derive(Clone, Copy)]
enum InterestRateField {
    FedFundsRate,
    TreasuryYield2y,
    TreasuryYield10y,
    TreasuryYield30y,
}

#[derive(Clone, Copy)]
enum MoneySupplyField {
    M1,
    M2,
}

#[derive(Clone, Copy)]
enum EmploymentField {
    UnemploymentRate,
    InitialClaims,
    NonfarmPayrolls,
}

#[derive(Clone, Copy)]
enum InflationField {
    Cpi,
    CoreCpi,
    Pce,
    CorePce,
    Ppi,
}

#[derive(Clone, Copy)]
enum GrowthField {
    Gdp,
    ConsumerConfidence,
    RetailSales,
}

#[derive(Clone, Copy)]
enum CommodityField {
    GoldPrice,
    SilverPrice,
}

#[derive(Clone, Copy)]
enum OtherField {
    Vix,
    DollarIndex,
    FedBalanceSheet,
    Sp500,
}

impl Vecs {
    pub fn compute(
        &mut self,
        fred: &Fred,
        indexes: &indexes::Vecs,
        starting_indexes: &ComputeIndexes,
        exit: &Exit,
    ) -> Result<()> {
        // Build the full DateIndex → Date mapping from the indexes.
        // This tells us all the dates we have in the system and their DateIndex.
        let date_vec = &indexes.dateindex.date;
        let total_dateindexes = date_vec.len();

        if total_dateindexes == 0 {
            info!("No dateindexes yet, skipping macro economy computation");
            return Ok(());
        }

        // Build Date → DateIndex lookup from the indexes
        let date_to_dateindex = build_date_to_dateindex(date_vec)?;

        // Process each FRED series
        for &(series_id, target) in SERIES_MAP {
            // Determine the starting dateindex for this vec to know where to resume
            let vec_len = self.vec_len_for_target(target);
            let starting_di = starting_indexes.dateindex.min(DateIndex::from(vec_len));

            // Determine start_date for incremental fetch
            let start_date = if usize::from(starting_di) > 0 {
                // Fetch from a bit before the starting point to ensure we have forward-fill data
                let fetch_di = DateIndex::from(usize::from(starting_di).saturating_sub(1));
                Some(Date::from(fetch_di))
            } else {
                None
            };

            info!("Fetching FRED series {series_id}...");
            let observations = match fred.fetch_series(series_id, start_date) {
                Ok(obs) => obs,
                Err(e) => {
                    info!("Failed to fetch FRED series {series_id}: {e}, skipping");
                    continue;
                }
            };

            if observations.is_empty() {
                info!("No observations for {series_id}, skipping");
                continue;
            }

            // Forward-fill observations into DateIndex-aligned values.
            // For each DateIndex, find the most recent observation on or before that date.
            info!("Forward-filling {series_id} into {} dateindexes...", total_dateindexes);

            let filled = forward_fill(
                &observations,
                &date_to_dateindex,
                date_vec,
                total_dateindexes,
            )?;

            // Push filled values into the appropriate EagerVec
            self.push_filled_values(target, &filled, starting_di, exit)?;
        }

        // --- Yahoo Finance series (gold, silver, S&P 500) ---
        let yahoo = Yahoo::new();
        let yahoo_series: &[(&str, SeriesTarget)] = &[
            ("GC=F", SeriesTarget::Commodities(CommodityField::GoldPrice)),
            ("SI=F", SeriesTarget::Commodities(CommodityField::SilverPrice)),
            ("^GSPC", SeriesTarget::Other(OtherField::Sp500)),
        ];

        for &(symbol, target) in yahoo_series {
            let vec_len = self.vec_len_for_target(target);
            let starting_di = starting_indexes.dateindex.min(DateIndex::from(vec_len));

            let start_date = if usize::from(starting_di) > 0 {
                let fetch_di = DateIndex::from(usize::from(starting_di).saturating_sub(1));
                Some(Date::from(fetch_di))
            } else {
                None
            };

            info!("Fetching Yahoo Finance {symbol}...");
            let observations = match yahoo.fetch_series(symbol, start_date) {
                Ok(obs) => obs,
                Err(e) => {
                    info!("Failed to fetch Yahoo Finance {symbol}: {e}, skipping");
                    continue;
                }
            };

            if observations.is_empty() {
                info!("No observations for {symbol}, skipping");
                continue;
            }

            info!("Forward-filling {symbol} into {} dateindexes...", total_dateindexes);

            let filled = forward_fill(
                &observations,
                &date_to_dateindex,
                date_vec,
                total_dateindexes,
            )?;

            self.push_filled_values(target, &filled, starting_di, exit)?;
        }

        {
            let _lock = exit.lock();
            self.db.compact()?;
        }

        Ok(())
    }

    /// Get the current length of the target vec (to determine where to resume).
    fn vec_len_for_target(&self, target: SeriesTarget) -> usize {
        match target {
            SeriesTarget::InterestRates(f) => match f {
                InterestRateField::FedFundsRate => self.interest_rates.fed_funds_rate.len(),
                InterestRateField::TreasuryYield2y => self.interest_rates.treasury_yield_2y.len(),
                InterestRateField::TreasuryYield10y => self.interest_rates.treasury_yield_10y.len(),
                InterestRateField::TreasuryYield30y => self.interest_rates.treasury_yield_30y.len(),
            },
            SeriesTarget::MoneySupply(f) => match f {
                MoneySupplyField::M1 => self.money_supply.m1.len(),
                MoneySupplyField::M2 => self.money_supply.m2.len(),
            },
            SeriesTarget::Employment(f) => match f {
                EmploymentField::UnemploymentRate => self.employment.unemployment_rate.len(),
                EmploymentField::InitialClaims => self.employment.initial_claims.len(),
                EmploymentField::NonfarmPayrolls => self.employment.nonfarm_payrolls.len(),
            },
            SeriesTarget::Inflation(f) => match f {
                InflationField::Cpi => self.inflation.cpi.len(),
                InflationField::CoreCpi => self.inflation.core_cpi.len(),
                InflationField::Pce => self.inflation.pce.len(),
                InflationField::CorePce => self.inflation.core_pce.len(),
                InflationField::Ppi => self.inflation.ppi.len(),
            },
            SeriesTarget::Growth(f) => match f {
                GrowthField::Gdp => self.growth.gdp.len(),
                GrowthField::ConsumerConfidence => self.growth.consumer_confidence.len(),
                GrowthField::RetailSales => self.growth.retail_sales.len(),
            },
            SeriesTarget::Commodities(f) => match f {
                CommodityField::GoldPrice => self.commodities.gold_price.len(),
                CommodityField::SilverPrice => self.commodities.silver_price.len(),
            },
            SeriesTarget::Other(f) => match f {
                OtherField::Vix => self.other.vix.len(),
                OtherField::DollarIndex => self.other.dollar_index.len(),
                OtherField::FedBalanceSheet => self.other.fed_balance_sheet.len(),
                OtherField::Sp500 => self.other.sp500.len(),
            },
        }
    }

    /// Push forward-filled values into the appropriate vec.
    fn push_filled_values(
        &mut self,
        target: SeriesTarget,
        filled: &[(DateIndex, StoredF32)],
        starting_di: DateIndex,
        exit: &Exit,
    ) -> Result<()> {
        macro_rules! push_to_vec {
            ($vec:expr) => {{
                // Pad with default/last-known values to fill any gap between
                // the current vec length and the first dateindex we're about to push.
                // This handles both empty vecs AND non-empty vecs where FRED
                // returned sparse data that skips some dateindexes.
                if let Some(&(first_di, _)) = filled.iter().find(|&&(di, _)| di >= starting_di) {
                    let first_idx: usize = first_di.into();
                    let vec_len = $vec.len();
                    if first_idx > vec_len {
                        let default_val = StoredF32::from(0.0f32);
                        for pad_idx in vec_len..first_idx {
                            $vec.truncate_push_at(pad_idx, default_val)?;
                        }
                    }
                }
                for &(di, val) in filled {
                    if di >= starting_di {
                        let idx: usize = di.into();
                        // Skip if we'd create a gap (shouldn't happen after padding, but be safe)
                        if idx <= $vec.len() {
                            $vec.truncate_push_at(idx, val)?;
                        }
                    }
                }
                {
                    let _lock = exit.lock();
                    $vec.write()?;
                }
            }};
        }

        match target {
            SeriesTarget::InterestRates(f) => match f {
                InterestRateField::FedFundsRate => push_to_vec!(self.interest_rates.fed_funds_rate),
                InterestRateField::TreasuryYield2y => {
                    push_to_vec!(self.interest_rates.treasury_yield_2y)
                }
                InterestRateField::TreasuryYield10y => {
                    push_to_vec!(self.interest_rates.treasury_yield_10y)
                }
                InterestRateField::TreasuryYield30y => {
                    push_to_vec!(self.interest_rates.treasury_yield_30y)
                }
            },
            SeriesTarget::MoneySupply(f) => match f {
                MoneySupplyField::M1 => push_to_vec!(self.money_supply.m1),
                MoneySupplyField::M2 => push_to_vec!(self.money_supply.m2),
            },
            SeriesTarget::Employment(f) => match f {
                EmploymentField::UnemploymentRate => {
                    push_to_vec!(self.employment.unemployment_rate)
                }
                EmploymentField::InitialClaims => push_to_vec!(self.employment.initial_claims),
                EmploymentField::NonfarmPayrolls => {
                    push_to_vec!(self.employment.nonfarm_payrolls)
                }
            },
            SeriesTarget::Inflation(f) => match f {
                InflationField::Cpi => push_to_vec!(self.inflation.cpi),
                InflationField::CoreCpi => push_to_vec!(self.inflation.core_cpi),
                InflationField::Pce => push_to_vec!(self.inflation.pce),
                InflationField::CorePce => push_to_vec!(self.inflation.core_pce),
                InflationField::Ppi => push_to_vec!(self.inflation.ppi),
            },
            SeriesTarget::Growth(f) => match f {
                GrowthField::Gdp => push_to_vec!(self.growth.gdp),
                GrowthField::ConsumerConfidence => push_to_vec!(self.growth.consumer_confidence),
                GrowthField::RetailSales => push_to_vec!(self.growth.retail_sales),
            },
            SeriesTarget::Commodities(f) => match f {
                CommodityField::GoldPrice => push_to_vec!(self.commodities.gold_price),
                CommodityField::SilverPrice => push_to_vec!(self.commodities.silver_price),
            },
            SeriesTarget::Other(f) => match f {
                OtherField::Vix => push_to_vec!(self.other.vix),
                OtherField::DollarIndex => push_to_vec!(self.other.dollar_index),
                OtherField::FedBalanceSheet => push_to_vec!(self.other.fed_balance_sheet),
                OtherField::Sp500 => push_to_vec!(self.other.sp500),
            },
        }

        Ok(())
    }
}

/// Build a Date → DateIndex lookup from the dateindex.date vec.
fn build_date_to_dateindex(
    date_vec: &vecdb::EagerVec<vecdb::PcoVec<DateIndex, Date>>,
) -> Result<BTreeMap<Date, DateIndex>> {
    let mut map = BTreeMap::new();
    let iter = date_vec.iter();
    for (i, date) in iter.enumerate() {
        map.insert(date, i.into());
    }
    Ok(map)
}

/// Forward-fill FRED observations into a DateIndex-aligned series.
///
/// For each DateIndex in [0..total_dateindexes), we find the most recent
/// FRED observation that falls on or before the corresponding date.
/// This handles monthly/weekly/quarterly data by repeating the last known
/// value for every day until the next observation.
///
/// Returns (DateIndex, StoredF32) pairs only for dateindexes that have a value
/// (i.e., after the first observation in the FRED series).
fn forward_fill(
    observations: &BTreeMap<Date, f32>,
    date_to_dateindex: &BTreeMap<Date, DateIndex>,
    _date_vec: &vecdb::EagerVec<vecdb::PcoVec<DateIndex, Date>>,
    total_dateindexes: usize,
) -> Result<Vec<(DateIndex, StoredF32)>> {
    let mut result = Vec::new();

    // Convert FRED observations to (DateIndex, f32) where possible.
    // Some FRED dates may be before the first Bitcoin block (2009-01-03),
    // so they won't have a DateIndex — we skip those but remember the value
    // for forward-fill purposes.
    let mut obs_by_dateindex: BTreeMap<DateIndex, f32> = BTreeMap::new();
    let mut earliest_value: Option<f32> = None;

    for (&date, &value) in observations {
        if let Some(&di) = date_to_dateindex.get(&date) {
            obs_by_dateindex.insert(di, value);
        } else {
            // This observation is before the first DateIndex or doesn't match exactly.
            // Keep track of values before the indexed range for forward-fill.
            // Use the most recent pre-index value.
            earliest_value = Some(value);
        }
    }

    // Forward-fill through all dateindexes
    let mut current_value: Option<f32> = earliest_value;

    for i in 0..total_dateindexes {
        let di = DateIndex::from(i);

        // Check if there's a new observation at this dateindex
        if let Some(&obs_val) = obs_by_dateindex.get(&di) {
            current_value = Some(obs_val);
        }

        // If we have a value (either new or carried forward), emit it
        if let Some(val) = current_value {
            result.push((di, StoredF32::from(val)));
        }
    }

    Ok(result)
}
