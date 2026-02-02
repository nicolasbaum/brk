use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::new(3);

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            vix: EagerVec::forced_import(db, "vix", v)?,
            dollar_index: EagerVec::forced_import(db, "dollar_index", v)?,
            fed_balance_sheet: EagerVec::forced_import(db, "fed_balance_sheet", v)?,
            sp500: EagerVec::forced_import(db, "sp500", v)?,
        })
    }
}
