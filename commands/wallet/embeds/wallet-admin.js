const { EmbedBuilder, blockQuote, quote, codeBlock, ButtonBuilder, ButtonStyle, roleMention } = require("discord.js");

/**
 * Creates an embed showing the user's wallet information.
 * @param {User} user - The User.js model instance for the user.
 * @returns {EmbedBuilder} The embed displaying wallet info.
 */
function checkWalletAdminEmbed(user, userObj, settings) {
	const embed = new EmbedBuilder()
		.setColor(0x00ae86)
		.setTitle(`${process.env.WALLET_EMOJI ? process.env.WALLET_EMOJI + " " : ""}${user.username} Arcade Wallet`)
		.setThumbnail(user.avatarURL() || undefined)
		.addFields(
			{
				name: `${process.env.BALANCE_EMOJI ? process.env.BALANCE_EMOJI + " " : ""}Balance`,
				value: `${codeBlock(userObj.balance.toFixed(2))}`,
				inline: true,
			},
			{
				name: `${process.env.GAMES_WON_EMOJI ? process.env.GAMES_WON_EMOJI + " " : ""}Games Won`,
				value: `${codeBlock(userObj.games_won)}`,
				inline: true,
			},
			{
				name: `${process.env.GAMES_LOST_EMOJI ? process.env.GAMES_LOST_EMOJI + " " : ""}Games Lost`,
				value: `${codeBlock(userObj.games_lost)}`,
				inline: true,
			},
			{
				name: `${process.env.TOTAL_WON_EMOJI ? process.env.TOTAL_WON_EMOJI + " " : ""}Tokens Won`,
				value: `${codeBlock(userObj.total_won.toFixed(2))}`,
				inline: true,
			},
			{
				name: `${process.env.TOTAL_LOST_EMOJI ? process.env.TOTAL_LOST_EMOJI + " " : ""}Tokens Lost`,
				value: `${codeBlock(userObj.total_lost.toFixed(2))}`,
				inline: true,
			},
			{
				name: `${process.env.TOTAL_WAGER_EMOJI ? process.env.TOTAL_WAGER_EMOJI + " " : ""}Tokens Wagered`,
				value: `${codeBlock(userObj.wager.toFixed(2))}`,
				inline: true,
			},
			{
				name: `${process.env.TOTAL_BOUGHT_EMOJI ? process.env.TOTAL_BOUGHT_EMOJI + " " : ""}Total Bought`,
				value: `${codeBlock(userObj.total_bought.toFixed(2))}`,
				inline: true,
			},
			{
				name: `${process.env.RANK_EMOJI ? process.env.RANK_EMOJI + " " : ""}Rank`,
				value: `${userObj.rank ? roleMention(userObj.rank) : "Unranked"}`,
				inline: false,
			}
		)
		.setTimestamp();

	if (settings?.color) {
		embed.setColor(settings.color);
	}

	const addTokensBtn = new ButtonBuilder()
		.setCustomId("admin_add_tokens-" + user.id)
		.setLabel("➕ Add Tokens")
		.setStyle(ButtonStyle.Secondary);

	const removeTokensBtn = new ButtonBuilder()
		.setCustomId("admin_remove_tokens-" + user.id)
		.setLabel("➖ Remove Tokens")
		.setStyle(ButtonStyle.Secondary);

	return {
		embeds: [embed],
		components: [
			{
				type: 1, // ActionRow
				components: [addTokensBtn, removeTokensBtn],
			},
		],
	};
}

module.exports = { checkWalletAdminEmbed };
