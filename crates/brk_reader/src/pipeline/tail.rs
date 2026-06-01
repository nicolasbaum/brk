use std::{fs::File, ops::ControlFlow, os::unix::fs::FileExt};

use brk_error::{Error, Result};
use brk_rpc::Client;
use brk_types::{BlockHash, Height, ReadBlock};
use crossbeam::channel::Sender;
use tracing::info;

use crate::{
    BlkIndexToBlkPath, OUT_OF_ORDER_FILE_BACKOFF, XORBytes, bisect,
    canonical::CanonicalRange,
    parse::{parse_canonical_body, peek_canonical},
    scan::scan_bytes,
};

const TAIL_CHUNK: usize = 8 * 1024 * 1024;

pub(super) fn pipeline_tail(
    client: &Client,
    paths: &BlkIndexToBlkPath,
    xor_bytes: XORBytes,
    canonical: &CanonicalRange,
    send: &Sender<Result<ReadBlock>>,
) -> Result<()> {
    let mut slots: Vec<Option<ReadBlock>> = (0..canonical.len()).map(|_| None).collect();
    let mut remaining = canonical.len();
    let mut parse_failure: Option<Error> = None;
    let mut below_floor_streak: usize = 0;
    let mut walked_past_backoff = false;

    'files: for (&blk_index, path) in paths.iter().rev() {
        if let Some(missing_idx) = slots.iter().position(Option::is_none)
            && let Ok(first_height) = bisect::first_block_height(client, path, xor_bytes)
        {
            let lowest_missing = Height::from(*canonical.start + missing_idx as u32);
            if first_height < lowest_missing {
                below_floor_streak += 1;
                if below_floor_streak >= OUT_OF_ORDER_FILE_BACKOFF {
                    // Bitcoind has advertised canonical hashes through
                    // RPC whose bodies are not yet flushed to blk*.dat.
                    // Stop searching and emit whatever contiguous prefix
                    // we already have — the next index() pass will pick
                    // up the rest once bitcoind catches up. Erroring
                    // here used to cascade into compute's "State
                    // recovery: fresh start" path and wipe a full
                    // genesis-to-tip pass of work.
                    walked_past_backoff = true;
                    break 'files;
                }
            } else {
                below_floor_streak = 0;
            }
        }

        let file = File::open(path)?;
        let file_len = file.metadata()?.len() as usize;
        if file_len == 0 {
            continue;
        }

        let mut end = file_len;
        let mut spillover: Vec<u8> = Vec::new();

        while end > 0 && remaining > 0 {
            let start = end.saturating_sub(TAIL_CHUNK);
            let chunk_len = end - start;
            let mut buf = vec![0u8; chunk_len + spillover.len()];
            file.read_exact_at(&mut buf[..chunk_len], start as u64)?;
            buf[chunk_len..].copy_from_slice(&spillover);
            spillover.clear();

            let result = scan_bytes(
                &mut buf,
                blk_index,
                start,
                xor_bytes,
                |metadata, block_bytes, xor_state| {
                    let Some((offset, header)) =
                        peek_canonical(block_bytes, xor_state, xor_bytes, canonical)
                    else {
                        return ControlFlow::Continue(());
                    };
                    if slots[offset as usize].is_some() {
                        return ControlFlow::Continue(());
                    }
                    if !canonical.verify_prev(offset, &BlockHash::from(header.prev_blockhash)) {
                        parse_failure = Some(Error::Internal(
                            "tail pipeline: canonical batch stitched across a reorg",
                        ));
                        return ControlFlow::Break(());
                    }
                    let height = Height::from(*canonical.start + offset);
                    match parse_canonical_body(
                        block_bytes.to_vec(),
                        metadata,
                        xor_state,
                        xor_bytes,
                        height,
                        header,
                    ) {
                        Ok(block) => {
                            slots[offset as usize] = Some(block);
                            remaining -= 1;
                        }
                        Err(e) => {
                            parse_failure = Some(e);
                            return ControlFlow::Break(());
                        }
                    }
                    if remaining == 0 {
                        ControlFlow::Break(())
                    } else {
                        ControlFlow::Continue(())
                    }
                },
            );

            if let Some(e) = parse_failure {
                return Err(e);
            }
            if remaining == 0 {
                break 'files;
            }

            // Carry pre-first-magic bytes into the earlier chunk so a
            // block straddling the boundary is stitched back together.
            end = start;
            if end > 0 {
                let prefix_len = result.first_magic.unwrap_or(buf.len());
                spillover.extend_from_slice(&buf[..prefix_len]);
            }
        }
    }

    if remaining > 0 && !walked_past_backoff {
        // Walked every blk file without filling all canonical slots and
        // never hit the per-file backoff — that's a true on-disk gap
        // (corruption, prune, etc.), not the bitcoind-flush race.
        return Err(Error::Internal(
            "tail pipeline: blk files missing canonical blocks",
        ));
    }

    if walked_past_backoff {
        let filled = canonical.len() - remaining;
        info!(
            "tail pipeline: bitcoind RPC advertised canonical hashes whose bodies are not yet on disk; emitting contiguous prefix of {filled}/{} blocks and deferring the rest to the next pass",
            canonical.len(),
        );
    }

    // Emit only the contiguous-from-start filled prefix. Any gap stops
    // the stream so the indexer's prev_hash stays on the last block it
    // actually consumed — the next index() pass resumes cleanly from
    // there.
    for slot in slots {
        let Some(block) = slot else {
            break;
        };
        if send.send(Ok(block)).is_err() {
            return Ok(());
        }
    }
    Ok(())
}
