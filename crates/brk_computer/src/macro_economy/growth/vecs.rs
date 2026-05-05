use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    pub gdp: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub consumer_confidence: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
    pub retail_sales: M::Stored<EagerVec<PcoVec<Day1, StoredF32>>>,
}
