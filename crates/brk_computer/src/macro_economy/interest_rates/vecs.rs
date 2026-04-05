use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, LazyVecFrom2, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub fed_funds_rate: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub treasury_yield_2y: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub treasury_yield_10y: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub treasury_yield_30y: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub yield_spread_10y_2y: LazyVecFrom2<Day1, StoredF32, Day1, StoredF32, Day1, StoredF32>,
}
