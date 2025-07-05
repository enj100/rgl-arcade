const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require("discord.js");

async function buildSettingsEmbed(interaction) {
	const settings = interaction.client.serverSettings;

	const brandName = `▸ **Brand Name:** ${settings.brand_name || "Not Set."}\n`;
	const logsChannel = `▸ **Logs Channel:** ${settings.logs_channel ? channelMention(settings.logs_channel) : "Not Set."}\n`;
	const gamesLogsChannel = `▸ **Games Logs Channel:** ${
		settings.games_logs_channel ? channelMention(settings.games_logs_channel) : "Not Set."
	}\n`;

	const embed = new EmbedBuilder()
		.setTitle("Server Settings")
		.setColor(settings.color)
		.setDescription(`${brandName}${logsChannel}${gamesLogsChannel}`);

	if (settings.thumbnail && settings.thumbnail.length > 0) {
		embed.setThumbnail(settings.thumbnail);
	}

	// add button to edit server settings

	const editButton = new ButtonBuilder()
		.setCustomId("server_settings_button")
		.setLabel("Edit Server Settings")
		.setStyle(ButtonStyle.Primary);

	const row1 = new ActionRowBuilder().addComponents(editButton);
	const row2 = new ActionRowBuilder().addComponents(
		new ChannelSelectMenuBuilder()
			.setCustomId("settings_logs_channel_select")
			.setPlaceholder("ℹ️ Change Logs Channel")
			.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
			.setMinValues(1)
			.setMaxValues(1)
	);
	const row3 = new ActionRowBuilder().addComponents(
		new ChannelSelectMenuBuilder()
			.setCustomId("settings_games_logs_channel_select")
			.setPlaceholder("ℹ️ Change Games Logs Channel")
			.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
			.setMinValues(1)
			.setMaxValues(1)
	);
	const row4 = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId("other_settings")
			.setPlaceholder("⚙️ More Settings")
			.addOptions([
				new StringSelectMenuOptionBuilder().setLabel("⚔️ Rank System Settings").setValue("rank_system_settings"),
				new StringSelectMenuOptionBuilder().setLabel("👛 Goodie Bag Settings").setValue("goodiebag_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🎟️ Community Raffle Settings").setValue("community_raffle_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🏁 Monthly Race Settings").setValue("monthly_race_settings"),
				new StringSelectMenuOptionBuilder().setLabel("💬 Feedback Settings").setValue("feedback_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🎁 Giveaways Settings").setValue("giveaways_settings"),
			])
	);

	return {
		embeds: [embed],
		components: [row1, row2, row3, row4],
	};
}

module.exports = buildSettingsEmbed;
