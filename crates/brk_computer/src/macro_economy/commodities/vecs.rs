use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub gold_price: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub silver_price: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub oil_wti: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub oil_brent: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
