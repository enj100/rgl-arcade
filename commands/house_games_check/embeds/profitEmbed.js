const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const GoodiebagSettings = require("../../goodie-bag/models/Settings");
const WheelSettings = require("../../wheel/models/Settings");
const FpLiveSettings = require("../../fp-live/models/Settings");
const HouseGamesProfit = require("../models/HouseGamesProfit");

async function buildHouseGamesProfitEmbed() {
	const goodieBagSettings = await GoodiebagSettings.findOne({ where: { id: 0 } });
	const wheelSettings = await WheelSettings.findOne({ where: { id: 0 } });
	const liveFpSettings = await FpLiveSettings.findOne({ where: { id: 0 } });
	const houseGameProfit = await HouseGamesProfit.findOne({ where: { id: 0 } });

	const gbProfit = `▸ Goodie Bag Profit: **$${(goodieBagSettings.users_paid - goodieBagSettings.payout).toFixed(2)}**\n`;
	const wheelProfit = `▸ Wheel Profit: **$${(wheelSettings.users_paid - wheelSettings.payout).toFixed(2)}**\n`;
	const liveFpProfit = `▸ Live FP Profit: **$${liveFpSettings.profit.toFixed(2)}**\n`;
	const whipProfit = `▸ Whip Duel [house game]: **$${houseGameProfit.whip_duel.toFixed(2)}**\n`;
	const diceProfit = `▸ Dice Duel [house game]: **$${houseGameProfit.dice_duel.toFixed(2)}**\n`;

	const embed = new EmbedBuilder()
		.setTitle("✅ House Games Check")
		.setColor("#FFD700")
		.setDescription(`${gbProfit}${wheelProfit}${liveFpProfit}${whipProfit}${diceProfit}`);

	const row = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId("house_games_reset")
			.setPlaceholder("⚙️ Select a Game to Reset Profits")
			.addOptions([
				new StringSelectMenuOptionBuilder().setLabel("👛 Goodie Bag").setValue("gb"),
				new StringSelectMenuOptionBuilder().setLabel("🛞 Wheel").setValue("wheel"),
				new StringSelectMenuOptionBuilder().setLabel("💐 Live Flower Poker").setValue("live_fp"),
				new StringSelectMenuOptionBuilder().setLabel("⚔️ Whip Duel").setValue("whip"),
				new StringSelectMenuOptionBuilder().setLabel("🎲 Dice Duel").setValue("dice"),
			])
	);

	return { embeds: [embed], components: [row] };
}

module.exports = { buildHouseGamesProfitEmbed };
