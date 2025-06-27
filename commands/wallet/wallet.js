const { SlashCommandBuilder } = require("discord.js");
const User = require("./models/User");
const { createWalletEmbed } = require("./embeds/wallet");

module.exports = {
	data: new SlashCommandBuilder().setName("wallet").setDescription("⭐ | Check your wallet."),
	async execute(interaction) {
		const [wallet] = await User.findOrCreate({
			where: { discord_id: interaction.user.id },
			defaults: {
				discord_id: interaction.user.id,
			},
		});

		const embed = createWalletEmbed(interaction.user, wallet, interaction.client.serverSettings);

		await interaction.reply({ embeds: [embed] });
	},
};
