import { EmbedBuilder } from 'discord.js';
import { SigmagitApiClient } from '../api';

const stateColors: Record<string, number> = {
  open: 0x00ff00,
  closed: 0xff0000,
  merged: 0x00ffff,
  public: 0x00ff00,
  private: 0xff0000,
};

const visibilityColors: Record<string, number> = {
  public: 0x00ff00,
  private: 0xff0000,
};

export async function handleRepoCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');

  const result = await api.getRepository(owner, repo);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `❌ Repository not found: ${owner}/${repo}` });
    return;
  }

  const { repo: repository, isOwner } = result.data;

  const embed = new EmbedBuilder()
    .setTitle(`📦 ${repository.name}`)
    .setDescription(repository.description || 'No description')
    .setURL(`${api['baseUrl']}/${owner}/${repo}`)
    .setThumbnail(repository.owner.avatarUrl || null)
    .addFields(
      { name: 'Owner', value: repository.owner.username, inline: true },
      { name: 'Visibility', value: repository.visibility, inline: true },
      { name: 'Default Branch', value: repository.defaultBranch, inline: true },
      { name: '⭐ Stars', value: String(repository.starCount), inline: true },
      { name: '🔀 Forks', value: String(repository.forkCount), inline: true },
    )
    .setColor(stateColors[repository.visibility])
    .setFooter({ text: `Created ${new Date(repository.createdAt).toLocaleDateString()}` })
    .setTimestamp();

  if (isOwner) {
    embed.addFields({ name: '👑', value: 'You are the owner', inline: false });
  }

  await interaction.editReply({ embeds: [embed] });
}

export async function handleSearchCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const query = interaction.options.getString('query');
  const result = await api.searchRepositories(query, 10, 0);

  if (result.error || !result.data) {
    await interaction.editReply({ content: '❌ Search failed' });
    return;
  }

  const { results, hasMore } = result.data;

  if (results.length === 0) {
    await interaction.editReply({ content: `No repositories found for "${query}"` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Search Results: ${query}`)
    .setDescription(`Found ${results.length}${hasMore ? '+' : ''} repositories`)
    .setColor('Blue')
    .setTimestamp();

  results.slice(0, 5).forEach((repo: any, index: number) => {
    const repoOwner = repo.owner?.username || repo.repository?.ownerUsername || 'unknown';
    const repoName = repo.title || repo.name || repo.repository?.name || 'unknown';

    embed.addFields({
      name: `${index + 1}. ${repoOwner}/${repoName}`,
      value: repo.description || 'No description',
      inline: false,
    });
  });

  if (hasMore) {
    embed.addFields({
      name: '📄',
      value: `And more... (first 5 shown)`,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

export async function handleIssuesCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const state = interaction.options.getString('state') || 'open';

  const result = await api.getIssues(owner, repo, state as any, 10, 0);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `❌ Failed to fetch issues` });
    return;
  }

  const { issues, hasMore } = result.data;

  if (issues.length === 0) {
    await interaction.editReply({ content: `No ${state} issues found for ${owner}/${repo}` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📋 Issues: ${owner}/${repo}`)
    .setDescription(`${issues.length} ${state} issue(s)${hasMore ? '+' : ''}`)
    .setColor(stateColors[state])
    .setTimestamp();

  issues.slice(0, 10).forEach((issue: any) => {
    const stateEmoji = issue.state === 'open' ? '🟢' : '🔴';
    const labels = issue.labels?.map((l: any) => l.name).join(', ') || '';
    const assignees = issue.assignees?.map((a: any) => a.username).join(', ') || '';

    embed.addFields({
      name: `${stateEmoji} #${issue.number}`,
      value: `${issue.title}\nLabels: ${labels || 'none'} | Assignees: ${assignees || 'none'}`,
      inline: false,
    });
  });

  await interaction.editReply({ embeds: [embed] });
}

export async function handlePRsCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const state = interaction.options.getString('state') || 'open';

  const result = await api.getPullRequests(owner, repo, state as any, 10, 0);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `❌ Failed to fetch pull requests` });
    return;
  }

  const { pullRequests, hasMore } = result.data;

  if (pullRequests.length === 0) {
    await interaction.editReply({ content: `No ${state} pull requests found for ${owner}/${repo}` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔀 Pull Requests: ${owner}/${repo}`)
    .setDescription(`${pullRequests.length} ${state} PR(s)${hasMore ? '+' : ''}`)
    .setColor(stateColors[state])
    .setTimestamp();

  pullRequests.slice(0, 10).forEach((pr: any) => {
    let stateEmoji = '🟢';
    if (pr.state === 'closed') stateEmoji = '🔴';
    else if (pr.state === 'merged') stateEmoji = '🟣';

    embed.addFields({
      name: `${stateEmoji} #${pr.number}`,
      value: `${pr.title}\n${pr.baseRepo?.name || 'base'}:${pr.baseBranch} ← ${pr.headRepo?.name || 'head'}:${pr.headBranch}`,
      inline: false,
    });
  });

  await interaction.editReply({ embeds: [embed] });
}

export async function handleCommitsCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const branch = interaction.options.getString('branch') || 'main';

  const result = await api.getCommits(owner, repo, branch, 10, 0);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `❌ Failed to fetch commits` });
    return;
  }

  const { commits, hasMore } = result.data;

  if (commits.length === 0) {
    await interaction.editReply({ content: `No commits found for ${owner}/${repo}/${branch}` });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📝 Recent Commits: ${owner}/${repo}/${branch}`)
    .setDescription(`${commits.length} commit(s)${hasMore ? '+' : ''}`)
    .setColor('Blurple')
    .setTimestamp();

  commits.slice(0, 10).forEach((commit: any, index: number) => {
    const date = new Date(commit.timestamp).toLocaleDateString();
    const message = commit.message.split('\n')[0];

    embed.addFields({
      name: `${index + 1}. \`${commit.oid.substring(0, 7)}\``,
      value: `${message}\n${commit.author.name} • ${date}`,
      inline: false,
    });
  });

  await interaction.editReply({ embeds: [embed] });
}

export async function handleForkCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const name = interaction.options.getString('name');

  await interaction.editReply({ content: '⏳ Forking repository... This may take a moment.' });

  const result = await api.forkRepository(owner, repo, name || undefined);

  if (result.error || !result.data) {
    await interaction.editReply({ content: `❌ Failed to fork repository: ${result.error || 'Unknown error'}` });
    return;
  }

  const { repo: forkedRepo } = result.data;

  const embed = new EmbedBuilder()
    .setTitle('🔀 Repository Forked!')
    .setDescription(`Successfully forked ${owner}/${repo}`)
    .setURL(`${api['baseUrl']}/${forkedRepo.owner.username}/${forkedRepo.name}`)
    .setThumbnail(forkedRepo.owner.avatarUrl || null)
    .setColor('Green')
    .setTimestamp();

  await interaction.editReply({ content: '✅ Fork successful!', embeds: [embed] });
}
