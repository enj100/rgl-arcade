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
} = require("discord.js");

async function guessGameSettingsEmbed(interaction) {
	const guessGame = interaction.client.guessGameSettings;

	const statusText = `▸ **Status:** ${guessGame.status ? "🟢 ON" : "🔴 OFF"}`;
	const prizeText = `▸ **Prize:** ${guessGame.prize ? guessGame.prize : "Not Set."} (${guessGame.prize_tokens} Tokens)`;
	const channelText = `▸ **Channel:** ${guessGame.channel_id ? channelMention(guessGame.channel_id) : "Not Set."}`;
	const announcements = `▸ **Announcements Channel:** ${
		guessGame.announcements_channel ? channelMention(guessGame.announcements_channel) : "Not Set."
	}`;
	const number = `▸ **Number to Guess:** ${guessGame.number}`;
	const text = `▸ **Text:**\n${guessGame.text ? guessGame.text : "Not Set."}`;

	const embed = new EmbedBuilder()
		.setTitle("❓ 1-1000 Guess Game Settings")
		.setDescription(`${statusText}\n${channelText}\n${announcements}\n${prizeText}\n${number}\n${text}`)
		.setColor("FFFFFF")
		.setFooter({ text: "🔧 Settings" });

	if (guessGame.thumbnail && guessGame.thumbnail.length > 0) {
		embed.setThumbnail(guessGame.thumbnail);
	}

	const channelSelect = new ChannelSelectMenuBuilder()
		.setCustomId("guess_game_channel_select")
		.setPlaceholder("ℹ️ Change Game Channel")
		.setChannelTypes(ChannelType.GuildText)
		.setMinValues(1)
		.setMaxValues(1);

	const announcementsSelect = new ChannelSelectMenuBuilder()
		.setCustomId("guess_game_announcements_channel_select")
		.setPlaceholder("ℹ️ Change Announcements Channel")
		.setChannelTypes(ChannelType.GuildText)
		.setMinValues(1)
		.setMaxValues(1);
	const settingsBtn = new ButtonBuilder()
		.setCustomId("guess_game_edit_settings")
		.setLabel("⚙️ Edit Settings")
		.setStyle(ButtonStyle.Secondary);

	const statusBtn = new ButtonBuilder()
		.setCustomId(`guess_game_status`)
		.setLabel(`${guessGame.status ? "Turn OFF" : "Turn ON"}`)
		.setStyle(guessGame.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const row = new ActionRowBuilder().addComponents(statusBtn, settingsBtn);
	const row2 = new ActionRowBuilder().addComponents(channelSelect);
	const row3 = new ActionRowBuilder().addComponents(announcementsSelect);

	return { embeds: [embed], components: [row, row2, row3] };
}

module.exports = guessGameSettingsEmbed;
