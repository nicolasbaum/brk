use brk_error::Result;
use brk_types::Day1;
use vecdb::{AnyStoredVec, Exit, VecValue, WritableVec};

/// Full rewrite of a `Day1`-indexed eager vec. Model series move their past
/// values as the fit is re-evaluated over the growing window, so each refit
/// truncates to zero and repushes the whole series under the exit lock.
pub(crate) fn full_rewrite<T, V>(vec: &mut V, values: &[T], exit: &Exit) -> Result<()>
where
    T: Copy + VecValue,
    V: WritableVec<Day1, T> + AnyStoredVec,
{
    vec.truncate_if_needed_at(0)?;
    for &v in values {
        vec.push(v);
    }
    let _lock = exit.lock();
    vec.write()?;
    Ok(())
}
