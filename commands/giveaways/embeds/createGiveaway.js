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
const GiveawayExtraEntriesSets = require("../models/giveawayExtraEntries");

// Helper function to get ordinal suffix (e.g., 1st, 2nd, 3rd)
function getOrdinalSuffix(n) {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}

async function createGiveawayEmbed() {
	const [giveaway] = await Giveaway.findOrCreate({
		where: { status: "creating" },
	});

	const channel = `➡️ **Channel:** ${giveaway.channel ? channelMention(giveaway.channel) : "No channel specified"}\n`;
	const duration = `➡️ **Duration:** ${giveaway.duration ?? "No duration specified"}\n`;
	const repetitive = `➡️ **Repetitive:** ${giveaway.repetitive ? "Yes" : "No"}\n`;
	const winners = `➡️ **Winners:** ${giveaway.winners_amount ?? "No winners specified"}\n`;
	const prize = `➡️ **Prize:** ${giveaway.prize ?? "No prize specified"}\n`;

	const rolesList = giveaway.roles ? giveaway.roles.split(",") : null;

	const extraEntriesList = giveaway.extra_entries ? giveaway.extra_entries.split(",") : null;

	const extraEntries = extraEntriesList
		? extraEntriesList
				.map((entry) => {
					const [roleId, entries] = entry.split(":"); // Split roleId and entries
					return `<@&${roleId}> (${entries} Entries)`; // Format the output
				})
				.join("\n") // Join each formatted entry with a newline
		: "No extra entries specified";

	const extraEntriesText = `➡️ **Extra Entries:**\n ${extraEntries}\n`;

	const roles = `➡️ **Roles:** ${
		rolesList ? rolesList.map((role) => `<@&${role}>`).join(", ") : "No roles specified(Any role can enter)"
	}\n`;

	const embed = new EmbedBuilder()
		.setColor(giveaway.color)
		.setTitle(giveaway.name)
		.setDescription(
			`${giveaway.description ?? ""}\n\n${channel}${duration}${repetitive}${winners}${prize}${roles}${extraEntriesText}`
		)
		.setFooter({ text: `▸ Giveaway in progress...` });

	if (giveaway.image_url) {
		embed.setImage(giveaway.image_url);
	}
	if (giveaway.thumbnail_url) {
		embed.setThumbnail(giveaway.thumbnail_url);
	}

	// const winnersSelectMenu = new StringSelectMenuBuilder()
	// 	.setCustomId("giveaways_create_winners")
	// 	.setPlaceholder("➕ Add Prizes")
	// 	.addOptions(
	// 		Array.from({ length: giveaway.winners_amount || 0 }, (_, i) => ({
	// 			label: `${i + 1}${getOrdinalSuffix(i + 1)} Place`,
	// 			description: `Select the prize for the ${i + 1}${getOrdinalSuffix(i + 1)} place.`,
	// 			value: `place_${i + 1}`,
	// 		}))
	// 	);

	// Create the select menu options
	const options = [
		new StringSelectMenuOptionBuilder().setLabel("➕ Change Info").setValue("change_info"),
		new StringSelectMenuOptionBuilder().setLabel("⏳ Change Duration").setValue("duration"),
		new StringSelectMenuOptionBuilder().setLabel(`🔁 Repeat Auto: ${giveaway.repetitive ? "Yes" : "No"}`).setValue("repeat"),
		new StringSelectMenuOptionBuilder().setLabel("🎉 Edit Winners").setValue("winners"),
		new StringSelectMenuOptionBuilder().setLabel("🎁 Edit Prize").setValue("prize"),
		new StringSelectMenuOptionBuilder().setLabel("⚙️ Set Channel").setValue("channel"),
		new StringSelectMenuOptionBuilder().setLabel("✅ Start!").setValue("start"),
	];

	const sets = await GiveawayExtraEntriesSets.findAll();

	const setsOptions = sets.map((set) => {
		return new StringSelectMenuOptionBuilder().setLabel(set.name).setValue(`set-${set.id}`);
	});

	// Select roles
	const rolesSelectMenu = new RoleSelectMenuBuilder({
		custom_id: "giveaways_create_roles",
		placeholder: "😁 Add Roles to Join!",
		minValues: 1,
		maxValues: 20,
	});

	// Extra entries
	const rolesEntriesSelectMenu = new StringSelectMenuBuilder({
		custom_id: "giveaways_create_extra_entries_choose_set",
		placeholder: "🎁 Extra Entries Sets",
	}).addOptions(setsOptions);

	if (sets.length === 0) {
		// add an option
		rolesEntriesSelectMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel("No Extra Entries Sets")
				.setValue("no_sets")
				.setDescription("No extra entries sets available.")
		);

		rolesEntriesSelectMenu.setDisabled(true);
	}

	// Create the select menu
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId("giveaways_create")
		.setPlaceholder("➡️ Choose an Option")
		.addOptions(options);

	// Create an action row to hold the select menu
	const actionRow = new ActionRowBuilder().addComponents(selectMenu);
	const actionRow2 = new ActionRowBuilder().addComponents(rolesSelectMenu);
	const actionRow3 = new ActionRowBuilder().addComponents(rolesEntriesSelectMenu);
	// const actionRow4 = new ActionRowBuilder().addComponents(winnersSelectMenu);

	return { embed, actionRow, actionRow2, actionRow3 };
}

module.exports = createGiveawayEmbed;
