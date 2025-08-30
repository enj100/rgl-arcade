const { SlashCommandBuilder, roleMention } = require("discord.js");
const User = require("../wallet/models/User");
const { logToChannel } = require("../../utils/logger");
const Sub = require("../subs/models/Subs");
const SubSettings = require("../subs/models/SubSettings");

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

		const sub = await Sub.findOne({
			where: { discord_id: user.id },
			defaults: {
				discord_id: user.id,
			},
		});

		const subSettings = await SubSettings.findOne({ where: { id: 0 } });

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

		let rankChanged = false;

		if (eligibleRank && wallet?.rank !== eligibleRank.role_id) {
			// Remove old rank role if exists
			if (wallet.rank) {
				try {
					const member = await interaction.guild.members.fetch(user.id);
					await member.roles.remove(wallet.rank).catch(() => {});
				} catch {}
			}
			// Assign new rank role
			try {
				const member = await interaction.guild.members.fetch(user.id).catch(() => null);
				if (member) {
					await member.roles.add(eligibleRank.role_id).catch((e) => {
						console.log(e);
					});
				}
			} catch {}
			wallet.rank = eligibleRank.role_id;
			rankChanged = true;
		}
		let bonus = 0;
		if (!eligibleRank) {
			wallet.balance += amount;
		} else {
			wallet.balance += amount;
			bonus = (amount * (eligibleRank.rakeback / 100)).toFixed(2);
			wallet.cashback += parseFloat(bonus);
		}

		let subCashback = 0;
		// calculate sub cashback extra
		if (sub && subSettings && subSettings.cashback_percentage) {
			subCashback = (amount * (subSettings.cashback_percentage / 100)).toFixed(2);
			wallet.cashback += parseFloat(subCashback);
		}

		await wallet.save();

		let totalCashback = parseFloat(bonus) + parseFloat(subCashback);
		let replyMsg = `<:red_check:1381871266855649360> Successfully added **${amount.toFixed(2)} (+${totalCashback.toFixed(
			2
		)} Cashback) Tokens** to ${user}'s wallet balance.`;
		if (rankChanged) {
			replyMsg += `\n<:arcade:1387956639578984589> ${user} has been promoted to ${roleMention(eligibleRank.role_id)}!`;
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
