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
mod trajectory;

use brk_traversable::Traversable;
use brk_types::{Day1, StoredF32};
use vecdb::{EagerVec, PcoVec, Rw, StorageMode};

use super::price::{CentsBand, DayPrice};
use band::Fingerprint;

/// A `Day1`-indexed band-deviation series (undershoot vs Q01 / overshoot vs Q99).
type BandDeviationVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, StoredF32>>>;
/// A `Day1`-indexed fan-position (model-implied quantile of spot) series.
type FanPositionVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, StoredF32>>>;
/// A `Day1`-indexed expanding-window coefficient series.
type TrajectoryVec<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, StoredF32>>>;

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    /// In-memory gate: the daily-close fingerprint of the last fit. Not stored
    /// — a fresh process refits once on first compute, then only on change.
    #[traversable(skip)]
    last_fingerprint: Option<Fingerprint>,

    /// The seven conditional price-quantile bands, ascending. Stored in cents,
    /// exposed as the usd / cents / sats triple so they overlay the spot price.
    pub q01: DayPrice<M>,
    pub q10: DayPrice<M>,
    pub q25: DayPrice<M>,
    pub q50: DayPrice<M>,
    pub q75: DayPrice<M>,
    pub q95: DayPrice<M>,
    pub q99: DayPrice<M>,

    /// Dislocation `U(t)` below the 1% band: conservative (close) and extreme
    /// (intraday wick / low). Negative ⇒ below the band.
    pub dislocation_close: BandDeviationVec<M>,
    pub dislocation_wick: BandDeviationVec<M>,

    /// Overshoot `O(t)` above the 99% band — the symmetric top-stretch magnitude:
    /// conservative (close) and extreme (intraday wick / high). Positive ⇒ above
    /// the band; this is what the saturating `fan_position` can't express at tops.
    pub overshoot_close: BandDeviationVec<M>,
    pub overshoot_wick: BandDeviationVec<M>,

    /// Model-implied quantile of spot: where the daily close sits across the
    /// seven bands (`≈0.01` at/under the bottom band, `≈0.99` at/over the top).
    /// The regression-ready top/bottom position feature; a full rewrite with the
    /// fan, so it backfills complete rather than day-by-day like the trajectory.
    pub fan_position: FanPositionVec<M>,

    /// Like `fan_position` but mapped through probit (z-score) space and *not*
    /// clamped to the outer bands: spot beyond q01/q99 keeps its magnitude
    /// (`< 0.01` for capitulation, `> 0.99` for euphoria, up to `Φ(±4σ)`) instead
    /// of saturating. Use this when the depth/height of a tail excursion matters.
    pub fan_position_extended: FanPositionVec<M>,

    /// In-memory warm seed for the next expanding-window backfill fit. Not
    /// stored; the first fit in a fresh process is cold, the rest warm-chain.
    #[traversable(skip)]
    traj_seed: Option<[f64; 3]>,

    /// Append-only expanding-window coefficient trajectory (one fit per day).
    pub trajectory_mu: TrajectoryVec<M>,
    pub trajectory_b_lo: TrajectoryVec<M>,
    pub trajectory_b_med: TrajectoryVec<M>,
    pub trajectory_b_hi: TrajectoryVec<M>,
    pub trajectory_delta_b: TrajectoryVec<M>,
}

impl<M: StorageMode> Vecs<M> {
    /// The seven stored band cents vecs in ascending-quantile order, for the
    /// uniform full-rewrite of the fan (usd/sats derive from these lazily).
    fn bands_mut(&mut self) -> [&mut CentsBand<M>; 7] {
        [
            &mut self.q01.cents,
            &mut self.q10.cents,
            &mut self.q25.cents,
            &mut self.q50.cents,
            &mut self.q75.cents,
            &mut self.q95.cents,
            &mut self.q99.cents,
        ]
    }
}
