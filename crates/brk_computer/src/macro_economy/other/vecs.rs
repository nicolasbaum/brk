use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Other macroeconomic metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// VIXCLS - VIX (daily)
    pub vix: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// DTWEXBGS - Trade-Weighted Dollar Index (daily)
    pub dollar_index: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// WALCL - Fed Balance Sheet Total Assets (weekly, millions)
    pub fed_balance_sheet: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// ^GSPC - S&P 500 Index, Yahoo Finance (daily)
    pub sp500: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
