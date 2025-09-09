const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const FpLiveSettings = require("./models/Settings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("live_fp_counter")
		.setDescription("⭐Check Live Flower Poker Profits")
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		const settings = await FpLiveSettings.findOne({ where: { id: 0 } });

		const embed = new EmbedBuilder()
			.setColor("#0099ff")
			.setTitle("🌻 Live Flower Poker Profits")
			.setDescription(`**▸ Total Profit:** ${settings.profit.toFixed(2)} RGL-Tokens\n\n*Profit updates after each game!*`)
			.setTimestamp();

		if (settings.thumbnail) {
			embed.setThumbnail(settings.thumbnail);
		}

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
