use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::ZERO;

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            m1: EagerVec::forced_import(db, "m1", v)?,
            m2: EagerVec::forced_import(db, "m2", v)?,
        })
    }
}
