const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
} = require("discord.js");
const CommunityRaffleSettings = require("./models/RaffleSettings");
const communityRaffleSettingsEmbed = require("./embeds/settingsEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("com_raffle_check")
		.setDescription("⭐ Create/Edit Community Raffles")
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		const raffles = await CommunityRaffleSettings.findAll();
		let options = raffles.map((raffle) => ({
			label: raffle.name,
			value: `community_raffle_settings-${raffle.id}`,
		}));

		if (options.length === 0) {
			options.push({
				label: "No raffles available",
				value: "no_raffles",
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("community_raffle_select")
			.setPlaceholder("‣ Select a raffle to edit")
			.addOptions(options)
			.setDisabled(raffles.length === 0);

		const createRaffleButton = new ButtonBuilder()
			.setCustomId("community_raffle_create")
			.setLabel("➕Create New Raffle")
			.setStyle(ButtonStyle.Success);

		const row = new ActionRowBuilder().addComponents(selectMenu);
		const row2 = new ActionRowBuilder().addComponents(createRaffleButton);

		await interaction.reply({
			embeds: [],
			components: [row, row2],
			ephemeral: true,
		});
	},
};
