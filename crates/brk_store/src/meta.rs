use std::{
    fs, io,
    path::{Path, PathBuf},
};

use brk_error::{Error, Result};
use brk_types::Version;
use fjall::Keyspace;

use super::Height;

#[derive(Debug, Clone)]
pub struct StoreMeta {
    pathbuf: PathBuf,
    version: Version,
    height: Option<Height>,
}

impl StoreMeta {
    pub fn checked_open<F>(
        path: &Path,
        version: Version,
        open_partition_handle: F,
    ) -> Result<(Self, Keyspace)>
    where
        F: Fn() -> Result<Keyspace>,
    {
        fs::create_dir_all(path)?;

        let partition = open_partition_handle()?;

        if let Ok(prev_version) = Version::try_from(Self::path_version_(path).as_path())
            && version != prev_version
        {
            return Err(Error::VersionMismatch {
                path: path.to_path_buf(),
                expected: usize::from(version),
                found: usize::from(prev_version),
            });
        }

        let slf = Self {
            pathbuf: path.to_owned(),
            version,
            height: Height::try_from(Self::path_height_(path).as_path()).ok(),
        };

        slf.version.write(&slf.path_version())?;

        Ok((slf, partition))
    }

    pub fn version(&self) -> Version {
        self.version
    }

    pub fn export(&mut self, height: Height) -> io::Result<()> {
        self.height = Some(height);
        height.write(&self.path_height())
    }

    pub fn path(&self) -> &Path {
        &self.pathbuf
    }

    /// Returns the path of the on-disk height stamp file. Intended for
    /// `Send` closures that need to write the stamp after a separate
    /// durable-data step (see `Store::take_pending_ingest`); other callers
    /// should prefer `export()` / `export_if_needed()`.
    pub fn path_height_buf(&self) -> PathBuf {
        self.path_height()
    }

    /// Updates the in-memory stamp without touching the on-disk file.
    /// Used to claim a logical height before the disk-write step that
    /// `path_height_buf()` enables.
    pub fn set_height_in_memory(&mut self, height: Height) {
        self.height = Some(height);
    }

    fn path_version(&self) -> PathBuf {
        Self::path_version_(&self.pathbuf)
    }
    fn path_version_(path: &Path) -> PathBuf {
        path.join("version")
    }

    #[inline]
    pub fn height(&self) -> Option<Height> {
        self.height
    }
    #[inline]
    pub fn needs(&self, height: Height) -> bool {
        self.height.is_none_or(|self_height| height > self_height)
    }
    #[inline]
    pub fn has(&self, height: Height) -> bool {
        !self.needs(height)
    }
    pub fn reset(&mut self) -> io::Result<()> {
        self.height = None;
        let path = self.path_height();
        if path.exists() {
            fs::remove_file(&path)?;
        }
        Ok(())
    }
    fn path_height(&self) -> PathBuf {
        Self::path_height_(&self.pathbuf)
    }
    fn path_height_(path: &Path) -> PathBuf {
        path.join("height")
    }
}
