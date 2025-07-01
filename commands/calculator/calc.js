const { SlashCommandBuilder } = require("discord.js");
const { createCalculatorEmbed } = require("./embeds/calculator");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("calc")
		.setDescription("💰 | Calculate RGL-Token deposit and withdrawal costs")
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("The amount of RGL-Tokens to calculate for")
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10000)
		),
	async execute(interaction) {
		const amount = interaction.options.getNumber("amount");

		// Input validation
		if (amount <= 0) {
			return await interaction.reply({
				content: "*❗ The amount must be greater than 0!*",
				ephemeral: true,
			});
		}

		const embed = createCalculatorEmbed(amount, interaction.client.serverSettings);

		await interaction.reply({ embeds: [embed] });
	},
};
