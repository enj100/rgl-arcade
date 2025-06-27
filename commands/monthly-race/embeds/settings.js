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
const MonthlyRaceSettings = require("../models/RaceSettings");
const MonthlyRacePrizes = require("../models/MonthlyRacePrizes");

async function monthlyRaceSettingsEmbed(interaction) {
	const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
	if (!settings) {
		return;
	}
	const allPrizes = await MonthlyRacePrizes.findAll();

	const logsChannelText = `__▸ Race Channel:__ ${settings.channel ? channelMention(settings.channel) : "❌ No channel set"}`;
	const winnersAmountText = `__▸ Winners Amount:__ ${settings.winners_amount || "❌ Not set"}`;
	const statusText = `__▸ Status:__ ${settings.status ? "*✅ Active*" : "*❌ Inactive*"}`;

	const embed = new EmbedBuilder().setTitle("🏁 Monthly Race Settings").setColor("FFFFFF").setDescription(`
		${logsChannelText}
		${winnersAmountText}
		${statusText}
	`);

	const statusBtn = new ButtonBuilder()
		.setCustomId("monthly_race_change_status")
		.setLabel(settings.status ? "Turn OFF" : "Turn ON")
		.setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

	const changeWinnersBtn = new ButtonBuilder()
		.setCustomId("monthly_race_change_winners")
		.setLabel("🏆 Change Winners Amount")
		.setStyle(ButtonStyle.Primary);

	const drawWinnersBtn = new ButtonBuilder()
		.setCustomId("monthly_race_draw_winners")
		.setLabel("🥳 Draw Winners")
		.setStyle(ButtonStyle.Success);

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("monthly_race_change_channel")
		.setPlaceholder("ℹ️ Change Race Channel")
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
			.setCustomId("monthly_race_prize_edit")
			.setPlaceholder("🎁 Select Place to Change Prize")
			.addOptions(options);

		prizeSelectRow = new ActionRowBuilder().addComponents(prizeSelectMenu);
	}

	const row1 = new ActionRowBuilder().addComponents(statusBtn, drawWinnersBtn, changeWinnersBtn);
	const row2 = new ActionRowBuilder().addComponents(channelSelectMenu);

	return { embeds: [embed], components: [row1, row2, prizeSelectRow] };
}

module.exports = monthlyRaceSettingsEmbed;
