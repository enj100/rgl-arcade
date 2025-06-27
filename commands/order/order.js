const { SlashCommandBuilder } = require("discord.js");
const User = require("../wallet/models/User");
const { logToChannel } = require("../../utils/logger");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("order")
		.setDefaultMemberPermissions(0)
		.setDescription("⭐ | Create an order for RGL-Tokens.")
		.addUserOption((option) => option.setName("user").setDescription("The user to check").setRequired(true))
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("The amount of RGL-Tokens to add to user")
				.setRequired(true)
				.setMinValue(0.01)
				.setMaxValue(100000)
		),
	async execute(interaction) {
		const user = interaction.options.getUser("user");
		const amount = interaction.options.getNumber("amount");

		const [wallet] = await User.findOrCreate({
			where: { discord_id: user.id },
			defaults: {
				discord_id: user.id,
			},
		});

		wallet.total_bought += amount;
		// apply higher rank if they bought enough already for higher one
		const ranks = interaction.client.ranks;
		let eligibleRank = null;
		for (const rank of ranks) {
			if (wallet.total_bought >= rank.requirement) {
				if (!eligibleRank || rank.requirement > eligibleRank.requirement) {
					eligibleRank = rank;
				}
			}
		}
		console.log(eligibleRank);

		let rankChanged = false;
		if (eligibleRank && wallet.rank !== eligibleRank.role_id) {
			// Remove old rank role if exists
			if (wallet.rank) {
				try {
					const member = await interaction.guild.members.fetch(user.id);
					await member.roles.remove(wallet.rank).catch(() => {});
				} catch {}
			}
			// Assign new rank role
			try {
				const member = await interaction.guild.members.fetch(user.id);
				await member.roles.add(eligibleRank.role_id).catch(() => {});
			} catch {}
			wallet.rank = eligibleRank.role_id;
			rankChanged = true;
		}
		let bonus = 0;
		if (!eligibleRank) {
			wallet.balance += amount;
		} else {
			wallet.balance += amount * (1 + eligibleRank.rakeback / 100);
			bonus = Math.round(amount * (eligibleRank.rakeback / 100));
		}

		await wallet.save();

		let replyMsg = `✅ Successfully added **${amount.toFixed(2)} (+${bonus.toFixed(2)}) RGL-Tokens** to ${user}'s wallet.`;
		if (rankChanged) {
			replyMsg += `\n🏅 ${user} has been promoted to a new rank!`;
		}

		await logToChannel(
			`Order created by **${interaction.user}** and added **${amount.toFixed(2)} RGL-Tokens** to **${user}**'s wallet`,
			interaction.client.logsChannel
		).catch((e) => null);

		await interaction.reply({
			content: replyMsg,
		});
	},
};
