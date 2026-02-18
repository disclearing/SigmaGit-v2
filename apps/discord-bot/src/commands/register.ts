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
