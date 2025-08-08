const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	RoleSelectMenuBuilder,
} = require("discord.js");
const SubSettings = require("../models/SubSettings");
const Sub = require("../models/Subs");

async function buildSubsSettingsEmbed(interaction) {
	const settings = await SubSettings.findOne({ where: { id: 0 } });
	const subsCount = await Sub.count();

	const priceTokens = `▸ **Price (Tokens):** ${settings.price_tokens}\n`;
	const status = `▸ **Status:** ${settings.status ? "✅ Enabled" : "❌ Disabled"}\n`;
	const role = `▸ **Role:** ${settings.role_id ? `<@&${settings.role_id}>` : "Not Set."}\n`;
	const logsChannel = `▸ **Announcements Channel:** ${
		settings.logs_channel ? channelMention(settings.logs_channel) : "Not Set."
	}\n`;
	const description = `▸ **Description:** ${settings.description || "Not Set."}\n`;
	const subsCountText = `▸ **Active Subscriptions:** ${subsCount}\n`;

	const embed = new EmbedBuilder()
		.setTitle("Subscription Settings")
		.setColor(settings.status ? 0x00ff00 : 0xff0000)
		.setDescription(`${priceTokens}${status}${role}${logsChannel}\n${subsCountText}\n${description}`);

	if (settings.thumbnail && settings.thumbnail.length > 0) {
		embed.setThumbnail(settings.thumbnail);
	}

	// General Settings Button
	const generalButton = new ButtonBuilder()
		.setCustomId("subs_general_settings")
		.setLabel("General Settings")
		.setStyle(ButtonStyle.Primary)
		.setEmoji("⚙️");

	// Status Toggle Button
	const statusButton = new ButtonBuilder()
		.setCustomId("subs_toggle_status")
		.setLabel(settings.status ? "Turn Off" : "Turn On")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success)
		.setEmoji(settings.status ? "❌" : "✅");

	// Role Select Menu
	const roleSelect = new RoleSelectMenuBuilder()
		.setCustomId("subs_role_select")
		.setPlaceholder("👤 Select a subscription role...")
		.setMaxValues(1);

	// Channel Select Menu
	const channelSelect = new ChannelSelectMenuBuilder()
		.setCustomId("subs_channel_select")
		.setPlaceholder("ℹ️ Select announcements channel...")
		.setChannelTypes(ChannelType.GuildText)
		.setMaxValues(1);

	const buttonRow = new ActionRowBuilder().addComponents(generalButton, statusButton);
	const roleRow = new ActionRowBuilder().addComponents(roleSelect);
	const channelRow = new ActionRowBuilder().addComponents(channelSelect);

	return {
		embeds: [embed],
		components: [buttonRow, roleRow, channelRow],
	};
}

module.exports = buildSubsSettingsEmbed;
