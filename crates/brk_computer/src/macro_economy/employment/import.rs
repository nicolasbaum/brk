use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

const VERSION: Version = Version::ZERO;

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        Ok(Self {
            unemployment_rate: EagerVec::forced_import(db, "unemployment_rate", v)?,
            initial_claims: EagerVec::forced_import(db, "initial_claims", v)?,
            nonfarm_payrolls: EagerVec::forced_import(db, "nonfarm_payrolls", v)?,
        })
    }
}
