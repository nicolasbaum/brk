use brk_error::Result;
use brk_types::{Height, Version};
use fjall::Keyspace;

pub trait AnyStore: Send + Sync {
    fn name(&self) -> &'static str;
    fn height(&self) -> Option<Height>;
    fn has(&self, height: Height) -> bool;
    fn needs(&self, height: Height) -> bool;
    fn version(&self) -> Version;
    fn export_meta(&mut self, height: Height) -> Result<()>;
    fn export_meta_if_needed(&mut self, height: Height) -> Result<()>;
    fn keyspace(&self) -> &Keyspace;
    /// Commits the pending puts/dels into fjall (data only, no stamp write).
    /// Pair with a subsequent `db.persist(SyncData)` and then
    /// `export_meta(_if_needed)` to advance the on-disk stamp safely.
    fn ingest_pending(&mut self) -> Result<()>;
    fn commit(&mut self, height: Height) -> Result<()>;
}
