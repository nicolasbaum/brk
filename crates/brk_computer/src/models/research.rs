//! The cached research artifact: block-bootstrap asymmetry inference and
//! out-of-sample diagnostics.
//!
//! This is the heavy, off-loop work (hundreds of refits). It is computed in a
//! background thread from a snapshot of the daily closes and serialized to a
//! JSON file — never written to the vecdb stores, so it cannot contend with the
//! single-writer compute loop.

use std::path::Path;

use brk_error::Result;
use brk_quantile::bootstrap::{Variant, block_bootstrap};
use brk_quantile::{FitSpec, expanding_window_oos_median};
use serde::Serialize;

/// Fixed seed so the served diagnostics are reproducible.
const SEED: u64 = 0x42524b5f_71636d76; // "BRK_qcmv"
/// Bootstrap replicates per configuration (off-loop, but kept modest so the
/// one-time artifact lands in minutes rather than tens of minutes).
const RESAMPLES: usize = 150;
/// Block lengths (days) for the dependence-robustness sweep.
const BLOCK_LENS: [usize; 4] = [14, 30, 60, 90];

/// Bootstrap diagnostics at one block length.
#[derive(Debug, Clone, Serialize)]
pub struct BlockLenDiagnostics {
    pub block_len: usize,
    pub delta_b: f64,
    pub standard_error: f64,
    pub ci_lo: f64,
    pub ci_hi: f64,
    pub p_value: f64,
}

/// The served research artifact.
#[derive(Debug, Clone, Serialize)]
pub struct ResearchArtifact {
    /// Number of positive-close samples the inference used.
    pub samples: usize,
    /// Full-sample point estimate of `Δb = b^HI − b^LO`.
    pub delta_b: f64,
    /// One-sided p-value, full (refit-all) bootstrap, block length 30.
    pub full_p_value: f64,
    /// One-sided p-value, concentrated bootstrap, block length 30.
    pub concentrated_p_value: f64,
    /// Concentrated-bootstrap diagnostics across block lengths (14/30/60/90).
    pub block_length_sensitivity: Vec<BlockLenDiagnostics>,
    /// Expanding-window Diebold–Mariano statistic at the median (linear −
    /// asymmetric); positive ⇒ the asymmetric model predicts better OOS.
    pub oos_dm_stat_median: f64,
    /// Mean OOS check-loss improvement of the asymmetric model at the median.
    pub oos_mean_improvement_median: f64,
}

impl ResearchArtifact {
    /// Pretty-printed JSON, ready to serve.
    pub fn to_json_pretty(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_default()
    }
}

/// Compute the artifact from a closes snapshot and write it (pretty JSON) to
/// `path`. Intended to run on an off-loop thread; a no-op when there are too
/// few samples to fit.
pub fn write_research_artifact(closes: &[Option<f64>], path: &Path) -> Result<()> {
    if let Some(artifact) = compute_research_artifact(closes) {
        std::fs::write(path, artifact.to_json_pretty())?;
    }
    Ok(())
}

/// Build the artifact from per-day closes (USD; `None` = no close that day).
/// Returns `None` if there are too few positive closes to fit.
pub fn compute_research_artifact(closes: &[Option<f64>]) -> Option<ResearchArtifact> {
    // t = days since genesis, t ≥ 1 so ln t is finite.
    let samples: Vec<(f64, f64)> = closes
        .iter()
        .enumerate()
        .filter_map(|(i, c)| match c {
            Some(v) if *v > 0.0 && i >= 1 => Some((i as f64, v.log10())),
            _ => None,
        })
        .collect();
    if samples.len() < 100 {
        return None;
    }

    let spec = FitSpec::asymmetric_grouped();

    let block_length_sensitivity: Vec<BlockLenDiagnostics> = BLOCK_LENS
        .iter()
        .map(|&bl| {
            let d = block_bootstrap(&samples, &spec, SEED, bl, RESAMPLES, Variant::Concentrated);
            BlockLenDiagnostics {
                block_len: bl,
                delta_b: d.delta_b,
                standard_error: d.standard_error,
                ci_lo: d.ci_lo,
                ci_hi: d.ci_hi,
                p_value: d.p_value,
            }
        })
        .collect();

    let full = block_bootstrap(&samples, &spec, SEED, 30, RESAMPLES, Variant::Full);
    let concentrated_30 = block_length_sensitivity
        .iter()
        .find(|d| d.block_len == 30)
        .map(|d| d.p_value)
        .unwrap_or(f64::NAN);

    // Out-of-sample, expanding window over the last third, ~20 cutpoints.
    let start = samples.len() * 2 / 3;
    let stride = (samples.len() / 60).max(1);
    let oos = expanding_window_oos_median(&samples, start, stride);

    Some(ResearchArtifact {
        samples: samples.len(),
        delta_b: full.delta_b,
        full_p_value: full.p_value,
        concentrated_p_value: concentrated_30,
        block_length_sensitivity,
        oos_dm_stat_median: oos.dm_stat,
        oos_mean_improvement_median: oos.mean_improvement(),
    })
}
