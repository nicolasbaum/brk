use brk_error::Result;
use brk_types::Day1;
use vecdb::{AnyStoredVec, AnyVec, Exit, ReadableOptionVec, WritableVec};

use super::{
    Vecs,
    band::{Fingerprint, build_q50_band, should_refit},
};
use crate::{indexes, prices};

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        // Read the daily close (USD) into a dense per-day vector.
        let close = &prices.split.close.usd.day1;
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
        let band = build_q50_band(&closes);
        self.q50.truncate_if_needed_at(0)?;
        for value in band {
            self.q50.push(value);
        }
        {
            let _lock = exit.lock();
            self.q50.write()?;
        }

        self.last_fingerprint = Some(fingerprint);
        Ok(())
    }
}
