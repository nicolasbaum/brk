#![doc = include_str!("../README.md")]

use std::{
    fs,
    thread::{self, sleep},
    time::{Duration, Instant},
};

use brk_alloc::Mimalloc;
use brk_computer::Computer;
use brk_error::Result;
use brk_indexer::Indexer;
use brk_mempool::Mempool;
use brk_query::AsyncQuery;
use brk_reader::Reader;
use brk_server::Server;
use tracing::{info, warn};
use vecdb::Exit;

mod config;
mod paths;
#[cfg(unix)]
mod watchdog;

use crate::{config::Config, paths::*};

pub fn main() -> anyhow::Result<()> {
    fs::create_dir_all(dot_brk_path())?;

    brk_logger::init(Some(&dot_brk_log_path()))?;

    #[cfg(unix)]
    if let Err(err) = watchdog::install_or_update() {
        warn!("Failed to install BRK watchdog: {err}");
    }

    let config = Config::import()?;

    let client = config.rpc()?;

    let exit = Exit::new();
    exit.set_ctrlc_handler();

    let reader = Reader::new(config.blocksdir(), &client);

    let mut indexer = Indexer::forced_import(&config.brkdir())?;
    let mut computer = Computer::forced_import(&config.brkdir(), &indexer, config.fetcher())?;

    let mempool = Mempool::new(&client);

    let mempool_clone = mempool.clone();
    thread::spawn(move || {
        mempool_clone.start();
    });

    let query = AsyncQuery::build(&reader, &indexer, &computer, Some(mempool));

    let data_path = config.brkdir();

    let website = config.website();

    let port = config.brkport();

    // Bind the HTTP server before the first indexing pass runs. The server reads
    // from the query snapshot and will report the current `indexed_height`,
    // `computed_height`, and `effective_height` throughout catch-up, so the
    // watchdog (and operators) can distinguish "still catching up from cold start"
    // from "hung" — previously the port only bound after catch-up finished, which
    // made every multi-hour cold-start look like a crashed process and caused the
    // watchdog to kill it mid-reindex in a self-sustaining loop.
    let future = async move {
        let server = Server::new(&query, data_path, website);

        tokio::spawn(async move {
            server.serve(port).await.unwrap();
        });

        Ok(()) as Result<()>
    };

    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?;

    let _handle = runtime.spawn(future);

    #[cfg(not(debug_assertions))]
    {
        let chain_height = client.get_last_height()?;
        let indexed_height = indexer.vecs.canonical_starting_height();
        let blocks_behind = chain_height.saturating_sub(*indexed_height);
        if blocks_behind > 10_000 {
            info!("---");
            info!("Catching up {blocks_behind} blocks (server already reachable)...");
            info!("---");
        }
    }

    loop {
        client.wait_for_synced_node()?;

        let last_height = client.get_last_height()?;

        info!("{} blocks found.", u32::from(last_height) + 1);

        let total_start = Instant::now();

        let starting_indexes = if cfg!(debug_assertions) {
            indexer.checked_index(&reader, &client, &exit)?
        } else {
            indexer.index(&reader, &client, &exit)?
        };

        Mimalloc::collect();

        computer.compute(&indexer, starting_indexes, &exit)?;

        info!("Total time: {:?}", total_start.elapsed());
        info!("Waiting for new blocks...");

        while last_height == client.get_last_height()? {
            sleep(Duration::from_secs(1))
        }
    }
}
