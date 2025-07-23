const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");

const WheelSettings = require("../models/Settings");
const WheelItems = require("../models/Items");

async function wheelSettingsEmbed(interaction) {
	const allItems = await WheelItems.findAll({});
	const gSettings = await WheelSettings.findOne({ where: { id: 0 } });

	const itemsList1 = [];
	const itemsList2 = [];

	for (let index = 0; index < Math.min(16, allItems.length); index++) {
		itemsList1.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${allItems[index].item_name}`)
				.setDescription(`Item no. ${index + 1}`)
				.setValue(`${allItems[index].id}`)
		);
	}

	let text = "__**Item Name ▸ Item Value ▸ Probability (%)**__\n\n";
	let ev = 0;
	let percents = 0;

	for (let index = 0; index < allItems.length; index++) {
		text += `${allItems[index].item_name} ▸ ${allItems[index].item_value} ▸ ${allItems[index].probability}%\n`;
		const p = allItems[index].item_value * (allItems[index].probability / 100);
		ev += p;
		percents += allItems[index].probability;
	}

	const embed = new EmbedBuilder()
		.setTitle("🛞 Settings")
		.setDescription(
			`${text}\n\n💰 **Expected Value:** $${ev.toFixed(2)}\n❗**Total Probability:** *${percents.toFixed(
				2
			)}*/100.00%\n\n✔️ **Price:** ${gSettings.price} RGL-Tokens\n🎊 **Profit:** $${(
				gSettings.users_paid - gSettings.payout
			).toFixed(2)}\n✔️ **Status:** ${gSettings.status ? "🟢 ON" : "🔴 OFF"}`
		)
		.setColor("FFFF00");

	if (gSettings.goodiebag_image) {
		embed.setImage(gSettings.goodiebag_image);
	}

	const items1 = new StringSelectMenuBuilder()
		.setCustomId("wheel_items_edit-1")
		.setPlaceholder("✅ Edit Items")
		.addOptions(...itemsList1);

	if (allItems.length === 0) {
		items1.addOptions([
			{
				label: "❌ No items available",
				value: "no_items",
				default: true,
			},
		]);
		items1.setDisabled(true);
	}

	const settings = new StringSelectMenuBuilder()
		.setCustomId("wheel_main_settings")
		.setPlaceholder("⚙️ General Settings")
		.addOptions(
			new StringSelectMenuOptionBuilder().setLabel(`💰 Price`).setValue(`price`),
			new StringSelectMenuOptionBuilder().setLabel(`✅ Turn On/Turn Off`).setValue(`status`)
		);

	const row = new ActionRowBuilder().addComponents(items1);
	const row3 = new ActionRowBuilder().addComponents(settings);

	return {
		embeds: [embed],
		components: [row, row3],
	};
}

module.exports = wheelSettingsEmbed;
