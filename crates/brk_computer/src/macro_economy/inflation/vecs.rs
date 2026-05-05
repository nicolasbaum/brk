use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub cpi: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub core_cpi: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub pce: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub core_pce: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub ppi: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
