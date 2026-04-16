#!/usr/bin/env bash
# Remount the Umbrel Bitcoin data over sshfs with the hardened option set.
#
# Why these options?
#   kernel_cache      - let the kernel page cache keep file data between reads
#   auto_cache        - invalidate caches based on file mtime (safer than no cache)
#   dir_cache=yes     - cache directory listings
#   entry_timeout     - stretch negative/positive dentry caching
#   attr_timeout      - cache getattr results
#   compression=no    - disable SSH compression (block files are already incompressible
#                       and compression causes CPU stalls with large sequential reads)
#   reconnect         - auto-reconnect on SSH disconnect
#   ServerAliveInterval / ServerAliveCountMax - catch dead connections quickly
#
# Together these significantly reduce the number of RPC-adjacent reads that trigger
# truncated responses / spurious "reorgs" when the upstream is flaky.

set -euo pipefail

MOUNTPOINT="/home/nicolas/umbrel-bitcoin"
REMOTE="umbrel@100.113.243.86:/home/umbrel/umbrel/app-data/bitcoin/data/bitcoin"

OPTS="ro,reconnect,ServerAliveInterval=15,ServerAliveCountMax=3"
OPTS+=",kernel_cache,auto_cache,dir_cache=yes"
OPTS+=",entry_timeout=60,attr_timeout=60,dcache_timeout=60"
OPTS+=",compression=no"

if mountpoint -q "$MOUNTPOINT"; then
    echo "Unmounting $MOUNTPOINT ..."
    # -z: lazy unmount so in-flight reads finish on the old handle, but new
    # lookups resolve against the new mount once we re-sshfs below.
    fusermount3 -u -z "$MOUNTPOINT" 2>/dev/null || fusermount -u -z "$MOUNTPOINT"
    # Give fuse a moment to tear the old connection down.
    sleep 1
fi

echo "Mounting $MOUNTPOINT with: $OPTS"
sshfs "$REMOTE" "$MOUNTPOINT" -o "$OPTS"

echo "Verifying mount..."
mount | grep " $MOUNTPOINT " || { echo "Mount not visible"; exit 1; }
ls "$MOUNTPOINT" >/dev/null

echo "Done."
