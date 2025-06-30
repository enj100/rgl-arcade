const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
} = require("discord.js");

async function buildFeedbackSettingsEmbed(interaction) {
	const settings = interaction.client.feedbackSettings;
	console.log(settings);

	const feedbackChannel = `▸ **Feedback Channel:** ${
		settings.feedbacks_channel ? channelMention(settings.feedbacks_channel) : "Not set."
	}\n`;
	const description = `▸ **Feedback Embed Description:**\n ${
		settings.feedback_description ? settings.feedback_description : "Not set."
	}\n`;

	const embed = new EmbedBuilder().setTitle("Feedback Settings").setDescription(`${feedbackChannel}${description}`);

	if (settings.color) {
		embed.setColor(settings.color);
	}
	if (settings.thumbnail && settings.thumbnail.length > 0) {
		embed.setThumbnail(settings.thumbnail);
	}
	if (settings.image && settings.image.length > 0) {
		embed.setImage(settings.image);
	}

	const editButton = new ButtonBuilder().setCustomId("feedback_settings_edit").setLabel("⚙️ Edit").setStyle(ButtonStyle.Primary);

	const channelButton = new ChannelSelectMenuBuilder()
		.setCustomId("feedback_settings_channel")
		.setPlaceholder("➡️ Change Feedback Channel")
		.setMinValues(1)
		.setMaxValues(1);

	const row1 = new ActionRowBuilder().addComponents(editButton);
	const row2 = new ActionRowBuilder().addComponents(channelButton);

	return {
		embed,
		components: [row1, row2],
	};
}

module.exports = buildFeedbackSettingsEmbed;
