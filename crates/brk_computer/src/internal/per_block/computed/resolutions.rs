use std::marker::PhantomData;

use brk_traversable::Traversable;
use brk_types::{
    Day1, Day3, Epoch, FromCoarserIndex, Halving, Height, Hour1, Hour4, Hour12, Minute10, Minute30,
    Month1, Month3, Month6, Version, Week1, Year1, Year10,
};
use derive_more::{Deref, DerefMut};
use schemars::JsonSchema;
use vecdb::{
    AggFold, LazyAggVec, ReadOnlyClone, ReadableBoxedVec, ReadableCloneableVec, ReadableVec,
    VecIndex, VecValue,
};

use crate::{
    indexes,
    internal::{ComputedVecValue, NumericValue, PerResolution, cache_wrap},
};

/// Sparse aggregation strategy that tolerates stale mappings which may briefly
/// point past the currently available source length during recomputation.
pub struct SafeSparse;

impl<T: VecValue, SI: VecIndex> AggFold<Option<T>, SI, SI, T> for SafeSparse {
    #[inline]
    fn try_fold<S: ReadableVec<SI, T> + ?Sized, B, E, F: FnMut(B, Option<T>) -> Result<B, E>>(
        source: &S,
        mapping: &[SI],
        from: usize,
        to: usize,
        init: B,
        mut f: F,
    ) -> Result<B, E> {
        let source_len = source.len();

        let mut indices: Vec<usize> = Vec::with_capacity(to - from);
        let mut slot_map: Vec<Option<u32>> = Vec::with_capacity(to - from);

        (from..to).for_each(|idx| {
            let current_first = mapping[idx].to_usize().min(source_len);
            let next_first = mapping
                .get(idx + 1)
                .map(|h| h.to_usize().min(source_len))
                .unwrap_or(source_len);

            if next_first == 0 || current_first >= next_first {
                slot_map.push(None);
            } else {
                slot_map.push(Some(indices.len() as u32));
                indices.push(next_first - 1);
            }
        });

        let values = source.read_sorted_at(&indices);

        slot_map.iter().try_fold(init, |acc, slot| match slot {
            None => f(acc, None),
            &Some(vi) => f(acc, values.get(vi as usize).cloned()),
        })
    }

    #[inline]
    fn collect_one<S: ReadableVec<SI, T> + ?Sized>(
        source: &S,
        mapping: &[SI],
        index: usize,
    ) -> Option<Option<T>> {
        let source_len = source.len();
        let current_first = mapping[index].to_usize().min(source_len);
        let next_first = mapping
            .get(index + 1)
            .map(|h| h.to_usize().min(source_len))
            .unwrap_or(source_len);

        if next_first == 0 || current_first >= next_first {
            return Some(None);
        }

        Some(source.collect_one_at(next_first - 1))
    }
}

/// Aggregation strategy for epoch-based indices (Halving, Epoch).
///
/// Uses `FromCoarserIndex::max_from` to compute the target height for each
/// coarse index, rather than reading from the mapping. The mapping is only
/// used for its length.
pub struct CoarserIndex<I>(PhantomData<I>);

impl<I, O, S1I, S2T> AggFold<O, S1I, S2T, O> for CoarserIndex<I>
where
    I: VecIndex,
    O: VecValue,
    S1I: VecIndex + FromCoarserIndex<I>,
    S2T: VecValue,
{
    #[inline]
    fn try_fold<S: ReadableVec<S1I, O> + ?Sized, B, E, F: FnMut(B, O) -> Result<B, E>>(
        source: &S,
        mapping: &[S2T],
        from: usize,
        to: usize,
        init: B,
        f: F,
    ) -> Result<B, E> {
        let mapping_len = mapping.len();
        let source_len = source.len();

        let indices: Vec<usize> = (from..to.min(mapping_len))
            .map(|i| S1I::max_from(I::from(i), source_len))
            .collect();

        let values = source.read_sorted_at(&indices);

        values.into_iter().try_fold(init, f)
    }

    #[inline]
    fn collect_one<S: ReadableVec<S1I, O> + ?Sized>(
        source: &S,
        _mapping: &[S2T],
        index: usize,
    ) -> Option<O> {
        let target = S1I::max_from(I::from(index), source.len());
        source.collect_one_at(target)
    }
}

#[derive(Clone, Deref, DerefMut, Traversable)]
#[traversable(transparent)]
pub struct Resolutions<T>(
    #[allow(clippy::type_complexity)]
    pub  PerResolution<
        LazyAggVec<Minute10, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Minute30, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Hour1, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Hour4, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Hour12, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Day1, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Day3, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Week1, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Month1, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Month3, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Month6, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Year1, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Year10, Option<T>, Height, Height, T, SafeSparse>,
        LazyAggVec<Halving, T, Height, Halving, T, CoarserIndex<Halving>>,
        LazyAggVec<Epoch, T, Height, Epoch, T, CoarserIndex<Epoch>>,
    >,
)
where
    T: ComputedVecValue + PartialOrd + JsonSchema;

impl<T> ReadOnlyClone for Resolutions<T>
where
    T: ComputedVecValue + PartialOrd + JsonSchema,
{
    type ReadOnly = Self;
    fn read_only_clone(&self) -> Self {
        self.clone()
    }
}

impl<T> Resolutions<T>
where
    T: NumericValue + JsonSchema,
{
    pub(crate) fn forced_import(
        name: &str,
        height_source: ReadableBoxedVec<Height, T>,
        version: Version,
        indexes: &indexes::Vecs,
    ) -> Self {
        let cached = cache_wrap(height_source);
        let height_source = cached.read_only_boxed_clone();

        let cm = &indexes.cached_mappings;

        macro_rules! res {
            ($cached:expr) => {{
                let cached = $cached.clone();
                let mapping_version = cached.version();
                LazyAggVec::new(
                    name,
                    version,
                    mapping_version,
                    height_source.clone(),
                    move || cached.get(),
                )
            }};
        }

        Self(PerResolution {
            minute10: res!(cm.minute10_first_height),
            minute30: res!(cm.minute30_first_height),
            hour1: res!(cm.hour1_first_height),
            hour4: res!(cm.hour4_first_height),
            hour12: res!(cm.hour12_first_height),
            day1: res!(cm.day1_first_height),
            day3: res!(cm.day3_first_height),
            week1: res!(cm.week1_first_height),
            month1: res!(cm.month1_first_height),
            month3: res!(cm.month3_first_height),
            month6: res!(cm.month6_first_height),
            year1: res!(cm.year1_first_height),
            year10: res!(cm.year10_first_height),
            halving: res!(cm.halving_identity),
            epoch: res!(cm.epoch_identity),
        })
    }
}
