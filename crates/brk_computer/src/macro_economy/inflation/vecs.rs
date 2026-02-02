use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Inflation metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// CPIAUCSL - CPI (monthly, index)
    pub cpi: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// CPILFESL - Core CPI (monthly, index)
    pub core_cpi: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// PCEPI - PCE Price Index (monthly, index)
    pub pce: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// PCEPILFE - Core PCE (monthly, index)
    pub core_pce: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// PPIACO - PPI All Commodities (monthly, index)
    pub ppi: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
