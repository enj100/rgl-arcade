const {
	Events,
	ModalBuilder,
	TextInputStyle,
	TextInputBuilder,
	ActionRowBuilder,
	ButtonStyle,
	ButtonBuilder,
	userMention,
	AttachmentBuilder,
	EmbedBuilder,
} = require("discord.js");
const { createSliderGIF } = require("./embeds/generateGif");
const User = require("../wallet/models/User");
const { processGameResult } = require("../../utils/winners");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction?.customId?.startsWith("slider_accept-")) {
			const [action, player1, player2, amount] = interaction.customId.split("-");
			// Handle the acceptance of the slider duel
			if (isNaN(amount) || parseFloat(amount) <= 0) {
				return await interaction.reply({
					content: `*❗ Invalid amount specified!*`,
					ephemeral: true,
				});
			}

			if (!interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot accept this slider duel!*`,
					ephemeral: true,
				});
			}

			const btn = new ButtonBuilder()
				.setCustomId(`disabled_btn_slider`)
				.setLabel("⏳ Please Wait...")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);
			const disabledRow = new ActionRowBuilder().addComponents(btn);
			await interaction.update({ components: [disabledRow] });

			const p1 = await interaction.client.users.fetch(player1).catch(() => null);
			const p2 = await interaction.client.users.fetch(player2).catch(() => null);

			const { gifBuffer, stoppingItem1, stoppingItem2 } = await createSliderGIF(p1, p2);

			const [player1Wallet] = await User.findOrCreate({
				where: { discord_id: player1 },
				defaults: { discord_id: player1 },
			});
			const [player2Wallet] = await User.findOrCreate({
				where: { discord_id: player2 },
				defaults: { discord_id: player2 },
			});

			if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
				return await interaction.followUp({
					content: `*❗ One of the players does not have enough RGL-Tokens to play this slider duel!*`,
				});
			}
			let winnerId = stoppingItem1 === stoppingItem2 ? "Tie" : stoppingItem1 > stoppingItem2 ? player1 : player2;

			await processGameResult({
				player1,
				player2,
				winner: winnerId,
				amount,
				player1Score: "-",
				player2Score: "-",
				gameName: "🎰 Slider Battle ",
				interaction,
			});

			const attachment = new AttachmentBuilder(gifBuffer, { name: "slider.gif" });

			await interaction.followUp({
				files: [attachment],
			});
		} else if (interaction?.customId?.startsWith("slider_decline-")) {
			const [action, player1, player2] = interaction.customId.split("-");
			if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot decline this slider duel!*`,
					ephemeral: true,
				});
			}

			const canceledBtn = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`slider_canceled-${player1}-${player2}`)
					.setLabel("❌ Slider Canceled")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);

			await interaction.update({
				content: `*❌ ${interaction.user} has declined the Slider Game.*`,
				components: [canceledBtn],
				ephemeral: true,
			});
		}
	},
};

// TO PREVENT DUPE!
// // Check and reserve funds BEFORE image generation
// if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
//     return await interaction.followUp({
//         content: `*❗ One of the players does not have enough RGL-Tokens to play this slider duel!*`,
//     });
// }

// // Deduct the bet amount immediately to "lock" the funds
// player1Wallet.balance -= parseFloat(amount);
// player2Wallet.balance -= parseFloat(amount);
// await player1Wallet.save();
// await player2Wallet.save();

// try {
//     const { gifBuffer, stoppingItem1, stoppingItem2 } = await createSliderGIF(p1, p2);

//     let winnerId = stoppingItem1 === stoppingItem2 ? "Tie" : stoppingItem1 > stoppingItem2 ? player1 : player2;

//     // Now process the result (add winnings, update stats, etc.)
//     await processGameResult({
//         player1,
//         player2,
//         winner: winnerId,
//         amount,
//         player1Score: "-",
//         player2Score: "-",
//         gameName: "🎰 Slider Battle ",
//         interaction,
//     });

//     const attachment = new AttachmentBuilder(gifBuffer, { name: "slider.gif" });
//     await interaction.followUp({ files: [attachment] });

// } catch (err) {
//     // If image generation fails, refund the bet
//     player1Wallet.balance += parseFloat(amount);
//     player2Wallet.balance += parseFloat(amount);
//     await player1Wallet.save();
//     await player2Wallet.save();
//     await interaction.followUp({ content: "❗ An error occurred. Your bet has been refunded." });
// }
