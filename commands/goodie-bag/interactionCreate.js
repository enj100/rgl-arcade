const { Events, ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const goodiebagSettingsEmbed = require("./embeds/settings");
const GoodiebagSettings = require("./models/Settings");
const GoodiebagItems = require("./models/Items");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction?.customId === "other_settings" && interaction?.values[0] === "goodiebag_settings") {
			const { embeds, components } = await goodiebagSettingsEmbed(interaction);

			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "goodiebag_main_settings") {
			const val = interaction.values[0];
			const settings = await GoodiebagSettings.findOne({ where: { id: 0 } });

			if (val === "status") {
				settings.status ? (settings.status = false) : (settings.status = true);
				await settings.save();
				interaction.client.goodiebagSettings = settings;
				const { embeds, components } = await goodiebagSettingsEmbed(interaction);

				await interaction.update({ embeds, components, ephemeral: true });
			} else if (val === "price") {
				const modal = new ModalBuilder().setCustomId(`edit_goodiebag_price`).setTitle("Edit the price");

				const price = new TextInputBuilder()
					.setCustomId("price")
					.setValue(`${settings.price}`)
					.setLabel("Goodie Bag Price")
					.setStyle(TextInputStyle.Short);

				const first = new ActionRowBuilder().addComponents(price);

				modal.addComponents(first);
				await interaction.showModal(modal);
			} else if (val === "picture") {
				const modal = new ModalBuilder().setCustomId(`edit_goodiebag_picture`).setTitle("Edit the picture");

				const picture = new TextInputBuilder()
					.setCustomId("picture")
					.setValue(settings.goodiebag_image || "")
					.setLabel("Goodie Bag Picture URL")
					.setStyle(TextInputStyle.Short);

				const first = new ActionRowBuilder().addComponents(picture);

				modal.addComponents(first);
				await interaction.showModal(modal);
			}
		} else if (interaction?.customId?.startsWith("edit_goodiebag_picture")) {
			const picture = interaction.fields.getTextInputValue("picture");

			const settings = await GoodiebagSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				await interaction.reply({ content: `❗ Please turn off the goodie bag to be able to make changes!`, ephemeral: true });
				return;
			}

			settings.goodiebag_image = picture;
			await settings.save();
			interaction.client.goodiebagSettings = settings;

			const { embeds, components } = await goodiebagSettingsEmbed(interaction);

			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction.customId && interaction.customId.includes("edit_goodiebag_price")) {
			const price = interaction.fields.getTextInputValue("price");

			const settings = await GoodiebagSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				await interaction.reply({ content: `❗ Please turn off the goodie bag to be able to make changes!`, ephemeral: true });
				return;
			}
			if (isNaN(price) || price <= 0) {
				await interaction.reply({ content: `❗ Make sure the price is a positive number!`, ephemeral: true });
				return;
			}

			settings.price = price;
			await settings.save();
			interaction.client.goodiebagSettings = settings;

			const { embeds, components } = await goodiebagSettingsEmbed(interaction);

			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId?.startsWith("goodiebag_items_edit-")) {
			const id = interaction.values[0];
			const item = await GoodiebagItems.findOne({ where: { id: +id } });
			if (!item) {
				return await interaction.reply({
					content: "*❗ Item not found!*",
					ephemeral: true,
				});
			}
			const modal = new ModalBuilder().setCustomId(`goodiebag_items_edit_submit-${item.id}`).setTitle("Edit an Item");

			const itemName = new TextInputBuilder()
				.setCustomId("itemName")
				.setValue(`${item.item_name ? item.item_name : ""}`)
				.setLabel("Item Name")
				.setStyle(TextInputStyle.Short);

			const itemValue = new TextInputBuilder()
				.setCustomId("itemValue")
				.setValue(`${item.item_value}`)
				.setLabel("Item Value(in RGL-Tokens)")
				.setStyle(TextInputStyle.Short);

			const probability = new TextInputBuilder()
				.setCustomId("probability")
				.setValue(`${item.probability}`)
				.setLabel("Probability(%)")
				.setStyle(TextInputStyle.Short);

			const first = new ActionRowBuilder().addComponents(itemName);
			const second = new ActionRowBuilder().addComponents(itemValue);
			const third = new ActionRowBuilder().addComponents(probability);

			modal.addComponents(first);
			modal.addComponents(second);
			modal.addComponents(third);

			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("goodiebag_items_edit_submit-")) {
			const id = interaction.customId.split("-")[1];
			const itemName = interaction.fields.getTextInputValue("itemName");
			const itemValue = interaction.fields.getTextInputValue("itemValue");
			const probability = interaction.fields.getTextInputValue("probability");
			const settings = await GoodiebagSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: `❗ Please turn off the goodie bag to be able to make changes!`,
					ephemeral: true,
				});
			}
			if (isNaN(itemValue) || isNaN(probability)) {
				return await interaction.reply({ content: `❗ Make sure item value and probability are numbers!`, ephemeral: true });
			}
			const item = await GoodiebagItems.findOne({ where: { id: +id } });

			item.item_name = itemName;
			item.item_value = itemValue;
			item.probability = probability;
			await item.save();
			interaction.client.goodiebagItems = await GoodiebagItems.findAll();

			const { embeds, components } = await goodiebagSettingsEmbed(interaction);

			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		}
	},
};
