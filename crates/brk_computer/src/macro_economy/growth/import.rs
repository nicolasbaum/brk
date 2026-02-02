use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::ZERO;

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            gdp: EagerVec::forced_import(db, "gdp", v)?,
            consumer_confidence: EagerVec::forced_import(db, "consumer_confidence", v)?,
            retail_sales: EagerVec::forced_import(db, "retail_sales", v)?,
        })
    }
}
