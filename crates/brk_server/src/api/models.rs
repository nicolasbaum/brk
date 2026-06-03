use aide::axum::ApiRouter;
use axum::{
    extract::State,
    http::{StatusCode, header::CONTENT_TYPE},
    response::{IntoResponse, Response},
    routing::get,
};

use crate::AppState;

pub trait ModelsRoutes {
    fn add_models_routes(self) -> Self;
}

impl ModelsRoutes for ApiRouter<AppState> {
    fn add_models_routes(self) -> Self {
        self.route("/api/v1/models/research", get(get_models_research))
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
