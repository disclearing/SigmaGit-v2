# SSH Authorized Keys Helper (Rust)

This binary is intended to be used by OpenSSH `AuthorizedKeysCommand`.

## Build

```sh
cargo build --release
```

Or via Turbo:

```sh
bun run build --filter=@sigmagit/ssh-key-helper
```

## Runtime environment

- `SIGMAGIT_API_URL` (required): API base URL, e.g. `http://127.0.0.1:3001`
- `SIGMAGIT_INTERNAL_TOKEN` (required): internal auth token (`BETTER_AUTH_SECRET`)
- `SIGMAGIT_ALLOWED_LOOKUP_USER` (optional, default `git`)
- `SIGMAGIT_SHELL_PATH` (optional, default `/opt/sigmagit/bin/sigmagit-shell`)
- `SIGMAGIT_LOOKUP_PATH` (optional, default `/api/internal/ssh/authorized-keys`)
- `SIGMAGIT_LOOKUP_TIMEOUT_SECONDS` (optional, default `3`)

## Usage

`sshd` will call this with the lookup username:

```sh
./sigmagit-ssh-key-helper git
```

The helper prints `authorized_keys` lines to stdout.
