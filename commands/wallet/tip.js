const { SlashCommandBuilder } = require("discord.js");
const User = require("./models/User");
const { logToChannel } = require("../../utils/logger");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("tip")
		.setDescription("⭐ | Tip RGL-Tokens to another user.")
		.addUserOption((option) => option.setName("user").setDescription("The user to tip RGL-Tokens to").setRequired(true))
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("The amount of RGL-Tokens to tip")
				.setRequired(true)
				.setMinValue(0.01)
				.setMaxValue(10000)
		),
	async execute(interaction) {
		const [sender] = await User.findOrCreate({
			where: { discord_id: interaction.user.id },
			defaults: {
				discord_id: interaction.user.id,
			},
		});

		const recipient = interaction.options.getUser("user");
		const amount = interaction.options.getNumber("amount");
		if (recipient.id === interaction.user.id) {
			return await interaction.reply({
				content: "*❗ You cannot tip yourself!*",
				ephemeral: true,
			});
		}
		if (amount <= 0) {
			return await interaction.reply({
				content: "*❗ The amount must be greater than 0!*",
				ephemeral: true,
			});
		}
		if (sender.balance < amount) {
			return await interaction.reply({
				content: "*❗ You do not have enough RGL-Tokens to tip!*",
				ephemeral: true,
			});
		}
		const [recipientWallet] = await User.findOrCreate({
			where: { discord_id: recipient.id },
			defaults: {
				discord_id: recipient.id,
			},
		});
		// Update sender's wallet
		sender.balance -= amount;
		recipientWallet.balance += amount;
		await sender.save();
		await recipientWallet.save();

		await logToChannel(
			`**${interaction.user}** tipped **${recipient}** with **${amount.toFixed(2)} RGL-Tokens**`,
			interaction.client.logsChannel
		).catch((e) => null);

		await interaction.reply({
			content: `*✅ You have tipped ${recipient} with **${amount.toFixed(2)} RGL-Tokens**!*`,
		});
	},
};
