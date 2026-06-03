use brk_error::Result;
use vecdb::Exit;

use super::Vecs;
use crate::{indexes, indicators, prices, supply};

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indicators: &indicators::Vecs,
        supply: &supply::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        self.quantile_curvature.compute(prices, indexes, exit)?;
        self.baselines
            .compute(prices, indicators, supply, indexes, exit)
    }
}
