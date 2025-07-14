const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	channelMention,
} = require("discord.js");
const JackpotSettings = require("../models/settings");

async function buildJackpotSettingsEmbed(interaction) {
	let settings = await JackpotSettings.findOne({ where: { id: 0 } });

	if (!settings) {
		settings = await JackpotSettings.create({ id: 0 });
	}

	const status = `▸ **Status:** ${settings.status ? "🟢 ON" : "🔴 OFF"}\n`;
	const ticketPrice = `▸ **Ticket Price:** ${settings.ticket_price.toFixed(2) || "Not Set."} Tokens\n`;
	const availableTickets = `▸ **Available Tickets:** ${settings.available_tickets || "Not Set."}\n`;
	const description = `▸ **Description:**\n ${settings.description || "Not Set."}\n`;
	const jackpotChannelText = `▸ **Channel:** ${settings.channel ? `${channelMention(settings.channel)}` : "Not Set."}\n`;
	const payoutPercent = `▸ **Payout Percent:** ${settings.payout_percent > 0 ? `${settings.payout_percent}%` : "Not Set."}\n`;

	const embed = new EmbedBuilder()
		.setTitle("Jackpot Settings")
		.setColor(settings.color)
		.setDescription(`${status}${jackpotChannelText}${payoutPercent}${ticketPrice}${availableTickets}${description}`);

	if (settings.thumbnail && settings.thumbnail.length > 0) {
		embed.setThumbnail(settings.thumbnail);
	}

	if (settings.image && settings.image.length > 0) {
		embed.setImage(settings.image);
	}

	const editButton = new ButtonBuilder()
		.setCustomId("jackpot_style_settings")
		.setLabel("⚙️ Edit Info")
		.setStyle(ButtonStyle.Primary);

	const editTicketsButton = new ButtonBuilder()
		.setCustomId("jackpot_tickets_settings")
		.setLabel("🎟️ Edit Tickets")
		.setStyle(ButtonStyle.Secondary);

	const toggleButton = new ButtonBuilder()
		.setCustomId("jackpot_toggle_button")
		.setLabel(settings.status ? "Disable" : "Enable")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const jackpotChannel = new ChannelSelectMenuBuilder()
		.setCustomId("jackpot_channel_select")
		.setPlaceholder("ℹ️ Select a channel for jackpot")
		.setChannelTypes(ChannelType.GuildText);

	const row1 = new ActionRowBuilder().addComponents(editButton, editTicketsButton, toggleButton);
	const row2 = new ActionRowBuilder().addComponents(jackpotChannel);
	return {
		embeds: [embed],
		components: [row1, row2],
	};
}

module.exports = buildJackpotSettingsEmbed;
