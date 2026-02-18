import { config } from '../../../apps/api/src/config';

export const botConfig = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  },
  api: {
    url: process.env.API_URL || config.apiUrl || 'http://localhost:3001',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'sigmagit-webhook-secret',
    url: process.env.PUBLIC_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/discord',
  },
} as const;

export function getBotConfig() {
  if (!botConfig.discord.token) {
    throw new Error('DISCORD_BOT_TOKEN is required');
  }
  if (!botConfig.api.url) {
    throw new Error('API_URL is required');
  }
  return botConfig;
}
