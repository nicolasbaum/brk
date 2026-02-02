use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Growth & sentiment metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// GDP - GDP (quarterly, billions)
    pub gdp: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// UMCSENT - Consumer Confidence / Michigan (monthly)
    pub consumer_confidence: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// RSXFS - Retail Sales ex food (monthly, millions)
    pub retail_sales: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
