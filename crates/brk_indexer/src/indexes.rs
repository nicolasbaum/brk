use brk_error::Result;
use brk_types::{Height, Indexes};
use tracing::{debug, info};
use vecdb::{AnyStoredVec, PcoVec, PcoVecValue, ReadableVec, VecIndex, VecValue, WritableVec};

use crate::{Stores, Vecs};

/// Outcome of trying to rebuild [`Indexes`] from the persisted vecs/stores.
///
/// The previous API returned [`Option<Indexes>`] and any `None` was treated as a
/// "data inconsistency" triggering a full reset. That conflated two very different
/// situations: a genuine rollback at the tip (which we should just roll back and
/// continue from) and actual missing data (which does require a reset).
#[derive(Debug)]
pub enum RecoveryOutcome {
    /// Safe to continue with these starting indexes. A tip-level rollback may have
    /// happened; the caller should still invoke `rollback_if_needed`.
    Ready(Indexes),
    /// Data is genuinely missing or inconsistent; the caller must run `full_reset`
    /// before indexing. The `&'static str` is a short, human-readable reason.
    NeedsFullReset(&'static str),
}

/// Why a specific auxiliary vec could not satisfy a requested `starting_height`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StartingIndexError {
    /// The vec has never been stamped (`stamp == 0`) even though we expected data.
    NotInitialized,
    /// `collect_one(starting_height)` returned `None` despite a non-zero stamp —
    /// this should not happen during normal operation.
    UnexpectedGap,
}

pub trait IndexesExt {
    fn checked_push(&self, vecs: &mut Vecs) -> Result<()>;
    fn from_vecs_and_stores(
        required_height: Height,
        vecs: &mut Vecs,
        stores: &Stores,
    ) -> RecoveryOutcome;
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
    ) -> RecoveryOutcome {
        debug!("Creating indexes from vecs and stores...");

        let vecs_height = vecs.canonical_starting_height();
        let stores_height = stores.canonical_starting_height();

        let Some(local_height) =
            recovery_starting_height(required_height, vecs_height, stores_height)
        else {
            return RecoveryOutcome::NeedsFullReset(
                "canonical block metadata is behind required height",
            );
        };

        let initial_target = local_height.min(required_height);

        // Auxiliary vecs only have data up to their stamp. If any of them lags behind
        // `initial_target` we prefer rolling back a few more blocks over a full reset.
        let aux_target = match auxiliary_rollback_target(vecs) {
            Ok(Some(cap)) => initial_target.min(cap),
            Ok(None) => initial_target,
            Err(StartingIndexError::NotInitialized) => {
                return RecoveryOutcome::NeedsFullReset(
                    "an auxiliary vec is uninitialized (stamp=0) while canonical data exists",
                );
            }
            Err(StartingIndexError::UnexpectedGap) => {
                return RecoveryOutcome::NeedsFullReset(
                    "unexpected gap inspecting auxiliary vec stamps",
                );
            }
        };

        if local_height > required_height {
            info!("Reorg detected: rolling back from {local_height} to {aux_target}");
        } else if aux_target < initial_target {
            info!(
                "Auxiliary vecs lag behind canonical tip; rolling back from {initial_target} to {aux_target}",
            );
        }

        debug!(
            vecs_height = ?vecs_height,
            stores_height = ?stores_height,
            required_height = ?required_height,
            local_height = ?local_height,
            starting_height = ?aux_target,
            "Resolved recovery heights from canonical block metadata",
        );

        match build_indexes(aux_target, vecs) {
            Ok(indexes) => RecoveryOutcome::Ready(indexes),
            Err(StartingIndexError::NotInitialized) => RecoveryOutcome::NeedsFullReset(
                "an auxiliary vec is uninitialized (stamp=0) while canonical data exists",
            ),
            Err(StartingIndexError::UnexpectedGap) => RecoveryOutcome::NeedsFullReset(
                "unexpected gap in auxiliary vec at rollback target",
            ),
        }
    }
}

fn build_indexes(
    starting_height: Height,
    vecs: &mut Vecs,
) -> std::result::Result<Indexes, StartingIndexError> {
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

    Ok(Indexes {
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

/// Returns the highest `starting_height` that every auxiliary vec can still satisfy,
/// i.e. `min(stamp) + 1`. Returns `Ok(None)` if all auxiliary vec stamps are 0 (a
/// fresh indexer state, where `starting_height` will be 0 anyway). Returns
/// `Err(NotInitialized)` when only some vecs are uninitialised, which is the
/// genuine "actual missing data" case.
fn auxiliary_rollback_target(
    vecs: &Vecs,
) -> std::result::Result<Option<Height>, StartingIndexError> {
    let stamps = [
        vecs.scripts.empty.first_index.stamp(),
        vecs.scripts.p2ms.first_index.stamp(),
        vecs.scripts.op_return.first_index.stamp(),
        vecs.addrs.p2pk33.first_index.stamp(),
        vecs.addrs.p2pk65.first_index.stamp(),
        vecs.addrs.p2pkh.first_index.stamp(),
        vecs.addrs.p2sh.first_index.stamp(),
        vecs.addrs.p2tr.first_index.stamp(),
        vecs.addrs.p2wpkh.first_index.stamp(),
        vecs.addrs.p2wsh.first_index.stamp(),
        vecs.addrs.p2a.first_index.stamp(),
        vecs.transactions.first_tx_index.stamp(),
        vecs.inputs.first_txin_index.stamp(),
        vecs.outputs.first_txout_index.stamp(),
        vecs.scripts.unknown.first_index.stamp(),
    ];

    let any_zero = stamps.iter().any(|&s| u64::from(s) == 0);
    let all_zero = stamps.iter().all(|&s| u64::from(s) == 0);

    if all_zero {
        return Ok(None);
    }
    if any_zero {
        return Err(StartingIndexError::NotInitialized);
    }

    let min_stamp = stamps
        .iter()
        .map(|s| u64::from(*s))
        .min()
        .unwrap_or_default() as u32;

    Ok(Some(Height::new(min_stamp).incremented()))
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

fn starting_index<I, T>(
    height_to_index: &PcoVec<Height, I>,
    index_to_else: &impl ReadableVec<I, T>,
    starting_height: Height,
) -> std::result::Result<I, StartingIndexError>
where
    I: VecIndex + PcoVecValue + From<usize>,
    T: VecValue,
{
    let h = Height::from(height_to_index.stamp());

    if h.is_zero() {
        Err(StartingIndexError::NotInitialized)
    } else if h + 1_u32 == starting_height {
        Ok(I::from(index_to_else.len()))
    } else {
        height_to_index
            .collect_one(starting_height)
            .ok_or(StartingIndexError::UnexpectedGap)
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
