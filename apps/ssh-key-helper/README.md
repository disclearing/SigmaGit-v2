# SSH Authorized Keys Helper (Rust)

This binary is intended to be used by OpenSSH `AuthorizedKeysCommand`. It handles **only** the key lookup and authorization - it queries the SigmaGit API to retrieve authorized SSH keys and formats them for OpenSSH.

**Important:** This helper only handles key lookup and emits restricted, non-interactive `authorized_keys` entries.

## SSH Setup Guide

### Step 1: Generate SSH Key Pair

If you don't already have an SSH key pair, generate one:

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Or use RSA (if ed25519 is not supported):

```sh
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

- Press Enter to accept the default file location (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`)
- Enter a passphrase (recommended) or leave empty
- Your public key will be saved to `~/.ssh/id_ed25519.pub` (or `~/.ssh/id_rsa.pub`)

### Step 2: Display Your Public Key

View your public key to copy it:

```sh
cat ~/.ssh/id_ed25519.pub
```

Or for RSA:

```sh
cat ~/.ssh/id_rsa.pub
```

### Step 3: Add Public Key to SigmaGit

1. Copy the entire public key output from Step 2
2. Log into your SigmaGit account
3. Navigate to your account settings → SSH Keys
4. Click "Add SSH Key"
5. Paste your public key and save

### Step 4: Build the SSH Key Helper

Build the helper binary:

```sh
cargo build --release
```

Or via Turbo:

```sh
bun run build --filter=@sigmagit/ssh-key-helper
```

The binary will be located at `target/release/sigmagit-ssh-key-helper`

### Step 5: Install the Helper Binary

Copy the binary to a system location (requires root):

```sh
sudo cp target/release/sigmagit-ssh-key-helper /usr/local/bin/sigmagit-ssh-key-helper
sudo chmod +x /usr/local/bin/sigmagit-ssh-key-helper
```

### Step 6: Create the Git User (if needed)

Create a dedicated `git` user for SSH access. Use a non-interactive shell:

```sh
sudo useradd -r -m -s /usr/sbin/nologin git
```

Or use `/bin/false`:

```sh
sudo useradd -r -m -s /bin/false git
```

Or use an existing user and set the shell:

```sh
sudo usermod -s /usr/sbin/nologin git
```

**Note:** The helper does not rely on a forced shell command path.

### Step 7: Configure OpenSSH Server

Edit the SSH daemon configuration:

```sh
sudo nano /etc/ssh/sshd_config
```

Add or modify these settings:

```
# Use the helper for authorized keys
AuthorizedKeysCommand /usr/local/bin/sigmagit-ssh-key-helper
AuthorizedKeysCommandUser git

# Optional: Disable password authentication (use keys only)
PasswordAuthentication no
PubkeyAuthentication yes
```

### Step 8: Set Environment Variables

Create a systemd service override or add to `/etc/environment`:

```sh
sudo nano /etc/systemd/system/sshd.service.d/override.conf
```

Add:

```ini
[Service]
Environment="SIGMAGIT_API_URL=http://127.0.0.1:3001"
Environment="SIGMAGIT_INTERNAL_TOKEN=your_better_auth_secret_here"
Environment="SIGMAGIT_ALLOWED_LOOKUP_USER=git"
Environment="SIGMAGIT_LOOKUP_PATH=/api/internal/ssh/authorized-keys"
Environment="SIGMAGIT_LOOKUP_TIMEOUT_SECONDS=3"
```

Reload systemd:

```sh
sudo systemctl daemon-reload
```

### Step 9: Restart SSH Service

Restart the SSH daemon to apply changes:

```sh
sudo systemctl restart sshd
```

Or on some systems:

```sh
sudo systemctl restart ssh
```

### Step 10: Test SSH Connection

Test the connection from your local machine:

```sh
ssh -T git@your-server-ip
```

Or test with verbose output for debugging:

```sh
ssh -vT git@your-server-ip
```

You should see a successful connection message or be prompted for repository access.

### Troubleshooting

**Check SSH daemon logs:**

```sh
sudo journalctl -u sshd -f
```

**Test the helper manually:**

```sh
sudo -u git /usr/local/bin/sigmagit-ssh-key-helper git
```

This should output authorized_keys lines.

**Verify environment variables:**

```sh
sudo systemctl show sshd | grep Environment
```

**Check file permissions:**

```sh
ls -la /usr/local/bin/sigmagit-ssh-key-helper
```

Should show executable permissions (`-rwxr-xr-x`).

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
- `SIGMAGIT_ALLOWED_LOOKUP_USER` (optional, default `git`): Only respond to key lookups for this username
- `SIGMAGIT_LOOKUP_PATH` (optional, default `/api/internal/ssh/authorized-keys`): API endpoint path for key lookup
- `SIGMAGIT_LOOKUP_TIMEOUT_SECONDS` (optional, default `3`): Timeout for API requests

## Usage

`sshd` will call this with the lookup username:

```sh
./sigmagit-ssh-key-helper git
```

The helper prints `authorized_keys` lines to stdout.
