//! `models.quantile_curvature` — the conditional price-quantile fan.
//!
//! Stores the seven asymmetric-grouped-curvature price bands as `Day1`-indexed
//! `Cents` series, monotone-rearranged so they never cross. The fan is refit (a
//! full rewrite, since past band values move as coefficients evolve) only when
//! the daily-close fingerprint changes. The coefficient trajectory and
//! out-of-loop inference land in later slices.

mod band;
mod compute;
mod import;

use brk_traversable::Traversable;
use brk_types::{Cents, Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

use band::Fingerprint;

/// A single `Day1`-indexed price-band series, in cents.
type BandVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, Cents>>>;
/// A `Day1`-indexed undershoot series.
type UndershootVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, StoredF32>>>;

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    /// In-memory gate: the daily-close fingerprint of the last fit. Not stored
    /// — a fresh process refits once on first compute, then only on change.
    #[traversable(skip)]
    last_fingerprint: Option<Fingerprint>,

    /// The seven conditional price-quantile bands (cents per day), ascending.
    pub q01: BandVec<M>,
    pub q10: BandVec<M>,
    pub q25: BandVec<M>,
    pub q50: BandVec<M>,
    pub q75: BandVec<M>,
    pub q95: BandVec<M>,
    pub q99: BandVec<M>,

    /// Dislocation `U(t)` below the 1% band: conservative (close) and extreme
    /// (intraday wick / low).
    pub dislocation_close: UndershootVec<M>,
    pub dislocation_wick: UndershootVec<M>,
}

impl<M: StorageMode> Vecs<M> {
    /// The seven band vecs in ascending-quantile order, for uniform iteration.
    fn bands_mut(&mut self) -> [&mut BandVec<M>; 7] {
        [
            &mut self.q01,
            &mut self.q10,
            &mut self.q25,
            &mut self.q50,
            &mut self.q75,
            &mut self.q95,
            &mut self.q99,
        ]
    }
}
