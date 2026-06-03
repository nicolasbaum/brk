use brk_error::Result;
use brk_types::Day1;
use vecdb::{AnyVec, Exit, ReadableOptionVec};

use super::{
    Vecs,
    predict::{Baselines, DayInput, build_baselines},
};
use crate::{indexes, indicators, models::util::full_rewrite, prices, supply};

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indicators: &indicators::Vecs,
        supply: &supply::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        let close = &prices.split.close.usd.day1;
        let sf = &indicators.stock_to_flow.resolutions.day1;
        let circulating = &supply.circulating.btc.day1;
        let day_count = indexes.day1.date.len();

        let inputs: Vec<DayInput> = (0..day_count)
            .map(|i| {
                let d = Day1::from(i);
                DayInput {
                    t: i as f64,
                    close: close.collect_one_flat(d).map(f64::from),
                    sf: sf.collect_one_flat(d).map(f64::from),
                    supply: circulating.collect_one_flat(d).map(f64::from),
                }
            })
            .collect();

        // Fingerprint-gate on (day_count, last positive close).
        let last_close_cents = inputs
            .iter()
            .rev()
            .find_map(|d| d.close.filter(|&c| c > 0.0))
            .map(|c| (c * 100.0).round() as u64)
            .unwrap_or(0);
        let fingerprint = (day_count, last_close_cents);
        if self.last_fingerprint == Some(fingerprint)
            && self.ols_power_law_price.cents.len() == day_count
        {
            return Ok(());
        }

        let Baselines {
            ols_power_law,
            s2f,
            s2fx,
        } = build_baselines(&inputs);

        full_rewrite(&mut self.ols_power_law_price.cents, &ols_power_law.price, exit)?;
        full_rewrite(&mut self.ols_power_law_error, &ols_power_law.error, exit)?;
        full_rewrite(&mut self.s2f_price.cents, &s2f.price, exit)?;
        full_rewrite(&mut self.s2f_error, &s2f.error, exit)?;
        full_rewrite(&mut self.s2fx_price.cents, &s2fx.price, exit)?;
        full_rewrite(&mut self.s2fx_error, &s2fx.error, exit)?;

        self.last_fingerprint = Some(fingerprint);
        Ok(())
    }
}
