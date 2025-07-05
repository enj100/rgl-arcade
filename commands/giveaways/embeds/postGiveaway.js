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

// calculate end date
function calculateEndDate(duration) {
	const now = new Date();
	const durationRegex = /(\d+)([dhm])/g;
	let match;

	while ((match = durationRegex.exec(duration)) !== null) {
		const value = parseInt(match[1], 10);
		const unit = match[2];

		if (unit === "d") {
			now.setDate(now.getDate() + value); // Add days
		} else if (unit === "h") {
			now.setHours(now.getHours() + value); // Add hours
		} else if (unit === "m") {
			now.setMinutes(now.getMinutes() + value); // Add minutes
		}
	}

	return now;
}

function formatDiscordTimestamp(date) {
	// Convert the date to a Discord timestamp format
	return `<t:${Math.floor(date.getTime() / 1000)}:f>`;
}

async function postGiveawayEmbed(giveaway, status = `🟢 Active!`) {
	// calculate end date
	const endDateCalc = calculateEndDate(giveaway.duration);
	giveaway.endDate = endDateCalc; // Update the giveaway object with the calculated end date
	const endDate = `▸ **End Date:** ${formatDiscordTimestamp(endDateCalc)}\n\n`;

	const winners = `▸ **Winners:** ${giveaway.winners_amount ?? "No winners specified"}\n`;
	const prize = `▸ **Prize:** ${giveaway.prize ?? "No prize specified"}\n`;

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

	const roles = `➡️ **Roles to Enter:** ${
		rolesList ? rolesList.map((role) => `<@&${role}>`).join(", ") : "Any role can enter."
	}\n`;

	const giveawayEmbed = new EmbedBuilder()
		.setColor(giveaway.color)
		.setTitle(giveaway.name)
		.setDescription(`\n${giveaway.description ?? ""}\n\n${winners}${prize}${endDate}${roles}${extraEntriesText}`)
		.setFooter({ text: `${status}` });

	if (giveaway.image_url) {
		giveawayEmbed.setImage(giveaway.image_url);
	}
	if (giveaway.thumbnail_url) {
		giveawayEmbed.setThumbnail(giveaway.thumbnail_url);
	}

	const joinButton = new ButtonBuilder().setCustomId(`giveaway_join-${giveaway.id}`).setEmoji("🎉").setStyle(ButtonStyle.Primary);
	const participantsButton = new ButtonBuilder()
		.setCustomId(`giveaway_participants-${giveaway.id}`)
		.setEmoji("👥")
		.setStyle(ButtonStyle.Secondary);

	// Create an action row to hold the select menu
	const giveawayActionRow = new ActionRowBuilder().addComponents(joinButton, participantsButton);

	return { giveawayEmbed, giveawayActionRow };
}

module.exports = postGiveawayEmbed;
