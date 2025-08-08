const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	channelMention,
	RoleSelectMenuBuilder,
	roleMention,
} = require("discord.js");

async function buildLiveFpSettings(interaction) {
	const settings = interaction.client.fpLiveSettings;

	const status = `**▸ Status:** ${settings.status ? "Enabled" : "Disabled"}\n`;
	const channel = `**▸ Channel:** ${settings.channel_id ? channelMention(settings.channel_id) : "Not Set"}\n`;
	const payoutPercent = `**▸ Payout Multiplier:** ${settings.payout_percent ? `x${settings.payout_percent}` : "Not Set"}\n`;

	const embed = new EmbedBuilder().setTitle("🎰 FP Live Settings").setDescription(`${status}${channel}${payoutPercent}`);

	if (settings?.thumbnail) {
		embed.setThumbnail(settings.thumbnail);
	}
	if (settings?.color) {
		embed.setColor(settings.color);
	}

	const toggleStatusButton = new ButtonBuilder()
		.setCustomId("fp_live_toggle_status")
		.setLabel(settings.status ? "✖️ Turn OFF" : "✔️ Turn ON")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const editSettingsButton = new ButtonBuilder()
		.setCustomId("fp_live_edit_settings")
		.setLabel("⚙️ Edit Settings")
		.setStyle(ButtonStyle.Secondary);

	const channelSelect = new ChannelSelectMenuBuilder()
		.setCustomId("fp_live_channel_select")
		.setPlaceholder("ℹ️ Choose a Channel for FP Live")
		.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
		.setMinValues(1)
		.setMaxValues(1);

	const row1 = new ActionRowBuilder().addComponents(toggleStatusButton, editSettingsButton);
	const row2 = new ActionRowBuilder().addComponents(channelSelect);

	return {
		embeds: [embed],
		components: [row1, row2],
	};
}

module.exports = buildLiveFpSettings;
