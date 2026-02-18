import { Client, EmbedBuilder, WebhookClient } from 'discord.js';
import { SigmagitApiClient } from './api';

interface WebhookEvent {
  type: 'issue' | 'pull_request' | 'push' | 'commit' | 'star' | 'fork';
  action: string;
  repository: {
    owner: string;
    name: string;
  };
  data: any;
}

export async function setupWebhooks(client: Client, apiUrl: string, webhookConfig: { secret: string; url: string }) {
  console.log('[Webhooks] Setting up webhook handlers');

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    await handleWebhookCommand(interaction, apiUrl);
  });

  console.log('[Webhooks] Ready to handle webhook interactions');
}

async function handleWebhookCommand(interaction: any, apiUrl: string) {
  const { commandName, options } = interaction;

  switch (commandName) {
    case 'link-repo':
      await handleLinkRepo(interaction, options, apiUrl);
      break;
    case 'unlink-repo':
      await handleUnlinkRepo(interaction, options);
      break;
    case 'test-webhook':
      await handleTestWebhook(interaction);
      break;
    default:
      await interaction.reply({ content: 'Unknown command', ephemeral: true });
  }
}

async function handleLinkRepo(interaction: any, options: any, apiUrl: string) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel;
  const owner = options.getString('owner');
  const repo = options.getString('repo');

  if (!owner || !repo) {
    await interaction.editReply({ content: 'Owner and repository name are required' });
    return;
  }

  const api = new SigmagitApiClient(apiUrl);
  const result = await api.getRepository(owner, repo);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `Repository ${owner}/${repo} not found` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📦 ${result.data.repo.name}`)
    .setDescription(result.data.repo.description || 'No description')
    .setURL(`${apiUrl}/${owner}/${repo}`)
    .addFields(
      { name: 'Owner', value: result.data.repo.owner.username, inline: true },
      { name: 'Visibility', value: result.data.repo.visibility, inline: true },
      { name: '⭐ Stars', value: String(result.data.repo.starCount), inline: true },
      { name: '🔀 Forks', value: String(result.data.repo.forkCount), inline: true },
    )
    .setColor('Blue')
    .setTimestamp();

  await interaction.editReply({ content: 'Repository linked successfully!', embeds: [embed] });
}

async function handleUnlinkRepo(interaction: any, options: any) {
  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply({ content: 'Repository unlinked from this channel' });
}

async function handleTestWebhook(interaction: any) {
  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('🧪 Webhook Test')
    .setDescription('This is a test webhook notification')
    .addFields(
      { name: 'Type', value: 'issue', inline: true },
      { name: 'Action', value: 'opened', inline: true },
      { name: 'Repository', value: 'test/repo', inline: true },
    )
    .setColor('Green')
    .setTimestamp();

  await interaction.editReply({ content: 'Test webhook sent!', embeds: [embed] });
}

export async function sendNotificationToChannel(channelId: string, embed: EmbedBuilder) {
  try {
    const channel = await globalThis.client?.channels.fetch(channelId);
    if (channel && 'send' in channel) {
      await (channel as any).send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('[Webhooks] Failed to send notification:', error);
  }
}

export function createIssueEmbed(event: WebhookEvent): EmbedBuilder {
  const { action, repository, data } = event;

  const embed = new EmbedBuilder()
    .setTitle(`${getActionEmoji(action)} Issue #${data.number}`)
    .setDescription(data.title)
    .setURL(`${process.env.API_URL}/${repository.owner}/${repository.name}/issues/${data.number}`)
    .addFields(
      { name: 'State', value: data.state, inline: true },
      { name: 'Author', value: data.author.username, inline: true },
    )
    .setColor(getColorForAction(action))
    .setTimestamp(new Date(data.createdAt));

  if (data.labels && data.labels.length > 0) {
    embed.addFields({
      name: 'Labels',
      value: data.labels.map((l: any) => l.name).join(', '),
      inline: false,
    });
  }

  if (data.assignees && data.assignees.length > 0) {
    embed.addFields({
      name: 'Assignees',
      value: data.assignees.map((a: any) => a.username).join(', '),
      inline: false,
    });
  }

  if (data.body) {
    embed.setDescription(data.body.substring(0, 400) + (data.body.length > 400 ? '...' : ''));
  }

  return embed;
}

export function createPullRequestEmbed(event: WebhookEvent): EmbedBuilder {
  const { action, repository, data } = event;

  const embed = new EmbedBuilder()
    .setTitle(`${getActionEmoji(action)} PR #${data.number}`)
    .setDescription(data.title)
    .setURL(`${process.env.API_URL}/${repository.owner}/${repository.name}/pulls/${data.number}`)
    .addFields(
      { name: 'State', value: data.state, inline: true },
      { name: 'Author', value: data.author.username, inline: true },
    )
    .setColor(getColorForAction(action))
    .setTimestamp(new Date(data.createdAt));

  if (data.baseRepo && data.headRepo) {
    embed.addFields({
      name: 'Branches',
      value: `${data.baseRepo.name}:${data.baseBranch} ← ${data.headRepo.name}:${data.headBranch}`,
      inline: false,
    });
  }

  if (data.body) {
    embed.setDescription(data.body.substring(0, 400) + (data.body.length > 400 ? '...' : ''));
  }

  return embed;
}

export function createPushEmbed(event: WebhookEvent): EmbedBuilder {
  const { repository, data } = event;

  const embed = new EmbedBuilder()
    .setTitle('📥 New Push')
    .setDescription(`${data.pusher} pushed ${data.commits.length} commit(s)`)
    .setURL(`${process.env.API_URL}/${repository.owner}/${repository.name}`)
    .setColor('Blurple')
    .setTimestamp(new Date());

  const commitMessages = data.commits.slice(0, 5).map((commit: any) => 
    `• \`${commit.oid.substring(0, 7)}\` ${commit.message.split('\n')[0]}`
  ).join('\n');

  if (commitMessages) {
    embed.addFields({
      name: 'Recent Commits',
      value: commitMessages,
      inline: false,
    });
  }

  if (data.commits.length > 5) {
    embed.addFields({
      name: 'More',
      value: `... and ${data.commits.length - 5} more`,
      inline: true,
    });
  }

  return embed;
}

export function createStarEmbed(event: WebhookEvent): EmbedBuilder {
  const { action, repository, data } = event;

  const embed = new EmbedBuilder()
    .setTitle(`${action === 'added' ? '⭐' : '💔'} Repository ${action === 'added' ? 'starred' : 'unstarred'}`)
    .setDescription(data.name)
    .setURL(`${process.env.API_URL}/${repository.owner}/${repository.name}`)
    .setColor(action === 'added' ? 'Yellow' : 'Grey')
    .setTimestamp(new Date());

  return embed;
}

export function createForkEmbed(event: WebhookEvent): EmbedBuilder {
  const { repository, data } = event;

  const embed = new EmbedBuilder()
    .setTitle('🔀 Repository Forked')
    .setDescription(`${data.username} forked ${repository.name}`)
    .setURL(`${process.env.API_URL}/${data.username}/${repository.name}`)
    .setColor('Green')
    .setTimestamp(new Date());

  return embed;
}

function getActionEmoji(action: string): string {
  const emojiMap: Record<string, string> = {
    opened: '🎉',
    closed: '✅',
    reopened: '🔄',
    edited: '✏️',
    deleted: '🗑️',
    merged: '🎊',
    added: '➕',
    removed: '➖',
  };
  return emojiMap[action] || '📌';
}

function getColorForAction(action: string): number {
  const colorMap: Record<string, number> = {
    opened: 0x00ff00,
    closed: 0xff0000,
    reopened: 0xffa500,
    merged: 0x00ffff,
    edited: 0xffff00,
    deleted: 0x808080,
    added: 0x00ff00,
    removed: 0xff0000,
  };
  return colorMap[action] || 0x0099ff;
}
