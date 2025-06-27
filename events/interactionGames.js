const {
	ActionRowBuilder,
	ButtonBuilder,
	Events,
	userMention,
	ButtonStyle,
	EmbedBuilder,
	AttachmentBuilder,
} = require("discord.js");
const User = require("../commands/wallet/models/User");
const path = require("path");
const fs = require("fs");
const { processGameResult } = require("../utils/winners");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		///////////////////////////////////////////////////
		////////////////// DICE DUEL //////////////////
		///////////////////////////////////////////////////
		else if (interaction?.customId?.startsWith("diceduel_accept-")) {
			const [action, player1, player2, amount] = interaction.customId.split("-");
			// Handle the acceptance of the dice duel
			if (isNaN(amount) || parseFloat(amount) <= 0) {
				return await interaction.reply({
					content: `*❗ Invalid amount specified!*`,
					ephemeral: true,
				});
			}
			if (!interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot accept this dice duel!*`,
					ephemeral: true,
				});
			}

			const [player1Wallet] = await User.findOrCreate({
				where: { discord_id: player1 },
				defaults: { discord_id: player1 },
			});
			const [player2Wallet] = await User.findOrCreate({
				where: { discord_id: player2 },
				defaults: { discord_id: player2 },
			});

			if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
				return await interaction.reply({
					content: `*❗ One of the players does not have enough RGL-Tokens to play this dice duel!*`,
					ephemeral: true,
				});
			}

			const player1Dice = Math.floor(Math.random() * 100) + 1;
			const player2Dice = Math.floor(Math.random() * 100) + 1;
			const winner = player1Dice > player2Dice ? player1 : player2Dice > player1Dice ? player2 : "Tie";

			await processGameResult({
				player1,
				player2,
				winner,
				amount,
				player1Score: player1Dice,
				player2Score: player2Dice,
				gameName: "🎲 Dice Duel",
				interaction,
			});

			await interaction.update({ components: [] });
			await interaction.followUp({
				content: `🎲 ${userMention(player1)} rolled... **${player1Dice}**!`,
			});
			setTimeout(async () => {
				await interaction.followUp({
					content: `🎲 ${userMention(player2)} rolled... **${player2Dice}**!`,
				});
			}, 1000);
			setTimeout(async () => {
				await interaction.followUp({
					content: `${winner === "Tie" ? "🎲 It's a tie!" : `🎲 The winner is ${userMention(winner)}🥳`}`,
				});
			}, 2000);
		} else if (interaction?.customId?.startsWith("diceduel_decline-")) {
			const [action, player1, player2] = interaction.customId.split("-");
			if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot decline this dice duel!*`,
					ephemeral: true,
				});
			}

			const canceledBtn = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`diceduel_canceled-${player1}-${player2}`)
					.setLabel("❌ Duel Canceled")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);

			await interaction.update({
				content: `*❌ ${interaction.user} has declined the Dice Duel.*`,
				components: [canceledBtn],
				ephemeral: true,
			});
		}
		///////////////////////////////////////////////////
		////////////////// WHIP DUEL //////////////////
		///////////////////////////////////////////////////
		else if (interaction?.customId?.startsWith("whip_accept-")) {
			const [action, player1, player2, amount] = interaction.customId.split("-");
			// Handle the acceptance of the dice duel
			if (isNaN(amount) || parseFloat(amount) <= 0) {
				return await interaction.reply({
					content: `*❗ Invalid amount specified!*`,
					ephemeral: true,
				});
			}
			if (!interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot accept this whip duel!*`,
					ephemeral: true,
				});
			}

			const [player1Wallet] = await User.findOrCreate({
				where: { discord_id: player1 },
				defaults: { discord_id: player1 },
			});
			const [player2Wallet] = await User.findOrCreate({
				where: { discord_id: player2 },
				defaults: { discord_id: player2 },
			});

			if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
				return await interaction.reply({
					content: `*❗ One of the players does not have enough RGL-Tokens to play this whip duel!*`,
					ephemeral: true,
				});
			}

			// 1. Randomly pick winner side
			const sides = ["left", "right"];
			const winnerSide = sides[Math.floor(Math.random() * sides.length)];

			// we know the winner already
			const winner = winnerSide === "left" ? player1 : player2;

			await processGameResult({
				player1,
				player2,
				winner,
				amount,
				player1Score: "-",
				player2Score: "-",
				gameName: "⚔️ Whip Duel",
				interaction,
			});

			const gifsDir = path.join(__dirname, `../commands/whip/assets/${winnerSide}`);
			const gifFiles = fs.readdirSync(gifsDir);
			const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
			console.log(`Selected GIF: ${randomGif}`);
			const gifPath = path.join(gifsDir, randomGif);
			const attachment = new AttachmentBuilder(gifPath, { name: randomGif });

			const editedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

			editedEmbed.setImage(`attachment://${randomGif}`);

			await interaction.update({
				embeds: [editedEmbed],
				files: [attachment],
				components: [],
			});
		} else if (interaction?.customId?.startsWith("whip_decline-")) {
			const [action, player1, player2] = interaction.customId.split("-");
			if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot decline this whip duel!*`,
					ephemeral: true,
				});
			}

			const canceledBtn = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`whip_canceled-${player1}-${player2}`)
					.setLabel("❌ Whip Duel Canceled")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);

			await interaction.update({
				content: `*❌ ${interaction.user} has declined the Whip Duel.*`,
				components: [canceledBtn],
				ephemeral: true,
			});
		}
	},
};
