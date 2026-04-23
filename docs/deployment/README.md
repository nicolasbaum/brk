# BRK deployment notes

## systemd layout (remote bitcoind over SSH)

When BRK runs against a remote bitcoind reached via an SSH tunnel + an sshfs
mount of `blocks/`, run three separate user units instead of bundling the
tunnels under `brk.service`:

- `brk.service` — the BRK process itself
- `brk-sshfs-bitcoin.service` — the sshfs mount of the remote `blocks/` parent
- `brk-tunnel-bitcoind.service` — the `ssh -L` tunnel that exposes the remote
  bitcoind RPC on `localhost:8332`

### Why split them

Historically the tunnels ran as `ExecStartPre=` children of `brk.service`,
which placed their processes in the same cgroup. A transient SSH flake then
took down sshfs and the RPC tunnel simultaneously — BRK saw this as an
unrecoverable bitcoind loss and, on the next restart, could trigger a
catastrophic re-index (see the April 2026 incident on the primary deployment:
a 1-block reorg coinciding with a brief SSH stutter wiped 945k blocks of
indexed state and trapped BRK in a 5-day restart loop).

Splitting them means:

- `sshfs -o reconnect` can silently re-establish the link without BRK ever
  noticing.
- If the tunnel process dies entirely, systemd restarts only that unit; BRK's
  RPC retry loop handles the gap.
- Restarting `brk.service` no longer teardown the tunnels, so startup is
  instant on the next run.
- A BRK crash mid-reorg never looks like a tunnel failure again.

### Installing

1. Copy the four `.example` files from `systemd/` into
   `~/.config/systemd/user/` as `brk.service`, `brk-sshfs-bitcoin.service`,
   `brk-tunnel-bitcoind.service`, and `brk.env`.
2. Edit each — every placeholder (`YOUR_USER`, `REMOTE_USER`, `REMOTE_HOST`,
   `REMOTE_BLOCKSDIR_MOUNT`, `LOCAL_PORT`, `REMOTE_BITCOIND_ADDR:PORT`) needs
   to be replaced with your values. Grep for `CUSTOMIZE` and uppercase
   placeholder tokens to find them.
3. `chmod 600 ~/.config/systemd/user/brk.env` — it holds secrets.
4. Make sure the SSH key you're using is already authorized on the remote
   host for passwordless login, and `mkdir -p ~/umbrel-bitcoin` (or whatever
   path you chose) exists.
5. Reload and enable:
   ```
   systemctl --user daemon-reload
   systemctl --user enable --now brk-sshfs-bitcoin.service brk-tunnel-bitcoind.service
   systemctl --user enable --now brk.service
   ```
6. Sanity-check:
   ```
   systemctl --user is-active brk-sshfs-bitcoin.service brk-tunnel-bitcoind.service brk.service
   curl http://localhost:3110/api/server/sync
   ```

### When you don't need the sidecars

If your bitcoind is reachable directly (same host, or Docker bridge, or a
pre-existing system-wide tunnel), skip the two sidecar units and delete their
entries from `brk.service`'s `After=`/`Wants=` lines. `brk.service` by itself
is enough.

### Watchdog

`brk.service` auto-installs `brk-healthcheck.service` + `brk-healthcheck.timer`
from assets bundled in the BRK binary on first start — you do not need to
install those manually. Tunables live in `~/.config/brk-healthcheck.env`; see
`crates/brk_cli/assets/brk-healthcheck.sh` for the defaults and what each
variable does.
