use std::{fs, os::unix::fs::PermissionsExt, path::Path, process::Command};

use anyhow::{Context, Result};
use tracing::info;

use crate::paths::{user_local_bin_path, user_systemd_user_path};

const WATCHDOG_SCRIPT: &str = include_str!("../assets/brk-healthcheck.sh");
const WATCHDOG_SERVICE: &str = include_str!("../assets/brk-healthcheck.service");
const WATCHDOG_TIMER: &str = include_str!("../assets/brk-healthcheck.timer");

pub(crate) fn install_or_update() -> Result<()> {
    fs::create_dir_all(user_local_bin_path())?;
    fs::create_dir_all(user_systemd_user_path())?;

    let script_path = user_local_bin_path().join("brk-healthcheck.sh");
    let service_path = user_systemd_user_path().join("brk-healthcheck.service");
    let timer_path = user_systemd_user_path().join("brk-healthcheck.timer");

    let mut changed = false;

    changed |= write_if_changed(&script_path, WATCHDOG_SCRIPT)?;
    set_executable(&script_path)?;
    changed |= write_if_changed(&service_path, WATCHDOG_SERVICE)?;
    changed |= write_if_changed(&timer_path, WATCHDOG_TIMER)?;

    if changed {
        run_systemctl(["--user", "daemon-reload"])?;
    }

    run_systemctl(["--user", "enable", "--quiet", "brk-healthcheck.timer"])?;

    if changed {
        run_systemctl(["--user", "restart", "--quiet", "brk-healthcheck.timer"])?;
    } else {
        run_systemctl(["--user", "start", "--quiet", "brk-healthcheck.timer"])?;
    }

    info!("BRK watchdog installed and timer ensured");

    Ok(())
}

fn write_if_changed(path: &Path, contents: &str) -> Result<bool> {
    let existing = fs::read_to_string(path).unwrap_or_default();
    if existing == contents {
        return Ok(false);
    }

    fs::write(path, contents).with_context(|| format!("failed to write {}", path.display()))?;

    Ok(true)
}

fn set_executable(path: &Path) -> Result<()> {
    let mut permissions = fs::metadata(path)?.permissions();
    let desired_mode = 0o755;

    if permissions.mode() != desired_mode {
        permissions.set_mode(desired_mode);
        fs::set_permissions(path, permissions)?;
    }

    Ok(())
}

fn run_systemctl<const N: usize>(args: [&str; N]) -> Result<()> {
    let output = Command::new("systemctl")
        .args(args)
        .output()
        .with_context(|| format!("failed to run systemctl {}", args.join(" ")))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();

    anyhow::bail!("systemctl {} failed: {stderr}", args.join(" "))
}
