const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	channelMention,
	RoleSelectMenuBuilder,
	roleMention,
	time,
	TimestampStyles,
	spoiler,
} = require("discord.js");

async function buildLiveFpEmbed(interaction, lastTotalPot = 0, lastTotalPayout = 0, winnersText = null, ended = false) {
	const client = interaction.client || interaction;

	const settings = client.fpLiveSettings;

	// add 5 min to the current time
	const currentTime = new Date();
	currentTime.setMinutes(currentTime.getMinutes() + 5);

	// convert to reverse time dicord
	const relative = time(currentTime, TimestampStyles.RelativeTime);

	const genericText = `\n*ℹ️ Click a button bellow to bet on Bob or Hans! Games are automatically launched every 5 minutes.*\n`;
	const payoutText = `**▸ Payout Multiplier:** ${settings.payout_percent ? `x${settings.payout_percent}` : "Not Set"}\n`;
	const nextGameTime = `**▸ Next Game Time:** ${relative}\n`;
	const totalPot = `**▸ Total Pot:** ${lastTotalPot ? `${lastTotalPot} Tokens` : "0 Tokens"}\n`;
	const totalPayout = `**▸ Total Payout:** ${lastTotalPayout ? `${lastTotalPayout} Tokens` : "0 Tokens"}\n`;

	const embed = new EmbedBuilder()
		.setTitle(`🌻 Live Flower Poker${ended ? " [ENDED]" : ""}`)
		.setDescription(
			`${nextGameTime}${payoutText}\n${totalPot}${totalPayout}${genericText}\n▸ Payouts:\n${spoiler(
				winnersText?.length > 0 ? winnersText : "-"
			)}`
		)
		.setTimestamp();

	if (settings?.thumbnail) {
		embed.setThumbnail(settings.thumbnail);
	}
	if (settings?.color) {
		embed.setColor(settings.color);
	}

	const betHansBtn = new ButtonBuilder().setCustomId("fp_live_bet_hans").setLabel("💰 Bet on Hans").setStyle(ButtonStyle.Danger);
	const betBobBtn = new ButtonBuilder().setCustomId("fp_live_bet_bob").setLabel("💰 Bet on Bob").setStyle(ButtonStyle.Success);

	const row1 = new ActionRowBuilder().addComponents(betHansBtn, betBobBtn);

	return {
		embeds: [embed],
		components: [row1],
	};
}

module.exports = buildLiveFpEmbed;
