import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SigmagitApiClient } from '../api';
import { generateLinkToken } from '../linking';

interface LinkState {
  discordId: string;
  userId?: string;
  email?: string;
}

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

export async function handleLinkButton(interaction: any, api: SigmagitApiClient, type: 'start' | 'email' | 'verify') {
  const discordId = interaction.user.id;

  if (type === 'start') {
    await showLinkOptions(interaction);
  } else if (type === 'email') {
    await showEmailInput(interaction);
  } else if (type === 'verify') {
    await verifyLink(interaction, api, discordId);
  }
}

async function showLinkOptions(interaction: any) {
  await interaction.deferReply({ ephemeral: true });

  const button1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('link_email')
      .setLabel('📧 Link with Email')
      .setStyle(ButtonStyle.Primary)
  );

  const button2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('link_unlinked')
      .setLabel('🔓 Link Unlinked Account')
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setTitle('📧 Choose Link Method')
    .setDescription('How would you like to link your Sigmagit account?')
    .addFields(
      {
        name: '📧 Link with Email',
        value: 'Enter your Sigmagit email to verify and link your account',
        inline: false,
      },
      {
        name: '🔓 Link Unlinked',
        value: 'Already have a Sigmagit account? We\'ll find it by your linked Discord ID',
        inline: false,
      },
    )
    .setColor('Green')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed], components: [button1, button2] });
}

async function showEmailInput(interaction: any) {
  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('📧 Enter Your Sigmagit Email')
    .setDescription('Please provide your Sigmagit account email address.')
    .addFields(
      { name: 'Email Address', value: 'Use the command format:', inline: false },
      { name: 'Example', value: '/link-email your-email@sigmagit.dev', inline: false },
    )
    .setColor('Blue')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export async function handleLinkEmailCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const email = interaction.options.getString('email');

  if (!email || !email.includes('@')) {
    await interaction.editReply({ content: '❌ Please provide a valid email address', ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;

  try {
    const response = await fetch(`${api['baseUrl']}/api/discord/link/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId, sigmagitEmail: email }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      await interaction.editReply({ content: `❌ ${data.error || 'Failed to generate link token'}`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Link Token Generated')
      .setDescription(`A verification link has been generated for **${email}**\n\nPlease check your Sigmagit account on the web to complete the linking process.`)
      .addFields(
        { name: 'Status', value: '🔗 Pending Verification', inline: true },
        { name: 'Token', value: `📋 ${data.token.substring(0, 16)}...`, inline: true },
      )
      .setColor('Green')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[Link] Error generating link token:', error);
    await interaction.editReply({ content: '❌ Failed to generate link token. Please try again.', ephemeral: true });
  }
}

export async function verifyLink(interaction: any, api: SigmagitApiClient, discordId: string) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await fetch(`${api['baseUrl']}/api/discord/link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: interaction.customId, sigmagitUserId: discordId }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      await interaction.editReply({ content: `❌ ${data.error || 'Failed to verify link'}`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Account Linked Successfully!')
      .setDescription(`Your Discord account has been linked to **${data.user.username}'s Sigmagit account!`)
      .setThumbnail(data.user.avatarUrl || null)
      .addFields(
        { name: 'Sigmagit User', value: data.user.username, inline: true },
        { name: 'Sigmagit Email', value: data.user.email, inline: true },
        { name: 'Verified', value: '✅ Yes', inline: true },
      )
      .setColor('Green')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    const response2 = await fetch(`${api['baseUrl']}/api/webhooks/discord/test`, {
      method: 'GET',
    });

    if (response2.ok) {
      await interaction.followUp({ content: '📢 Discord webhook is configured and working!' });
    }
  } catch (error) {
    console.error('[Link] Error verifying link:', error);
    await interaction.editReply({ content: '❌ Failed to verify link. Please try again.', ephemeral: true });
  }
}

export async function handleUnlinkCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  try {
    const response = await fetch(`${api['baseUrl']}/api/discord/link/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      await interaction.editReply({ content: `❌ ${data.error || 'Failed to unlink account'}`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔓 Account Unlinked')
      .setDescription('Your Discord account has been unlinked from Sigmagit.')
      .setColor('Orange')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[Unlink] Error:', error);
    await interaction.editReply({ content: '❌ Failed to unlink account. Please try again.', ephemeral: true });
  }
}

export async function handleStatusCommand(interaction: any, api: SigmagitApiClient) {
  await interaction.deferReply();

  const discordId = interaction.user.id;

  try {
    const response = await fetch(`${api['baseUrl']}/api/discord/link/status/${discordId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      await interaction.editReply({ content: '❌ Failed to check link status', ephemeral: true });
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
  } catch (error) {
    console.error('[Status] Error:', error);
    await interaction.editReply({ content: '❌ Failed to check link status', ephemeral: true });
  }
}
