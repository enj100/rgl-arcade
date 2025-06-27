const { SlashCommandBuilder, EmbedBuilder, userMention } = require("discord.js");
const CommunityRaffleTickets = require("./models/RaffleTickets");
const { fn, col } = require("sequelize");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("com_raffle_check")
		.setDefaultMemberPermissions("0")
		.setDescription("⭐ | Community Raffle: check users tickets."),
	async execute(interaction) {
		const allTickets = await CommunityRaffleTickets.findAll({
			attributes: ["discord_id", [fn("COUNT", col("discord_id")), "count"]],
			group: ["discord_id"],
			raw: true,
		});

		const text = allTickets.map((t) => `${userMention(t.discord_id)} ▸ ${t.count}`).join("\n");

		const embed = new EmbedBuilder()
			.setTitle(`🎟️ User Raffle Tickets`)
			.setDescription(`${text.length > 0 ? text : "-"}`)
			.setColor("ffffff");

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
