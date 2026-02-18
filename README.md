# Sigmagit

A modern GitHub-like git hosting platform built with TypeScript, Bun, React, and more.

## Overview

Sigmagit is a fully-featured git hosting platform that allows you to host and manage your code with ease.

## 🚀 Quick Start

### Prerequisites
- **Bun 1.3+**: JavaScript runtime and package manager
- **Node.js 20+**: For certain dependencies
- **PostgreSQL 14+**: Database
- **Redis** (optional): For caching
- **S3-compatible storage** or local filesystem: For git objects

### Installation

```bash
# Clone repository
git clone <repository-url>
cd sigmagit

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:push

# Start API server
bun run dev:api

# Start web app (in another terminal)
bun run dev:web

# Start Discord bot (optional)
bun run dev:discord
```

## 📁 Project Structure

```
sigmagitv2/
├── apps/
│   ├── web/              # TanStack Start web application
│   ├── mobile/           # Expo React Native mobile app
│   ├── api/               # Hono API server (Bun)
│   └── discord-bot/      # Discord integration bot
├── packages/
│   ├── db/                # Drizzle ORM database schema
│   ├── lib/               # Shared utilities
│   └── hooks/             # React Query hooks
├── docs/                   # Documentation (this directory)
└── .env.example           # Environment variables template
```

## 📚 Documentation

### Getting Started
- [Quick Start](/README.md) - This file
- [API Documentation](docs/api/README.md) - API endpoints and usage
- [Web App](docs/web/README.md) - Web app development
- [Mobile App](docs/mobile/README.md) - Mobile app development
- [Discord Bot](docs/discord-bot/README.md) - Discord integration
- [Architecture](docs/architecture/README.md) - System architecture
- [Development](docs/development/README.md) - Development workflow
- [Deployment](docs/deployment/README.md) - Deployment guides
- [Features](docs/features/README.md) - Feature documentation
- [Security](docs/security/README.md) - Security best practices

### Technical Documentation
- [Git Operations](docs/features/git/README.md) - Git hosting features
- [Authentication](docs/features/auth/README.md) - User authentication
- [Storage](docs/features/storage/README.md) - Git object storage
- [Webhooks](docs/features/webhooks/README.md) - Webhook notifications
- [Account Linking](docs/features/account-linking/README.md) - Discord account linking

## 🛠 Tech Stack

### Core Technologies
- **Runtime**: Bun 1.3.5+
- **Language**: TypeScript
- **Frontend**: React 19, TanStack Start, TailwindCSS
- **Backend**: Hono, Bun
- **Mobile**: React Native, Expo
- **Database**: PostgreSQL, Drizzle ORM
- **Caching**: Redis (optional)
- **Storage**: S3-compatible or local filesystem
- **Authentication**: better-auth

### Key Libraries
- **UI**: shadcn/ui, lucide-react, tanstack-theme-kit
- **State Management**: TanStack Query, TanStack Store
- **Forms**: react-hook-form
- **Routing**: TanStack Router (file-based)
- **Git**: isomorphic-git
- **Email**: Resend or Nodemailer (SMTP)
- **Database**: Drizzle ORM, postgres

## 🔒 Configuration

### Required Environment Variables

See [Environment Variables](#environment-variables) section below) for required configuration.

### Optional Features

- **Redis**: Enable for caching and rate limiting
- **S3**: Configure for git object storage (alternatively use local)
- **SMTP**: Configure for email sending (alternatively use Resend)

## 🔗 API

The API server provides REST endpoints for all Sigmagit functionality.

- Base URL: `http://localhost:3001` (configurable)
- Documentation: [API Documentation](docs/api/README.md)

## 🌐 Web App

Modern React-based web application with file-based routing.

- Base URL: `http://localhost:3000` (configurable)
- Documentation: [Web App](docs/web/README.md)

## 📱 Mobile App

React Native mobile application built with Expo.

- Documentation: [Mobile App](docs/mobile/README.md)

## 🤖 Discord Bot

Discord integration for notifications and repository management.

- Documentation: [Discord Bot](docs/discord-bot/README.md)
- Feature Details: [Account Linking](docs/features/account-linking/README.md)

## 🔐 Architecture

System architecture and data flow.

- Documentation: [Architecture](docs/architecture/README.md)

## 🛠 Development

Development setup, workflow, and best practices.

- Documentation: [Development](docs/development/README.md)

## 🚢 Deployment

Production deployment guides for various platforms.

- Documentation: [Deployment](docs/deployment/README.md)

## 🔐 Features

Detailed feature documentation.

- [Git Operations](docs/features/git/README.md)
- [Authentication](docs/features/auth/README.md)
- [Storage](docs/features/storage/README.md)
- [Webhooks](docs/features/webhooks/README.md)
- [Account Linking](docs/features/account-linking/README.md)

## 🔒 Security

Security best practices and guidelines.

- Documentation: [Security](docs/security/README.md)

## 📞 Environment Variables

### Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sigmagit"
BETTER_AUTH_SECRET="your-super-secret-key-here"
```

### Optional

```env
# Storage
STORAGE_TYPE="s3"  # Options: s3, local
S3_ENDPOINT="https://your-s3-endpoint.com"
S3_REGION="auto"
S3_ACCESS_KEY_ID="your-access-key-id"
S3_SECRET_ACCESS_KEY="your-secret-access-key"
S3_BUCKET_NAME="your-bucket-name"
STORAGE_LOCAL_PATH="./data/repos"  # Only if STORAGE_TYPE=local

# Redis (recommended)
REDIS_URL="redis://localhost:6379"

# Email
EMAIL_PROVIDER="resend"  # Options: resend, smtp
RESEND_API_KEY="resend-api-key-here"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-username"
SMTP_PASS="your-password"
EMAIL_FROM="Sigmagit <noreply@sigmagit.dev>"

# API
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"

# Discord Bot
DISCORD_BOT_TOKEN="your-bot-token-here"
DISCORD_CLIENT_ID="your-client-id-here"
DISCORD_GUILD_ID="your-server-id-here"

# Discord Webhooks (for API to send notifications to Discord)
DISCORD_WEBHOOK_URL="https://your-discord-webhook-url.com"
WEBHOOK_SECRET="your-webhook-secret-here"
PUBLIC_WEBHOOK_URL="http://your-domain.com/api/webhooks/discord"
```

## 📚 Additional Documentation

- [API_ENHANCEMENTS.md](API_ENHANCEMENTS.md) - Recent API enhancements
- [MEMORY_LEAK_ANALYSIS.md](MEMORY_LEAK_ANALYSIS.md) - Memory leak analysis
- [DISCORD_LINKING.md](D_SCORD_LINKING.md) - Discord linking details
- [AGENTS.md](AGENTS.md) - Agent coding guidelines

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

[License](LICENSE) - See LICENSE file for details.

## 🆘 Support

For support, please open an issue on [GitHub Issues](https://github.com/sigmagit/sigmagit/issues).

---

Made with ❤️ using Bun, TypeScript, and React
