const { Events, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, userMention } = require("discord.js");
const User = require("./models/User");
const { checkWalletAdminEmbed } = require("./embeds/wallet-admin");
const { logToChannel } = require("../../utils/logger");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction.customId?.startsWith("admin_add_tokens-")) {
			const userId = interaction.customId.split("-")[1];
			const modal = new ModalBuilder().setCustomId("add_tokens_submit-" + userId).setTitle("Add Tokens to Wallet");

			const amountInput = new TextInputBuilder()
				.setCustomId("amount")
				.setLabel("Amount of Tokens to Add")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const firstRow = new ActionRowBuilder().addComponents(amountInput);
			modal.addComponents(firstRow);

			await interaction.showModal(modal);
		} else if (interaction.customId?.startsWith("add_tokens_submit-")) {
			const userId = interaction.customId.split("-")[1];
			const amount = parseFloat(interaction.fields.getTextInputValue("amount"));

			if (isNaN(amount) || amount <= 0) {
				return await interaction.reply({ content: "❗ Please enter a valid amount.", ephemeral: true });
			}

			// Find the user and update their wallet
			const [user] = await User.findOrCreate({ where: { discord_id: userId }, defaults: { discord_id: userId } });
			if (!user) {
				return await interaction.reply({ content: "User not found.", ephemeral: true });
			}

			user.balance += amount;
			await user.save();

			await logToChannel(
				`**${interaction.user}** __added__ **${amount.toFixed(2)} RGL-Tokens** to **${userMention(userId)}**'s wallet`,
				interaction.client.logsChannel
			);

			const userObj = await interaction.client.users.fetch(userId).catch(() => null);
			if (!userObj) {
				return await interaction.reply({
					content: "❗ User not found in Discord, but their wallet has been updated.",
					ephemeral: true,
				});
			}
			const { embeds, components } = checkWalletAdminEmbed(userObj, user, interaction.client.serverSettings);

			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});

			await interaction.followUp({
				content: `*✅ Successfully added ${amount.toFixed(2)} RGL-Tokens to ${userObj}'s wallet.*`,
				ephemeral: true,
			});
		} else if (interaction.customId?.startsWith("admin_remove_tokens-")) {
			const userId = interaction.customId.split("-")[1];
			const modal = new ModalBuilder().setCustomId("remove_tokens_submit-" + userId).setTitle("Remove Tokens from Wallet");
			const amountInput = new TextInputBuilder()
				.setCustomId("amount")
				.setLabel("Amount of Tokens to Remove")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const firstRow = new ActionRowBuilder().addComponents(amountInput);
			modal.addComponents(firstRow);
			await interaction.showModal(modal);
		} else if (interaction.customId?.startsWith("remove_tokens_submit-")) {
			const userId = interaction.customId.split("-")[1];
			const amount = parseFloat(interaction.fields.getTextInputValue("amount"));
			if (isNaN(amount) || amount <= 0) {
				return await interaction.reply({ content: "❗ Please enter a valid amount.", ephemeral: true });
			}
			// Find the user and update their wallet
			const [user] = await User.findOrCreate({ where: { discord_id: userId }, defaults: { discord_id: userId } });
			if (!user) {
				return await interaction.reply({ content: "User not found.", ephemeral: true });
			}
			if (user.balance < amount) {
				return await interaction.reply({ content: "❗ Insufficient balance to remove this amount.", ephemeral: true });
			}
			user.balance -= amount;
			await user.save();

			await logToChannel(
				`**${interaction.user}** __removed__ **${amount.toFixed(2)} RGL-Tokens** from **${userMention(userId)}**'s wallet`,
				interaction.client.logsChannel
			);

			const userObj = await interaction.client.users.fetch(userId).catch(() => null);
			if (!userObj) {
				return await interaction.reply({
					content: "❗ User not found in Discord, but their wallet has been updated.",
					ephemeral: true,
				});
			}
			const { embeds, components } = checkWalletAdminEmbed(userObj, user, interaction.client.serverSettings);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
			await interaction.followUp({
				content: `*✅ Successfully removed ${amount.toFixed(2)} RGL-Tokens from ${userObj}'s wallet.*`,
				ephemeral: true,
			});
		}
	},
};
