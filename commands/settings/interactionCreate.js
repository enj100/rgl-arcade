const { Events, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const Settings = require("./models/settings");
const buildSettingsEmbed = require("./embeds/settings");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction?.customId === "settings_logs_channel_select") {
			const selectedChannelId = interaction.values[0];

			const settings = await Settings.findOne({
				where: { id: 0 },
			});
			settings.logs_channel = selectedChannelId;
			await settings.save();
			interaction.client.serverSettings = settings;

			interaction.client.logsChannel = await interaction.client.channels.fetch(selectedChannelId).catch(() => null);

			const { embeds, components } = await buildSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "server_settings_button") {
			const settings = interaction.client.serverSettings;

			const modal = new ModalBuilder().setCustomId("settings_edit_submit").setTitle("Edit Server Settings");

			const thumbnailInput = new TextInputBuilder()
				.setCustomId("settings_thumbnail")
				.setLabel("Thumbnail URL")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("https://example.com/image.png")
				.setRequired(false)
				.setValue(settings?.thumbnail || "");

			const colorInput = new TextInputBuilder()
				.setCustomId("settings_color")
				.setLabel("Embed Color (hex, e.g. #00AE86)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("#00AE86")
				.setRequired(false)
				.setValue(settings?.color || "");

			const brandNameInput = new TextInputBuilder()
				.setCustomId("settings_brand_name")
				.setLabel("Brand Name")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Arcade Brand")
				.setRequired(false)
				.setValue(settings?.brand_name || "");

			modal.addComponents(
				new ActionRowBuilder().addComponents(thumbnailInput),
				new ActionRowBuilder().addComponents(colorInput),
				new ActionRowBuilder().addComponents(brandNameInput)
			);
			await interaction.showModal(modal);
		} else if (interaction?.customId === "settings_edit_submit") {
			const settings = interaction.client.serverSettings;

			const thumbnail = interaction.fields.getTextInputValue("settings_thumbnail");
			const color = interaction.fields.getTextInputValue("settings_color");
			const brandName = interaction.fields.getTextInputValue("settings_brand_name");

			settings.thumbnail = thumbnail || null;
			settings.color = color || "FFFFFF";
			settings.brand_name = brandName || null;

			await settings.save();
			interaction.client.serverSettings = settings;

			const { embeds, components } = await buildSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		}
	},
};
