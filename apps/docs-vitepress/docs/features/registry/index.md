# Container Registry

Sigmagit provides an **OCI Distribution (Docker Registry) v2**–compatible API so you can host container images alongside your git repositories, similar to GitHub Container Registry (ghcr.io).

## Overview

- **Protocol**: [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec) v2
- **Storage**: Same backend as git (S3 or local) under the `registry/` prefix
- **Auth**: Bearer tokens issued via `/api/registry/token`; login with Sigmagit username + password or username + API key

## Usage

### Login

Use your API base URL as the registry:

```bash
docker login https://your-api.example.com
# Username: your Sigmagit username (or email)
# Password: your account password or an API key
```

For CI, use an API key as the password and your username as the identifier.

### Push

Image names use the form **owner/image**. The owner can be a **user** (username) or **organization** (org name). You must have push access to that namespace (you are the user or an org member).

```bash
docker tag myapp:latest your-api.example.com/yourusername/myapp:latest
docker push your-api.example.com/yourusername/myapp:latest
```

### Pull

```bash
docker pull your-api.example.com/yourusername/myapp:latest
```

Pull requires authentication; only users with access to the namespace (owner or org members) can pull.

### List tags

The registry supports the optional tags list endpoint:

```bash
GET /v2/<owner>/<image>/tags/list
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v2/` | Registry version check |
| GET | `/api/registry/token` | Issue Bearer token (query: `service=registry`, `scope=repository:owner/image:pull,push`) |
| GET/HEAD | `/v2/<name>/manifests/<ref>` | Pull manifest (ref = tag or digest) |
| PUT | `/v2/<name>/manifests/<ref>` | Push manifest |
| GET/HEAD | `/v2/<name>/blobs/<digest>` | Pull blob |
| POST | `/v2/<name>/blobs/uploads/` | Start blob upload |
| PUT | `/v2/<name>/blobs/uploads/<uuid>?digest=sha256:xxx` | Complete blob upload (monolithic or after PATCH) |
| PATCH | `/v2/<name>/blobs/uploads/<uuid>` | Upload chunk (resumable) |
| GET | `/v2/<name>/tags/list` | List tags |

## Storage layout

- Blobs: `registry/<owner>/<image>/blobs/<alg>/<digestHex>`
- Manifests: `registry/<owner>/<image>/manifests/<ref>` (ref = tag or digest)
- In-progress uploads: `registry/_uploads/<uuid>` (temporary)

## Permissions

- **Push**: Namespace owner (user with that username, or org members for org namespaces)
- **Pull**: Same as push (authenticated users with access to the namespace)

No additional configuration is required; the registry uses the same database and storage as the rest of Sigmagit.
