//! `models` — distributional / comparison price models.
//!
//! A top-level metric category backed by the pure `brk_quantile` crate. Slice 1
//! ships `quantile_curvature` (the median band tracer); later slices add the
//! full asymmetric fan, the coefficient trajectory, dislocation, and the prior
//! `baselines`.

pub mod baselines;
mod compute;
mod import;
pub mod quantile_curvature;
pub mod research;
mod util;

use brk_traversable::Traversable;
use vecdb::{Database, Rw, StorageMode};

pub use baselines::Vecs as BaselinesVecs;
pub use quantile_curvature::Vecs as QuantileCurvatureVecs;
pub use research::{ResearchArtifact, compute_research_artifact, write_research_artifact};

pub const DB_NAME: &str = "models";

#[derive(Traversable)]
pub struct Vecs<M: StorageMode = Rw> {
    #[traversable(skip)]
    pub(crate) db: Database,

    pub quantile_curvature: QuantileCurvatureVecs<M>,
    pub baselines: BaselinesVecs<M>,
}
