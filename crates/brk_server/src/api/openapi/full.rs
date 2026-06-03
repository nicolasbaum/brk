use std::hash::Hasher;

use aide::openapi::OpenApi;
use axum::body::Bytes;
use rustc_hash::FxHasher;

/// Full OpenAPI spec, pre-serialized at startup and served as raw bytes per request.
#[derive(Clone)]
pub struct OpenApiJson {
    bytes: Bytes,
    /// FxHash of `bytes`, computed once at startup. Drives a content-addressed
    /// ETag so a spec change invalidates caches even without a VERSION bump.
    content_hash: u64,
}

impl OpenApiJson {
    pub fn new(openapi: &OpenApi) -> Self {
        let bytes = Bytes::from(serde_json::to_vec(openapi).unwrap());
        let mut hasher = FxHasher::default();
        hasher.write(&bytes);
        Self {
            content_hash: hasher.finish(),
            bytes,
        }
    }

    pub fn bytes(&self) -> Bytes {
        self.bytes.clone()
    }

    pub fn content_hash(&self) -> u64 {
        self.content_hash
    }
}
