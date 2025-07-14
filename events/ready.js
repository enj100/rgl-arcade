const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
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
const postGiveawayEmbed = require("../commands/giveaways/embeds/postGiveaway");
const { Op } = require("sequelize");
const JackpotSettings = require("../commands/jackpot/models/settings");
const JackpotTickets = require("../commands/jackpot/models/tickets");
const jackpotRollWinners = require("../commands/jackpot/embeds/rollWinners");
const GuessGameSettings = require("../commands/1-1000/models/1-1000_settings");

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}

async function syncDatabaseModels() {
	console.log("⏳ Syncing database models...");

	await sequelize.sync({ alter: true });
	console.log("✅ Database models synced successfully.");
}

async function fetchInitialData(client) {
	console.log("⏳ Fetching initial data...");

	await JackpotSettings.findOrCreate({
		where: { id: 0 },
		defaults: {
			id: 0,
		},
	});

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

	[client.guessGameSettings] = await GuessGameSettings.findOrCreate({
		where: { id: 0 },
		defaults: { id: 0 },
	});
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`✅ Ready! Logged in as ${client.user.tag}`);
		await syncDatabaseModels();
		await fetchInitialData(client);
		// await registerCommands();

		// Jackpot
		cron.schedule("*/1 * * * *", async () => {
			const [settings] = await JackpotSettings.findOrCreate({
				where: { id: 0 },
				defaults: {
					id: 0,
				},
			});

			if (settings.next_draw_date <= new Date()) {
				await jackpotRollWinners(client);
			}
		});

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

		cron.schedule("0 */1 * * * *", async () => {
			const giveaways = await Giveaway.findAll({
				where: {
					status: "active",
					endDate: {
						[Op.lt]: new Date(),
					},
				},
			});

			if (giveaways.length > 0) {
				for (let index = 0; index < giveaways.length; index++) {
					// winners logic
					const winners = giveaways[index].winners_amount;
					const allUsers = await GiveawayUsers.findAll({
						where: {
							giveaway_id: giveaways[index].id,
						},
					});
					if (allUsers.length <= 0) {
						// post a message: no users entered the giveaway
						const embed = new EmbedBuilder()
							.setColor("ff0000")
							.setDescription(`❌ No users entered the giveaway!`)
							.setFooter({ text: "RGL-Tokens - Giveaways" });

						const channel = await client.channels.fetch(giveaways[index].channel).catch((e) => null);
						// edit buttons of the current giveaway message
						const message = await channel.messages.fetch(giveaways[index].message).catch((e) => null);
						if (message) {
							const { giveawayEmbed, giveawayActionRow } = await postGiveawayEmbed(giveaways[index], `✅ Giveaway Ended!`);
							// attach cancelled button
							const cancelledButton = new ButtonBuilder()
								.setCustomId("giveaway_cancelled")
								.setLabel("✅ Giveaway Ended!")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true);

							const cancelledRow = new ActionRowBuilder().addComponents(cancelledButton);

							await message.edit({ embeds: [giveawayEmbed], components: [cancelledRow] });
						}
						if (channel) {
							await channel.send({ embeds: [embed] });
						}
					} else {
						// some users have extra_entries and needs to be added as multiple entries in the list
						const usersList = [];
						for (let index2 = 0; index2 < allUsers.length; index2++) {
							// add user as many times as the extra_entries
							const extraEntries = allUsers[index2].extra_entries;
							if (extraEntries === 0) {
								usersList.push(allUsers[index2].discord_id);
							} else {
								// push to the list the user as many times as the extra_entries
								for (let index3 = 0; index3 < extraEntries; index3++) {
									usersList.push(allUsers[index2].discord_id);
								}
							}
						}

						// Shuffle the list
						const shuffledList = shuffleArray(usersList);
						// get the winners from the shuffled list randomly
						const winnersList = shuffledList.slice(0, winners);

						const winnersText = [];
						if (giveaways[index].prize_tokens > 0) {
							winnersText.push(`**RGL-Tokens** ${giveaways[index].prize_tokens.toFixed(2)}`);
						}

						// post winners
						const embed = new EmbedBuilder()
							.setTitle("🎉 Giveaway Ended!")
							.setColor("ff0000")
							.setDescription(
								`🎁 Winners of **${giveaways[index].name}**:\n${winnersList
									.map((user) => `<@${user}>`)
									.join("\n")}\n*Congrats On Your Win! ${winnersText.join(", ")} Has Been Added To Your Wallet Balance.*\n`
							)
							.setFooter({ text: "RGL-Tokens - Giveaways" });

						const channel = await client.channels.fetch(giveaways[index].channel).catch((e) => null);

						if (channel) {
							await channel.send({ embeds: [embed] });
						}

						// reward the winners
						for (let index4 = 0; index4 < winnersList.length; index4++) {
							const [user] = await User.findOrCreate({
								where: { discord_id: winnersList[index4] },
								defaults: { discord_id: winnersList[index4] },
							});
							user.balance += giveaways[index].prize_tokens;
							await user.save();
						}

						// edit buttons of the current giveaway message
						const message = await channel.messages.fetch(giveaways[index].message).catch((e) => null);
						if (message) {
							const { giveawayEmbed, giveawayActionRow } = await postGiveawayEmbed(giveaways[index], `✅ Giveaway Ended!`);
							// attach cancelled button
							const cancelledButton = new ButtonBuilder()
								.setCustomId("giveaway_cancelled")
								.setLabel("✅ Giveaway Ended!")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true);

							const cancelledRow = new ActionRowBuilder().addComponents(cancelledButton);

							await message.edit({ embeds: [giveawayEmbed], components: [cancelledRow] });
						}
					}

					if (!giveaways[index].repetitive) {
						giveaways[index].status = "ended";
						await giveaways[index].save();
					} else {
						// post a new giveaway
						const { giveawayEmbed, giveawayActionRow } = await postGiveawayEmbed(giveaways[index]);
						const channel = await client.channels.fetch(giveaways[index].channel).catch((e) => null);
						await GiveawayUsers.destroy({
							where: {
								giveaway_id: giveaways[index].id,
							},
						});
						const mgs = await channel.send({ embeds: [giveawayEmbed], components: [giveawayActionRow] });
						giveaways[index].message = mgs.id;
						giveaways[index].status = "active";
						await giveaways[index].save();
					}
				}
			}
		});
	},
};
