use brk_error::Result;
use brk_types::Version;
use vecdb::{
    BinaryTransform, Database, EagerVec, ImportableVec, LazyVecFrom2, ReadableCloneableVec,
};

use super::Vecs;
use brk_types::StoredF32;

struct DifferenceF32;

impl BinaryTransform<StoredF32, StoredF32, StoredF32> for DifferenceF32 {
    #[inline(always)]
    fn apply(value: StoredF32, base: StoredF32) -> StoredF32 {
        StoredF32::from(*value - *base)
    }
}

const VERSION: Version = Version::ZERO;

impl Vecs {
    pub fn forced_import(db: &Database, version: Version) -> Result<Self> {
        let v = version + VERSION;

        let fed_funds_rate = EagerVec::forced_import(db, "fed_funds_rate", v)?;
        let treasury_yield_2y = EagerVec::forced_import(db, "treasury_yield_2y", v)?;
        let treasury_yield_10y = EagerVec::forced_import(db, "treasury_yield_10y", v)?;
        let treasury_yield_30y = EagerVec::forced_import(db, "treasury_yield_30y", v)?;

        let yield_spread_10y_2y = LazyVecFrom2::transformed::<DifferenceF32>(
            "yield_spread_10y_2y",
            v,
            treasury_yield_10y.read_only_boxed_clone(),
            treasury_yield_2y.read_only_boxed_clone(),
        );

        Ok(Self {
            fed_funds_rate,
            treasury_yield_2y,
            treasury_yield_10y,
            treasury_yield_30y,
            yield_spread_10y_2y,
        })
    }
}
