use brk_error::Result;
use brk_types::{Height, Indexes};
use tracing::{debug, info};
use vecdb::{AnyStoredVec, PcoVec, PcoVecValue, ReadableVec, VecIndex, VecValue, WritableVec};

use crate::{Stores, Vecs};

/// Extension trait for Indexes with brk_indexer-specific functionality.
pub trait IndexesExt {
    fn checked_push(&self, vecs: &mut Vecs) -> Result<()>;
    fn from_vecs_and_stores(
        required_height: Height,
        vecs: &mut Vecs,
        stores: &Stores,
    ) -> Option<Self>
    where
        Self: Sized;
}

impl IndexesExt for Indexes {
    fn checked_push(&self, vecs: &mut Vecs) -> Result<()> {
        let height = self.height;
        vecs.transactions
            .first_tx_index
            .checked_push(height, self.tx_index)?;
        vecs.inputs
            .first_txin_index
            .checked_push(height, self.txin_index)?;
        vecs.outputs
            .first_txout_index
            .checked_push(height, self.txout_index)?;
        vecs.scripts
            .empty
            .first_index
            .checked_push(height, self.empty_output_index)?;
        vecs.scripts
            .p2ms
            .first_index
            .checked_push(height, self.p2ms_output_index)?;
        vecs.scripts
            .op_return
            .first_index
            .checked_push(height, self.op_return_index)?;
        vecs.addrs
            .p2a
            .first_index
            .checked_push(height, self.p2a_addr_index)?;
        vecs.scripts
            .unknown
            .first_index
            .checked_push(height, self.unknown_output_index)?;
        vecs.addrs
            .p2pk33
            .first_index
            .checked_push(height, self.p2pk33_addr_index)?;
        vecs.addrs
            .p2pk65
            .first_index
            .checked_push(height, self.p2pk65_addr_index)?;
        vecs.addrs
            .p2pkh
            .first_index
            .checked_push(height, self.p2pkh_addr_index)?;
        vecs.addrs
            .p2sh
            .first_index
            .checked_push(height, self.p2sh_addr_index)?;
        vecs.addrs
            .p2tr
            .first_index
            .checked_push(height, self.p2tr_addr_index)?;
        vecs.addrs
            .p2wpkh
            .first_index
            .checked_push(height, self.p2wpkh_addr_index)?;
        vecs.addrs
            .p2wsh
            .first_index
            .checked_push(height, self.p2wsh_addr_index)?;

        Ok(())
    }

    fn from_vecs_and_stores(
        required_height: Height,
        vecs: &mut Vecs,
        stores: &Stores,
    ) -> Option<Indexes> {
        debug!("Creating indexes from vecs and stores...");

        let vecs_height = vecs.canonical_starting_height();
        let stores_height = stores.canonical_starting_height();
        let local_height = recovery_starting_height(required_height, vecs_height, stores_height)?;

        if local_height > required_height {
            info!(
                "Reorg detected: rolling back from {} to {}",
                local_height, required_height
            );
        }

        let starting_height = local_height.min(required_height);

        debug!(
            vecs_height = ?vecs_height,
            stores_height = ?stores_height,
            starting_height = ?starting_height,
            "Resolved recovery heights from canonical block metadata",
        );

        let empty_output_index = starting_index(
            &vecs.scripts.empty.first_index,
            &vecs.scripts.empty.to_tx_index,
            starting_height,
        )?;

        let p2ms_output_index = starting_index(
            &vecs.scripts.p2ms.first_index,
            &vecs.scripts.p2ms.to_tx_index,
            starting_height,
        )?;

        let op_return_index = starting_index(
            &vecs.scripts.op_return.first_index,
            &vecs.scripts.op_return.to_tx_index,
            starting_height,
        )?;

        let p2pk33_addr_index = starting_index(
            &vecs.addrs.p2pk33.first_index,
            &vecs.addrs.p2pk33.bytes,
            starting_height,
        )?;

        let p2pk65_addr_index = starting_index(
            &vecs.addrs.p2pk65.first_index,
            &vecs.addrs.p2pk65.bytes,
            starting_height,
        )?;

        let p2pkh_addr_index = starting_index(
            &vecs.addrs.p2pkh.first_index,
            &vecs.addrs.p2pkh.bytes,
            starting_height,
        )?;

        let p2sh_addr_index = starting_index(
            &vecs.addrs.p2sh.first_index,
            &vecs.addrs.p2sh.bytes,
            starting_height,
        )?;

        let p2tr_addr_index = starting_index(
            &vecs.addrs.p2tr.first_index,
            &vecs.addrs.p2tr.bytes,
            starting_height,
        )?;

        let p2wpkh_addr_index = starting_index(
            &vecs.addrs.p2wpkh.first_index,
            &vecs.addrs.p2wpkh.bytes,
            starting_height,
        )?;

        let p2wsh_addr_index = starting_index(
            &vecs.addrs.p2wsh.first_index,
            &vecs.addrs.p2wsh.bytes,
            starting_height,
        )?;

        let p2a_addr_index = starting_index(
            &vecs.addrs.p2a.first_index,
            &vecs.addrs.p2a.bytes,
            starting_height,
        )?;

        let tx_index = starting_index(
            &vecs.transactions.first_tx_index,
            &vecs.transactions.txid,
            starting_height,
        )?;

        let txin_index = starting_index(
            &vecs.inputs.first_txin_index,
            &vecs.inputs.outpoint,
            starting_height,
        )?;

        let txout_index = starting_index(
            &vecs.outputs.first_txout_index,
            &vecs.outputs.value,
            starting_height,
        )?;

        let unknown_output_index = starting_index(
            &vecs.scripts.unknown.first_index,
            &vecs.scripts.unknown.to_tx_index,
            starting_height,
        )?;

        Some(Indexes {
            empty_output_index,
            height: starting_height,
            p2ms_output_index,
            op_return_index,
            p2pk33_addr_index,
            p2pk65_addr_index,
            p2pkh_addr_index,
            p2sh_addr_index,
            p2tr_addr_index,
            p2wpkh_addr_index,
            p2wsh_addr_index,
            p2a_addr_index,
            tx_index,
            txin_index,
            txout_index,
            unknown_output_index,
        })
    }
}

fn recovery_starting_height(
    required_height: Height,
    vecs_height: Height,
    stores_height: Height,
) -> Option<Height> {
    let local_height = vecs_height.min(stores_height);

    if local_height < required_height {
        return None;
    }

    Some(local_height)
}

pub fn starting_index<I, T>(
    height_to_index: &PcoVec<Height, I>,
    index_to_else: &impl ReadableVec<I, T>,
    starting_height: Height,
) -> Option<I>
where
    I: VecIndex + PcoVecValue + From<usize>,
    T: VecValue,
{
    let h = Height::from(height_to_index.stamp());
    if h.is_zero() {
        None
    } else if h + 1_u32 == starting_height {
        Some(I::from(index_to_else.len()))
    } else {
        height_to_index.collect_one(starting_height)
    }
}

#[cfg(test)]
mod tests {
    use super::recovery_starting_height;
    use brk_types::Height;

    #[test]
    fn prefers_canonical_block_heights_over_lagging_auxiliary_state() {
        let required_height = Height::from(101_u32);
        let vecs_height = Height::from(101_u32);
        let stores_height = Height::from(101_u32);

        assert_eq!(
            recovery_starting_height(required_height, vecs_height, stores_height),
            Some(Height::from(101_u32))
        );
    }

    #[test]
    fn rejects_recovery_when_canonical_store_height_is_behind() {
        let required_height = Height::from(101_u32);
        let vecs_height = Height::from(101_u32);
        let stores_height = Height::from(100_u32);

        assert_eq!(
            recovery_starting_height(required_height, vecs_height, stores_height),
            None
        );
    }

    #[test]
    fn keeps_higher_local_height_for_reorg_rollbacks() {
        let required_height = Height::from(101_u32);
        let vecs_height = Height::from(104_u32);
        let stores_height = Height::from(103_u32);

        assert_eq!(
            recovery_starting_height(required_height, vecs_height, stores_height),
            Some(Height::from(103_u32))
        );
    }
}
