const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, userMention } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("fp")
		.setDescription("⭐Flower poker duel.")
		.addUserOption((option) => option.setName("opponent").setDescription("Select your opponent.").setRequired(true))
		.addNumberOption((option) =>
			option.setName("amount").setDescription("Enter the amount").setRequired(true).setMinValue(0).setMaxValue(1000000)
		),
	async execute(interaction) {
		const player1 = interaction.user.id;
		const player2 = interaction.options.getUser("opponent").id;
		const amount = interaction.options.getNumber("amount");
		const settings = interaction.client.serverSettings;

		if (player2 === player1) {
			return await interaction.reply({ content: `*❗ You can't play vs yourself!*`, ephemeral: true });
		}

		const embed = new EmbedBuilder()
			.setTitle("🌻 Flower Poker")
			.setDescription(
				`🟢 **Player 1:** ${userMention(player1)}\n🔴 **Player 2:** ${userMention(player2)}\n\n▸ **Bet:** ${amount.toFixed(
					2
				)} RGL-Tokens`
			)
			.setColor("FFFF00")
			.setFooter({ text: `RGL-GP - Flower Poker` })
			.setFooter({
				text: `${settings.brand_name} - Flower Poker`,
			});

		if (settings.thumbnail) {
			embed.setThumbnail(settings.thumbnail).setFooter({
				text: `${settings.brand_name} - Flower Poker`,
				iconURL: settings.thumbnail,
			});
		}
		if (settings.color) {
			embed.setColor(settings.color);
		}

		const confirm = new ButtonBuilder()
			.setCustomId(`fp_accept-${player1}-${player2}-${amount}`)
			.setEmoji("✔️")
			.setStyle(ButtonStyle.Success);

		const decline = new ButtonBuilder()
			.setCustomId(`fp_decline-${player1}-${player2}`)
			.setEmoji("✖️")
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder().addComponents(confirm, decline);

		await interaction.reply({ content: `📢 ${userMention(player2)}`, embeds: [embed], components: [row] });

		setTimeout(async () => {
			try {
				const message = await interaction.fetchReply();
				const disabledRow = ActionRowBuilder.from(row).setComponents(
					row.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
				);
				await message.edit({ components: [disabledRow] });
			} catch (e) {
				// Message might have been deleted or already edited, ignore errors
				console.error("Error editing dice duel message:", e);
			}
		}, 60000);
	},
};
