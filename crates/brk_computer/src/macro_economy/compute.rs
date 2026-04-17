use std::{collections::BTreeMap, fs, str::FromStr};

use brk_error::Result;
use brk_fetcher::{BinanceFutures, Fred, Yahoo};
use brk_types::{Date, Day1, Indexes, StoredF32};
use tracing::info;
use vecdb::{AnyStoredVec, AnyVec, Exit, ReadableVec, WritableVec};

use super::Vecs;
use crate::indexes;

const SERIES_MAP: &[(&str, SeriesTarget)] = &[
    (
        "DFF",
        SeriesTarget::InterestRates(InterestRateField::FedFundsRate),
    ),
    (
        "DGS2",
        SeriesTarget::InterestRates(InterestRateField::TreasuryYield2y),
    ),
    (
        "DGS10",
        SeriesTarget::InterestRates(InterestRateField::TreasuryYield10y),
    ),
    (
        "DGS30",
        SeriesTarget::InterestRates(InterestRateField::TreasuryYield30y),
    ),
    ("M1SL", SeriesTarget::MoneySupply(MoneySupplyField::M1)),
    ("WM2NS", SeriesTarget::MoneySupply(MoneySupplyField::M2)),
    (
        "UNRATE",
        SeriesTarget::Employment(EmploymentField::UnemploymentRate),
    ),
    (
        "ICSA",
        SeriesTarget::Employment(EmploymentField::InitialClaims),
    ),
    (
        "PAYEMS",
        SeriesTarget::Employment(EmploymentField::NonfarmPayrolls),
    ),
    ("CPIAUCSL", SeriesTarget::Inflation(InflationField::Cpi)),
    ("CPILFESL", SeriesTarget::Inflation(InflationField::CoreCpi)),
    ("PCEPI", SeriesTarget::Inflation(InflationField::Pce)),
    ("PCEPILFE", SeriesTarget::Inflation(InflationField::CorePce)),
    ("PPIACO", SeriesTarget::Inflation(InflationField::Ppi)),
    ("GDP", SeriesTarget::Growth(GrowthField::Gdp)),
    (
        "UMCSENT",
        SeriesTarget::Growth(GrowthField::ConsumerConfidence),
    ),
    ("RSXFS", SeriesTarget::Growth(GrowthField::RetailSales)),
    ("VIXCLS", SeriesTarget::Other(OtherField::Vix)),
    ("DTWEXBGS", SeriesTarget::Other(OtherField::DollarIndex)),
    ("WALCL", SeriesTarget::Other(OtherField::FedBalanceSheet)),
];

const MACRO_REFRESH_LOG_LABEL: &str = "macro economy remote refresh";

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
    OilWti,
    OilBrent,
}

#[derive(Clone, Copy)]
enum OtherField {
    Vix,
    DollarIndex,
    FedBalanceSheet,
    Sp500,
    FundingRate,
}

impl Vecs {
    pub fn compute(
        &mut self,
        fred: Option<&Fred>,
        indexes: &indexes::Vecs,
        starting_indexes: &Indexes,
        exit: &Exit,
    ) -> Result<()> {
        let date_vec = &indexes.day1.date;
        let total_day1s = date_vec.len();

        if total_day1s == 0 {
            info!("No day1 indexes yet, skipping macro economy computation");
            return Ok(());
        }

        let prev_height = starting_indexes.height.decremented().unwrap_or_default();
        let starting_day1 = indexes
            .height
            .day1
            .collect_one(prev_height)
            .unwrap_or_default();
        let date_to_day1 = build_date_to_day1(date_vec)?;
        let today = Date::today();

        if !should_refresh_remote_series(self.last_refresh_date(), today) {
            info!("Skipping {MACRO_REFRESH_LOG_LABEL}; already attempted on {today}");
            return Ok(());
        }

        info!("Starting {MACRO_REFRESH_LOG_LABEL} for {today}");

        if let Some(fred) = fred {
            for &(series_id, target) in SERIES_MAP {
                let starting_day1 = self.starting_day1_for_target(target, starting_day1);
                let start_date = start_date_for_day1(starting_day1);

                let observations = match fred.fetch_series(series_id, start_date) {
                    Ok(observations) => observations,
                    Err(e) => {
                        info!("Failed to fetch FRED series {series_id}: {e}, skipping");
                        continue;
                    }
                };

                if observations.is_empty() {
                    info!("No observations for {series_id}, skipping");
                    continue;
                }

                let filled = forward_fill(&observations, &date_to_day1, total_day1s);
                self.push_filled_values(target, &filled, starting_day1, exit)?;
            }
        } else {
            info!("No FRED API key configured, skipping FRED-backed macro series");
        }

        let yahoo = Yahoo::new();
        let yahoo_series: &[(&str, SeriesTarget)] = &[
            ("GC=F", SeriesTarget::Commodities(CommodityField::GoldPrice)),
            (
                "SI=F",
                SeriesTarget::Commodities(CommodityField::SilverPrice),
            ),
            ("CL=F", SeriesTarget::Commodities(CommodityField::OilWti)),
            ("BZ=F", SeriesTarget::Commodities(CommodityField::OilBrent)),
            ("^GSPC", SeriesTarget::Other(OtherField::Sp500)),
        ];

        for &(symbol, target) in yahoo_series {
            let starting_day1 = self.starting_day1_for_target(target, starting_day1);
            let start_date = start_date_for_day1(starting_day1);

            let observations = match yahoo.fetch_series(symbol, start_date) {
                Ok(observations) => observations,
                Err(e) => {
                    info!("Failed to fetch Yahoo Finance {symbol}: {e}, skipping");
                    continue;
                }
            };

            if observations.is_empty() {
                info!("No observations for {symbol}, skipping");
                continue;
            }

            let filled = forward_fill(&observations, &date_to_day1, total_day1s);
            self.push_filled_values(target, &filled, starting_day1, exit)?;
        }

        let funding_target = SeriesTarget::Other(OtherField::FundingRate);
        let funding_starting_day1 = self.starting_day1_for_target(funding_target, starting_day1);
        let funding_start_date = start_date_for_day1(funding_starting_day1);

        match BinanceFutures::fetch_daily_funding_rates(funding_start_date) {
            Ok(observations) if !observations.is_empty() => {
                let filled = forward_fill(&observations, &date_to_day1, total_day1s);
                self.push_filled_values(funding_target, &filled, funding_starting_day1, exit)?;
            }
            Ok(_) => info!("No funding rate observations, skipping"),
            Err(e) => info!("Failed to fetch Binance funding rates: {e}, skipping"),
        }

        {
            let _lock = exit.lock();
            self.db.compact()?;
        }

        self.write_last_refresh_date(today)?;
        info!("Completed {MACRO_REFRESH_LOG_LABEL} for {today}");

        Ok(())
    }

    fn last_refresh_date(&self) -> Option<Date> {
        fs::read_to_string(&self.state_path)
            .ok()
            .and_then(|contents| Date::from_str(contents.trim()).ok())
    }

    fn write_last_refresh_date(&self, date: Date) -> Result<()> {
        fs::write(&self.state_path, date.to_string())?;

        Ok(())
    }

    fn starting_day1_for_target(&self, target: SeriesTarget, starting_day1: Day1) -> Day1 {
        starting_day1.min(Day1::from(self.vec_len_for_target(target)))
    }

    fn vec_len_for_target(&self, target: SeriesTarget) -> usize {
        match target {
            SeriesTarget::InterestRates(field) => match field {
                InterestRateField::FedFundsRate => self.interest_rates.fed_funds_rate.len(),
                InterestRateField::TreasuryYield2y => self.interest_rates.treasury_yield_2y.len(),
                InterestRateField::TreasuryYield10y => self.interest_rates.treasury_yield_10y.len(),
                InterestRateField::TreasuryYield30y => self.interest_rates.treasury_yield_30y.len(),
            },
            SeriesTarget::MoneySupply(field) => match field {
                MoneySupplyField::M1 => self.money_supply.m1.len(),
                MoneySupplyField::M2 => self.money_supply.m2.len(),
            },
            SeriesTarget::Employment(field) => match field {
                EmploymentField::UnemploymentRate => self.employment.unemployment_rate.len(),
                EmploymentField::InitialClaims => self.employment.initial_claims.len(),
                EmploymentField::NonfarmPayrolls => self.employment.nonfarm_payrolls.len(),
            },
            SeriesTarget::Inflation(field) => match field {
                InflationField::Cpi => self.inflation.cpi.len(),
                InflationField::CoreCpi => self.inflation.core_cpi.len(),
                InflationField::Pce => self.inflation.pce.len(),
                InflationField::CorePce => self.inflation.core_pce.len(),
                InflationField::Ppi => self.inflation.ppi.len(),
            },
            SeriesTarget::Growth(field) => match field {
                GrowthField::Gdp => self.growth.gdp.len(),
                GrowthField::ConsumerConfidence => self.growth.consumer_confidence.len(),
                GrowthField::RetailSales => self.growth.retail_sales.len(),
            },
            SeriesTarget::Commodities(field) => match field {
                CommodityField::GoldPrice => self.commodities.gold_price.len(),
                CommodityField::SilverPrice => self.commodities.silver_price.len(),
                CommodityField::OilWti => self.commodities.oil_wti.len(),
                CommodityField::OilBrent => self.commodities.oil_brent.len(),
            },
            SeriesTarget::Other(field) => match field {
                OtherField::Vix => self.other.vix.len(),
                OtherField::DollarIndex => self.other.dollar_index.len(),
                OtherField::FedBalanceSheet => self.other.fed_balance_sheet.len(),
                OtherField::Sp500 => self.other.sp500.len(),
                OtherField::FundingRate => self.other.funding_rate.len(),
            },
        }
    }

    fn push_filled_values(
        &mut self,
        target: SeriesTarget,
        filled: &[(Day1, StoredF32)],
        starting_day1: Day1,
        exit: &Exit,
    ) -> Result<()> {
        macro_rules! push_to_vec {
            ($vec:expr) => {{
                let min_len = $vec.len().min(usize::from(starting_day1));
                $vec.truncate_if_needed_at(min_len)?;

                let mut last_known_val = if $vec.len() > 0 {
                    $vec.collect_one(Day1::from($vec.len() - 1))
                        .unwrap_or(StoredF32::from(0.0f32))
                } else {
                    StoredF32::from(0.0f32)
                };

                if let Some(&(first_day1, _)) =
                    filled.iter().find(|&&(day1, _)| day1 >= starting_day1)
                {
                    let first_idx = usize::from(first_day1);
                    let vec_len = $vec.len();
                    if first_idx > vec_len {
                        for _ in vec_len..first_idx {
                            $vec.push(last_known_val);
                        }
                    }
                }

                for &(day1, value) in filled {
                    if day1 >= starting_day1 {
                        let idx = usize::from(day1);
                        if idx < $vec.len() {
                            continue;
                        }

                        while idx > $vec.len() {
                            $vec.push(last_known_val);
                        }

                        let final_val = if *value == 0.0f32 && *last_known_val != 0.0f32 {
                            last_known_val
                        } else {
                            value
                        };

                        if idx == $vec.len() {
                            $vec.push(final_val);
                            last_known_val = final_val;
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
            SeriesTarget::InterestRates(field) => match field {
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
            SeriesTarget::MoneySupply(field) => match field {
                MoneySupplyField::M1 => push_to_vec!(self.money_supply.m1),
                MoneySupplyField::M2 => push_to_vec!(self.money_supply.m2),
            },
            SeriesTarget::Employment(field) => match field {
                EmploymentField::UnemploymentRate => {
                    push_to_vec!(self.employment.unemployment_rate)
                }
                EmploymentField::InitialClaims => push_to_vec!(self.employment.initial_claims),
                EmploymentField::NonfarmPayrolls => push_to_vec!(self.employment.nonfarm_payrolls),
            },
            SeriesTarget::Inflation(field) => match field {
                InflationField::Cpi => push_to_vec!(self.inflation.cpi),
                InflationField::CoreCpi => push_to_vec!(self.inflation.core_cpi),
                InflationField::Pce => push_to_vec!(self.inflation.pce),
                InflationField::CorePce => push_to_vec!(self.inflation.core_pce),
                InflationField::Ppi => push_to_vec!(self.inflation.ppi),
            },
            SeriesTarget::Growth(field) => match field {
                GrowthField::Gdp => push_to_vec!(self.growth.gdp),
                GrowthField::ConsumerConfidence => push_to_vec!(self.growth.consumer_confidence),
                GrowthField::RetailSales => push_to_vec!(self.growth.retail_sales),
            },
            SeriesTarget::Commodities(field) => match field {
                CommodityField::GoldPrice => push_to_vec!(self.commodities.gold_price),
                CommodityField::SilverPrice => push_to_vec!(self.commodities.silver_price),
                CommodityField::OilWti => push_to_vec!(self.commodities.oil_wti),
                CommodityField::OilBrent => push_to_vec!(self.commodities.oil_brent),
            },
            SeriesTarget::Other(field) => match field {
                OtherField::Vix => push_to_vec!(self.other.vix),
                OtherField::DollarIndex => push_to_vec!(self.other.dollar_index),
                OtherField::FedBalanceSheet => push_to_vec!(self.other.fed_balance_sheet),
                OtherField::Sp500 => push_to_vec!(self.other.sp500),
                OtherField::FundingRate => push_to_vec!(self.other.funding_rate),
            },
        }

        Ok(())
    }
}

fn start_date_for_day1(day1: Day1) -> Option<Date> {
    (usize::from(day1) > 0).then(|| Date::from(Day1::from(usize::from(day1).saturating_sub(1))))
}

fn should_refresh_remote_series(last_refresh_date: Option<Date>, today: Date) -> bool {
    last_refresh_date != Some(today)
}

fn build_date_to_day1(date_vec: &impl ReadableVec<Day1, Date>) -> Result<BTreeMap<Date, Day1>> {
    let mut map = BTreeMap::new();
    for index in 0..date_vec.len() {
        let day1 = Day1::from(index);
        if let Some(date) = date_vec.collect_one(day1) {
            map.insert(date, day1);
        }
    }
    Ok(map)
}

fn forward_fill(
    observations: &BTreeMap<Date, f32>,
    date_to_day1: &BTreeMap<Date, Day1>,
    total_day1s: usize,
) -> Vec<(Day1, StoredF32)> {
    let mut result = Vec::new();
    let mut observations_by_day1 = BTreeMap::new();
    let mut earliest_value = None;

    for (&date, &value) in observations {
        if let Some(&day1) = date_to_day1.get(&date) {
            if value != 0.0 {
                observations_by_day1.insert(day1, value);
            }
        } else {
            earliest_value = Some(value);
        }
    }

    let mut current_value = earliest_value;
    for index in 0..total_day1s {
        let day1 = Day1::from(index);
        if let Some(&observation) = observations_by_day1.get(&day1) {
            current_value = Some(observation);
        }
        if let Some(value) = current_value {
            result.push((day1, StoredF32::from(value)));
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::should_refresh_remote_series;
    use brk_types::Date;

    #[test]
    fn refreshes_when_no_previous_pull_is_recorded() {
        let today = Date::new(2026, 4, 17);

        assert!(should_refresh_remote_series(None, today));
    }

    #[test]
    fn skips_when_batch_already_attempted_today() {
        let today = Date::new(2026, 4, 17);

        assert!(!should_refresh_remote_series(Some(today), today));
    }

    #[test]
    fn refreshes_again_on_a_new_day() {
        let today = Date::new(2026, 4, 17);
        let yesterday = Date::new(2026, 4, 16);

        assert!(should_refresh_remote_series(Some(yesterday), today));
    }
}
