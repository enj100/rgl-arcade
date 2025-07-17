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

async function shopEmbed(page = 1, interaction) {
	// Get total count of items
	const settings = interaction.client.serverSettings;
	const totalItems = await ShopItems.count();

	if (totalItems === 0) {
		// No items in shop
		const embed = new EmbedBuilder()
			.setTitle("🛒 Items Shop")
			.setDescription("*Sorry, the shop is currently empty. Please check back later!*")
			.setColor("#FF6B6B")
			.setFooter({ text: "RGL-Arcade Shop" });

		if (settings?.thumbnail) {
			embed.setThumbnail(settings.thumbnail);
		}
		if (settings?.color) {
			embed.setColor(settings.color);
		}

		return {
			embeds: [embed],
			components: [],
		};
	}

	// Calculate item index (0-based)
	const itemIndex = page - 1;

	// Get the specific item for this page
	const item = await ShopItems.findOne({
		offset: itemIndex,
		order: [["id", "ASC"]],
	});

	if (!item) {
		// Item not found, go to first page
		return await shopEmbed(1);
	}

	// Create embed for the item
	const embed = new EmbedBuilder()
		.setTitle("🛒 Items Shop")
		.setColor("#00D4FF")
		.setFooter({ text: `Item ${page} of ${totalItems} • RGL-Arcade Shop` });

	if (settings?.thumbnail) {
		embed.setThumbnail(settings.thumbnail);
		embed.setFooter({ text: `Item ${page} of ${totalItems} • RGL-Arcade Shop`, iconURL: settings.thumbnail });
	}
	if (settings?.color) {
		embed.setColor(settings.color);
	}

	// Add item information
	// embed.addFields(
	// 	{ name: "📦 Item Name", value: item.name, inline: true },
	// 	{ name: "💰 Price", value: `${item.price.toFixed(2)} Tokens`, inline: true },
	// 	{ name: "\u200B", value: "\u200B", inline: true } // Empty field for spacing
	// );

	const itemName = `**▸ Item Name:** ${item.name}\n`;
	const price = `**▸ Price:** ${item.price.toFixed(2)} Tokens\n\n`;
	const description = item.description ? `**▸ Description:**\n*${item.description}*\n` : "";

	// if (item.description) {
	// 	embed.addFields({ name: "📝 Description", value: item.description, inline: false });
	// }

	embed.setDescription(`${itemName}${price}${description}`);

	if (item.image) {
		embed.setImage(item.image);
	}

	// Create navigation buttons
	const navigationRow = new ActionRowBuilder();

	// Previous button
	navigationRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_prev-${page}`)
			.setLabel("⬅️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page <= 1)
	);

	// Buy button
	navigationRow.addComponents(
		new ButtonBuilder().setCustomId(`shop_buy-${item.id}`).setLabel("💳 Buy Now").setStyle(ButtonStyle.Success)
	);

	// Next button
	navigationRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_next-${page}`)
			.setLabel("➡️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page >= totalItems)
	);

	// Item counter row
	const infoRow = new ActionRowBuilder();
	infoRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`shop_info-${page}`)
			.setLabel(`${page}/${totalItems}`)
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true)
	);

	return {
		embeds: [embed],
		components: [navigationRow],
	};
}

module.exports = shopEmbed;
