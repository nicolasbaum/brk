mod compute;
mod import;

pub mod interest_rates;
pub mod money_supply;
pub mod employment;
pub mod inflation;
pub mod growth;
pub mod commodities;
pub mod other;

use brk_traversable::Traversable;
use vecdb::Database;

pub use interest_rates::Vecs as InterestRatesVecs;
pub use money_supply::Vecs as MoneySupplyVecs;
pub use employment::Vecs as EmploymentVecs;
pub use inflation::Vecs as InflationVecs;
pub use growth::Vecs as GrowthVecs;
pub use commodities::Vecs as CommoditiesVecs;
pub use other::Vecs as OtherMacroVecs;

pub const DB_NAME: &str = "macro_economy";

/// Macroeconomic data from FRED and Yahoo Finance.
#[derive(Clone, Traversable)]
pub struct Vecs {
    #[traversable(skip)]
    pub(crate) db: Database,
    pub interest_rates: InterestRatesVecs,
    pub money_supply: MoneySupplyVecs,
    pub employment: EmploymentVecs,
    pub inflation: InflationVecs,
    pub growth: GrowthVecs,
    pub commodities: CommoditiesVecs,
    pub other: OtherMacroVecs,
}
