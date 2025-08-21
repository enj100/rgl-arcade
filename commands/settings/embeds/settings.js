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
	const shopSettings = interaction.client.shopSettings;

	const brandName = `▸ **Brand Name:** ${settings.brand_name || "Not Set."}\n`;
	const logsChannel = `▸ **Logs Channel:** ${settings.logs_channel ? channelMention(settings.logs_channel) : "Not Set."}\n`;
	const gamesLogsChannel = `▸ **Games Logs Channel:** ${
		settings.games_logs_channel ? channelMention(settings.games_logs_channel) : "Not Set."
	}\n`;
	const ticketsLogsChannel = `▸ **Shop Tickets Logs Channel:** ${
		shopSettings.tickets_logs_channel ? channelMention(shopSettings.tickets_logs_channel) : "Not Set."
	}\n`;

	const embed = new EmbedBuilder()
		.setTitle("Server Settings")
		.setColor(settings.color)
		.setDescription(`${brandName}${logsChannel}${gamesLogsChannel}${ticketsLogsChannel}`);

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
		new ChannelSelectMenuBuilder()
			.setCustomId("settings_tickets_logs_channel_select")
			.setPlaceholder("ℹ️ Change Shop Tickets Logs Channel")
			.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
			.setMinValues(1)
			.setMaxValues(1)
	);
	const row5 = new ActionRowBuilder().addComponents(
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
				new StringSelectMenuOptionBuilder().setLabel("🍯 Jackpot Settings").setValue("jackpot_settings"),
				new StringSelectMenuOptionBuilder().setLabel("❓ 1-1000 Game Settings").setValue("guess_game_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🛒 Shop Settings").setValue("shop_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🛞 Wheel Settings").setValue("wheel_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🛍️ Subs Settings").setValue("subs_settings"),
				new StringSelectMenuOptionBuilder().setLabel("💐 Live Flower Poker").setValue("fp_live_settings"),
				new StringSelectMenuOptionBuilder().setLabel("👑 King of the Hill Settings").setValue("koth_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🧰 Chests Battle").setValue("chests_battle_settings"),
				new StringSelectMenuOptionBuilder().setLabel("🔁 Swap Gold Settings").setValue("swap_gold_settings"),
			])
	);

	return {
		embeds: [embed],
		components: [row1, row2, row3, row4, row5],
	};
}

module.exports = buildSettingsEmbed;
