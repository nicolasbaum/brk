mod compute;
mod import;

pub mod commodities;
pub mod employment;
pub mod growth;
pub mod inflation;
pub mod interest_rates;
pub mod money_supply;
pub mod other;

use brk_traversable::Traversable;
use vecdb::{Database, Rw, StorageMode};

pub use commodities::Vecs as CommoditiesVecs;
pub use employment::Vecs as EmploymentVecs;
pub use growth::Vecs as GrowthVecs;
pub use inflation::Vecs as InflationVecs;
pub use interest_rates::Vecs as InterestRatesVecs;
pub use money_supply::Vecs as MoneySupplyVecs;
pub use other::Vecs as OtherMacroVecs;

pub const DB_NAME: &str = "macro_economy";

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    #[traversable(skip)]
    pub(crate) db: Database,
    pub interest_rates: InterestRatesVecs<M>,
    pub money_supply: MoneySupplyVecs<M>,
    pub employment: EmploymentVecs<M>,
    pub inflation: InflationVecs<M>,
    pub growth: GrowthVecs<M>,
    pub commodities: CommoditiesVecs<M>,
    pub other: OtherMacroVecs<M>,
}
