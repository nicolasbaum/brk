use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::ZERO;

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            cpi: EagerVec::forced_import(db, "cpi", v)?,
            core_cpi: EagerVec::forced_import(db, "core_cpi", v)?,
            pce: EagerVec::forced_import(db, "pce", v)?,
            core_pce: EagerVec::forced_import(db, "core_pce", v)?,
            ppi: EagerVec::forced_import(db, "ppi", v)?,
        })
    }
}
