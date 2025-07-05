const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	StringSelectMenuOptionBuilder,
	StringSelectMenuBuilder,
	RoleSelectMenuBuilder,
} = require("discord.js");

async function giveawayExtraEntriesEmbed(interaction, set) {
	const extraEntriesList = set.extra_entries ? set.extra_entries.split(",") : null;

	const extraEntries = extraEntriesList
		? extraEntriesList
				.map((entry) => {
					const [roleId, entries] = entry.split(":"); // Split roleId and entries
					return `<@&${roleId}> (${entries} Entries)`; // Format the output
				})
				.join("\n") // Join each formatted entry with a newline
		: "No extra entries specified";

	const embed = new EmbedBuilder()
		.setColor("ffffff")
		.setTitle(`${set.name}`)
		.setDescription(`${extraEntries.length > 0 ? extraEntries : "No extra entries found."}`);

	// Extra entries
	const rolesEntriesSelectMenu = new RoleSelectMenuBuilder({
		custom_id: "giveaways_create_extra_entries_roles-" + set.id,
		placeholder: "🎁 Extra Entries (Add/Remove)",
	});

	const row = new ActionRowBuilder().addComponents(rolesEntriesSelectMenu);

	return {
		embeds: [embed],
		components: [row],
	};
}

module.exports = giveawayExtraEntriesEmbed;
