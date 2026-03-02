# Account Linking

Sigmagit supports linking user accounts to Discord, enabling notifications and bot integration.

## Overview

The account linking system provides:

- Secure Discord account linking via email verification
- Token-based verification process
- Support for linking/unlinking accounts
- Verification state tracking
- Integration with Discord bot commands

## Database Schema

### Discord Links Table

```typescript
// packages/db/src/discord.ts
export const discordLinks = pgTable('discord_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  verified: boolean('verified').notNull().default(false),
  linkedAt: timestamp('linked_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Link Tokens Table

```typescript
export const linkTokens = pgTable('link_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  discordId: text('discord_id').notNull(),
  sigmagitEmail: text('sigmagit_email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## API Endpoints

### Generate Link Token

Generate a verification token for Discord account linking:

```typescript
// apps/api/src/routes/discord.ts
app.post('/api/discord/link/generate', async (c) => {
  const { discordId, sigmagitEmail } = await c.req.json();

  const token = await generateLinkToken(discordId, sigmagitEmail);

  await sendLinkEmail(sigmagitEmail, token);

  return c.json({ token: token.substring(0, 16) + '...' });
});
```

### Verify Link Token

Verify a link token and complete the account linking:

```typescript
app.post('/api/discord/link/verify', async (c) => {
  const { token, sigmagitUserId } = await c.req.json();

  const result = await verifyAndLinkAccount(token, sigmagitUserId);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ user: result.user });
});
```

### Unlink Account

Remove Discord account linking:

```typescript
app.post('/api/discord/link/unlink', async (c) => {
  const { discordId } = await c.req.json();

  await db
    .delete(discordLinks)
    .where(eq(discordLinks.discordId, discordId));

  return c.json({ success: true });
});
```

### Get Link Status

Check if a Discord account is linked:

```typescript
app.get('/api/discord/link/status/:discordId', async (c) => {
  const discordId = c.req.param('discordId');

  const link = await db
    .select()
    .from(discordLinks)
    .where(eq(discordLinks.discordId, discordId))
    .leftJoin(users, eq(discordLinks.userId, users.id))
    .get();

  if (!link) {
    return c.json({ linked: false });
  }

  return c.json({
    linked: true,
    verified: link.discord_links.verified,
    user: link.users,
    linkedAt: link.discord_links.linkedAt,
  });
});
```

## Token Generation and Validation

### Generate Link Token

```typescript
// apps/api/src/utils/linking.ts
import crypto from 'crypto';

export async function generateLinkToken(
  discordId: string,
  sigmagitEmail: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(linkTokens).values({
    token,
    discordId,
    sigmagitEmail,
    expiresAt,
  });

  return token;
}
```

### Validate Link Token

```typescript
export async function validateLinkToken(
  token: string
): Promise<{ valid: boolean; tokenData?: LinkToken }> {
  const linkToken = await db
    .select()
    .from(linkTokens)
    .where(eq(linkTokens.token, token))
    .get();

  if (!linkToken) {
    return { valid: false };
  }

  if (linkToken.used) {
    return { valid: false };
  }

  if (new Date(linkToken.expiresAt) < new Date()) {
    return { valid: false };
  }

  return { valid: true, tokenData: linkToken };
}
```

### Link Account

```typescript
export async function linkAccount(
  discordId: string,
  userId: string
): Promise<void> {
  const existing = await db
    .select()
    .from(discordLinks)
    .where(eq(discordLinks.discordId, discordId))
    .get();

  if (existing) {
    await db
      .update(discordLinks)
      .set({
        userId,
        verified: true,
        updatedAt: new Date(),
      })
      .where(eq(discordLinks.discordId, discordId));
  } else {
    await db.insert(discordLinks).values({
      discordId,
      userId,
      verified: true,
    });
  }
}
```

## Email Verification

### Send Link Email

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.WEB_URL}/verify-discord?token=${token}`;

  await resend.emails.send({
    from: 'Sigmagit <noreply@sigmagit.dev>',
    to: email,
    subject: 'Link your Discord account',
    html: `
      <h1>Link your Discord account</h1>
      <p>Click the link below to link your Discord account to Sigmagit:</p>
      <a href="${verificationUrl}">Link Account</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
```

### Complete Linking Flow

```typescript
export async function verifyAndLinkAccount(
  token: string,
  sigmagitUserId: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const { valid, tokenData } = await validateLinkToken(token);

  if (!valid || !tokenData) {
    return { success: false, error: 'Invalid or expired token' };
  }

  // Mark token as used
  await db
    .update(linkTokens)
    .set({ used: true })
    .where(eq(linkTokens.token, token));

  // Link the account
  await linkAccount(tokenData.discordId, sigmagitUserId);

  // Get user data
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, sigmagitUserId))
    .get();

  return { success: true, user };
}
```

## Discord Bot Integration

### Link Command

```typescript
// apps/discord-bot/src/commands/link.ts
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export async function handleLinkCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('link_start')
      .setLabel('🔗 Link Account')
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setTitle('🔗 Account Linking')
    .setDescription('Connect your Sigmagit account to enable notifications and personalized features.')
    .addFields(
      { name: 'What this enables:', value: '• Discord notifications for issues, PRs, and more\n• Personalized commands and mentions\n• Repository activity tracking' },
      { name: 'Privacy', value: '• Your Discord ID is linked securely\n• You can unlink at any time\n• Email is never shared' },
    )
    .setColor('Blue')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed], components: [button] });
}
```

### Link Email Command

```typescript
export async function handleLinkEmailCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const email = interaction.options.getString('email');

  if (!email || !email.includes('@')) {
    await interaction.editReply({ content: '❌ Please provide a valid email address' });
    return;
  }

  const discordId = interaction.user.id;

  const response = await fetch(`${api['baseUrl']}/api/discord/link/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discordId, sigmagitEmail: email }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    await interaction.editReply({ content: `❌ ${data.error || 'Failed to generate link token'}` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Link Token Generated')
    .setDescription(`A verification link has been generated for **${email}**`)
    .addFields(
      { name: 'Status', value: '🔗 Pending Verification', inline: true },
      { name: 'Token', value: `📋 ${data.token.substring(0, 16)}...`, inline: true },
    )
    .setColor('Green')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
```

### Unlink Command

```typescript
export async function handleUnlinkCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  const response = await fetch(`${api['baseUrl']}/api/discord/link/unlink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discordId }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    await interaction.editReply({ content: `❌ ${data.error || 'Failed to unlink account'}` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🔓 Account Unlinked')
    .setDescription('Your Discord account has been unlinked from Sigmagit.')
    .setColor('Orange')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
```

### Link Status Command

```typescript
export async function handleStatusCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const discordId = interaction.user.id;

  const response = await fetch(`${api['baseUrl']}/api/discord/link/status/${discordId}`);

  const data = await response.json();

  if (!response.ok) {
    await interaction.editReply({ content: '❌ Failed to check link status' });
    return;
  }

  if (!data.linked) {
    const embed = new EmbedBuilder()
      .setTitle('🔗 Not Linked')
      .setDescription('Your Discord account is not linked to Sigmagit.')
      .addFields(
        { name: 'Action', value: 'Use /link to connect your account', inline: false },
      )
      .setColor('Red')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('✅ Account Link Status')
      .setDescription('Your Discord account is linked to Sigmagit.')
      .addFields(
        { name: 'Sigmagit User', value: data.user?.username || 'Unknown', inline: true },
        { name: 'Verified', value: data.verified ? '✅ Yes' : '⏳ Pending', inline: true },
        { name: 'Linked Since', value: new Date(data.linkedAt).toLocaleDateString(), inline: true },
      )
      .setColor(data.verified ? 'Green' : 'Yellow')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
```

## Webhook Notifications

After linking, users can receive Discord notifications:

```typescript
export async function sendDiscordNotification(
  userId: string,
  event: WebhookEvent
): Promise<void> {
  const link = await db
    .select()
    .from(discordLinks)
    .where(eq(discordLinks.userId, userId))
    .get();

  if (!link || !link.verified) {
    return;
  }

  const webhook = await db
    .select()
    .from(discordWebhooks)
    .where(eq(discordWebhooks.userId, userId))
    .get();

  if (!webhook) {
    return;
  }

  const embed = createNotificationEmbed(event);

  await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
```

## Security Considerations

### Token Security

- Use cryptographically secure random tokens (32 bytes)
- Set token expiry (24 hours recommended)
- Mark tokens as used after verification
- One-time use only

### Email Security

- Verify email ownership before linking
- Use secure email sending (Resend or SMTP)
- Don't expose full tokens in logs
- Rate limit token generation

### Privacy

- Store minimal Discord data (only ID)
- Allow users to unlink at any time
- Don't share email with Discord
- Clear data on unlink

## Troubleshooting

### Link Token Not Working

- Check token hasn't expired (24 hours)
- Verify token hasn't been used already
- Check Discord ID matches
- Verify email is correct

### Email Not Received

- Check spam folder
- Verify SMTP settings
- Confirm email address is correct
- Check Resend API key

### Account Already Linked

- User must unlink first
- Check existing link in database
- Contact support if needed
