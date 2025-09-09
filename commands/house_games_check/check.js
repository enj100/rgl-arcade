const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require("discord.js");
const GoodiebagSettings = require("../goodie-bag/models/Settings");
const WheelSettings = require("../wheel/models/Settings");
const FpLiveSettings = require("../fp-live/models/Settings");
const { buildHouseGamesProfitEmbed } = require("./embeds/profitEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("house_games_check")
		.setDefaultMemberPermissions("0")
		.setDescription("⭐ | House games check."),
	async execute(interaction) {
		const { embeds, components } = await buildHouseGamesProfitEmbed();

		await interaction.reply({ embeds, components, ephemeral: true }); // Make the reply visible only to the user who invoked the command
	},
};
