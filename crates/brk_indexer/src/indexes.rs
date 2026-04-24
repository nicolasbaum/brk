use brk_error::Result;
use brk_types::{Height, Indexes};
use tracing::{debug, info, warn};
use vecdb::{AnyStoredVec, PcoVec, PcoVecValue, ReadableVec, VecIndex, VecValue, WritableVec};

use crate::{Stores, Vecs};

/// Maximum number of blocks to walk back looking for a self-consistent auxiliary-vec
/// state during recovery. In practice a legitimate tip reorg is a handful of blocks
/// and an auxiliary-vec partial-write artifact resolves within a few blocks too, so
/// this limit is intentionally generous. If it is exceeded the on-disk state is
/// genuinely corrupt and requires operator intervention — we surface a fatal error
/// instead of silently wiping weeks of indexed data.
const RECOVERY_WALKBACK_LIMIT: u32 = 1000;

/// Outcome of trying to rebuild [`Indexes`] from the persisted vecs/stores.
#[derive(Debug)]
pub enum RecoveryOutcome {
    /// Safe to continue with these starting indexes. A tip-level rollback may have
    /// happened; the caller should still invoke `rollback_if_needed`.
    Ready(Indexes),
    /// On-disk state is genuinely corrupt and cannot be recovered by rolling back
    /// within [`RECOVERY_WALKBACK_LIMIT`] blocks. The caller must surface this as a
    /// fatal error — historically we wiped the indexed directory and re-indexed from
    /// scratch in response, but that threw away weeks of work on trivially-recoverable
    /// inconsistencies (see Apr 2026 incident where a 1-block reorg triggered a
    /// 945k-block reset). The `&'static str` is a short, human-readable reason.
    Unrecoverable(&'static str),
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
            return RecoveryOutcome::Unrecoverable(
                "canonical block metadata is behind required height",
            );
        };

        let initial_target = local_height.min(required_height);

        // Auxiliary vecs only have data up to their stamp. If any of them lags behind
        // `initial_target` we prefer rolling back a few more blocks over a full reset.
        let stamp_based_target = match auxiliary_rollback_target(vecs) {
            Ok(Some(cap)) => initial_target.min(cap),
            Ok(None) => initial_target,
            Err(StartingIndexError::NotInitialized) => {
                return RecoveryOutcome::Unrecoverable(
                    "an auxiliary vec is uninitialized (stamp=0) while canonical data exists",
                );
            }
            Err(StartingIndexError::UnexpectedGap) => {
                return RecoveryOutcome::Unrecoverable(
                    "unexpected gap inspecting auxiliary vec stamps",
                );
            }
        };

        // Bounded walkback: if build_indexes fails at the stamp-based target, walk
        // back one block at a time until it succeeds. This defends against partial
        // writes and off-by-one stamp/len mismatches in auxiliary vecs that used to
        // trigger a full reset — a response that threw away the entire indexed
        // directory in response to a trivially-recoverable inconsistency.
        let mut target = stamp_based_target;
        let mut walked_back: u32 = 0;
        let last_err = loop {
            match build_indexes(target, vecs) {
                Ok(indexes) => {
                    if local_height > required_height {
                        info!("Reorg detected: rolling back from {local_height} to {target}");
                    } else if target < initial_target {
                        info!(
                            "Auxiliary vecs lag behind canonical tip; rolling back from {initial_target} to {target}",
                        );
                    }
                    if walked_back > 0 {
                        warn!(
                            "Recovered from auxiliary-vec inconsistency by walking back {walked_back} block(s) beyond the stamp-based rollback target",
                        );
                    }
                    debug!(
                        vecs_height = ?vecs_height,
                        stores_height = ?stores_height,
                        required_height = ?required_height,
                        local_height = ?local_height,
                        starting_height = ?target,
                        "Resolved recovery heights from canonical block metadata",
                    );
                    return RecoveryOutcome::Ready(indexes);
                }
                Err(err) => {
                    if walked_back >= RECOVERY_WALKBACK_LIMIT {
                        break err;
                    }
                    match target.decremented() {
                        Some(prev) => {
                            target = prev;
                            walked_back += 1;
                        }
                        None => break err,
                    }
                }
            }
        };

        match last_err {
            StartingIndexError::NotInitialized => RecoveryOutcome::Unrecoverable(
                "an auxiliary vec remained uninitialized throughout recovery walkback",
            ),
            StartingIndexError::UnexpectedGap => RecoveryOutcome::Unrecoverable(
                "auxiliary vec gaps persist throughout recovery walkback",
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
    _required_height: Height,
    vecs_height: Height,
    stores_height: Height,
) -> Option<Height> {
    // `min(vecs, stores)` is the highest height where both sides agree.
    // Returning it even when it's below `required_height` lets the caller roll
    // back to that consistent point and re-index forward; the previous
    // `None`-on-behind behaviour crash-looped the process after a mid-rollback
    // crash (stores committed, vecs never flushed), because recovery refused
    // to proceed from the lower-but-consistent height.
    Some(vecs_height.min(stores_height))
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
    fn accepts_lower_local_height_when_store_is_behind() {
        // A mid-rollback crash can persist stores at N-1 while vecs remain at N
        // (vecs aren't flushed until the next export). On restart, required
        // equals the bitcoind tip, which is ahead of stores. Recovery must
        // still succeed at `min(vecs, stores)` so the caller can truncate vecs
        // down to the consistent height and re-index forward, rather than
        // crash-loop.
        let required_height = Height::from(101_u32);
        let vecs_height = Height::from(101_u32);
        let stores_height = Height::from(100_u32);

        assert_eq!(
            recovery_starting_height(required_height, vecs_height, stores_height),
            Some(Height::from(100_u32))
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
