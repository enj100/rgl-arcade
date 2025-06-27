const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	roleMention,
	RoleSelectMenuBuilder,
} = require("discord.js");

async function rankSystemEmbed(interaction) {
	const ranks = interaction.client.ranks;

	let rankText = "";
	for (const rank of ranks) {
		rankText += `▸ \`${rank.requirement.toFixed(2)}C\` ▸ ${roleMention(rank.role_id)}*(${rank.rakeback.toFixed(2)}%)*\n`;
	}

	// create options for select menu
	const options = ranks.map((rank) => {
		return {
			label: `Requirement: ${rank.requirement.toFixed(2)}C`,
			value: rank.role_id,
		};
	});

	const embed = new EmbedBuilder()
		.setTitle("Rank System Settings")
		.setColor("FFFFFF")
		.setDescription(`__▸ Requirement(RGL-Tokens) ▸ Rank (rakeback %)__\n\n${rankText}`)
		.setFooter({
			text: `⭐ ${ranks.length}/25 Ranks`,
		});

	const addRank = new RoleSelectMenuBuilder()
		.setCustomId("rank_system_add_rank")
		.setPlaceholder("➕ Add Rank")
		.setMinValues(1)
		.setMaxValues(1);

	const removeRank = new StringSelectMenuBuilder()
		.setCustomId("rank_system_remove_rank")
		.setPlaceholder("➖ Remove Rank")
		.addOptions(options);

	const editRank = new StringSelectMenuBuilder()
		.setCustomId("rank_system_edit_rank")
		.setPlaceholder("✏️ Edit Rank")
		.addOptions(options);

	if (ranks.length === 0) {
		removeRank.addOptions([
			{
				label: "❌ No ranks available",
				value: "no_ranks",
				default: true,
			},
		]);
		removeRank.setDisabled(true);
		editRank.addOptions([
			{
				label: "❌ No ranks available",
				value: "no_ranks",
				default: true,
			},
		]);
		editRank.setDisabled(true);
	}

	const row1 = new ActionRowBuilder().addComponents(addRank);
	const row2 = new ActionRowBuilder().addComponents(editRank);
	const row3 = new ActionRowBuilder().addComponents(removeRank);

	return {
		embeds: [embed],
		components: [row1, row2, row3],
	};
}

module.exports = rankSystemEmbed;
