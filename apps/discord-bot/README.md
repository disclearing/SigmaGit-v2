# Sigmagit Discord Bot

A Discord bot that integrates with Sigmagit API to provide repository management, notifications, search, and account linking functionality.

## Features

### Repository Management
- **Repository Information**: Get details about any Sigmagit repository
- **Search**: Search for repositories on Sigmagit
- **Issues**: View and manage issues with filters (open/closed)
- **Pull Requests**: List PRs with state filters (open/closed/merged)
- **Commits**: View recent commits for any repository and branch
- **Fork**: Fork repositories directly from Discord

### Notifications
- **Issue Events**: Notifications for opened, closed, edited issues
- **Pull Request Events**: Notifications for PR status changes, merges
- **Push Events**: Notifications for new commits pushed
- **Star Events**: Notifications for repository stars
- **Fork Events**: Notifications for repository forks

### Account Linking 🆔
- **Link Account**: Link Discord account to Sigmagit account
- **Link with Email**: Generate verification tokens for email-based linking
- **Check Status**: View account link status and verification state
- **Unlink Account**: Disconnect Discord from Sigmagit

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Set up application name (e.g., "Sigmagit Bot")
4. Click "Create"

### 2. Create Bot User

1. In application settings, go to "Bot" section
2. Click "Add Bot"
3. Set up bot username (e.g., "Sigmagit")
4. Enable the following privileged intents under "Privileged Gateway Intents":
   - Server Members Intent
   - Message Content Intent
5. Click "Save Changes"
6. Copy the bot token

### 3. Configure OAuth2 Scopes

1. Go to "OAuth2" > "URL Generator"
2. Select the following scopes under "bot":
   - applications.commands
3. Under "Bot Permissions", select:
   - Send Messages
   - Embed Links
   - Read Messages
   - Read Message History
4. Copy the generated OAuth2 URL

### 4. Invite Bot to Server

1. Open the OAuth2 URL in your browser
2. Select your Discord server
3. Authorize the bot

### 5. Configure Environment Variables

Add the following to your `.env` file:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN="your-bot-token-here"
DISCORD_CLIENT_ID="your-client-id-here"

# API Configuration
API_URL="http://localhost:3001"

# Discord Webhook Configuration (optional, for receiving notifications)
DISCORD_WEBHOOK_URL="http://your-domain.com/api/webhooks/discord"
WEBHOOK_SECRET="your-secret-key-here"
PUBLIC_WEBHOOK_URL="http://your-domain.com/api/webhooks/discord"
```

### 6. Install Dependencies

```bash
cd apps/discord-bot
bun install
```

### 7. Register Commands

```bash
bun run register
```

### 8. Start the Bot

```bash
bun run dev
```

## Commands

### Repository Commands

#### `/repo [owner] [repo]`
Get detailed information about a repository.

**Example:**
```
/repo owner torvalds linux
```

#### `/search [query]`
Search for repositories on Sigmagit.

**Example:**
```
/search javascript web framework
```

#### `/issues [owner] [repo] [state]`
List issues for a repository.

**Parameters:**
- `state`: (Optional) Filter by state - "open" or "closed" (default: open)

**Example:**
```
/issues owner torvalds repo linux state open
```

#### `/prs [owner] [repo] [state]`
List pull requests for a repository.

**Parameters:**
- `state`: (Optional) Filter by state - "open", "closed", or "merged" (default: open)

**Example:**
```
/prs owner torvalds repo linux state open
```

#### `/commits [owner] [repo] [branch]`
View recent commits for a repository.

**Parameters:**
- `branch`: (Optional) Branch name (default: main)

**Example:**
```
/commits owner torvalds repo linux branch main
```

#### `/fork [owner] [repo] [name]`
Fork a repository to your account.

**Parameters:**
- `name`: (Optional) Name for the fork (defaults to original name)

**Example:**
```
/fork owner torvalds repo linux name my-linux
```

### Account Linking Commands 🆔

#### `/link`
Start the account linking process. Shows button to choose linking method.

**Example:**
```
/link
```

#### `/link-email [email]`
Link your account using your Sigmagit email address.

**Parameters:**
- `email`: Your Sigmagit account email address

**Example:**
```
/link-email your-email@sigmagit.dev
```

#### `/unlink`
Unlink your Discord account from Sigmagit.

**Example:**
```
/unlink
```

#### `/link-status`
Check your Sigmagit account link status and verification state.

**Example:**
```
/link-status
```

## Account Linking Flow 🆔

### Email-Based Linking

1. **Generate Link Token**
   - Use `/link-email your-email@sigmagit.dev`
   - Bot generates a unique verification token
   - Token is stored in database with 24-hour expiry

2. **Receive Verification Link**
   - Sigmagit sends verification link to your email
   - Link includes token and Discord ID

3. **Click Verification Button**
   - Click link in email to open Discord bot
   - Bot verifies token and creates account link
   - Link marked as verified

### Unlinked Account Linking

1. **Start Linking**
   - Use `/link` command
   - Choose "Link Unlinked Account" option
   - Bot checks for existing link with your Discord ID
   - If found, prompts to verify ownership
   - Requires signing in to Sigmagit to confirm

### Verification and Security

- **Token Expiry**: Link tokens expire after 24 hours
- **One-Time Use**: Each token can only be used once
- **Secure Storage**: Discord IDs and user IDs stored securely
- **Token Generation**: Cryptographically secure random tokens
- **Email Privacy**: Email addresses never displayed publicly

### Benefits of Linking

- **Personalized Notifications**: @mentions in issues and PRs
- **Quick Actions**: Operate on repositories using Discord commands
- **Status Display**: Show your Sigmagit identity on Discord
- **Contribution Tracking**: See your commits and activity in Discord
- **Real-Time Updates**: Get notifications for your starred/watched repos

## API Integration

The bot uses the following Sigmagit API endpoints:

### Repository API
- `GET /api/repositories/:owner/:name` - Get repository info
- `GET /api/repositories/:owner/:name/issues` - List issues
- `GET /api/repositories/:owner/:name/pulls` - List pull requests
- `GET /api/repositories/:owner/:name/commits` - List commits
- `GET /api/search` - Search repositories
- `POST /api/repositories/:owner/:name/fork` - Fork repository

### Discord Linking API
- `POST /api/discord/link/generate` - Generate link token
  - Body: `{ discordId, sigmagitEmail? }`
- `POST /api/discord/link/verify` - Verify link token
  - Body: `{ token, sigmagitUserId }`
- `POST /api/discord/link/unlink` - Unlink account
  - Body: `{ discordId }`
- `GET /api/discord/link/status/:discordId` - Get link status
- `GET /api/discord/link/test` - Test webhook (debug)

### Database Schema

```sql
CREATE TABLE discord_links (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  sigmagit_user_id VARCHAR(255) NOT NULL,
  sigmagit_username VARCHAR(255) NOT NULL,
  sigmagit_email VARCHAR(255) NOT NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_verified_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE link_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);
```

## Development

### Project Structure

```
apps/discord-bot/
├── src/
│   ├── index.ts           # Main bot entry point
│   ├── config.ts         # Configuration management
│   ├── linking.ts        # Token generation and validation
│   ├── api.ts            # Sigmagit API client
│   ├── webhooks.ts       # Webhook handlers
│   └── commands/
│       ├── register.ts    # Command definitions
│       ├── handlers.ts    # Command implementations
│       └── link.ts        # Account linking commands
├── package.json
└── tsconfig.json
```

### Running in Development

```bash
cd apps/discord-bot
bun run dev
```

### Building for Production

```bash
bun install
bun run register  # Register commands once
bun start           # Start bot
```

## Error Handling

The bot includes comprehensive error handling:

- **API Errors**: Graceful error messages when API requests fail
- **Not Found**: Clear messaging when repositories/issues don't exist
- **Rate Limiting**: Automatic retry with exponential backoff
- **Link Errors**: User-friendly error messages for linking failures
- **Invalid Tokens**: Proper validation and expiry checking
- **Network Errors**: Retry logic for transient failures

## Security Considerations 🔒

1. **Token Security**: Link tokens are cryptographically generated and expire
2. **Email Privacy**: Email addresses only stored, never displayed
3. **ID Protection**: Discord IDs and user IDs stored securely in database
4. **Input Validation**: All user inputs are validated before processing
5. **Rate Limiting**: Respects Discord and API rate limits
6. **Webhook Secret**: Use `WEBHOOK_SECRET` to verify webhook payloads
7. **One-Time Tokens**: Each verification token can only be used once

## Troubleshooting

### Bot doesn't respond to commands
- Verify bot has been invited to server with correct permissions
- Check that privileged intents are enabled in Discord Developer Portal
- Ensure that bot token is correct in `.env`

### Account linking not working
- Verify `API_URL` is correct
- Check that Sigmagit API server is running
- Ensure Discord webhook URL is configured if needed
- Check database connection and migrations

### Link tokens expiring
- Token validity: 24 hours from generation
- Generate new token if previous one expired
- Complete linking within 24 hours

## Future Enhancements

- [ ] Real-time @mention notifications for linked users
- [ ] Repository-specific notification preferences
- [ ] Display contribution stats in Discord profile
- [ ] Link multiple Discord accounts to one Sigmagit account
- [ ] Quick repository actions from Discord comments
- [ ] Web UI for managing linked accounts
- [ ] Two-factor authentication for linking
- [ ] Activity feed for linked repositories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Same as parent Sigmagit project.
