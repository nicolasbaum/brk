use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, LazyVecFrom2, PcoVec};

/// Interest rate metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// DFF - Federal Funds Rate (daily effective)
    pub fed_funds_rate: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// DGS2 - 2-Year Treasury Yield (daily)
    pub treasury_yield_2y: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// DGS10 - 10-Year Treasury Yield (daily)
    pub treasury_yield_10y: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// DGS30 - 30-Year Treasury Yield (daily)
    pub treasury_yield_30y: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// Yield spread: 10Y - 2Y (computed lazily)
    pub yield_spread_10y_2y:
        LazyVecFrom2<DateIndex, StoredF32, DateIndex, StoredF32, DateIndex, StoredF32>,
}
