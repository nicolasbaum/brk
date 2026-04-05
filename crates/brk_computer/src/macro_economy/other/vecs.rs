use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub vix: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub dollar_index: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub fed_balance_sheet: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub sp500: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub funding_rate: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
