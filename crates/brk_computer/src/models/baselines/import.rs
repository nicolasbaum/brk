use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

impl Vecs {
    pub(crate) fn forced_import(db: &Database, version: Version) -> Result<Self> {
        Ok(Self {
            last_fingerprint: None,
            ols_power_law_price: EagerVec::forced_import(db, "baseline_ols_power_law", version)?,
            ols_power_law_error: EagerVec::forced_import(
                db,
                "baseline_ols_power_law_error",
                version,
            )?,
            s2f_price: EagerVec::forced_import(db, "baseline_s2f", version)?,
            s2f_error: EagerVec::forced_import(db, "baseline_s2f_error", version)?,
            s2fx_price: EagerVec::forced_import(db, "baseline_s2fx", version)?,
            s2fx_error: EagerVec::forced_import(db, "baseline_s2fx_error", version)?,
        })
    }
}
