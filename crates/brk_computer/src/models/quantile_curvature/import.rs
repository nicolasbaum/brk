use brk_error::Result;
use brk_types::Version;
use vecdb::{Database, EagerVec, ImportableVec};

use super::Vecs;
use crate::models::price::DayPrice;

impl Vecs {
    pub(crate) fn forced_import(db: &Database, version: Version) -> Result<Self> {
        Ok(Self {
            last_fingerprint: None,
            q01: DayPrice::forced_import(db, "quantile_curvature_q01", version)?,
            q10: DayPrice::forced_import(db, "quantile_curvature_q10", version)?,
            q25: DayPrice::forced_import(db, "quantile_curvature_q25", version)?,
            q50: DayPrice::forced_import(db, "quantile_curvature_q50", version)?,
            q75: DayPrice::forced_import(db, "quantile_curvature_q75", version)?,
            q95: DayPrice::forced_import(db, "quantile_curvature_q95", version)?,
            q99: DayPrice::forced_import(db, "quantile_curvature_q99", version)?,
            dislocation_close: EagerVec::forced_import(
                db,
                "quantile_curvature_dislocation_close",
                version,
            )?,
            dislocation_wick: EagerVec::forced_import(
                db,
                "quantile_curvature_dislocation_wick",
                version,
            )?,
            overshoot_close: EagerVec::forced_import(
                db,
                "quantile_curvature_overshoot_close",
                version,
            )?,
            overshoot_wick: EagerVec::forced_import(
                db,
                "quantile_curvature_overshoot_wick",
                version,
            )?,
            fan_position: EagerVec::forced_import(
                db,
                "quantile_curvature_fan_position",
                version,
            )?,
            fan_position_extended: EagerVec::forced_import(
                db,
                "quantile_curvature_fan_position_extended",
                version,
            )?,
            traj_seed: None,
            trajectory_mu: EagerVec::forced_import(db, "quantile_curvature_trajectory_mu", version)?,
            trajectory_b_lo: EagerVec::forced_import(
                db,
                "quantile_curvature_trajectory_b_lo",
                version,
            )?,
            trajectory_b_med: EagerVec::forced_import(
                db,
                "quantile_curvature_trajectory_b_med",
                version,
            )?,
            trajectory_b_hi: EagerVec::forced_import(
                db,
                "quantile_curvature_trajectory_b_hi",
                version,
            )?,
            trajectory_delta_b: EagerVec::forced_import(
                db,
                "quantile_curvature_trajectory_delta_b",
                version,
            )?,
            trajectory_fan_position_extended: EagerVec::forced_import(
                db,
                "quantile_curvature_trajectory_fan_position_extended",
                version,
            )?,
        })
    }
}
