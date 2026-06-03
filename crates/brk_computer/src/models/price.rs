//! A `Day1`-indexed model price, stored once in cents but exposed as the
//! standard usd / cents / sats triple — so the website renders it like any
//! other BRK price: correct magnitude on the USD axis and a working sats
//! toggle when overlaid on the spot price. The dollar and sat views are lazy
//! unit transforms of the stored cents series (no extra storage), named so the
//! generated client groups `<base>`, `<base>_cents`, `<base>_sats` into one
//! price pattern exactly as `price_close` is.

use brk_error::Result;
use brk_traversable::Traversable;
use brk_types::{Cents, Day1, Dollars, Sats, Version};
use vecdb::{
    Database, EagerVec, ImportableVec, LazyVecFrom1, PcoVec, ReadableCloneableVec, Rw, StorageMode,
};

use crate::internal::{CentsUnsignedToDollars, CentsUnsignedToSats};

/// The stored cents series, mode-gated like the other model vecs.
pub(crate) type CentsBand<M> = <M as StorageMode>::Stored<EagerVec<PcoVec<Day1, Cents>>>;

/// A `Day1` price exposed as usd (dollars) / cents / sats. Only `cents` is
/// stored; `usd` and `sats` derive from it lazily.
#[derive(Traversable)]
pub struct DayPrice<M: StorageMode = Rw> {
    pub usd: LazyVecFrom1<Day1, Dollars, Day1, Cents>,
    pub cents: CentsBand<M>,
    pub sats: LazyVecFrom1<Day1, Sats, Day1, Cents>,
}

impl DayPrice<Rw> {
    /// Import the stored cents series as `<base_name>_cents` and derive the
    /// dollar (`<base_name>`) and sat (`<base_name>_sats`) lazy views from it.
    pub(crate) fn forced_import(db: &Database, base_name: &str, version: Version) -> Result<Self> {
        let cents = EagerVec::forced_import(db, &format!("{base_name}_cents"), version)?;
        let usd = LazyVecFrom1::transformed::<CentsUnsignedToDollars>(
            base_name,
            version,
            cents.read_only_boxed_clone(),
        );
        let sats = LazyVecFrom1::transformed::<CentsUnsignedToSats>(
            &format!("{base_name}_sats"),
            version,
            cents.read_only_boxed_clone(),
        );
        Ok(Self { usd, cents, sats })
    }
}
