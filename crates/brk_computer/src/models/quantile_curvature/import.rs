use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;

impl Vecs {
    pub(crate) fn forced_import(db: &Database, version: Version) -> Result<Self> {
        Ok(Self {
            last_fingerprint: None,
            q01: EagerVec::forced_import(db, "quantile_curvature_q01", version)?,
            q10: EagerVec::forced_import(db, "quantile_curvature_q10", version)?,
            q25: EagerVec::forced_import(db, "quantile_curvature_q25", version)?,
            q50: EagerVec::forced_import(db, "quantile_curvature_q50", version)?,
            q75: EagerVec::forced_import(db, "quantile_curvature_q75", version)?,
            q95: EagerVec::forced_import(db, "quantile_curvature_q95", version)?,
            q99: EagerVec::forced_import(db, "quantile_curvature_q99", version)?,
        })
    }
}
