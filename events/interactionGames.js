const {
    ActionRowBuilder,
    ButtonBuilder,
    Events,
    userMention,
    ButtonStyle,
    EmbedBuilder,
    AttachmentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
} = require("discord.js");
const User = require("../commands/wallet/models/User");
const path = require("path");
const fs = require("fs");
const { processGameResult } = require("../utils/winners");
const validate = require("validator");

const buildFeedbackSettingsEmbed = require("../commands/feedback/feedbackSettingsEmbed");
const Feedbacks = require("../commands/feedback/models/feedbacks");
const giveawaySettingsEmbed = require("../commands/giveaways/embeds/settings");
const Giveaway = require("../commands/giveaways/models/giveaways");
const editGiveawayEmbed = require("../commands/giveaways/embeds/editGiveaway");
const createGiveawayEmbed = require("../commands/giveaways/embeds/createGiveaway");
const giveawayExtraEntriesEmbed = require("../commands/giveaways/embeds/extraEntriesEdit");
const GiveawayExtraEntriesSets = require("../commands/giveaways/models/giveawayExtraEntries");
const postGiveawayEmbed = require("../commands/giveaways/embeds/postGiveaway");
const GiveawayUsers = require("../commands/giveaways/models/giveawayUsers");
const giveawayExtraEntriesMenu = require("../commands/giveaways/embeds/extraEntriesMenu");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) return;
        ///////////////////////////////////////////////////
        ////////////////// GIVEAWAYS //////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId === "other_settings" && interaction?.values[0] && interaction?.values[0] === "giveaways_settings") {
            const actionRow = await giveawaySettingsEmbed();

            await interaction.reply({
                components: [actionRow],
                ephemeral: true,
            });
        } else if (
            interaction?.customId === "giveaways_settings" &&
            interaction?.values[0] &&
            interaction?.values[0] === "giveaways_reroll"
        ) {
            const modal = new ModalBuilder().setCustomId("giveaways_reroll_submit").setTitle("Re-Roll Giveaway");

            const messageIdInput = new TextInputBuilder()

                .setCustomId("giveaways_reroll_message_id")
                .setLabel("Message ID")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Message ID")
                .setRequired(true)
                .setMaxLength(50);

            // show modal
            const row = new ActionRowBuilder().addComponents(messageIdInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_reroll_submit") {
            const messageId = interaction.fields.getTextInputValue("giveaways_reroll_message_id");

            const giveaway = await Giveaway.findOne({
                where: {
                    message: messageId,
                    status: "ended",
                },
            });
            if (!giveaway) {
                return await interaction.reply({
                    content: "❗ Giveaway not found! It only works for ended giveaways!",
                    ephemeral: true,
                });
            }

            // winners logic
            const winners = giveaway.winners_amount;
            const allUsers = await GiveawayUsers.findAll({
                where: {
                    giveaway_id: giveaway.id,
                },
            });
            if (allUsers.length <= 0) {
                return await interaction.reply({
                    content: "❗ There are no participants in this giveaway!",
                    ephemeral: true,
                });
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

                // post winners
                const embed = new EmbedBuilder()
                    .setTitle("🎉 Giveaway Re-Rolled!")
                    .setColor("ff0000")
                    .setDescription(`🎁 Winners of **${giveaway.name}**:\n${winnersList.map((user) => `<@${user}>`).join("\n")}`)
                    .setFooter({ text: "RGL - Giveaways" });

                const channel = await interaction.client.channels.fetch(giveaway.channel).catch((e) => null);

                if (channel) {
                    await channel.send({ embeds: [embed] });
                    // reward the winners
                    for (let index4 = 0; index4 < winnersList.length; index4++) {
                        const [user] = await User.findOrCreate({
                            where: { discord_id: winnersList[index4] },
                            defaults: { discord_id: winnersList[index4] },
                        });
                        user.balance += giveaway.prize_tokens;
                        await user.save();
                    }
                    return await interaction.reply({
                        content: "✅ Giveaway re-rolled!",
                        ephemeral: true,
                    });
                } else {
                    return await interaction.reply({
                        content: "❗ Channel not found! Was it deleted? Not possible to re-roll this giveaway!",
                        ephemeral: true,
                    });
                }
            }
        } else if (
            interaction?.customId === "giveaways_extra_entries_settings" &&
            interaction?.values[0] &&
            interaction?.values[0] === "create_set"
        ) {
            const setCount = await GiveawayExtraEntriesSets.count();

            if (setCount >= 25) {
                return await interaction.reply({
                    content: "❗ You can only create 25 sets of extra entries roles!",
                    ephemeral: true,
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("giveaways_extra_entries_create_set")
                .setTitle("Create a new set of extra entries roles");

            const nameInput = new TextInputBuilder()
                .setCustomId("giveaways_extra_entries_set_name")
                .setLabel("Set name")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Set name")
                .setRequired(true)
                .setMaxLength(50);

            // show modal
            const row = new ActionRowBuilder().addComponents(nameInput);

            modal.addComponents(row);

            await interaction.showModal(modal);

            return;
        } else if (interaction?.customId === "giveaways_extra_entries_create_set") {
            const setCount = await GiveawayExtraEntriesSets.count();

            if (setCount >= 25) {
                return await interaction.reply({
                    content: "❗ You can only create 25 sets of extra entries roles!",
                    ephemeral: true,
                });
            }
            const name = interaction.fields.getTextInputValue("giveaways_extra_entries_set_name");
            const existingSet = await GiveawayExtraEntriesSets.findOne({
                where: {
                    name: name,
                },
            });

            if (existingSet) {
                return await interaction.reply({
                    content: "❗ Set with this name already exists!",
                    ephemeral: true,
                });
            }
            await GiveawayExtraEntriesSets.create({
                name: name,
            });

            const { components } = await giveawayExtraEntriesMenu();

            await interaction.update({
                components: [...components],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_extra_entries_remove_sets") {
            const id = interaction.values[0].split("-")[1];
            await GiveawayExtraEntriesSets.destroy({
                where: {
                    id: id,
                },
            });
            const { components } = await giveawayExtraEntriesMenu();
            await interaction.update({
                components: [...components],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_create_extra_entries_choose_set") {
            const setId = interaction.values[0].split("-")[1];
            const set = await GiveawayExtraEntriesSets.findOne({
                where: {
                    id: setId,
                },
            });
            if (!set) {
                return await interaction.reply({
                    content: "❗ Set with this name does not exist!",
                    ephemeral: true,
                });
            }

            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });

            await giveaway.update({
                extra_entries: set.extra_entries,
            });

            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed(interaction, giveaway);

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_extra_entries_edit_sets") {
            const id = interaction.values[0].split("-")[1];
            const existingSet = await GiveawayExtraEntriesSets.findOne({
                where: {
                    id: id,
                },
            });
            if (!existingSet) {
                return await interaction.reply({
                    content: "❗ Set with this name does not exist!",
                    ephemeral: true,
                });
            }

            const { embeds, components } = await giveawayExtraEntriesEmbed(interaction, existingSet);

            await interaction.reply({
                embeds: [...embeds],
                components: [...components],
                ephemeral: true,
            });

            return;
        } else if (
            interaction?.customId === "giveaways_settings" &&
            interaction.values[0] &&
            interaction.values[0] === "giveaways_extra_entries"
        ) {
            const { components } = await giveawayExtraEntriesMenu();

            await interaction.update({
                components: [...components],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId?.startsWith("giveaway_participants-")) {
            const giveawayId = interaction.customId.split("-")[1];

            // create embed with buttons, 10 user per page
            const users = await GiveawayUsers.findAll({
                where: {
                    giveaway_id: giveawayId,
                },
                order: [["extra_entries", "DESC"]],
            });

            const usersCount = users.length;
            const pagesCount = Math.ceil(usersCount / 10) === 0 ? 1 : Math.ceil(usersCount / 10);
            const currentPage = parseInt(interaction.customId.split("-")[2], 10) || 1;
            const startIndex = (currentPage - 1) * 10;
            const endIndex = startIndex + 10;
            const currentUsers = users.slice(startIndex, endIndex);
            const userList = currentUsers
                .map((user, index) => {
                    const userId = user.discord_id;
                    const extraEntries = user.extra_entries;
                    const userMention = `<@${userId}>`;

                    return `**${index + 1 + startIndex}**. ${userMention} ${extraEntries > 0 ? `(${extraEntries} extra entries)` : ""}`;
                })
                .join("\n");
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Giveaway Participants")
                .setDescription(userList || "No participants found.")
                .setFooter({ text: `Page ${currentPage} of ${pagesCount}` });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_prev-${giveawayId}-${currentPage - 1}`)
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1), // Disable if on the first page
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_next-${giveawayId}-${currentPage + 1}`)
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pagesCount) // Disable if on the last page
            );

            await interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
            return;
        } else if (interaction?.customId?.startsWith("giveaway_participants_next-")) {
            const giveawayId = interaction.customId.split("-")[1];
            const currentPage = parseInt(interaction.customId.split("-")[2], 10) || 1;
            const users = await GiveawayUsers.findAll({
                where: {
                    giveaway_id: giveawayId,
                },
                order: [["extra_entries", "DESC"]],
            });
            const usersCount = users.length;
            const pagesCount = Math.ceil(usersCount / 10) === 0 ? 1 : Math.ceil(usersCount / 10);
            const startIndex = (currentPage - 1) * 10;
            const endIndex = startIndex + 10;
            const currentUsers = users.slice(startIndex, endIndex);
            const userList = currentUsers
                .map((user, index) => {
                    const userId = user.discord_id;
                    const extraEntries = user.extra_entries;
                    const userMention = `<@${userId}>`;

                    return `**${index + 1 + startIndex}**. ${userMention} ${extraEntries > 0 ? `(${extraEntries} extra entries)` : ""}`;
                })
                .join("\n");
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Giveaway Participants")
                .setDescription(userList || "No participants found.")
                .setFooter({ text: `Page ${currentPage} of ${pagesCount}` });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_prev-${giveawayId}-${currentPage - 1}`)
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1), // Disable if on the first page
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_next-${giveawayId}-${currentPage + 1}`)
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pagesCount) // Disable if on the last page
            );

            await interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
            return;
        } else if (interaction?.customId?.startsWith("giveaway_participants_prev-")) {
            const giveawayId = interaction.customId.split("-")[1];
            const currentPage = parseInt(interaction.customId.split("-")[2], 10) || 1;
            const users = await GiveawayUsers.findAll({
                where: {
                    giveaway_id: giveawayId,
                },
                order: [["extra_entries", "DESC"]],
            });
            const usersCount = users.length;
            const pagesCount = Math.ceil(usersCount / 10) === 0 ? 1 : Math.ceil(usersCount / 10);
            const startIndex = (currentPage - 1) * 10;
            const endIndex = startIndex + 10;
            const currentUsers = users.slice(startIndex, endIndex);
            const userList = currentUsers
                .map((user, index) => {
                    const userId = user.discord_id;
                    const extraEntries = user.extra_entries;
                    const userMention = `<@${userId}>`;

                    return `**${index + 1 + startIndex}**. ${userMention} ${extraEntries > 0 ? `(${extraEntries} extra entries)` : ""}`;
                })
                .join("\n");
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Giveaway Participants")
                .setDescription(userList || "No participants found.")
                .setFooter({ text: `Page ${currentPage} of ${pagesCount}` });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_prev-${giveawayId}-${currentPage - 1}`)
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1), // Disable if on the first page
                new ButtonBuilder()
                    .setCustomId(`giveaway_participants_next-${giveawayId}-${currentPage + 1}`)
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pagesCount) // Disable if on the last page
            );

            await interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
            return;
        } else if (interaction?.customId?.startsWith("giveaway_join-")) {
            const giveawayId = interaction.customId.split("-")[1];
            const [giveaway] = await Giveaway.findOrCreate({
                where: { id: giveawayId },
            });
            if (!giveaway || giveaway.status !== "active") {
                return await interaction.reply({ content: "❗ Giveaway not found!", ephemeral: true });
            }
            const userId = interaction.user.id;

            // get user's roles
            const member = await interaction.guild.members.fetch(userId).catch((e) => null);
            if (!member) {
                return await interaction.reply({ content: "❗ User not found!", ephemeral: true });
            }
            const roles = member.roles.cache.map((role) => role.id);
            const hasRole = giveaway.roles?.split(",").some((role) => roles.includes(role));

            if (giveaway.roles) {
                if (!hasRole) {
                    return await interaction.reply({
                        content: "❗ You don't have the required role to enter this giveaway!",
                        ephemeral: true,
                    });
                }
            }

            // check if user already entered the giveaway
            const existingEntry = await GiveawayUsers.findOne({
                where: {
                    giveaway_id: giveaway.id,
                    discord_id: userId,
                },
            });

            if (existingEntry) {
                return await interaction.reply({
                    content: "❗ You have already entered this giveaway!",
                    ephemeral: true,
                });
            }
            // check if user has role for extra entries
            const extraEntriesList = giveaway.extra_entries ? giveaway.extra_entries.split(",") : null;
            let extraEntries = 0;
            if (extraEntriesList) {
                for (const entry of extraEntriesList) {
                    const [roleId, entries] = entry.split(":"); // Split roleId and entries
                    if (roles.includes(roleId)) {
                        extraEntries += parseInt(entries, 10); // Add the entries to the total
                    }
                }
            }
            // create new entry
            await GiveawayUsers.create({
                giveaway_id: giveaway.id,
                discord_id: userId,
                extra_entries: extraEntries,
            });

            await interaction.reply({
                content: `✅ You have entered the giveaway! You have ${extraEntries} extra entries!`,
                ephemeral: true,
            });

            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "start") {
            // validate fields
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            const total = await Giveaway.count({
                where: { status: "active" },
            });
            if (total >= 20) {
                return await interaction.reply({ content: "❗ You can only have 20 active giveaways at a time!", ephemeral: true });
            }

            const channel = await interaction.client.channels.fetch(giveaway.channel).catch((e) => null);

            if (!channel) {
                return await interaction.reply({ content: "❗ Please select a channel first!", ephemeral: true });
            }
            if (!giveaway.duration) {
                return await interaction.reply({ content: "❗ Please select a duration first!", ephemeral: true });
            }
            if (!giveaway.prize) {
                return await interaction.reply({ content: "❗ Please select a prize first!", ephemeral: true });
            }
            if (!giveaway.winners_amount) {
                return await interaction.reply({ content: "❗ Please select a winners amount first!", ephemeral: true });
            }
            // if (!giveaway.roles) {
            // 	return await interaction.reply({ content: "❗ Please select a roles first!", ephemeral: true });
            // }
            // post giveaway
            const { giveawayEmbed, giveawayActionRow } = await postGiveawayEmbed(giveaway);
            const msg = await channel.send({
                embeds: [giveawayEmbed],
                components: [giveawayActionRow],
            });
            giveaway.message = msg.id;
            // change status to "active"
            giveaway.status = "active";
            await giveaway.save();

            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();
            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "channel") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            // create modal
            const modal = new ModalBuilder().setCustomId("giveaways_create_channel_submit").setTitle("Edit Giveaway Channel");

            const channelInput = new TextInputBuilder()
                .setCustomId("channel_input")
                .setLabel("Enter Giveaway Channel ID")
                .setValue(`${giveaway.channel ?? ""}`)
                .setStyle(TextInputStyle.Short);

            const row = new ActionRowBuilder().addComponents(channelInput);

            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_create_channel_submit") {
            const channelId = interaction.fields.getTextInputValue("channel_input");
            const channel = await interaction.client.channels.fetch(channelId).catch((e) => null);
            if (!channel || channel.type !== ChannelType.GuildText) {
                return await interaction.reply({ content: "❗ Invalid channel ID!", ephemeral: true });
            }
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            giveaway.channel = channel.id;
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();
            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "prize") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });

            // create modal
            const modal = new ModalBuilder().setCustomId("giveaways_create_prize_submit").setTitle("Edit Giveaway Prize");

            const prizeInput = new TextInputBuilder()
                .setCustomId("prize_input")
                .setLabel("Enter Giveaway Prize Name")
                .setValue(`${giveaway.prize ?? ""} `)
                .setRequired(false)
                .setStyle(TextInputStyle.Short);

            const prizeTokensInput = new TextInputBuilder()
                .setCustomId("prize_osrs_input")
                .setLabel("Raward in Tokens")
                .setValue(`${giveaway.prize_tokens}`)
                .setStyle(TextInputStyle.Short);

            const row1 = new ActionRowBuilder().addComponents(prizeInput);
            const row2 = new ActionRowBuilder().addComponents(prizeTokensInput);

            modal.addComponents(row1, row2);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_create_prize_submit") {
            const prize = interaction.fields.getTextInputValue("prize_input");
            const prizeTokens = +interaction.fields.getTextInputValue("prize_osrs_input");

            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });

            if (isNaN(prizeTokens) || prizeTokens < 0) {
                return await interaction.reply({ content: "❗ Tokens Prize must be a positive number!", ephemeral: true });
            }

            giveaway.prize = prize;
            giveaway.prize_tokens = prizeTokens;
            await giveaway.save();

            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();
            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });

            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "winners") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            // create modal
            const modal = new ModalBuilder().setCustomId("giveaways_create_winners_submit").setTitle("Edit Giveaway Winners");

            const winnersInput = new TextInputBuilder()
                .setCustomId("winners_input")
                .setLabel("Enter Giveaway Winners")
                .setValue(`${giveaway.winners_amount}`)
                .setStyle(TextInputStyle.Short);

            const row = new ActionRowBuilder().addComponents(winnersInput);

            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_create_winners_submit") {
            const winners = +interaction.fields.getTextInputValue("winners_input");
            if (isNaN(winners) || winners < 1 || winners > 100) {
                return await interaction.reply({ content: "❗ Winners must be a positive number and up to 100!", ephemeral: true });
            }
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            giveaway.winners_amount = winners;
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "duration") {
            // create modal
            const modal = new ModalBuilder().setCustomId("giveaways_create_duration_submit").setTitle("Edit Giveaway Duration");

            const durationInput = new TextInputBuilder()
                .setCustomId("duration_input")
                .setLabel("Enter Giveaway Duration")
                .setPlaceholder("e.g. 1d, 2h, 30m")
                .setStyle(TextInputStyle.Short);

            const row = new ActionRowBuilder().addComponents(durationInput);

            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_create_duration_submit") {
            const duration = interaction.fields.getTextInputValue("duration_input");
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            const durationRegex = /(\d+)([dhm])/;
            const match = duration.match(durationRegex);
            if (!match) {
                return await interaction.reply({ content: "❗ Invalid duration format! Use d, h, or m.", ephemeral: true });
            }

            giveaway.duration = duration;
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId?.startsWith("giveaways_create_extra_entries_roles-")) {
            const id = interaction.customId.split("-")[1];
            const selectedRoles = interaction.values[0];
            if (!selectedRoles) return;

            // create modal
            const modal = new ModalBuilder()
                .setCustomId(`giveaways_create_extra_entries_submit-${selectedRoles}-${id}`)
                .setTitle("Edit Extra Entries");

            const extraEntriesInput = new TextInputBuilder()

                .setCustomId("extra_entries_input")
                .setLabel("Enter Extra Entries")
                .setStyle(TextInputStyle.Short);

            const row = new ActionRowBuilder().addComponents(extraEntriesInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId?.startsWith("giveaways_create_extra_entries_submit-")) {
            const selectedRoles = interaction.customId.split("-")[1];
            const id = interaction.customId.split("-")[2];
            const extraEntries = +interaction.fields.getTextInputValue("extra_entries_input");
            if (isNaN(extraEntries) || extraEntries < 0) {
                return await interaction.reply({ content: "❗ Extra entries must be a positive number!", ephemeral: true });
            }

            const set = await GiveawayExtraEntriesSets.findOne({
                where: {
                    id: id,
                },
            });
            if (!set) {
                return await interaction.reply({ content: "❗ Set with this name does not exist!", ephemeral: true });
            }
            const extraEntriesList = set.extra_entries ? set.extra_entries.split(",") : [];
            const existingEntry = extraEntriesList.find((entry) => entry.startsWith(selectedRoles));
            if (existingEntry) {
                const index = extraEntriesList.indexOf(existingEntry);
                if (extraEntries === 0) {
                    // Remove the entry if extraEntries is 0
                    extraEntriesList.splice(index, 1);
                } else {
                    // Update the entry if extraEntries is not 0
                    extraEntriesList[index] = `${selectedRoles}:${extraEntries}`;
                }
            } else if (extraEntries !== 0) {
                // Add a new entry if it doesn't exist and extraEntries is not 0
                extraEntriesList.push(`${selectedRoles}:${extraEntries}`);
            }
            set.extra_entries = extraEntriesList.join(",");
            await set.save();
            const { embeds, components } = await giveawayExtraEntriesEmbed(interaction, set);

            await interaction.update({
                embeds: [...embeds],
                components: [...components],
                ephemeral: true,
            });

            return;
        } else if (interaction?.customId === "giveaways_create_roles") {
            const selectedRoles = interaction.values;
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            giveaway.roles = selectedRoles.join(",");
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "repeat") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });
            giveaway.repetitive = !giveaway.repetitive;
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_create" && interaction?.values[0] && interaction?.values[0] === "change_info") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });

            // create modal
            const modal = new ModalBuilder().setCustomId("giveaways_create_submit").setTitle("Edit Giveaway Info");

            const nameInput = new TextInputBuilder()
                .setCustomId("name_input")
                .setLabel("Enter Giveaway Name")
                .setValue(`${giveaway.name}`)
                .setStyle(TextInputStyle.Short);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("description_input")
                .setLabel("Enter Giveaway Description")
                .setValue(`${giveaway.description ?? ""}`)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const colorInput = new TextInputBuilder()
                .setCustomId("color_input")
                .setLabel("Enter Giveaway Color")
                .setValue(`${giveaway.color}`)
                .setStyle(TextInputStyle.Short);

            const thumbnailInput = new TextInputBuilder()
                .setCustomId("thumbnail_input")
                .setLabel("Enter Giveaway Thumbnail URL")
                .setValue(`${giveaway.thumbnail_url ?? ""}`)
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const imageInput = new TextInputBuilder()
                .setCustomId("image_input")
                .setLabel("Enter Giveaway Image URL")
                .setValue(`${giveaway.image_url ?? ""}`)
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            // show modal

            const row1 = new ActionRowBuilder().addComponents(nameInput);
            const row2 = new ActionRowBuilder().addComponents(descriptionInput);
            const row3 = new ActionRowBuilder().addComponents(colorInput);
            const row4 = new ActionRowBuilder().addComponents(thumbnailInput);
            const row5 = new ActionRowBuilder().addComponents(imageInput);

            modal.addComponents(row1, row2, row3, row4, row5);

            await interaction.showModal(modal);
            return;
        } else if (interaction?.customId === "giveaways_create_submit") {
            const name = interaction.fields.getTextInputValue("name_input");
            const description = interaction.fields.getTextInputValue("description_input");
            const color = interaction.fields.getTextInputValue("color_input");
            const thumbnail = interaction.fields.getTextInputValue("thumbnail_input");
            const image = interaction.fields.getTextInputValue("image_input");
            const [giveaway] = await Giveaway.findOrCreate({
                where: { status: "creating" },
            });

            giveaway.name = name.length > 0 ? name : "New Giveaway";
            giveaway.description = description.length > 0 ? description : null;
            giveaway.color = color.length > 0 ? color : "ffffff";
            giveaway.thumbnail_url = thumbnail.length > 0 ? thumbnail : null;
            giveaway.image_url = image.length > 0 ? image : null;
            await giveaway.save();
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (
            interaction?.customId === "giveaways_settings" &&
            interaction?.values[0] &&
            interaction?.values[0] === "giveaways_create"
        ) {
            const { embed, actionRow, actionRow2, actionRow3 } = await createGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2, actionRow3],
                ephemeral: true,
            });
            return;
        } else if (
            interaction?.customId === "giveaways_settings" &&
            interaction?.values[0] &&
            interaction?.values[0] === "giveaways_check"
        ) {
            const { embed, actionRow, actionRow2 } = await editGiveawayEmbed();

            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2],
                ephemeral: true,
            });
            return;
        } else if (interaction?.customId === "giveaways_check_repeat") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { id: interaction.values[0] },
            });
            if (!giveaway) {
                return await interaction.reply({ content: "❗ Giveaway not found!", ephemeral: true });
            }

            if (giveaway.status !== "active") {
                return await interaction.reply({ content: "❗ Giveaway is not active!", ephemeral: true });
            }

            giveaway.repetitive = !giveaway.repetitive;
            await giveaway.save();

            const { embed, actionRow, actionRow2 } = await editGiveawayEmbed();
            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2],
                ephemeral: true,
            });

            return;
        } else if (interaction?.customId === "giveaways_cancel") {
            const [giveaway] = await Giveaway.findOrCreate({
                where: { id: interaction.values[0] },
            });
            if (!giveaway) {
                return await interaction.reply({ content: "❗ Giveaway not found!", ephemeral: true });
            }

            if (giveaway.status !== "active") {
                return await interaction.reply({ content: "❗ Giveaway is not active!", ephemeral: true });
            }
            giveaway.status = "cancelled";
            // find channel and message
            const channel = await interaction.client.channels.fetch(giveaway.channel).catch((e) => null);
            if (!channel) {
                return await interaction.reply({ content: "❗ Channel not found!", ephemeral: true });
            }
            const message = await channel.messages.fetch(giveaway.message).catch((e) => null);
            if (!message) {
                return await interaction.reply({ content: "❗ Message not found!", ephemeral: true });
            }

            const { giveawayEmbed, giveawayActionRow } = await postGiveawayEmbed(giveaway, `🔴 Cancelled!`);

            // attach cancelled button
            const cancelledButton = new ButtonBuilder()
                .setCustomId("giveaway_cancelled")
                .setLabel("❌ Cancelled")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const cancelledRow = new ActionRowBuilder().addComponents(cancelledButton);

            await message.edit({ embeds: [giveawayEmbed], components: [cancelledRow] });
            await giveaway.save();

            const { embed, actionRow, actionRow2 } = await editGiveawayEmbed();
            await interaction.update({
                embeds: [embed],
                components: [actionRow, actionRow2],
                ephemeral: true,
            });

            return;
        }

        ///////////////////////////////////////////////////
        ////////////////// FEEDBACKS //////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId === "other_settings" && interaction?.values[0] && interaction?.values[0] === "feedback_settings") {
            const { embed, components } = await buildFeedbackSettingsEmbed(interaction);
            await interaction.reply({
                embeds: [embed],
                components: [...components],
                ephemeral: true,
            });
        } else if (interaction?.customId === "feedback_settings_channel") {
            const channelId = interaction.values[0];
            const channel = await interaction.guild.channels.fetch(channelId);
            if (!channel) {
                return await interaction.reply({
                    content: "❗️ Invalid channel selected.",
                    ephemeral: true,
                });
            }

            interaction.client.feedbackSettings.feedbacks_channel = channelId;

            await interaction.client.feedbackSettings.save();

            const { embed, components } = await buildFeedbackSettingsEmbed(interaction);

            await interaction.update({
                embeds: [embed],
                components: [...components],
            });

            await interaction.followUp({
                content: `✅ Feedback channel updated to ${channel}.`,
                ephemeral: true,
            });
        } else if (interaction?.customId === "feedback_settings_edit") {
            const settings = interaction.client.feedbackSettings;
            const modal = new ModalBuilder().setCustomId("feedback_settings_edit_submit").setTitle("Edit Feedback Settings");

            const colorInput = new TextInputBuilder()
                .setCustomId("color_input")
                .setLabel("Enter the color for the embed (hex code):")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.color || "000000")
                .setRequired(true)
                .setMinLength(6)
                .setMaxLength(6)
                .setPlaceholder("000000");

            const thumbnailInput = new TextInputBuilder()
                .setCustomId("thumbnail_input")
                .setLabel("Enter the thumbnail URL:")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.thumbnail || "")
                .setRequired(false)
                .setMaxLength(2000)
                .setPlaceholder("https://example.com/thumbnail.png");

            const imageInput = new TextInputBuilder()
                .setCustomId("image_input")
                .setLabel("Enter the image URL:")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.image || "")
                .setMaxLength(2000)
                .setRequired(false)
                .setPlaceholder("https://example.com/image.png");

            const descriptionInput = new TextInputBuilder()
                .setCustomId("description_input")
                .setLabel("Feedback Embed Description:")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(settings.feedback_description || "")
                .setRequired(false)
                .setMaxLength(2000)
                .setPlaceholder("Use buttons bellow to leave a feedback.");

            const row1 = new ActionRowBuilder().addComponents(colorInput);
            const row2 = new ActionRowBuilder().addComponents(thumbnailInput);
            const row3 = new ActionRowBuilder().addComponents(imageInput);
            const row4 = new ActionRowBuilder().addComponents(descriptionInput);

            modal.addComponents(row1, row2, row3, row4);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "feedback_settings_edit_submit") {
            const color = interaction.fields.getTextInputValue("color_input");
            const thumbnail = interaction.fields.getTextInputValue("thumbnail_input");
            const image = interaction.fields.getTextInputValue("image_input");
            const description = interaction.fields.getTextInputValue("description_input");

            if (!validate.isHexColor(color)) {
                return await interaction.reply({
                    content: "❗️ Invalid color format. Please enter a valid hex code.",
                    ephemeral: true,
                });
            }

            if (thumbnail && thumbnail.length > 0 && !validate.isURL(thumbnail)) {
                return await interaction.reply({
                    content: "❗️ Invalid thumbnail URL. Please enter a valid URL.",
                    ephemeral: true,
                });
            }

            if (image && image.length > 0 && !validate.isURL(image)) {
                return await interaction.reply({
                    content: "❗️ Invalid image URL. Please enter a valid URL.",
                    ephemeral: true,
                });
            }

            interaction.client.feedbackSettings.color = color;
            interaction.client.feedbackSettings.thumbnail = thumbnail;
            interaction.client.feedbackSettings.image = image;
            interaction.client.feedbackSettings.feedback_description = description;

            await interaction.client.feedbackSettings.save();
            const { embed, components } = await buildFeedbackSettingsEmbed(interaction);
            await interaction.update({
                embeds: [embed],
                components: [...components],
            });
            await interaction.followUp({
                content: "✅ Feedback settings updated successfully.",
                ephemeral: true,
            });
        } else if (interaction?.customId?.startsWith("feedback_form_open-")) {
            const rating = interaction.customId.split("-")[1];
            const userId = interaction.customId.split("-")[2];
            const issuedBy = interaction.customId.split("-")[3];

            if (interaction.user.id !== userId) {
                return await interaction.reply({
                    content: "❗️ You are not allowed to submit feedback!",
                    ephemeral: true,
                });
            }

            // modal to add feedback
            const modal = new ModalBuilder()
                .setCustomId("feedback_form_submit-" + rating + "-" + userId + "-" + issuedBy)
                .setTitle(`Feedback Form`);

            const feedbackInput = new TextInputBuilder()
                .setCustomId("feedback_input")
                .setLabel(`Enter your feedback - (${rating}/5):`)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(2000)
                .setPlaceholder("Your feedback here...");
            const row = new ActionRowBuilder().addComponents(feedbackInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        } else if (interaction?.customId?.startsWith("feedback_form_submit-")) {
            const rating = interaction.customId.split("-")[1];
            const customer = interaction.customId.split("-")[2];
            const issuedBy = interaction.customId.split("-")[3];
            const feedback = interaction.fields.getTextInputValue("feedback_input");
            const settings = interaction.client.feedbackSettings;
            const serverSettings = interaction.client.serverSettings;

            if (interaction.user.id !== customer) {
                return await interaction.reply({
                    content: "❗️ You are not allowed to submit feedback!",
                    ephemeral: true,
                });
            }

            if (!settings.feedbacks_channel) {
                return await interaction.reply({
                    content: "❗️ Feedbacks channel is not set.",
                    ephemeral: true,
                });
            }

            const channel = await interaction.client.channels.fetch(settings.feedbacks_channel);

            if (!channel) {
                return await interaction.reply({
                    content: "❗️ Feedbacks channel not found.",
                    ephemeral: true,
                });
            }

            let stars = "";

            for (let i = 0; i < rating; i++) {
                stars += "<:yellowstar:1389456622832582706>";
            }

            const customerText = `${process.env.FEEDBACK_CUSTOMER_EMOJI || "👥"} | \`Customer :\` <@${customer}>\n`;
            const ratingText = `${process.env.FEEDBACK_RATING_EMOJI || "👍🏻"} | \`Rating   :\` ${stars} (${rating}/5)\n`;
            const feedbackText = `${process.env.FEEDBACK_EMOJI || "💭"} | \`Feedback :\` ${feedback}\n`;

            const embed = new EmbedBuilder()
                .setTitle(`${process.env.FEEDBACK_TITLE_EMOJI || "⭐"} New Feedback`)
                .setDescription(`Thank you for your feedback!\n\n${customerText}${ratingText}${feedbackText}`)
                .setTimestamp();

            if (settings.color) {
                embed.setColor(settings.color);
            }
            if (settings.thumbnail && settings.thumbnail.length > 0) {
                embed.setThumbnail(settings.thumbnail);
            }
            if (settings.image && settings.image.length > 0) {
                embed.setImage(settings.image);
            }

            if (serverSettings.thumbnail && serverSettings.thumbnail.length > 0) {
                if (serverSettings.brand_name && serverSettings.brand_name.length > 0) {
                    embed.setFooter({ text: serverSettings.brand_name, iconURL: serverSettings.thumbnail });
                } else {
                    embed.setFooter({ text: "Feedbacks", iconURL: serverSettings.thumbnail });
                }
            } else {
                embed.setFooter({ text: "Feedbacks" });
            }

            const thankyouButton = new ButtonBuilder()
                .setCustomId("feedback_thankyou")
                .setLabel("❤️ Thank You!")
                .setStyle(ButtonStyle.Success)
                .setDisabled(true);

            await channel.send({ embeds: [embed] });

            await Feedbacks.create({
                customer: customer,
                rating: rating,
                feedback: feedback,
                issued_by: issuedBy,
            });

            const row = new ActionRowBuilder().addComponents(thankyouButton);

            await interaction.update({
                components: [row],
            });

            await interaction.followUp({
                content: `✅ Thank you for your feedback! You rated ${rating}/5.`,
                ephemeral: true,
            });
        }
        ///////////////////////////////////////////////////
        ////////////////// DICE DUEL //////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId?.startsWith("diceduel_accept-")) {
            const [action, player1, player2, amount] = interaction.customId.split("-");
            // Handle the acceptance of the dice duel
            if (isNaN(amount) || parseFloat(amount) <= 0) {
                return await interaction.reply({
                    content: `*❗ Invalid amount specified!*`,
                    ephemeral: true,
                });
            }
            if (!interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot accept this dice duel!*`,
                    ephemeral: true,
                });
            }

            const [player1Wallet] = await User.findOrCreate({
                where: { discord_id: player1 },
                defaults: { discord_id: player1 },
            });
            const [player2Wallet] = await User.findOrCreate({
                where: { discord_id: player2 },
                defaults: { discord_id: player2 },
            });

            if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
                return await interaction.reply({
                    content: `*❗ One of the players does not have enough RGL-Tokens to play this dice duel!*`,
                    ephemeral: true,
                });
            }

            const player1Dice = Math.floor(Math.random() * 100) + 1;
            const player2Dice = Math.floor(Math.random() * 100) + 1;
            const winner = player1Dice > player2Dice ? player1 : player2Dice > player1Dice ? player2 : "Tie";

            await processGameResult({
                player1,
                player2,
                winner,
                amount,
                player1Score: player1Dice,
                player2Score: player2Dice,
                gameName: "🎲 Dice Duel",
                interaction,
            });

            await interaction.update({ components: [] });
            await interaction.followUp({
                content: `🎲 ${userMention(player1)} rolled... **${player1Dice}**!`,
            });
            setTimeout(async () => {
                await interaction.followUp({
                    content: `🎲 ${userMention(player2)} rolled... **${player2Dice}**!`,
                });
            }, 1000);
            setTimeout(async () => {
                await interaction.followUp({
                    content: `${winner === "Tie" ? "🎲 It's a tie!" : `🎲 The winner is ${userMention(winner)}🥳`}`,
                });
            }, 2000);
        } else if (interaction?.customId?.startsWith("diceduel_decline-")) {
            const [action, player1, player2] = interaction.customId.split("-");
            if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot decline this dice duel!*`,
                    ephemeral: true,
                });
            }

            const canceledBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`diceduel_canceled-${player1}-${player2}`)
                    .setLabel("❌ Duel Canceled")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await interaction.update({
                content: `*❌ ${interaction.user} has declined the Dice Duel.*`,
                components: [canceledBtn],
                ephemeral: true,
            });
        }
        ///////////////////////////////////////////////////
        ////////////////// WHIP DUEL //////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId?.startsWith("whip_accept-")) {
            const [action, player1, player2, amount] = interaction.customId.split("-");
            // Handle the acceptance of the dice duel
            if (isNaN(amount) || parseFloat(amount) <= 0) {
                return await interaction.reply({
                    content: `*❗ Invalid amount specified!*`,
                    ephemeral: true,
                });
            }
            if (!interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot accept this whip duel!*`,
                    ephemeral: true,
                });
            }

            const [player1Wallet] = await User.findOrCreate({
                where: { discord_id: player1 },
                defaults: { discord_id: player1 },
            });
            const [player2Wallet] = await User.findOrCreate({
                where: { discord_id: player2 },
                defaults: { discord_id: player2 },
            });

            if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
                return await interaction.reply({
                    content: `*❗ One of the players does not have enough RGL-Tokens to play this whip duel!*`,
                    ephemeral: true,
                });
            }

            // 1. Randomly pick winner side
            const sides = ["left", "right"];
            const winnerSide = sides[Math.floor(Math.random() * sides.length)];

            // we know the winner already
            const winner = winnerSide === "left" ? player1 : player2;

            await processGameResult({
                player1,
                player2,
                winner,
                amount,
                player1Score: "-",
                player2Score: "-",
                gameName: "⚔️ Whip Duel",
                interaction,
            });

            const gifsDir = path.join(__dirname, `../commands/whip/assets/${winnerSide}`);
            const gifFiles = fs.readdirSync(gifsDir);
            const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
            console.log(`Selected GIF: ${randomGif}`);
            const gifPath = path.join(gifsDir, randomGif);
            const attachment = new AttachmentBuilder(gifPath, { name: randomGif });

            const editedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

            editedEmbed.setImage(`attachment://${randomGif}`);

            await interaction.update({
                embeds: [editedEmbed],
                files: [attachment],
                components: [],
            });
        } else if (interaction?.customId?.startsWith("whip_decline-")) {
            const [action, player1, player2] = interaction.customId.split("-");
            if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot decline this whip duel!*`,
                    ephemeral: true,
                });
            }

            const canceledBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`whip_canceled-${player1}-${player2}`)
                    .setLabel("❌ Whip Duel Canceled")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await interaction.update({
                content: `*❌ ${interaction.user} has declined the Whip Duel.*`,
                components: [canceledBtn],
                ephemeral: true,
            });
        }
    },
};
