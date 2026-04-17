use std::path::Path;

use brk_error::Result;
use brk_traversable::Traversable;
use brk_types::Version;
use vecdb::{AnyExportableVec, Database, PAGE_SIZE};

use super::{
    CommoditiesVecs, EmploymentVecs, GrowthVecs, InflationVecs, InterestRatesVecs, MoneySupplyVecs,
    OtherMacroVecs, Vecs,
};

impl Vecs {
    pub fn forced_import(parent_path: &Path, parent_version: Version) -> Result<Self> {
        let db = Database::open(&parent_path.join(super::DB_NAME))?;
        db.set_min_len(PAGE_SIZE * 1_000_000)?;
        let state_path = parent_path.join("macro_economy_last_pull_date.txt");

        let version = parent_version;

        let interest_rates = InterestRatesVecs::forced_import(&db, version)?;
        let money_supply = MoneySupplyVecs::forced_import(&db, version)?;
        let employment = EmploymentVecs::forced_import(&db, version)?;
        let inflation = InflationVecs::forced_import(&db, version)?;
        let growth = GrowthVecs::forced_import(&db, version)?;
        let commodities = CommoditiesVecs::forced_import(&db, version)?;
        let other = OtherMacroVecs::forced_import(&db, version)?;

        let this = Self {
            db,
            state_path,
            interest_rates,
            money_supply,
            employment,
            inflation,
            growth,
            commodities,
            other,
        };

        this.db.retain_regions(
            this.iter_any_exportable()
                .flat_map(|v: &dyn AnyExportableVec| v.region_names())
                .collect(),
        )?;
        this.db.compact()?;

        Ok(this)
    }
}
