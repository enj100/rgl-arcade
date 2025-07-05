const { Events } = require("discord.js");
const { registerCommands } = require("../registerCommands");
const Settings = require("../commands/settings/models/settings");
const sequelize = require("../database/database");
const User = require("../commands/wallet/models/User");
const Rank = require("../commands/rank-system/models/Ranks");
const GoodiebagItems = require("../commands/goodie-bag/models/Items");
const GoodiebagSettings = require("../commands/goodie-bag/models/Settings");
const MonthlyRaceSettings = require("../commands/monthly-race/models/RaceSettings");
const MonthlyRacePrizes = require("../commands/monthly-race/models/MonthlyRacePrizes");

var cron = require("node-cron");
const { buildMonthlyLeaderboard } = require("../commands/monthly-race/embeds/buildBoard");
const CommunityRafflePrizes = require("../commands/community-raffle/models/RafflePrizes");
const CommunityRaffleSettings = require("../commands/community-raffle/models/RaffleSettings");
const CommunityRaffleTickets = require("../commands/community-raffle/models/RaffleTickets");
const FeedbackSettings = require("../commands/feedback/models/feedbackSettings");
const Feedbacks = require("../commands/feedback/models/feedbacks");
const Giveaway = require("../commands/giveaways/models/giveaways");
const GiveawayExtraEntriesSets = require("../commands/giveaways/models/giveawayExtraEntries");
const GiveawayUsers = require("../commands/giveaways/models/giveawayUsers");

async function syncDatabaseModels() {
	console.log("⏳ Syncing database models...");

	await sequelize.sync();
	console.log("✅ Database models synced successfully.");
}

async function fetchInitialData(client) {
	console.log("⏳ Fetching initial data...");
	[client.serverSettings] = await Settings.findOrCreate({
		where: { id: 0 },
		defaults: {
			id: 0,
		},
	});
	[client.goodiebagSettings] = await GoodiebagSettings.findOrCreate({
		where: { id: 0 },
		defaults: {
			id: 0,
		},
	});
	// create 28 default goodiebag items if they don't exist
	const allItems = await GoodiebagItems.findAll({});
	if (allItems.length === 0) {
		for (let i = 1; i <= 28; i++) {
			await GoodiebagItems.create({
				id: i,
				item_name: `Item ${i}`,
				item_value: 0,
				probability: 0,
			});
		}
	}
	client.goodiebagItems = await GoodiebagItems.findAll();
	client.ranks = await Rank.findAll({ order: [["requirement", "DESC"]] });

	if (client.serverSettings.logs_channel) {
		client.logsChannel = await client.channels.fetch(client.serverSettings.logs_channel).catch(() => null);
	}
	if (client.serverSettings.games_logs_channel) {
		client.gamesLogsChannel = await client.channels.fetch(client.serverSettings.games_logs_channel).catch(() => null);
	}

	await MonthlyRaceSettings.findOrCreate({
		where: { id: 0 },
		defaults: {
			id: 0,
		},
	});
	const allPrizes = await MonthlyRacePrizes.findAll({});
	if (allPrizes.length === 0) {
		for (let i = 1; i <= 20; i++) {
			await MonthlyRacePrizes.create({
				place: i,
				prize: null,
			});
		}
	}
	await CommunityRaffleSettings.findOrCreate({
		where: { id: 0 },
		defaults: {
			id: 0,
		},
	});

	const communityRafflePrizes = await CommunityRafflePrizes.findAll({});
	if (communityRafflePrizes.length === 0) {
		for (let i = 1; i <= 20; i++) {
			await CommunityRafflePrizes.create({
				place: i,
				prize: null,
			});
		}
	}

	[client.feedbackSettings] = await FeedbackSettings.findOrCreate({
		where: { id: 0 },
		defaults: { id: 0 },
	});

	console.log("✅ Initial data fetched successfully.");
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`✅ Ready! Logged in as ${client.user.tag}`);
		await syncDatabaseModels();
		await fetchInitialData(client);
		// await registerCommands();

		cron.schedule("*/5 * * * *", async () => {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				if (settings.channel) {
					const channel = await client.channels.fetch(settings.channel).catch(() => null);
					if (channel) {
						const msg = await channel.messages.fetch(settings.message).catch(() => null);
						if (msg) {
							const { files, components } = await buildMonthlyLeaderboard(client, 0, true);

							await msg.edit({
								files,
								components,
							});
						}
					}
				}
			}
		});
	},
};
