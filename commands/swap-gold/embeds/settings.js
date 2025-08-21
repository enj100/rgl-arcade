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
	RoleSelectMenuBuilder,
	roleMention,
} = require("discord.js");

async function buildGoldSwapSettings(interaction) {
	const settings = interaction.client.goldSwapSettings;

	const ticketsCategory = `**▸ Tickets Category:** ${settings.category ? channelMention(settings.category) : "Not Set"}\n`;

	const adminRole = `**▸ Admin Role:** ${settings.staff_role ? `${roleMention(settings.staff_role)}` : "Not Set"}\n`;
	const logsChannel = `**▸ Transcripts/Logs Channel:** ${
		settings.logs_channel ? channelMention(settings.logs_channel) : "Not Set"
	}\n`;
	const ticketMessage = `**▸ Ticket Message:**\n ${settings.ticket_message || "Not Set"}\n`;

	const embed = new EmbedBuilder()
		.setTitle("🔁 Gold Swap Settings")
		.setColor(settings.color || "#0099ff")
		.setDescription(`${ticketsCategory}${adminRole}${logsChannel}${ticketMessage}`);

	if (settings?.thumbnail) {
		embed.setThumbnail(settings.thumbnail);
	}
	if (settings?.color) {
		embed.setColor(settings.color);
	}

	const goldSwapSettings = new ButtonBuilder()
		.setCustomId("gold_swap_settings_edit")
		.setLabel("⚙️ Edit")
		.setStyle(ButtonStyle.Secondary);

	const goldSwapLogsChannelSelect = new ChannelSelectMenuBuilder()
		.setCustomId("gold_swap_logs_channel")
		.setPlaceholder("ℹ️ Choose a logs channel")
		.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
		.setMinValues(1)
		.setMaxValues(1);

	const goldSwapTicketsCategorySelect = new ChannelSelectMenuBuilder()
		.setCustomId("gold_swap_category_select")
		.setPlaceholder("ℹ️ Choose a Category for Tickets")
		.setChannelTypes(ChannelType.GuildCategory) // 4 is for GUILD_CATEGORY channels
		.setMinValues(1)
		.setMaxValues(1);

	const adminRoleSelect = new RoleSelectMenuBuilder()
		.setCustomId("gold_swap_admin_role_select")
		.setPlaceholder("ℹ️ Choose an Admin Role for Tickets")
		.setMinValues(1)
		.setMaxValues(1);

	const row1 = new ActionRowBuilder().addComponents(goldSwapSettings);
	const row2 = new ActionRowBuilder().addComponents(goldSwapLogsChannelSelect);
	const row3 = new ActionRowBuilder().addComponents(goldSwapTicketsCategorySelect);
	const row4 = new ActionRowBuilder().addComponents(adminRoleSelect);

	return {
		embeds: [embed],
		components: [row1, row2, row3, row4],
	};
}

module.exports = buildGoldSwapSettings;
