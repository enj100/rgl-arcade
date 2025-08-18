const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder, userMention } = require("discord.js");
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
const ShopSettings = require("../commands/shop/models/ShopSettings");
const WheelSettings = require("../commands/wheel/models/Settings");
const WheelItems = require("../commands/wheel/models/Items");
const SubSettings = require("../commands/subs/models/SubSettings");
const Sub = require("../commands/subs/models/Subs");
const FpLiveSettings = require("../commands/fp-live/models/Settings");
const FpLiveBets = require("../commands/fp-live/models/Bets");
const buildLiveFpEmbed = require("../commands/fp-live/embeds/game");
const { createFpLiveGif } = require("../commands/fp-live/embeds/generateGif");
const { logToChannel } = require("../utils/logger");
const KothSettings = require("../commands/king-of-hill/models/settings");
const KothPrize = require("../commands/king-of-hill/models/Prize");
const { buildKothLeaderboard } = require("../commands/king-of-hill/embeds/buildBoard");
const KothLeaderboard = require("../commands/king-of-hill/models/Leaderboard");

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

    [client.feedbackSettings] = await FeedbackSettings.findOrCreate({
        where: { id: 0 },
        defaults: { id: 0 },
    });

    [client.guessGameSettings] = await GuessGameSettings.findOrCreate({
        where: { id: 0 },
        defaults: { id: 0 },
    });

    [client.shopSettings] = await ShopSettings.findOrCreate({
        where: { id: 0 },
        defaults: { id: 0 },
    });

    [client.wheelSettings] = await WheelSettings.findOrCreate({
        where: { id: 0 },
        defaults: {
            id: 0,
        },
    });
    // create 28 default wheel items if they don't exist
    const wheelItems = await WheelItems.findAll({});
    if (wheelItems.length === 0) {
        await WheelItems.create({ id: 1, item_name: `3rd Age Full Helmet`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 2, item_name: `5x Tokens`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 3, item_name: `50x Tokens`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 4, item_name: `Amulet of Torture`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 5, item_name: `Arcane Spirit Shield`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 6, item_name: `Bandos Chestplate`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 7, item_name: `Barrows Gloves`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 8, item_name: `Bow of Faerdhinen`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 9, item_name: `Burning Claws`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 10, item_name: `Ghrazi Rapier`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 11, item_name: `Granite Maul`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 12, item_name: `Infernal Cape`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 13, item_name: `Primordial Boots`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 14, item_name: `Spectral Spirit Shield`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 15, item_name: `Tumeken's Shadow`, item_value: 0, probability: 0 });
        await WheelItems.create({ id: 16, item_name: `Weeds`, item_value: 0, probability: 0 });
    }
    client.wheelItems = await WheelItems.findAll();

    await SubSettings.findOrCreate({
        where: { id: 0 },
        defaults: {
            id: 0,
        },
    });

    [client.fpLiveSettings] = await FpLiveSettings.findOrCreate({
        where: { id: 0 },
        defaults: {
            id: 0,
        },
    });
    await FpLiveBets.sync({ alter: true });
    await KothSettings.findOrCreate({ where: { id: 0 }, defaults: { id: 0 } });
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Ready! Logged in as ${client.user.tag}`);
        await syncDatabaseModels();
        await fetchInitialData(client);
        // await registerCommands();

        // koth announce auto winners
        cron.schedule("59 23 * * *", async () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);

            // If tomorrow's month is different, today is the last day
            if (now.getMonth() !== tomorrow.getMonth()) {
                const settings = await KothSettings.findOne({ where: { id: 0 } });
                const winners = await KothLeaderboard.findAll({ limit: settings.winners_amount, order: [["wins", "DESC"]] });
                const prizes = await KothPrize.findAll({ order: [["place", "ASC"]], limit: settings.winners_amount });
                if (!settings.status) return;
                if (!settings.auto_run) return;
                settings.status = false;
                await settings.save();
                const channel = await client.channels.fetch(settings.channel).catch(() => null);

                if (settings.channel) {
                    const channel = await client.channels.fetch(settings.channel).catch(() => null);
                    if (channel) {
                        const msg = await channel.messages.fetch(settings.message).catch(() => null);
                        if (msg) {
                            let prizesString = prizes
                                .filter((p) => p.place <= settings.winners_amount)
                                .map((p) => `**${p.place}st Place:** ${p.prize_name} - ${p.prize_tokens} Tokens`)
                                .join("\n");
                            const { files, components, filename } = await buildKothLeaderboard(client, 0, true);
                            const embed = new EmbedBuilder()
                                .setTitle("🏆 King of the Hill Leaderboard")
                                .setDescription(prizesString)
                                .setImage(`attachment://${filename}`);
                            embed.setFooter({ text: "King of the Hill" });

                            if (settings.color) {
                                embed.setColor(settings.color);
                            }
                            if (settings.thumbnail) {
                                embed.setThumbnail(settings.thumbnail);
                                embed.setFooter({ text: "King of the Hill", iconURL: settings.thumbnail });
                            }
                            await msg.edit({
                                embeds: [embed],
                                files,
                                components,
                            });
                        }
                    }
                }
                // END updating
                let winnersText = "";
                for (let i = 0; i < winners.length; i++) {
                    const winner = winners[i];
                    if (winner) {
                        const prize = prizes[i];
                        const [user] = await User.findOrCreate({
                            where: { discord_id: winner.discord_id },
                            defaults: { discord_id: winner.discord_id },
                        });
                        if (user) {
                            winnersText += `${prize.place}. ${userMention(user.discord_id)} won **${prize.prize_name}(${
                                prize.prize_tokens
                            } Tokens)** !\n`;
                        }
                        user.balance += prize.prize_tokens;
                        await user.save();
                    }
                }
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle("🏆 Koth Race Winners")
                        .setDescription(
                            winnersText.length > 0
                                ? winnersText + "\n\n *Rewards have been added to your wallet balance.*"
                                : "*No winners this time.*"
                        )
                        .setColor("#FFD700");
                    embed.setFooter({ text: "King of the Hill Winners" });
                    if (settings.thumbnail) {
                        embed.setThumbnail(settings.thumbnail);
                        embed.setFooter({ text: "King of the Hill Winners", iconURL: settings.thumbnail });
                    }
                    if (settings.color) {
                        embed.setColor(settings.color);
                    }

                    await channel.send({ embeds: [embed] });
                }
                await KothLeaderboard.destroy({ where: {} });

                if (!settings.channel) {
                    return;
                }
                const channelToStart = await client.channels.fetch(settings?.channel).catch(() => null);
                if (channelToStart) {
                    let prizesString = prizes
                        .filter((p) => p.place <= settings.winners_amount)
                        .map((p) => `**${p.place}st Place:** ${p.prize_name} - ${p.prize_tokens} Tokens`)
                        .join("\n");
                    const { files, components, filename } = await buildKothLeaderboard(client, 0, true);
                    const embed = new EmbedBuilder()
                        .setTitle("🏆 King of the Hill Leaderboard")
                        .setDescription(prizesString)
                        .setImage(`attachment://${filename}`);
                    embed.setFooter({ text: "King of the Hill" });

                    if (settings.color) {
                        embed.setColor(settings.color);
                    }
                    if (settings.thumbnail) {
                        embed.setThumbnail(settings.thumbnail);
                        embed.setFooter({ text: "King of the Hill", iconURL: settings.thumbnail });
                    }
                    const msg = await channelToStart.send({
                        embeds: [embed],
                        files,
                        components,
                    });
                    settings.message = msg.id;
                    settings.status = true;
                    await settings.save();
                }
            }
        });
        // koth update
        cron.schedule("*/5 * * * *", async () => {
            const settings = await KothSettings.findOne({ where: { id: 0 } });
            if (settings.status) {
                if (settings.channel) {
                    const channel = await client.channels.fetch(settings.channel).catch(() => null);
                    if (channel) {
                        const msg = await channel.messages.fetch(settings.message).catch(() => null);
                        if (msg) {
                            const prizes = await KothPrize.findAll({ order: [["place", "ASC"]], limit: settings.winners_amount });

                            let prizesString = prizes
                                .filter((p) => p.place <= settings.winners_amount)
                                .map((p) => `**${p.place}st Place:** ${p.prize_name} - ${p.prize_tokens} Tokens`)
                                .join("\n");
                            const { files, components, filename } = await buildKothLeaderboard(client, 0, true);
                            const embed = new EmbedBuilder()
                                .setTitle("🏆 King of the Hill Leaderboard")
                                .setDescription(prizesString)
                                .setImage(`attachment://${filename}`);
                            embed.setFooter({ text: "King of the Hill" });

                            if (settings.color) {
                                embed.setColor(settings.color);
                            }
                            if (settings.thumbnail) {
                                embed.setThumbnail(settings.thumbnail);
                                embed.setFooter({ text: "King of the Hill", iconURL: settings.thumbnail });
                            }
                            await msg.edit({
                                embeds: [embed],
                                files,
                                components,
                            });
                        }
                    }
                }
            }
        });

        // live fp
        cron.schedule("*/5 * * * *", async () => {
            const settings = client.fpLiveSettings;

            if (settings.status) {
                // announce a winner
                settings.bets_status = false;

                const { winnerId, gif } = await createFpLiveGif(client);
                const allbets = await FpLiveBets.findAll();
                const payoutMultiplier = settings.payout_percent;
                let totalPot = 0;
                let totalPayout = 0;
                let winnersText = "";
                let logText = "";
                if (winnerId === "Hans") {
                    // Handle Hans winning
                    for (const bet of allbets) {
                        logText += `${userMention(bet.discord_id)}: H: ${bet.bet_hans} B: ${bet.bet_bob}\n`;

                        if (bet.bet_hans > 0) {
                            const [user] = await User.findOrCreate({
                                where: { discord_id: bet.discord_id },
                                defaults: { discord_id: bet.discord_id },
                            });
                            const totalRounded = (bet.bet_hans * payoutMultiplier).toFixed(2);
                            user.balance += parseFloat(totalRounded);
                            totalPayout += parseFloat(totalRounded);
                            await user.save();
                            winnersText += `${userMention(user.discord_id)}(${totalRounded}),`;
                        }
                        totalPot += bet.bet_hans;
                        totalPot += bet.bet_bob;
                        await bet.destroy();
                    }
                } else if (winnerId === "Bob") {
                    for (const bet of allbets) {
                        logText += `${userMention(bet.discord_id)}: H: ${bet.bet_hans} B: ${bet.bet_bob}\n`;

                        if (bet.bet_bob > 0) {
                            const [user] = await User.findOrCreate({
                                where: { discord_id: bet.discord_id },
                                defaults: { discord_id: bet.discord_id },
                            });
                            const totalRounded = (bet.bet_bob * payoutMultiplier).toFixed(2);
                            user.balance += parseFloat(totalRounded);
                            totalPayout += parseFloat(totalRounded);
                            await user.save();
                            winnersText += `${userMention(user.discord_id)}(${totalRounded}),`;
                        }
                        totalPot += bet.bet_hans;
                        totalPot += bet.bet_bob;
                        await bet.destroy();
                    }
                } else {
                    // tie
                    for (const bet of allbets) {
                        logText += `${userMention(bet.discord_id)}: H: ${bet.bet_hans} B: ${bet.bet_bob}\n`;

                        const [user] = await User.findOrCreate({
                            where: { discord_id: bet.discord_id },
                            defaults: { discord_id: bet.discord_id },
                        });

                        user.balance += bet.bet_hans + bet.bet_bob;
                        winnersText += `${userMention(user.discord_id)}(${bet.bet_hans + bet.bet_bob}),`;
                        await user.save();
                        totalPot += bet.bet_hans;
                        totalPot += bet.bet_bob;
                        totalPayout += bet.bet_hans + bet.bet_bob;
                        await bet.destroy();
                    }
                }

                await logToChannel(
                    `▸ Winner: **${winnerId}**\n▸ Users who bet:\n${logText}`,
                    client.logsChannel,
                    "FF0000",
                    "<:games:1381870887623594035> Live Flower Poker Results"
                );

                const attachment = new AttachmentBuilder(gif, { name: "fp.gif" });
                const { embeds, components } = await buildLiveFpEmbed(client, totalPot, totalPayout, winnersText, true);
                embeds[0].setImage("attachment://fp.gif"); // Reference the attachment by name
                const channel = await client.channels.fetch(settings.channel_id).catch(() => null);
                if (channel) {
                    const message = await channel.messages.fetch(settings.message_id).catch(() => null);
                    if (message) {
                        await message.edit({ embeds, components: [], files: [attachment] });
                    }
                    // send a new bets form
                    const { embeds: embeds2, components: components2 } = await buildLiveFpEmbed(client, 0, 0);
                    const msg = await channel.send({ embeds: embeds2, components: components2 });
                    settings.message_id = msg.id;
                    settings.bets_status = true;

                    await settings.save();
                } else {
                    console.error("Channel not found for FP Live settings.");
                }
            }
        });

        // Jackpot
        cron.schedule("*/1 * * * *", async () => {
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
                defaults: {
                    id: 0,
                },
            });

            if (settings.status && settings.next_draw_date <= new Date()) {
                await jackpotRollWinners(client);
            }
        });

        // Subscriptions
        cron.schedule("0 0 * * *", async () => {
            const subs = await Sub.findAll({
                where: {
                    expiry_date: {
                        [Op.lt]: new Date(),
                    },
                },
            });

            if (subs.length > 0) {
                const settings = await SubSettings.findOne({ where: { id: 0 } });
                for (const sub of subs) {
                    // remove role
                    const guild = client.guilds.cache.get(process.env.GUILDID);
                    if (guild) {
                        const member = await guild.members.fetch(sub.discord_id).catch(() => null);
                        if (member) {
                            const role = guild.roles.cache.get(settings.role_id);
                            if (role) {
                                await member.roles.remove(role).catch(() => null);
                            }
                        }
                    }
                    await sub.destroy();
                }
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
                                    .join("\n")}\n*Congrats On Your Win! ${winnersText.join(
                                    ", "
                                )} Has Been Added To Your Wallet Balance.*\n`
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
