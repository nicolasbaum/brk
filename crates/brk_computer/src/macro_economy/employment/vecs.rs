use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub unemployment_rate: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub initial_claims: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub nonfarm_payrolls: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
