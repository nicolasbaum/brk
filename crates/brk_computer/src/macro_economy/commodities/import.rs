use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::new(3);

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            gold_price: EagerVec::forced_import(db, "gold_price", v)?,
            silver_price: EagerVec::forced_import(db, "silver_price", v)?,
        })
    }
}
