//! `models.baselines` — prior public Bitcoin price models (OLS power law, S2F,
//! S2FX) evaluated from their published coefficients, so the systematic
//! optimistic bias is visible directly against realized price.
//!
//! Each model stores a `Day1`-indexed predicted-price series (cents) and a
//! per-day `log₁₀` forecast-error series. Refit-gated like the quantile fan.

mod compute;
mod import;
mod predict;

use brk_traversable::Traversable;
use brk_types::{Cents, Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

/// A `Day1`-indexed predicted-price series, in cents.
type PriceVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, Cents>>>;
/// A `Day1`-indexed `log₁₀` forecast-error series.
type ErrorVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, StoredF32>>>;

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    /// In-memory refit gate: `(day_count, last_close_cents)` of the last build.
    #[traversable(skip)]
    last_fingerprint: Option<(usize, u64)>,

    pub ols_power_law_price: PriceVec<M>,
    pub ols_power_law_error: ErrorVec<M>,
    pub s2f_price: PriceVec<M>,
    pub s2f_error: ErrorVec<M>,
    pub s2fx_price: PriceVec<M>,
    pub s2fx_error: ErrorVec<M>,
}
