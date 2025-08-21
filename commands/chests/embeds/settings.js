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
const ChestItems = require("../models/ChestsItems");

async function buildChestsSettingsEmbed(interaction) {
	const items = await ChestItems.findAll();

	const itemsText = items
		.map((item) => `${item.emoji} ${item.item_name} - Value: ${item.item_value.toLocaleString("en-US")}`)
		.join("\n");

	const embed = new EmbedBuilder()
		.setTitle("🧰 Chests Battle Settings")
		.setDescription(`**▸ Items List:**\n ${itemsText}`)
		.setColor("FF0000");

	const addItemBtn = new ButtonBuilder()
		.setCustomId("chests_battle_add_item")
		.setLabel("➕ Add Item")
		.setStyle(ButtonStyle.Secondary);

	// create a select menu for items deletion
	const deleteItemMenu = new StringSelectMenuBuilder()
		.setCustomId("chests_battle_delete_item")
		.setPlaceholder("➖ Select an item to delete")
		.addOptions(
			items.map((item) => ({
				label: item.item_name,
				value: item.id.toString(),
			}))
		);

	const editItemMenu = new StringSelectMenuBuilder()
		.setCustomId("chests_battle_edit_item")
		.setPlaceholder("✏️ Select an item to edit")
		.addOptions(
			items.map((item) => ({
				label: item.item_name,
				value: item.id.toString(),
			}))
		);

	if (items.length <= 0) {
		deleteItemMenu.setDisabled(true);
		deleteItemMenu.addOptions([
			{
				label: "No items available",
				value: "no_items",
			},
		]);
		editItemMenu.setDisabled(true);
		editItemMenu.addOptions([
			{
				label: "No items available",
				value: "no_items",
			},
		]);
	}

	const row1 = new ActionRowBuilder().addComponents(addItemBtn);

	const row2 = new ActionRowBuilder().addComponents(deleteItemMenu);
	const row3 = new ActionRowBuilder().addComponents(editItemMenu);

	return {
		embeds: [embed],
		components: [row1, row2, row3],
	};
}

module.exports = buildChestsSettingsEmbed;
