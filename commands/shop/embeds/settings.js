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

async function buildShopSettings(interaction) {
	const settings = interaction.client.shopSettings;

	const ticketsCategory = `**▸ Tickets Category:** ${
		settings.tickets_category ? channelMention(settings.tickets_category) : "Not Set"
	}\n`;

	const adminRole = `**▸ Admin Role:** ${
		settings.tickets_admin_role ? `${roleMention(settings.tickets_admin_role)}` : "Not Set"
	}\n`;

	const embed = new EmbedBuilder()
		.setTitle("🛒 Shop Settings")
		.setColor(settings.color || "#0099ff")
		.setDescription(`${ticketsCategory}${adminRole}`);

	if (settings?.tickets_thumbnail) {
		embed.setThumbnail(settings.tickets_thumbnail);
	}
	if (settings?.tickets_color) {
		embed.setColor(settings.tickets_color);
	}

	const shopStatus = new ButtonBuilder()
		.setCustomId("shop_status")
		.setLabel(settings.status ? "✖️ Turn OFF" : "✔️ Turn ON")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const itemSettings = new ButtonBuilder()
		.setCustomId("shop_item_settings")
		.setLabel("🛍️ Item Settings")
		.setStyle(ButtonStyle.Secondary);

	const editTickets = new ButtonBuilder()
		.setCustomId("shop_edit_tickets_settings")
		.setLabel("⚙️ Tickets Settings")
		.setStyle(ButtonStyle.Secondary);

	const shopFrontButton = new ButtonBuilder()
		.setCustomId("shop_edit_main_settings")
		.setLabel("⚙️ Edit Shop")
		.setStyle(ButtonStyle.Secondary);

	const shopChannelSelect = new ChannelSelectMenuBuilder()
		.setCustomId("shop_channel_select")
		.setPlaceholder("ℹ️ Choose a Channel to Post Shop")
		.setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
		.setMinValues(1)
		.setMaxValues(1);

	const shopTicketsCategorySelect = new ChannelSelectMenuBuilder()
		.setCustomId("shop_tickets_category_select")
		.setPlaceholder("ℹ️ Choose a Category for Shop Tickets")
		.setChannelTypes(ChannelType.GuildCategory) // 4 is for GUILD_CATEGORY channels
		.setMinValues(1)
		.setMaxValues(1);

	const adminRoleSelect = new RoleSelectMenuBuilder()
		.setCustomId("shop_admin_role_select")
		.setPlaceholder("ℹ️ Choose an Admin Role for Shop")
		.setMinValues(1)
		.setMaxValues(1);

	const row1 = new ActionRowBuilder().addComponents(shopFrontButton, editTickets, itemSettings, shopStatus);
	const row2 = new ActionRowBuilder().addComponents(shopChannelSelect);
	const row3 = new ActionRowBuilder().addComponents(shopTicketsCategorySelect);
	const row4 = new ActionRowBuilder().addComponents(adminRoleSelect);

	return {
		embeds: [embed],
		components: [row1, row2, row3, row4],
	};
}

module.exports = buildShopSettings;
