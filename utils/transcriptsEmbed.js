const { EmbedBuilder } = require("discord.js");

/**
 * Creates a universal embed for transcripts.
 *
 * @param {string} userId - The ID of the user who initiated or was involved in the ticket.
 * @param {string} ticketName - The ticket name.
 * @param {string} transcriptLink - The link to the transcript file.
 * @param {Date} closedDate - The date when the ticket was closed.
 * @param {Object} [extraInfo={}] - Additional information to include in the embed (optional).
 * @returns {EmbedBuilder} - The formatted embed.
 */
function createTranscriptEmbed(
	userId,
	closedBy,
	ticketName,
	transcriptLink,
	closedDate,
	extraInfo = {},
	title = "📄 Ticket Transcript"
) {
	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(`Here is the transcript for the ticket.`)
		.setColor("0000FF")
		.addFields(
			{ name: "Ticket Name", value: ticketName, inline: true },
			{ name: "Customer", value: `<@${userId}> (${userId})`, inline: true },
			{ name: "Closed By", value: `<@${closedBy}> (${closedBy})`, inline: true },
			{ name: "Closed On", value: `<t:${Math.floor(closedDate.getTime() / 1000)}:F>`, inline: true }, // Discord timestamp
			{ name: "Transcript", value: `[Click here to view the transcript](${transcriptLink})`, inline: false }
		);

	// Add extra information if provided
	for (const [key, value] of Object.entries(extraInfo)) {
		embed.addFields({ name: key, value: value, inline: false });
	}

	embed.setFooter({ text: "Ticket System", iconURL: "https://example.com/icon.png" }); // Optional footer
	embed.setTimestamp(); // Adds the current timestamp

	return embed;
}

module.exports = { createTranscriptEmbed };
