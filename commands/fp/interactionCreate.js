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
} = require("discord.js");
const { createFpGif } = require("./embeds/generateGif");
const User = require("../wallet/models/User");
const { processGameResult } = require("../../utils/winners");
const KothSettings = require("../king-of-hill/models/settings");
const KothLeaderboard = require("../king-of-hill/models/Leaderboard");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) return;
        else if (interaction?.customId?.startsWith("fp_accept-")) {
            const [action, player1, player2, amount] = interaction.customId.split("-");
            // Handle the acceptance of the fp duel
            if (isNaN(amount) || parseFloat(amount) <= 0) {
                return await interaction.reply({
                    content: `*❗ Invalid amount specified!*`,
                    ephemeral: true,
                });
            }

            if (!interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot accept this flower poker duel!*`,
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
                    content: `*❗ One of the players does not have enough RGL-Tokens to play this flower poker duel!*`,
                    ephemeral: true,
                });
            }
            await interaction.update({ components: [] });

            const { winnerId, gif } = await createFpGif(player2, player1, interaction, "none", amount);

            const kothSettings = await KothSettings.findOne({ where: { id: 0 } });
            if (kothSettings && kothSettings.status && winnerId !== "Tie") {
                // increment in the leaderboard
                const [entry] = await KothLeaderboard.findOrCreate({
                    where: { discord_id: winnerId },
                    defaults: { discord_id: winnerId, wins: 0 },
                });
                await KothLeaderboard.increment("wins", { by: 1, where: { discord_id: winnerId } });
            }
            const attachment = new AttachmentBuilder(gif, { name: "fp.gif" });
            await interaction.followUp({ files: [attachment] });
            await processGameResult({
                player1,
                player2,
                winner: winnerId,
                amount,
                player1Score: "-",
                player2Score: "-",
                gameName: "🌻 Flower Poker",
                interaction,
            });
        } else if (interaction?.customId?.startsWith("fp_decline-")) {
            const [action, player1, player2] = interaction.customId.split("-");
            if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot decline this flower poker duel!*`,
                    ephemeral: true,
                });
            }

            const canceledBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`fp_canceled-${player1}-${player2}`)
                    .setLabel("❌ FP Canceled")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await interaction.update({
                content: `*❌ ${interaction.user} has declined the Flower Poker Game.*`,
                components: [canceledBtn],
                ephemeral: true,
            });
        }
    },
};
