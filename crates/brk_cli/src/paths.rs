use std::path::PathBuf;

pub fn home_path() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap())
}

pub fn dot_brk_path() -> PathBuf {
    home_path().join(".brk")
}

pub fn dot_brk_log_path() -> PathBuf {
    dot_brk_path().join("logs")
}

pub fn default_brk_path() -> PathBuf {
    dot_brk_path()
}

pub fn user_local_bin_path() -> PathBuf {
    home_path().join(".local").join("bin")
}

pub fn user_systemd_user_path() -> PathBuf {
    home_path().join(".config").join("systemd").join("user")
}

pub fn fix_user_path(path: &str) -> PathBuf {
    if let Some(rest) = path.strip_prefix("~/").or(path.strip_prefix("$HOME/"))
        && let Ok(home) = std::env::var("HOME")
    {
        return PathBuf::from(home).join(rest);
    }
    PathBuf::from(path)
}
