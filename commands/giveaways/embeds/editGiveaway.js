const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	StringSelectMenuOptionBuilder,
	StringSelectMenuBuilder,
	RoleSelectMenuBuilder,
	channelMention,
} = require("discord.js");
const Giveaway = require("../models/giveaways");

async function editGiveawayEmbed() {
	const giveaways = await Giveaway.findAll({
		where: { status: "active" },
	});

	// create text in a format of "ID: giveaway name"
	const giveawayList = giveaways.map((giveaway) => `**ID: ${giveaway.id}**: ${giveaway.name}`).join("\n");

	// create a select menu with the list of giveaways
	const giveawaySelectMenu = new StringSelectMenuBuilder()
		.setCustomId("giveaways_check_repeat")
		.setPlaceholder("➡️ Change Giveaways Repetitiveness")
		.addOptions(
			giveaways.map((giveaway) => ({
				label: `ID: ${giveaway.id}: ${giveaway.name}`.slice(0, 100),
				description: `Repetitive: ${giveaway.repetitive ? "Yes" : "No"}`,
				value: giveaway.id.toString(),
			}))
		);

	const giveawaysCancel = new StringSelectMenuBuilder()
		.setCustomId("giveaways_cancel")
		.setPlaceholder("❌ Cancel Giveaways")
		.addOptions(
			giveaways.map((giveaway) => ({
				label: `ID: ${giveaway.id}: ${giveaway.name}`.slice(0, 100),
				value: giveaway.id.toString(),
			}))
		);

	// if there are no giveaways, set the placeholder to "No Giveaways"
	if (giveaways.length === 0) {
		giveawaySelectMenu
			.addOptions([
				{
					label: "No Giveaways",
					value: "no_giveaways",
					default: true,
				},
			])
			.setDisabled(true);
		giveawaysCancel
			.addOptions([
				{
					label: "No Giveaways",
					value: "no_giveaways",
					default: true,
				},
			])
			.setDisabled(true);
	}

	const embed = new EmbedBuilder()
		.setColor("ffffff")
		.setTitle(`⚙️ Edit Giveaways`)
		.setDescription(`__▸ List of Active Giveaways__\n${giveawayList.length > 0 ? giveawayList : "No giveaways found."}`)
		.setFooter({ text: `▸ Edit Giveaways` });

	// Create an action row to hold the select menu
	const actionRow = new ActionRowBuilder().addComponents(giveawaySelectMenu);
	const actionRow2 = new ActionRowBuilder().addComponents(giveawaysCancel);

	return { embed, actionRow, actionRow2 };
}

module.exports = editGiveawayEmbed;
