import { REST, Routes } from 'discord.js';
import { getBotConfig } from '../config';

const { discord, api } = getBotConfig();

interface Command {
  name: string;
  description: string;
  options?: CommandOption[];
}

interface CommandOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
}

const commands: Command[] = [
  {
    name: 'repo',
    description: 'Get information about a Sigmagit repository',
    options: [
      {
        name: 'owner',
        description: 'Repository owner username',
        type: 3,
        required: true,
      },
      {
        name: 'repo',
        description: 'Repository name',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'search',
    description: 'Search for repositories on Sigmagit',
    options: [
      {
        name: 'query',
        description: 'Search query',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'issues',
    description: 'List issues for a repository',
    options: [
      {
        name: 'owner',
        description: 'Repository owner username',
        type: 3,
        required: true,
      },
      {
        name: 'repo',
        description: 'Repository name',
        type: 3,
        required: true,
      },
      {
        name: 'state',
        description: 'Filter by issue state (open/closed)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'prs',
    description: 'List pull requests for a repository',
    options: [
      {
        name: 'owner',
        description: 'Repository owner username',
        type: 3,
        required: true,
      },
      {
        name: 'repo',
        description: 'Repository name',
        type: 3,
        required: true,
      },
      {
        name: 'state',
        description: 'Filter by PR state (open/closed/merged)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'commits',
    description: 'View recent commits for a repository',
    options: [
      {
        name: 'owner',
        description: 'Repository owner username',
        type: 3,
        required: true,
      },
      {
        name: 'repo',
        description: 'Repository name',
        type: 3,
        required: true,
      },
      {
        name: 'branch',
        description: 'Branch name (default: main)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'fork',
    description: 'Fork a repository',
    options: [
      {
        name: 'owner',
        description: 'Repository owner username',
        type: 3,
        required: true,
      },
      {
        name: 'repo',
        description: 'Repository name',
        type: 3,
        required: true,
      },
      {
        name: 'name',
        description: 'Name for the fork (optional)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'link',
    description: 'Link your Discord account to Sigmagit',
    options: [],
  },
  {
    name: 'link-email',
    description: 'Link your account with email',
    options: [
      {
        name: 'email',
        description: 'Your Sigmagit email address',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'unlink',
    description: 'Unlink your Discord account from Sigmagit',
    options: [],
  },
  {
    name: 'link-status',
    description: 'Check your Sigmagit account link status',
    options: [],
  },
  // Ticket Management
  {
    name: 'ticket',
    description: 'Create a support ticket',
    options: [
      {
        name: 'category',
        description: 'Ticket category',
        type: 3,
        required: false,
      },
      {
        name: 'description',
        description: 'Description of your issue',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'ticket-close',
    description: 'Close a ticket (Staff only)',
    options: [
      {
        name: 'reason',
        description: 'Reason for closing',
        type: 3,
        required: false,
      },
    ],
  },
  // Moderation Commands
  {
    name: 'kick',
    description: 'Kick a member from the server (Staff only)',
    options: [
      {
        name: 'user',
        description: 'User to kick',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for kick',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'ban',
    description: 'Ban a member from the server (Staff only)',
    options: [
      {
        name: 'user',
        description: 'User to ban',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for ban',
        type: 3,
        required: false,
      },
      {
        name: 'delete_days',
        description: 'Days of messages to delete (0-7)',
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: 'timeout',
    description: 'Timeout a member (Staff only)',
    options: [
      {
        name: 'user',
        description: 'User to timeout',
        type: 6,
        required: true,
      },
      {
        name: 'duration',
        description: 'Duration in minutes',
        type: 4,
        required: false,
      },
      {
        name: 'reason',
        description: 'Reason for timeout',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'warn',
    description: 'Warn a member (Staff only)',
    options: [
      {
        name: 'user',
        description: 'User to warn',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for warning',
        type: 3,
        required: false,
      },
    ],
  },
  // Server Management
  {
    name: 'purge',
    description: 'Delete multiple messages (Staff only)',
    options: [
      {
        name: 'amount',
        description: 'Number of messages to delete (1-100)',
        type: 4,
        required: false,
      },
      {
        name: 'user',
        description: 'User to purge messages from',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'slowmode',
    description: 'Set slowmode for a channel (Staff only)',
    options: [
      {
        name: 'seconds',
        description: 'Slowmode duration in seconds (0-21600)',
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: 'lock',
    description: 'Lock a channel (Staff only)',
    options: [
      {
        name: 'channel',
        description: 'Channel to lock',
        type: 7,
        required: false,
      },
    ],
  },
  {
    name: 'unlock',
    description: 'Unlock a channel (Staff only)',
    options: [
      {
        name: 'channel',
        description: 'Channel to unlock',
        type: 7,
        required: false,
      },
    ],
  },
  // Info Commands
  {
    name: 'userinfo',
    description: 'Get information about a user',
    options: [
      {
        name: 'user',
        description: 'User to get info about',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'serverinfo',
    description: 'Get information about the server',
    options: [],
  },
];

export async function setupCommands(client: any) {
  console.log('[Commands] Registering slash commands...');

  try {
    const rest = new REST({ version: '10' }).setToken(discord.token);

    await rest.put(
      Routes.applicationCommands(discord.clientId),
      { body: commands }
    );

    console.log(`[Commands] Successfully registered ${commands.length} commands`);
  } catch (error) {
    console.error('[Commands] Failed to register commands:', error);
    throw error;
  }
}

export async function registerCommands() {
  console.log('[Commands] Registering commands globally...');

  const { discord } = getBotConfig();

  try {
    const rest = new REST({ version: '10' }).setToken(discord.token);

    await rest.put(
      Routes.applicationCommands(discord.clientId),
      { body: commands }
    );

    console.log(`[Commands] Successfully registered ${commands.length} commands globally`);
  } catch (error) {
    console.error('[Commands] Failed to register commands:', error);
    throw error;
  }
}

export { commands };
