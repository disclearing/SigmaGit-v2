use serde::Deserialize;
use std::env;
use std::io::{self, Write};
use std::process;
use std::time::Duration;

const DEFAULT_LOOKUP_PATH: &str = "/api/internal/ssh/authorized-keys";
const DEFAULT_ALLOWED_USER: &str = "git";
const DEFAULT_SHELL_PATH: &str = "/opt/sigmagit/bin/sigmagit-shell";

#[derive(Debug, Deserialize)]
struct LookupResponse {
    keys: Vec<SshKeyRecord>,
}

#[derive(Debug, Deserialize)]
struct SshKeyRecord {
    #[serde(rename = "keyId")]
    key_id: String,
    #[serde(rename = "userId")]
    user_id: String,
    #[serde(rename = "publicKey")]
    public_key: String,
}

fn required_env(name: &str) -> String {
    match env::var(name) {
        Ok(value) if !value.trim().is_empty() => value,
        _ => {
            eprintln!("{name} is required");
            process::exit(1);
        }
    }
}

fn sanitize_tag(value: &str) -> Option<String> {
    if value.is_empty() {
        return None;
    }
    if value
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        Some(value.to_string())
    } else {
        None
    }
}

fn join_url(base: &str, path: &str) -> String {
    let base_trimmed = base.trim_end_matches('/');
    let path_prefixed = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    format!("{base_trimmed}{path_prefixed}")
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let lookup_user = args.get(1).cloned().unwrap_or_default();
    let allowed_user =
        env::var("SIGMAGIT_ALLOWED_LOOKUP_USER").unwrap_or_else(|_| DEFAULT_ALLOWED_USER.to_string());

    // sshd can call this helper for any user. Only respond for the configured git user.
    if lookup_user != allowed_user {
        process::exit(0);
    }

    let api_url = required_env("SIGMAGIT_API_URL");
    let internal_token = required_env("SIGMAGIT_INTERNAL_TOKEN");
    let shell_path = env::var("SIGMAGIT_SHELL_PATH").unwrap_or_else(|_| DEFAULT_SHELL_PATH.to_string());
    let lookup_path = env::var("SIGMAGIT_LOOKUP_PATH").unwrap_or_else(|_| DEFAULT_LOOKUP_PATH.to_string());
    let timeout_secs = env::var("SIGMAGIT_LOOKUP_TIMEOUT_SECONDS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(3);

    let lookup_url = format!(
        "{}?username={}",
        join_url(&api_url, &lookup_path),
        allowed_user
    );

    let agent = ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(timeout_secs))
        .timeout_read(Duration::from_secs(timeout_secs))
        .timeout_write(Duration::from_secs(timeout_secs))
        .build();

    let response = match agent
        .get(&lookup_url)
        .set("x-internal-auth", &internal_token)
        .call()
    {
        Ok(resp) => resp,
        Err(err) => {
            eprintln!("lookup request failed: {err}");
            process::exit(1);
        }
    };

    let lookup: LookupResponse = match response.into_json() {
        Ok(body) => body,
        Err(err) => {
            eprintln!("invalid lookup response: {err}");
            process::exit(1);
        }
    };

    let mut out = io::BufWriter::new(io::stdout());

    for key in lookup.keys {
        let safe_key_id = match sanitize_tag(&key.key_id) {
            Some(value) => value,
            None => {
                eprintln!("skipping key with invalid key_id");
                continue;
            }
        };

        let safe_user_id = match sanitize_tag(&key.user_id) {
            Some(value) => value,
            None => {
                eprintln!("skipping key with invalid user_id");
                continue;
            }
        };

        let forced_command =
            format!("{shell_path} --key-id={safe_key_id} --user-id={safe_user_id}");
        let line = format!(
            "command=\"{forced_command}\",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding {}\n",
            key.public_key
        );

        if let Err(err) = out.write_all(line.as_bytes()) {
            eprintln!("failed to write output: {err}");
            process::exit(1);
        }
    }

    if let Err(err) = out.flush() {
        eprintln!("failed to flush output: {err}");
        process::exit(1);
    }
}
