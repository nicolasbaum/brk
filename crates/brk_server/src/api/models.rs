use aide::axum::{ApiRouter, routing::get_with};
use axum::{
    extract::State,
    http::{StatusCode, header::CONTENT_TYPE},
    response::{IntoResponse, Response},
};

use crate::{AppState, extended::TransformResponseExtended};

pub trait ModelsRoutes {
    fn add_models_routes(self) -> Self;
}

impl ModelsRoutes for ApiRouter<AppState> {
    fn add_models_routes(self) -> Self {
        self.api_route(
            "/api/v1/models/research",
            get_with(get_models_research, |op| {
                op.id("get_models_research")
                    .models_tag()
                    .summary("Quantile model research artifact")
                    .description(
                        "Block-bootstrap asymmetry inference for the asymmetric tail-curvature \
                         quantile price model: `Δb` (curvature asymmetry) with standard error, \
                         confidence interval and p-value, block-length sensitivity, plus the \
                         out-of-sample Diebold–Mariano diagnostics. Computed off the per-block \
                         compute loop and written to `<data>/models_research.json`; returns 404 \
                         until the first artifact has been produced.\n\nThe model's fitted result \
                         series (quantile bands `quantile_curvature_q01`..`q99`, dislocation, \
                         overshoot, fan position (clamped and extended), expanding-window trajectory, and the \
                         `baseline_*` prior models) are exposed as regular metrics — list them \
                         via `/api/series/list` and query via `/api/series/{series}/{index}`.",
                    )
                    .json_response::<serde_json::Value>()
                    .not_found()
                    .server_error()
            }),
        )
    }
}

/// Serve the cached models research artifact — block-bootstrap asymmetry
/// inference (`Δb` SE / CI / p-value, block-length sensitivity) plus the
/// out-of-sample Diebold–Mariano diagnostics. Computed off the per-block compute
/// loop and written to `<data>/models_research.json`; 404 until first produced.
async fn get_models_research(State(state): State<AppState>) -> Response {
    let path = state.data_path.join("models_research.json");
    match std::fs::read(&path) {
        Ok(bytes) => ([(CONTENT_TYPE, "application/json")], bytes).into_response(),
        Err(_) => (
            StatusCode::NOT_FOUND,
            "models research artifact not yet available",
        )
            .into_response(),
    }
}
