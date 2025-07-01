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
	roleMention,
	RoleSelectMenuBuilder,
} = require("discord.js");
const CommunityRaffleSettings = require("../models/RaffleSettings");
const CommunityRafflePrizes = require("../models/RafflePrizes");

async function communityRaffleSettingsEmbed(interaction) {
	const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
	if (!settings) {
		return;
	}
	const allPrizes = await CommunityRafflePrizes.findAll();

	const logsChannelText = `__▸ Raffle Channel:__ ${settings.channel ? channelMention(settings.channel) : "❌ No channel set"}\n`;
	const spamChannelText = `__▸ Announcements Channel:__ ${
		settings.spam_channel ? channelMention(settings.spam_channel) : "❌ No channel set"
	}\n`;
	const winnersAmountText = `__▸ Winners Amount:__ ${settings.winners_amount}\n`;
	const priceText = `__▸ Tickets Price:__ ${settings.ticket_price_tokens + " RGL-Tokens" || "❌ Not set"}\n`;
	const statusText = `__▸ Status:__ ${settings.status ? "*✅ Active*" : "*❌ Inactive*"}\n`;
	const ticketsAmountText = `__▸ Tickets Amount:__ ${settings.tickets_amount || "❌ Not set"}\n`;

	const messageText = `**__▸ Message:__\n**${settings.message?.length > 0 ? settings.message : "❌ Not set"}`;

	const embed = new EmbedBuilder()
		.setTitle("🎟️ Community Raffle Settings")
		.setColor("FFFFFF")
		.setDescription(
			`${logsChannelText}${spamChannelText}${winnersAmountText}${ticketsAmountText}${priceText}${statusText}${messageText}`
		);

	const statusBtn = new ButtonBuilder()
		.setCustomId("community_raffle_change_status")
		.setLabel(settings.status ? "Turn OFF" : "Turn ON")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const generalSettingsBtn = new ButtonBuilder()
		.setCustomId("community_raffle_general_settings")
		.setLabel("⚙️ General Settings")
		.setStyle(ButtonStyle.Secondary);

	const editEmbedBtn = new ButtonBuilder()
		.setCustomId("community_raffle_edit_embed")
		.setLabel("🖊️ Edit Embed")
		.setStyle(ButtonStyle.Secondary);

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("community_raffle_change_channel")
		.setPlaceholder("ℹ️ Change Raffle Channel")
		.setChannelTypes(ChannelType.GuildText);

	const spamSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("community_raffle_change_spam_channel")
		.setPlaceholder("ℹ️ Change Announcements Channel")
		.setChannelTypes(ChannelType.GuildText);

	let prizeSelectRow = null;
	if (settings.winners_amount && settings.winners_amount > 0) {
		const options = [];
		for (let i = 1; i <= settings.winners_amount; i++) {
			const prizeObj = allPrizes.find((p) => p.place === i);
			options.push(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${i}${i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"} Place`)
					.setValue(`${i}`)
					.setDescription(prizeObj && prizeObj.prize ? prizeObj.prize : "No prize set")
			);
		}
		const prizeSelectMenu = new StringSelectMenuBuilder()
			.setCustomId("community_raffle_prize_edit")
			.setPlaceholder("🎁 Select Place to Change Prize")
			.addOptions(options);

		prizeSelectRow = new ActionRowBuilder().addComponents(prizeSelectMenu);
	}

	const row1 = new ActionRowBuilder().addComponents(statusBtn, generalSettingsBtn, editEmbedBtn);
	const row2 = new ActionRowBuilder().addComponents(channelSelectMenu);
	const row3 = new ActionRowBuilder().addComponents(spamSelectMenu);

	return { embeds: [embed], components: [row1, row2, row3, prizeSelectRow] };
}

module.exports = communityRaffleSettingsEmbed;
