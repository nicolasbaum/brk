//! `models.quantile_curvature` — the conditional price-quantile fan.
//!
//! Slice 1 stores the median band (`q50`) as a `Day1`-indexed `Cents` series,
//! refit (full rewrite) only when the daily-close fingerprint changes. The
//! remaining six bands, rearrangement, and the coefficient trajectory land in
//! later slices.

mod band;
mod compute;
mod import;

use brk_traversable::Traversable;
use brk_types::{Cents, Day1};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

use band::Fingerprint;

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    /// In-memory gate: the daily-close fingerprint of the last fit. Not stored
    /// — a fresh process refits once on first compute, then only on change.
    #[traversable(skip)]
    last_fingerprint: Option<Fingerprint>,

    /// Median (τ = 0.50) predicted price, in cents, per day index.
    pub q50: M::Stored<EagerVec<PcoVec<Day1, Cents>>>,
}
