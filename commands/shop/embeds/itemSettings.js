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
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require("discord.js");
const ShopItems = require("../models/Items");

async function buildItemsSettings(page = 1) {
	const itemsPerPage = 25;
	const offset = (page - 1) * itemsPerPage;

	// Fetch items with pagination
	const { count, rows: items } = await ShopItems.findAndCountAll({
		limit: itemsPerPage,
		offset: offset,
		order: [["id", "ASC"]],
	});

	let totalPages = Math.ceil(count / itemsPerPage);

	if (totalPages === 0) {
		totalPages = 1; // Ensure at least one page is shown
	}

	// Create embed
	const embed = new EmbedBuilder()
		.setTitle("🛒 Shop Items")
		.setDescription(`*▸ Manage your shop items.*\n*✔️ Total items: ${count}*`)
		.setColor("#00FF00")
		.setFooter({ text: `Page ${page} of ${totalPages}` });

	// Add items to embed
	if (items.length > 0) {
		let itemsList = "";
		items.forEach((item, index) => {
			const itemNumber = offset + index + 1;
			itemsList += `**${itemNumber}.** ${item.name} - ${item.price} Tokens\n`;
		});
		embed.addFields({ name: "🧸 Items", value: itemsList, inline: false });
	} else {
		embed.addFields({ name: "🧸 Items", value: "*No items found on this page.*", inline: false });
	}

	// Create components array
	const components = [];

	// Navigation buttons row
	const navigationRow = new ActionRowBuilder();

	// Previous page button
	navigationRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_items_prev-${page}`)
			.setLabel("⬅️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page <= 1)
	);

	// Current page button (disabled)
	navigationRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_items_current-${page}`)
			.setLabel(`${page}/${totalPages}`)
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true)
	);

	// Next page button
	navigationRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_items_next-${page}`)
			.setLabel("➡️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page >= totalPages)
	);

	// Add new item button
	navigationRow.addComponents(
		new ButtonBuilder().setCustomId("shop_items_add").setLabel("➕ Add Item").setStyle(ButtonStyle.Success)
	);

	components.push(navigationRow);

	// Edit items select menu (only if there are items on this page)
	if (items.length > 0) {
		const editSelectMenu = new StringSelectMenuBuilder()
			.setCustomId(`shop_items_edit-${page}`)
			.setPlaceholder("🖊️ Select an Item to Edit");

		items.forEach((item, index) => {
			const itemNumber = offset + index + 1;
			editSelectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${itemNumber}. ${item.name}`)
					.setDescription(`Price: ${item.price} Tokens`)
					.setValue(item.id.toString())
			);
		});

		const editRow = new ActionRowBuilder().addComponents(editSelectMenu);
		components.push(editRow);

		// Delete items select menu
		const deleteSelectMenu = new StringSelectMenuBuilder()
			.setCustomId(`shop_items_delete-${page}`)
			.setPlaceholder("❌ Select an Item to Delete");

		items.forEach((item, index) => {
			const itemNumber = offset + index + 1;
			deleteSelectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${itemNumber}. ${item.name}`)
					.setDescription(`Price: ${item.price.toFixed(2)} Tokens`)
					.setValue(item.id.toString())
			);
		});

		const deleteRow = new ActionRowBuilder().addComponents(deleteSelectMenu);
		components.push(deleteRow);
	}

	return {
		embeds: [embed],
		components: components,
	};
}

module.exports = buildItemsSettings;
