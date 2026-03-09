use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Commodity prices from Yahoo Finance
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// GC=F - Gold Futures, USD per Troy Ounce (daily)
    pub gold_price: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// SI=F - Silver Futures, USD per Troy Ounce (daily)
    pub silver_price: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// CL=F - WTI Crude Oil Futures, USD per Barrel (daily)
    pub oil_wti: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// BZ=F - Brent Crude Oil Futures, USD per Barrel (daily)
    pub oil_brent: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
