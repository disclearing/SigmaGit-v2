import { Client, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import { getBotConfig } from './config';
import { setupWebhooks } from './webhooks';
import { setupCommands } from './commands/register';
import { SigmagitApiClient } from './api';
import {
  handleRepoCommand,
  handleSearchCommand,
  handleIssuesCommand,
  handlePRsCommand,
  handleCommitsCommand,
  handleForkCommand,
} from './commands/handlers';
import {
  handleLinkCommand,
  handleLinkEmailCommand,
  handleUnlinkCommand,
  handleStatusCommand,
  handleLinkButton,
} from './commands/link';
import {
  handleTicketCreate,
  handleTicketClose,
  handleTicketButton,
  handleKick,
  handleBan,
  handleTimeout,
  handleWarn,
  handlePurge,
  handleSlowmode,
  handleLockChannel,
  handleUnlockChannel,
  handleUserInfo,
  handleServerInfo,
} from './commands/management';

const { discord, api, webhook } = getBotConfig();

type GlobalClient = Client & { user: { tag: string } };

const client: GlobalClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
  ],
});

client.once('ready', async () => {
  console.log(`[Bot] Logged in as ${client.user!.tag}`);

  try {
    await setupCommands(client);
    console.log('[Bot] Commands registered successfully');
  } catch (error) {
    console.error('[Bot] Failed to register commands:', error);
  }

  try {
    await setupWebhooks(client, api.url, webhook);
    console.log('[Bot] Webhooks configured successfully');
  } catch (error) {
    console.error('[Bot] Failed to setup webhooks:', error);
  }

  console.log('[Bot] Bot is ready');
});

client.on('interactionCreate', async (interaction) => {
  const apiClient = new SigmagitApiClient(api.url);

  try {
    if (interaction.isChatInputCommand()) {
      await interaction.deferReply();

      switch (interaction.commandName) {
        case 'repo':
          await handleRepoCommand(interaction, apiClient);
          break;
        case 'search':
          await handleSearchCommand(interaction, apiClient);
          break;
        case 'issues':
          await handleIssuesCommand(interaction, apiClient);
          break;
        case 'prs':
          await handlePRsCommand(interaction, apiClient);
          break;
        case 'commits':
          await handleCommitsCommand(interaction, apiClient);
          break;
        case 'fork':
          await handleForkCommand(interaction, apiClient);
          break;
        case 'link':
          await handleLinkCommand(interaction, apiClient);
          break;
        case 'link-email':
          await handleLinkEmailCommand(interaction, apiClient);
          break;
        case 'unlink':
          await handleUnlinkCommand(interaction, apiClient);
          break;
        case 'link-status':
          await handleStatusCommand(interaction, apiClient);
          break;
        // Ticket Management
        case 'ticket':
          await handleTicketCreate(interaction);
          break;
        case 'ticket-close':
          await handleTicketClose(interaction);
          break;
        // Moderation
        case 'kick':
          await handleKick(interaction);
          break;
        case 'ban':
          await handleBan(interaction);
          break;
        case 'timeout':
          await handleTimeout(interaction);
          break;
        case 'warn':
          await handleWarn(interaction);
          break;
        // Server Management
        case 'purge':
          await handlePurge(interaction);
          break;
        case 'slowmode':
          await handleSlowmode(interaction);
          break;
        case 'lock':
          await handleLockChannel(interaction);
          break;
        case 'unlock':
          await handleUnlockChannel(interaction);
          break;
        // Info Commands
        case 'userinfo':
          await handleUserInfo(interaction);
          break;
        case 'serverinfo':
          await handleServerInfo(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown command' });
      }
    } else if (interaction.isButton()) {
      const [action, type] = interaction.customId.split('_');
      
      // Handle ticket buttons
      if (action === 'ticket') {
        await handleTicketButton(interaction);
        return;
      }
      
      // Handle link buttons
      await handleLinkButton(interaction, apiClient, (action || 'start') as 'start' | 'email' | 'verify');
    }
  } catch (error) {
    console.error('[Bot] Command execution error:', error);
    if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isMessageComponent()) {
      await interaction.editReply({ content: '❌ An error occurred while executing this command' }).catch(() => {});
    } else if (interaction.isRepliable()) {
      await interaction.reply({ content: '❌ An error occurred while executing this command', ephemeral: true }).catch(() => {});
    }
  }
});

client.on('error', (error) => {
  console.error('[Bot] Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Bot] Unhandled promise rejection:', error);
});

process.on('SIGINT', async () => {
  console.log('[Bot] Received SIGINT, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

await client.login(discord.token);
