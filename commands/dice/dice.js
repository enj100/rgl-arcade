const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, userMention } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("dice")
		.setDescription("⭐ | Dice duel.")
		.addUserOption((option) => option.setName("opponent").setDescription("▸ Select your opponent.").setRequired(true))
		.addNumberOption((option) =>
			option
				.setName("amount")
				.setDescription("▸ Enter the amount of RGL-Tokens")
				.setRequired(true)
				.setMinValue(0.1)
				.setMaxValue(1000000)
		),
	async execute(interaction) {
		if (interaction) {
			const player1 = interaction.user.id;
			const player2 = interaction.options.getUser("opponent").id;
			const amount = interaction.options.getNumber("amount");
			const settings = interaction.client.serverSettings;

			if (player2 === player1) {
				return await interaction.reply({ content: `*❗ You can't play vs yourself!*`, ephemeral: true });
			}
			const embed = new EmbedBuilder()
				.setTitle("🎲 Dice Duel 🎲")
				.setDescription(
					`🟢 **Player 1:** ${userMention(player1)}\n🔴 **Player 2:** ${userMention(player2)}\n\n▸ **Bet:** ${amount.toFixed(
						2
					)} RGL-Tokens`
				)
				.setFooter({
					text: `${settings.brand_name} - Dice Duel`,
					iconURL: settings.thumbnail,
				})
				.setColor(settings.color);

			if (settings.thumbnail) {
				embed.setThumbnail(settings.thumbnail);
			}

			const buttons = new ActionRowBuilder();
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId(`diceduel_accept-${player1}-${player2}-${amount}`)
					.setLabel("✔️")
					.setStyle(ButtonStyle.Success)
			);
			buttons.addComponents(
				new ButtonBuilder().setCustomId(`diceduel_decline-${player1}-${player2}`).setLabel("✖️").setStyle(ButtonStyle.Danger)
			);
			await interaction.reply({ content: `📢 ${userMention(player2)}`, embeds: [embed], components: [buttons] });

			setTimeout(async () => {
				try {
					const message = await interaction.fetchReply();
					const disabledRow = ActionRowBuilder.from(buttons).setComponents(
						buttons.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
					);
					await message.edit({ components: [disabledRow] });
				} catch (e) {
					// Message might have been deleted or already edited, ignore errors
					console.error("Error editing dice duel message:", e);
				}
			}, 60000);
		}
	},
};
