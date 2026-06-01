use brk_error::Result;
use vecdb::Exit;

use super::Vecs;
use crate::{indexes, prices};

impl Vecs {
    pub(crate) fn compute(
        &mut self,
        prices: &prices::Vecs,
        indexes: &indexes::Vecs,
        exit: &Exit,
    ) -> Result<()> {
        self.quantile_curvature.compute(prices, indexes, exit)
    }
}
