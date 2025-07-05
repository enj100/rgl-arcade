const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	StringSelectMenuOptionBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");

async function giveawaySettingsEmbed() {
	// Create the select menu options
	const options = [
		new StringSelectMenuOptionBuilder()
			.setLabel("➕ Create a New Giveaway")
			.setDescription("Start a new giveaway")
			.setValue("giveaways_create"),
		new StringSelectMenuOptionBuilder()
			.setLabel("✅ Check Giveaways")
			.setDescription("View and edit ongoing giveaways")
			.setValue("giveaways_check"),
		new StringSelectMenuOptionBuilder()
			.setLabel("🔁 Re-Roll Giveaway")
			.setDescription("Re-roll a giveaway. Just copy/paste the message ID!")
			.setValue("giveaways_reroll"),
		new StringSelectMenuOptionBuilder()
			.setLabel("🎟️ Extra Entries Roles")
			.setDescription("View and edit extra entries roles")
			.setValue("giveaways_extra_entries"),
	];

	// Create the select menu
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId("giveaways_settings")
		.setPlaceholder("➡️ Choose an option")
		.addOptions(options);

	// Create an action row to hold the select menu
	const actionRow = new ActionRowBuilder().addComponents(selectMenu);

	// Return the action row
	return actionRow;
}

module.exports = giveawaySettingsEmbed;
