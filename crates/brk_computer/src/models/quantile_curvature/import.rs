use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

impl Vecs {
    pub(crate) fn forced_import(db: &Database, version: Version) -> Result<Self> {
        Ok(Self {
            last_fingerprint: None,
            q50: EagerVec::forced_import(db, "quantile_curvature_q50", version)?,
        })
    }
}
