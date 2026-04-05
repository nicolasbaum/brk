use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub m1: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub m2: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
