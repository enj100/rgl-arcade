const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	StringSelectMenuOptionBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");
const GiveawayExtraEntriesSets = require("../models/giveawayExtraEntries");

async function giveawayExtraEntriesMenu() {
	// Create the select menu options
	const options = [
		new StringSelectMenuOptionBuilder().setLabel("➕ Create a New Set of Extra Entries Roles").setValue("create_set"),
	];

	const sets = await GiveawayExtraEntriesSets.findAll();
	const setsOptions = sets.map((set) => {
		return new StringSelectMenuOptionBuilder().setLabel(set.name).setValue(`set-${set.id}`);
	});

	// Create the select menu
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId("giveaways_extra_entries_settings")
		.setPlaceholder("➡️ Choose an option")
		.addOptions(options);

	const selectMenu2 = new StringSelectMenuBuilder()
		.setCustomId("giveaways_extra_entries_edit_sets")
		.setPlaceholder("🖊️ Edit Sets")
		.addOptions(setsOptions);

	const selectMenu3 = new StringSelectMenuBuilder()
		.setCustomId("giveaways_extra_entries_remove_sets")
		.setPlaceholder("➖ Remove Sets")
		.addOptions(setsOptions);

	if (sets.length === 0) {
		// add an option
		selectMenu2.addOptions([new StringSelectMenuOptionBuilder().setLabel("No sets available").setValue("no_sets_available")]);
		selectMenu3.addOptions([new StringSelectMenuOptionBuilder().setLabel("No sets available").setValue("no_sets_available")]);

		selectMenu2.setDisabled(true);
		selectMenu3.setDisabled(true);
	}

	// Create an action row to hold the select menu
	const actionRow = new ActionRowBuilder().addComponents(selectMenu);
	const actionRow2 = new ActionRowBuilder().addComponents(selectMenu2);
	const actionRow3 = new ActionRowBuilder().addComponents(selectMenu3);

	// Return the action row
	return { components: [actionRow, actionRow2, actionRow3] };
}

module.exports = giveawayExtraEntriesMenu;
