use std::path::Path;

use brk_error::Result;
use brk_types::Version;

use crate::internal::db_utils::{finalize_db, open_db};

use super::{QuantileCurvatureVecs, Vecs};

impl Vecs {
    pub(crate) fn forced_import(parent_path: &Path, parent_version: Version) -> Result<Self> {
        let db = open_db(parent_path, super::DB_NAME, 100_000)?;
        let version = parent_version;

        let quantile_curvature = QuantileCurvatureVecs::forced_import(&db, version)?;

        let this = Self {
            db,
            quantile_curvature,
        };
        finalize_db(&this.db, &this)?;
        Ok(this)
    }
}
