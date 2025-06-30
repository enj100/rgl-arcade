const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	channelMention,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require("discord.js");
const User = require("../wallet/models/User");
const GoodiebagSettings = require("./models/Settings");
const MonthlyRaceSettings = require("../monthly-race/models/RaceSettings");
const MonthlyRaceBoard = require("../monthly-race/models/MonthlyRaceBoard");
const { logToChannel } = require("../../utils/logger");

module.exports = {
	data: new SlashCommandBuilder().setName("goodiebag").setDescription("⭐ Goodie Bag Game."),
	async execute(interaction) {
		// updated version
		const [wallet] = await User.findOrCreate({
			where: { discord_id: interaction.user.id },
			defaults: {
				discord_id: interaction.user.id,
			},
		});

		const settings = interaction.client.goodiebagSettings || (await GoodiebagSettings.findOne({ where: { id: 0 } }));
		const serverSettings = interaction.client.serverSettings;

		if (!settings.status) {
			return await interaction.reply({ content: `❗ Goodie Bag is offline at the moment!`, ephemeral: true });
		}

		if (wallet.balance <= 0 || wallet.balance < settings.price) {
			return await interaction.reply({
				content: `❗ You do not have enough RGL-Tokens to play! Each game costs **${settings.price.toFixed(2)} RGL-Tokens**!`,
				ephemeral: true,
			});
		}

		// old version
		const items = interaction.client.goodiebagItems || (await GoodiebagItems.findAll());

		const item = rollDiceAndGetItem(items);

		// update wallet
		// add prize
		wallet.balance -= settings.price;
		wallet.balance += item.item_value;
		wallet.total_won += item.item_value;
		wallet.total_lost += settings.price;
		wallet.wager += settings.price;

		settings.payout += item.item_value;
		settings.users_paid += settings.price;
		await settings.save();
		await wallet.save();

		const monthlyRaceSettings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
		if (monthlyRaceSettings.status) {
			// add to monthly
			const [board] = await MonthlyRaceBoard.findOrCreate({
				where: { discord_id: interaction.user.id },
				defaults: {
					discord_id: interaction.user.id,
				},
			});
			board.total += settings.price;
			await board.save();
		}

		// create him embed with goodiebag picture
		const embed = new EmbedBuilder().setTitle(`🔮 Goodie bag`).setImage(settings.goodiebag_image).setColor("FFFFFF");

		if (serverSettings?.color) {
			embed.setColor(serverSettings.color);
		}
		if (serverSettings?.brand_name) {
			embed.setFooter({
				text: serverSettings.brand_name,
			});
		}
		if (serverSettings?.thumbnail) {
			embed.setFooter({
				iconURL: serverSettings.thumbnail,
				text: serverSettings.brand_name || "RGL-Arcade",
			});
		}
		await interaction.reply({ embeds: [embed] });

		setTimeout(async () => {
			await interaction.followUp({
				content: `🎲 *Rolling a dice...*`,
			});
		}, 1000);

		setTimeout(async () => {
			const embed = new EmbedBuilder()
				.setDescription(
					`🎲 ${interaction.user} rolled a **${item.id + 1}**! 🎊 You won ⟫ *__${
						item.item_name
					}__* ⟪ (**${item.item_value.toFixed(2)} RGL-Tokens**) 🎊`
				)
				.setColor("FFFF00");

			await interaction.followUp({
				embeds: [embed],
			});
			await logToChannel(
				`🎲 ${interaction.user} rolled a **${item.id + 1}** and won **${item.item_name}** worth **${item.item_value.toFixed(
					2
				)} RGL-Tokens**!`,
				interaction.client.logsChannel
			);
		}, 2000);

		function rollDiceAndGetItem(items) {
			const random = Math.random(); // Generate a random number between 0 and 1
			let cumulativeProbability = 0;

			for (const item of items) {
				cumulativeProbability += item.probability / 100;
				if (random < cumulativeProbability) {
					return item; // Return the item when the random number is less than cumulative probability
				}
			}
		}
	},
};
