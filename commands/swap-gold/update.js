const { SlashCommandBuilder, roleMention } = require("discord.js");
const Rate = require("./models/Rate");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("update")
		.setDefaultMemberPermissions(0)
		.setDescription("⭐ | Update Tokens to OSRS rate.")
		.addNumberOption((option) =>
			option
				.setName("rate")
				.setDescription("RGL-Tokens → OSRS Gold (Tokens/M)")
				.setRequired(true)
				.setMinValue(0.01)
				.setMaxValue(100000)
		),
	async execute(interaction) {
		const rate = interaction.options.getNumber("rate");
		if (rate <= 0) {
			return interaction.reply({ content: "Rate must be greater than 0.", ephemeral: true });
		}
		await Rate.update({ value: rate }, { where: { id: 0 } });

		return interaction.reply({ content: `*✅ Rate updated successfully. Tokens → OSRS:* **${rate}/M**`, ephemeral: true });
	},
};
