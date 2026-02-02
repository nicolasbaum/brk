use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Money supply metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// M1SL - M1 Money Supply (monthly, billions)
    pub m1: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// WM2NS - M2 Money Supply (weekly, billions)
    pub m2: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
