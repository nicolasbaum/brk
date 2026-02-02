use brk_traversable::Traversable;
use brk_types::{DateIndex, StoredF32};
use vecdb::{EagerVec, PcoVec};

/// Employment metrics from FRED
#[derive(Clone, Traversable)]
pub struct Vecs {
    /// UNRATE - Unemployment Rate (monthly, %)
    pub unemployment_rate: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// ICSA - Initial Jobless Claims (weekly)
    pub initial_claims: EagerVec<PcoVec<DateIndex, StoredF32>>,
    /// PAYEMS - Non-farm Payrolls (monthly, thousands)
    pub nonfarm_payrolls: EagerVec<PcoVec<DateIndex, StoredF32>>,
}
