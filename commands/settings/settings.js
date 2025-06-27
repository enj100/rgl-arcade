const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require("discord.js");
const buildSettingsEmbed = require("./embeds/settings");

module.exports = {
	data: new SlashCommandBuilder().setName("settings").setDefaultMemberPermissions("0").setDescription("⭐ | Server settings."),
	async execute(interaction) {
		const { embeds, components } = await buildSettingsEmbed(interaction);

		await interaction.reply({
			embeds,
			components,
			ephemeral: true, // Make the reply visible only to the user who invoked the command
		});
	},
};
