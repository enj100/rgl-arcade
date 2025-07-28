const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	channelMention,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	AttachmentBuilder,
	spoiler,
} = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const User = require("../wallet/models/User");
const WheelSettings = require("./models/Settings");
const WheelItems = require("./models/Items");
const MonthlyRaceSettings = require("../monthly-race/models/RaceSettings");
const MonthlyRaceBoard = require("../monthly-race/models/MonthlyRaceBoard");
const { logToChannel } = require("../../utils/logger");

module.exports = {
	data: new SlashCommandBuilder().setName("wheel").setDescription("⭐ Wheel Game."),
	async execute(interaction) {
		// updated version
		const [wallet] = await User.findOrCreate({
			where: { discord_id: interaction.user.id },
			defaults: {
				discord_id: interaction.user.id,
			},
		});

		const settings = interaction.client.wheelSettings || (await WheelSettings.findOne({ where: { id: 1 } }));
		const serverSettings = interaction.client.serverSettings;

		if (!settings.status) {
			return await interaction.reply({ content: `❗ Wheel is offline at the moment!`, ephemeral: true });
		}

		if (wallet.balance <= 0 || wallet.balance < settings.price) {
			return await interaction.reply({
				content: `❗ You do not have enough RGL-Tokens to play! Each game costs **${settings.price.toFixed(2)} RGL-Tokens**!`,
				ephemeral: true,
			});
		}

		// old version
		const items = interaction.client.wheelItems || (await WheelItems.findAll());

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

		const itemNameForPath = item.item_name.replace(/ /g, "_");
		const itemDirectory = path.join(__dirname, "assets", itemNameForPath);
		let imagePath;

		try {
			const files = await fs.readdir(itemDirectory);
			if (files.length > 0) {
				const randomFile = files[Math.floor(Math.random() * files.length)];
				imagePath = path.join(itemDirectory, randomFile);
			}
		} catch (error) {
			console.error(`Could not read directory ${itemDirectory}:`, error);
		}

		const reward = `${spoiler(`**🎉 Your Reward:** *${item.item_name} worth ${item.item_value.toFixed(2)} RGL-Tokens!*`)}`;

		// create him embed with wheel picture
		const embed = new EmbedBuilder()
			.setTitle(`<:luckywheel:1399274373013307467> Lucky Wheel!`)
			.setDescription(
				`*⭐ Items will be converted into Tokens and credited into your wallet balance automatically.*\n\n${reward}`
			)
			.setColor("FF0000");

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

		const checkItems = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("wheel_check_items")
				.setLabel("Check Items")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("<:luckywheel:1399274373013307467>"),
			new ButtonBuilder().setCustomId("wheel_spin_again").setLabel("Spin Again").setStyle(ButtonStyle.Success).setEmoji("🔄")
		);

		const replyPayload = { embeds: [embed], components: [checkItems] };
		if (imagePath) {
			const attachment = new AttachmentBuilder(imagePath);
			embed.setImage(`attachment://${path.basename(imagePath)}`);
			replyPayload.files = [attachment];
		}

		await interaction.reply(replyPayload);

		await logToChannel(
			`<:luckywheel:1399274373013307467> User ${interaction.user} just spun the wheel and won **${item.item_name}** worth **${item.item_value} RGL-Tokens**!`,
			interaction.client.logsChannel,
			"FF0000",
			"<:games:1381870887623594035> Game Results"
		);

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
