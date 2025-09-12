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
const WhipHouseLastBets = require("./models/WhipHouseLastBets");
const { updateWinnerStats } = require("../../utils/updateWinnersStats");
const { logToChannel } = require("../../utils/logger");
const HouseGamesProfit = require("../house_games_check/models/HouseGamesProfit");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("whip_house")
		.setDescription("⭐ | Whip duel vs bot.")
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
				.setName("side")
				.setDescription("▸ Choose your fighter.")
				.setRequired(true)
				.addChoices({ name: "Right [Jason]", value: "right" }, { name: "Left [Jaxson]", value: "left" })
		),
	async execute(interaction) {
		if (interaction) {
			const amount = interaction.options.getNumber("amount");
			const side = interaction.options.getString("side");
			const userId = interaction.user.id;

			let [user] = await User.findOrCreate({ where: { discord_id: userId } });
			const [streak] = await WhipHouseLastBets.findOrCreate({ where: { discord_id: userId } });

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
			const multiplierText = `▸ **Multiplier:** x${parseFloat(process.env.HOUSE_WHIP_MULTIPLIER)}`;

			// 1. Randomly pick winner side
			const sides = ["left", "right"];
			const winnerSide = sides[Math.floor(Math.random() * sides.length)];
			const winner = winnerSide === side ? userId : "RGL House Bot";
			await updateWinnerStats(user, amount, winner === userId, parseFloat(process.env.HOUSE_WHIP_MULTIPLIER));

			// update profit
			const [profit] = await HouseGamesProfit.findOrCreate({ where: { id: 0 } });
			if (winner === userId) {
				profit.whip_duel -= amount * (parseFloat(process.env.HOUSE_WHIP_MULTIPLIER) - 1);
			} else {
				profit.whip_duel += amount;
			}
			await profit.save();

			// update streak
			const betResult = winnerSide === "left" ? "⬅️" : "➡️";
			const displayStreak = streak.last_bets;
			let lastBets = streak.last_bets ? streak.last_bets.split(" ") : [];
			if (lastBets.length >= 5) {
				lastBets.shift(); // Remove oldest
			}
			lastBets.push(betResult);
			streak.last_bets = lastBets.join(" ");
			// console.log(streak.last_bets);
			await streak.save();

			const gifsDir = path.join(__dirname, `./assets/${winnerSide}`);
			const gifFiles = fs.readdirSync(gifsDir);
			const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
			const gifPath = path.join(gifsDir, randomGif);
			const attachment = new AttachmentBuilder(gifPath);

			const whipContainer = new ContainerBuilder()
				.setAccentColor(0xff0000)
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## ⚔️ Whip Duel ⚔️`))
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
				)
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent(
								`▸ **Bettor:** ${interaction.user}\n${bet}\n${multiplierText}\n▸ **Last Results:** ${
									displayStreak?.length > 0 ? displayStreak : "-"
								}`
							)
						)
						.setButtonAccessory((button) =>
							button
								.setLabel(`${side === "left" ? "Jaxson ⬅️" : "Jason ➡️"}`)
								.setStyle(ButtonStyle.Secondary)
								.setCustomId(`test`)
								.setDisabled(true)
						)
				)
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
				)
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`attachment://${randomGif}`))
				)
				.addMediaGalleryComponents((gallery) =>
					gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
				)
				.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`whip_house_repeat-${userId}-${amount}-${side}`)
							.setLabel("🔁 Play Again!")
							.setStyle(ButtonStyle.Secondary)
					)
				);

			await interaction.reply({ components: [whipContainer], files: [attachment], flags: [MessageFlags.IsComponentsV2] });

			await logToChannel(
				`⚔️ User ${interaction.user} just played **Whip Duel [house game]** and ${winner === userId ? "won" : "lost"} ${
					winner === userId ? (amount * parseFloat(process.env.HOUSE_WHIP_MULTIPLIER)).toFixed(2) : amount.toFixed(2)
				} RGL-Tokens!\n\n**▸ User Bet:** ${side === "left" ? "Jaxson ⬅️" : "Jason ➡️"}\n**▸ Result:** ${
					winnerSide === "left" ? "Jaxson ⬅️" : "Jason ➡️"
				}\n${bet}`,
				interaction.client.logsChannel,
				"FF0000",
				"<:games:1381870887623594035> Game Results"
			);
		}
	},
};
