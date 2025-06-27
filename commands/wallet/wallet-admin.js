const { SlashCommandBuilder } = require("discord.js");
const User = require("./models/User");
const { createWalletEmbed } = require("./embeds/wallet");
const { checkWalletAdminEmbed } = require("./embeds/wallet-admin");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("wallet-admin")
		.setDefaultMemberPermissions(0)
		.setDescription("⭐ | Check user's wallet (add/remove tokens).")
		.addUserOption((option) => option.setName("user").setDescription("The user to check").setRequired(true)),
	async execute(interaction) {
		const user = interaction.options.getUser("user");
		const [wallet] = await User.findOrCreate({
			where: { discord_id: user.id },
			defaults: {
				discord_id: user.id,
			},
		});

		const { embeds, components } = checkWalletAdminEmbed(user, wallet, interaction.client.serverSettings);

		await interaction.reply({
			embeds,
			components,
			ephemeral: true,
		});
	},
};
