const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	userMention,
	ContainerBuilder,
	MessageFlags,
	AttachmentBuilder,
} = require("discord.js");
const User = require("../wallet/models/User");
const path = require("path");
const fs = require("fs");
const { updateWinnerStats } = require("../../utils/updateWinnersStats");
const { logToChannel } = require("../../utils/logger");
const HouseGamesProfit = require("../house_games_check/models/HouseGamesProfit");
const { createCanvas } = require("canvas");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("dice_house")
		.setDescription("⭐ | Dice duel vs house bot.")
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("▸ Enter the amount of RGL-Tokens")
				.setRequired(true)
				.setMinValue(0.1)
				.setMaxValue(1000000)
		)
		.addStringOption((option) =>
			option
				.setName("option")
				.setDescription("▸ Choose an option")
				.setRequired(true)
				.addChoices(
					{ name: "Under [0-47]", value: "under" },
					{ name: "Middle [27-74]", value: "middle" },
					{ name: "Over [53-100]", value: "over" }
				)
		),
	async execute(interaction) {
		if (interaction) {
			const amount = interaction.options.getNumber("amount");
			const userId = interaction.user.id;
			const option = interaction.options.getString("option");

			let [user] = await User.findOrCreate({ where: { discord_id: userId } });

			if (user.balance < amount) {
				return await interaction.reply({ content: `*❗ You don't have enough RGL-Tokens to place this bet!*`, ephemeral: true });
			}
			if (amount > parseFloat(process.env.HOUSE_MAX_BET)) {
				return await interaction.reply({
					content: `*❗ The maximum bet for Whip Duel is ${process.env.HOUSE_MAX_BET} RGL-Tokens!*`,
					ephemeral: true,
				});
			}

			const bet = `▸ **Bet:** ${amount.toFixed(2)} RGL-Tokens`;
			const multiplierText = `▸ **Multiplier:** x${parseFloat(process.env.HOUSE_DICE_MULTIPLIER)}`;

			// 1. Randomly pick winner side
			const randomDice = +(Math.random() * 99 + 1).toFixed(2);
			let winner = "RGL House Bot";
			if (option === "under" && randomDice <= 47.0) {
				winner = userId;
			} else if (option === "middle" && randomDice >= 27.0 && randomDice <= 74.0) {
				winner = userId;
			} else if (option === "over" && randomDice >= 53.0) {
				winner = userId;
			}

			await updateWinnerStats(user, amount, winner === userId, parseFloat(process.env.HOUSE_DICE_MULTIPLIER));

			// update profit
			const [profit] = await HouseGamesProfit.findOrCreate({ where: { id: 0 } });
			if (winner === userId) {
				profit.dice_duel -= amount * (parseFloat(process.env.HOUSE_DICE_MULTIPLIER) - 1);
			} else {
				profit.dice_duel += amount;
			}
			await profit.save();

			const canvas = createCanvas(200, 200);
			const ctx = canvas.getContext("2d");
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, 200, 200);

			ctx.fillStyle = winner === userId ? "#00FF00" : "#FF0000";
			ctx.font = "bold 24px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(`${randomDice}`, 100, 100);

			const buffer = canvas.toBuffer("image/png");
			const attachment = new AttachmentBuilder(buffer, { name: "dice_result.png" });

			const whipContainer = new ContainerBuilder()
				.setAccentColor(0xff0000)
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## 🎲 Dice Duel 🎲`))
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Dice Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
				)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						`▸ **Bettor:** ${interaction.user}\n${bet}\n▸ **Option Chosen:** ${
							option === "under" ? "Under [0-47]" : option === "middle" ? "Middle [27-74]" : "Over [53-100]"
						}\n${multiplierText}`
					)
				)
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Dice Duel").setURL("attachment://dice_result.png").setSpoiler(true))
				)
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Dice Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
				)
				.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`dice_house_repeat-${userId}-${amount}-${option}`)
							.setLabel("🔁 Play Again!")
							.setStyle(ButtonStyle.Secondary)
					)
				);

			await interaction.reply({ components: [whipContainer], files: [attachment], flags: [MessageFlags.IsComponentsV2] });

			await logToChannel(
				`🎲 User ${interaction.user} just played **Dice Duel [house game]** and ${winner === userId ? "won" : "lost"} ${
					winner === userId ? (amount * parseFloat(process.env.HOUSE_DICE_MULTIPLIER)).toFixed(2) : amount.toFixed(2)
				} RGL-Tokens!\n\n**▸ User Bet:** ${
					option === "under" ? "Under [0-47]" : option === "middle" ? "Middle [27-74]" : "Over [53-100]"
				}\n**▸ Result:** ${winner === userId ? "User" : "RGL House Bot"}\n▸ **Dice Roll:** ${randomDice}\n${bet}\n▸ **Result:** ${
					winner === userId ? "won" : "lost"
				}`,
				interaction.client.logsChannel,
				"FF0000",
				"<:games:1381870887623594035> Game Results"
			);
		}
	},
};
