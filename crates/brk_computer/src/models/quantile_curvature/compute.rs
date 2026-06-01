use brk_error::Result;
use brk_types::Day1;
use vecdb::{AnyVec, Exit, ReadableOptionVec, ReadableVec};

use super::{
    Vecs,
    band::{Fingerprint, build_bands, build_undershoot, should_refit},
};
use crate::{indexes, models::util::full_rewrite, prices};

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        // Read the daily close and intraday low (USD) into dense per-day vectors.
        let close = &prices.split.close.usd.day1;
        let low = &prices.split.low.usd.day1;
        let day_count = indexes.day1.date.len();
        let closes: Vec<Option<f64>> = (0..day_count)
            .map(|i| close.collect_one_flat(Day1::from(i)).map(f64::from))
            .collect();

        // Fingerprint-gate: skip the (full) refit when nothing relevant changed.
        let fingerprint = Fingerprint::of(&closes);
        if !should_refit(self.last_fingerprint, fingerprint, self.q50.len()) {
            return Ok(());
        }

        // Past band values move as the fit evolves, so this is a full rewrite.
        let bands = build_bands(&closes);
        let q01 = bands[0].clone();
        for (vec, values) in self.bands_mut().into_iter().zip(bands) {
            full_rewrite(vec, &values, exit)?;
        }

        // Dislocation U(t): conservative (close) and extreme (wick/low) vs q01.
        let lows: Vec<Option<f64>> = (0..day_count)
            .map(|i| low.collect_one_at(i).map(f64::from))
            .collect();
        full_rewrite(
            &mut self.dislocation_close,
            &build_undershoot(&closes, &q01),
            exit,
        )?;
        full_rewrite(
            &mut self.dislocation_wick,
            &build_undershoot(&lows, &q01),
            exit,
        )?;

        self.last_fingerprint = Some(fingerprint);
        Ok(())
    }
}
