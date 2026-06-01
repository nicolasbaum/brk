//! Pure, dependency-free numerical core for the asymmetric tail-curvature
//! quantile price model (BRK `models.quantile_curvature`).
//!
//! Everything here operates on plain `(t, y)` samples — `t` = days since the
//! 2009-01-01 genesis anchor, `y = log10(close)` — so the fit, prediction, and
//! (later) rearrangement / bootstrap / dislocation / baseline logic can be
//! unit-tested in isolation against the working paper's published values, with
//! no BRK dependencies.

pub mod baselines;
pub mod dislocation;
mod fit;
mod optimize;
pub mod rearrange;

pub use fit::{
    Coefficients, FitSpec, HI_IDX, LO_IDX, MEDIAN_IDX, QuantileCoef, TAUS, Variant, fit,
};
