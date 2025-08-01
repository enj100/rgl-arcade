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
    time,
    spoiler,
} = require("discord.js");
const User = require("../commands/wallet/models/User");
const path = require("path");
const fs = require("fs");
const { processGameResult } = require("../utils/winners");
const validate = require("validator");
const discordTranscripts = require("discord-html-transcripts");

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
const buildJackpotSettingsEmbed = require("../commands/jackpot/embeds/settings");
const JackpotSettings = require("../commands/jackpot/models/settings");
const JackpotTickets = require("../commands/jackpot/models/tickets");
const jackpotRollWinners = require("../commands/jackpot/embeds/rollWinners");
const guessGameSettingsEmbed = require("../commands/1-1000/embeds/settings");
const buildShopSettings = require("../commands/shop/embeds/settings");
const buildItemsSettings = require("../commands/shop/embeds/itemSettings");
const shopEmbed = require("../commands/shop/embeds/shop");
const ShopItems = require("../commands/shop/models/Items");
const { createTicket } = require("../utils/createChannel");
const { createTranscriptEmbed } = require("../utils/transcriptsEmbed");
const wheelSettingsEmbed = require("../commands/wheel/embeds/settings");
const WheelSettings = require("../commands/wheel/models/Settings");
const WheelItems = require("../commands/wheel/models/Items");
const MonthlyRaceBoard = require("../commands/monthly-race/models/MonthlyRaceBoard");
const MonthlyRaceSettings = require("../commands/monthly-race/models/RaceSettings");
const { logToChannel } = require("../utils/logger");

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
        ////////////////// WHEEL /////////////////////////
        ///////////////////////////////////////////////////
        else if (interaction.isButton() && interaction.customId === "wheel_spin_again") {
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
            const itemDirectory = path.join(__dirname, "..", "commands", "wheel", "assets", itemNameForPath);
            let imagePath;

            try {
                const files = await fs.promises.readdir(itemDirectory);
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

            const replyPayload = { content: `${interaction.user}`, embeds: [embed], components: [checkItems] };
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
        } else if (interaction?.customId === "other_settings" && interaction?.values[0] === "wheel_settings") {
            const { embeds, components } = await wheelSettingsEmbed(interaction);

            await interaction.update({
                embeds,
                components,
                ephemeral: true, // Make the reply visible only to the user who invoked the command
            });
        } else if (interaction?.customId === "wheel_main_settings") {
            const val = interaction.values[0];
            const settings = await WheelSettings.findOne({ where: { id: 0 } });

            if (val === "status") {
                settings.status ? (settings.status = false) : (settings.status = true);
                await settings.save();
                interaction.client.wheelSettings = settings;
                const { embeds, components } = await wheelSettingsEmbed(interaction);

                await interaction.update({ embeds, components, ephemeral: true });
            } else if (val === "price") {
                const modal = new ModalBuilder().setCustomId(`edit_wheel_price`).setTitle("Edit the price");

                const price = new TextInputBuilder()
                    .setCustomId("price")
                    .setValue(`${settings.price}`)
                    .setLabel("Wheel Price")
                    .setStyle(TextInputStyle.Short);

                const first = new ActionRowBuilder().addComponents(price);

                modal.addComponents(first);
                await interaction.showModal(modal);
            }
        } else if (interaction.customId && interaction.customId.includes("edit_wheel_price")) {
            const price = interaction.fields.getTextInputValue("price");

            const settings = await WheelSettings.findOne({ where: { id: 0 } });
            if (settings.status) {
                await interaction.reply({ content: `❗ Please turn off the wheel to be able to make changes!`, ephemeral: true });
                return;
            }
            if (isNaN(price) || price <= 0) {
                await interaction.reply({ content: `❗ Make sure the price is a positive number!`, ephemeral: true });
                return;
            }

            settings.price = price;
            await settings.save();
            interaction.client.wheelSettings = settings;

            const { embeds, components } = await wheelSettingsEmbed(interaction);

            await interaction.update({
                embeds,
                components,
                ephemeral: true, // Make the reply visible only to the user who invoked the command
            });
        } else if (interaction?.customId?.startsWith("wheel_items_edit-")) {
            const id = interaction.values[0];
            const item = await WheelItems.findOne({ where: { id: +id } });
            if (!item) {
                return await interaction.reply({
                    content: "*❗ Item not found!*",
                    ephemeral: true,
                });
            }
            const modal = new ModalBuilder().setCustomId(`wheel_items_edit_submit-${item.id}`).setTitle("Edit an Item");

            const itemValue = new TextInputBuilder()
                .setCustomId("itemValue")
                .setValue(`${item.item_value}`)
                .setLabel("Item Value(in RGL-Tokens)")
                .setStyle(TextInputStyle.Short);

            const probability = new TextInputBuilder()
                .setCustomId("probability")
                .setValue(`${item.probability}`)
                .setLabel("Probability(%)")
                .setStyle(TextInputStyle.Short);

            const second = new ActionRowBuilder().addComponents(itemValue);
            const third = new ActionRowBuilder().addComponents(probability);

            modal.addComponents(second);
            modal.addComponents(third);

            await interaction.showModal(modal);
        } else if (interaction?.customId?.startsWith("wheel_items_edit_submit-")) {
            const id = interaction.customId.split("-")[1];
            const itemValue = interaction.fields.getTextInputValue("itemValue");
            const probability = interaction.fields.getTextInputValue("probability");
            const settings = await WheelSettings.findOne({ where: { id: 0 } });
            if (settings.status) {
                return await interaction.reply({
                    content: `❗ Please turn off the wheel to be able to make changes!`,
                    ephemeral: true,
                });
            }
            if (isNaN(itemValue) || isNaN(probability)) {
                return await interaction.reply({ content: `❗ Make sure item value and probability are numbers!`, ephemeral: true });
            }
            const item = await WheelItems.findOne({ where: { id: +id } });

            item.item_value = itemValue;
            item.probability = probability;
            await item.save();
            interaction.client.wheelItems = await WheelItems.findAll();

            const { embeds, components } = await wheelSettingsEmbed(interaction);

            await interaction.update({
                embeds,
                components,
                ephemeral: true, // Make the reply visible only to the user who invoked the command
            });
        } else if (interaction?.customId === "wheel_check_items") {
            const items = await WheelItems.findAll({ order: [["item_value", "DESC"]] });
            const settings = interaction.client.wheelSettings || (await WheelSettings.findOne({ where: { id: 0 } }));
            const serverSettings = interaction.client.serverSettings;
            if (items.length === 0) {
                return await interaction.reply({
                    content: `❗ No items have been found.`,
                    ephemeral: true,
                });
            }
            if (!settings.status) {
                return await interaction.reply({
                    content: `❗ Wheel is offline at the moment!`,
                    ephemeral: true,
                });
            }

            const itemList = items.map((item, index) => `${index + 1}. \`${item.item_name}\` - ${item.item_value} RGL-Tokens`).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("<:luckywheel:1399274373013307467> Wheel Items")
                .setDescription(itemList)
                .setColor("FF0000");

            if (serverSettings?.color) {
                embed.setColor(serverSettings.color);
            }
            if (serverSettings?.thumbnail) {
                embed.setThumbnail(serverSettings.thumbnail);
                embed.setFooter({
                    iconURL: serverSettings.thumbnail,
                    text: serverSettings.brand_name || "RGL-Arcade",
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true, // Make the reply visible only to the user who invoked the command
            });
        }
        ///////////////////////////////////////////////////
        ////////////////// COIN FLIP DUEL /////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId?.startsWith("coin_flip_accept-")) {
            const [action, player1, player2, amount] = interaction.customId.split("-");
            const parsedAmount = parseFloat(amount);
            const settings = interaction.client.serverSettings;

            // Handle the acceptance of the coin flip duel
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
                    content: `*❗ One of the players does not have enough RGL-Tokens to play this coin flip duel!*`,
                    ephemeral: true,
                });
            }

            // 1. Randomly pick winner side
            const sides = ["heads", "tails"];
            const winnerSide = sides[Math.floor(Math.random() * sides.length)];

            // randomly assign sides for each player
            const player1Side = Math.random() < 0.5 ? "heads" : "tails";
            const player2Side = player1Side === "heads" ? "tails" : "heads";

            // check the winners
            const winner = winnerSide === player1Side ? player1 : player2;

            await processGameResult({
                player1,
                player2,
                winner,
                amount,
                player1Score: "-",
                player2Score: "-",
                gameName: "🪙 Coin Flip Duel",
                interaction,
            });

            const gifsDir = path.join(__dirname, `../commands/coin/assets/${winnerSide}`);
            const gifFiles = fs.readdirSync(gifsDir);
            const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
            console.log(`Selected GIF: ${randomGif}`);
            const gifPath = path.join(gifsDir, randomGif);
            const attachment = new AttachmentBuilder(gifPath, { name: randomGif });

            const editedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

            editedEmbed
                .setImage(`attachment://${randomGif}`)
                .setDescription(
                    `🟢 **[${player1Side.toUpperCase()} - ${player1Side === "tails" ? "1" : "R"}]:** ${userMention(
                        player1
                    )}\n🔴 **[${player2Side.toUpperCase()} - ${player2Side === "tails" ? "1" : "R"}]:** ${userMention(
                        player2
                    )}\n\n▸ **Bet:** ${parsedAmount.toFixed(2)} RGL-Tokens`
                );

            await interaction.update({
                embeds: [editedEmbed],
                files: [attachment],
                components: [],
            });
        } else if (interaction?.customId?.startsWith("coin_flip_decline-")) {
            const [action, player1, player2] = interaction.customId.split("-");
            if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
                return await interaction.reply({
                    content: `*❗ You cannot decline this coin flip duel!*`,
                    ephemeral: true,
                });
            }

            const canceledBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`coin_flip_canceled-${player1}-${player2}`)
                    .setLabel("❌ Coin Flip Canceled")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await interaction.update({
                content: `*❌ ${interaction.user} has declined the Coin Flip Duel.*`,
                components: [canceledBtn],
                ephemeral: true,
            });
        }
        ///////////////////////////////////////////////////
        ////////////////// SHOP SETTINGS //////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId === "other_settings" && interaction?.values[0] && interaction?.values[0] === "shop_settings") {
            const { embeds, components } = await buildShopSettings(interaction);

            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_tickets_category_select") {
            const category = interaction.values[0];
            const settings = interaction.client.shopSettings;
            settings.tickets_category = category || null;
            await settings.save();
            const { embeds, components } = await buildShopSettings(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_edit_tickets_settings") {
            // create modal to edit tickets settings
            const settings = interaction.client.shopSettings;
            const modal = new ModalBuilder().setCustomId("shop_tickets_settings_submit").setTitle("Edit Tickets Settings");

            const ticketsTitleInput = new TextInputBuilder()
                .setCustomId("shop_tickets_title")
                .setLabel("Tickets Title")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.tickets_title || "")
                .setRequired(true)
                .setMaxLength(256);

            const ticketsDescriptionInput = new TextInputBuilder()
                .setCustomId("shop_tickets_description")
                .setLabel("Tickets Description")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(settings.tickets_description || "")
                .setRequired(true)
                .setMaxLength(3000);

            const ticketsThumbnailInput = new TextInputBuilder()
                .setCustomId("shop_tickets_thumbnail")
                .setLabel("Tickets Thumbnail URL")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.tickets_thumbnail || "")
                .setRequired(true)
                .setMaxLength(1000);
            const ticketsColorInput = new TextInputBuilder()
                .setCustomId("shop_tickets_color")
                .setLabel("Tickets Color (Hex without #)")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.tickets_color || "FF0000")
                .setRequired(true)
                .setMaxLength(6);

            // show modal
            const row1 = new ActionRowBuilder().addComponents(ticketsTitleInput);
            const row2 = new ActionRowBuilder().addComponents(ticketsDescriptionInput);
            const row3 = new ActionRowBuilder().addComponents(ticketsThumbnailInput);
            const row4 = new ActionRowBuilder().addComponents(ticketsColorInput);
            modal.addComponents(row1, row2, row3, row4);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "shop_tickets_settings_submit") {
            const ticketsTitle = interaction.fields.getTextInputValue("shop_tickets_title");
            const ticketsDescription = interaction.fields.getTextInputValue("shop_tickets_description");
            const ticketsThumbnail = interaction.fields.getTextInputValue("shop_tickets_thumbnail");
            const ticketsColor = interaction.fields.getTextInputValue("shop_tickets_color");

            // validate color
            if (ticketsColor && !validate.isHexColor(`#${ticketsColor}`)) {
                return await interaction.reply({
                    content: "❗ Invalid color! Please provide a valid hex color without #.",
                    ephemeral: true,
                });
            }
            // validate thumbnail URL
            if (ticketsThumbnail && !validate.isURL(ticketsThumbnail)) {
                return await interaction.reply({
                    content: "❗ Invalid thumbnail URL! Please provide a valid URL.",
                    ephemeral: true,
                });
            }
            // update settings
            const settings = interaction.client.shopSettings;
            settings.tickets_title = ticketsTitle || null;
            settings.tickets_description = ticketsDescription || null;
            settings.tickets_thumbnail = ticketsThumbnail || null;
            settings.tickets_color = ticketsColor || "FF0000";
            await settings.save();
            const { embeds, components } = await buildShopSettings(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_edit_main_settings") {
            // create modal to edit main shop settings
            const settings = interaction.client.shopSettings;
            const modal = new ModalBuilder().setCustomId("shop_main_settings_submit").setTitle("Edit Shop Main Settings");
            const shopImageInput = new TextInputBuilder()
                .setCustomId("shop_image")
                .setLabel("Shop Image URL")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.shop_image || "")
                .setRequired(false)
                .setMaxLength(1000);

            // show modal
            const row1 = new ActionRowBuilder().addComponents(shopImageInput);
            modal.addComponents(row1);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "shop_main_settings_submit") {
            const shopImage = interaction.fields.getTextInputValue("shop_image");
            // validate image URL
            if (shopImage && !validate.isURL(shopImage)) {
                return await interaction.reply({
                    content: "❗ Invalid shop image URL! Please provide a valid URL.",
                    ephemeral: true,
                });
            }
            // update settings
            const settings = interaction.client.shopSettings;
            settings.shop_image = shopImage || null;
            await settings.save();
            const { embeds, components } = await buildShopSettings(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_admin_role_select") {
            const role = interaction.values[0];
            const settings = interaction.client.shopSettings;
            settings.tickets_admin_role = role || null;
            await settings.save();
            const { embeds, components } = await buildShopSettings(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_channel_select") {
            const channelId = interaction.values[0];
            const settings = interaction.client.shopSettings;
            const channel = await interaction.client.channels.fetch(channelId).catch((e) => null);
            if (channel) {
                const openShopButton = new ButtonBuilder()
                    .setCustomId("open_shop")
                    .setLabel("Browse Shop")
                    .setEmoji("<:halfarrow:1393028711766294560>")
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(openShopButton);
                await channel.send({
                    content: `${settings.shop_image ? settings.shop_image : ""}`,
                    components: [row],
                });
                await interaction.reply({
                    content: `*✅ Shop has been opened in ${channel}.*`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "❗ Invalid channel selected. Please choose a valid text channel.",
                    ephemeral: true,
                });
            }
        } else if (interaction?.customId === "shop_status") {
            const settings = interaction.client.shopSettings;
            settings.status = !settings.status;
            await settings.save();
            const { embeds, components } = await buildShopSettings(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_item_settings") {
            const { embeds, components } = await buildItemsSettings(1);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "shop_items_add") {
            // Create modal for adding new shop item
            const modal = new ModalBuilder().setCustomId("shop_items_add_submit").setTitle("Add New Shop Item");

            const nameInput = new TextInputBuilder()
                .setCustomId("shop_item_name")
                .setLabel("Item Name")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter item name")
                .setRequired(true)
                .setMaxLength(256);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("shop_item_description")
                .setLabel("Item Description")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Enter item description (optional)")
                .setRequired(false)
                .setMaxLength(3000);

            const priceInput = new TextInputBuilder()
                .setCustomId("shop_item_price")
                .setLabel("Item Price in Tokens")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("0.00")
                .setRequired(true)
                .setMaxLength(10);

            const imageInput = new TextInputBuilder()
                .setCustomId("shop_item_image")
                .setLabel("Item Image URL")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("https://example.com/image.png (optional)")
                .setRequired(false)
                .setMaxLength(1000);

            const row1 = new ActionRowBuilder().addComponents(nameInput);
            const row2 = new ActionRowBuilder().addComponents(descriptionInput);
            const row3 = new ActionRowBuilder().addComponents(priceInput);
            const row4 = new ActionRowBuilder().addComponents(imageInput);

            modal.addComponents(row1, row2, row3, row4);

            await interaction.showModal(modal);
        } else if (interaction?.customId === "shop_items_add_submit") {
            // Handle modal submission for adding new item
            const name = interaction.fields.getTextInputValue("shop_item_name");
            const description = interaction.fields.getTextInputValue("shop_item_description") || null;
            const priceInput = interaction.fields.getTextInputValue("shop_item_price");
            const image = interaction.fields.getTextInputValue("shop_item_image") || null;

            // Validate price
            const price = parseFloat(priceInput);
            if (isNaN(price) || price < 0) {
                return await interaction.reply({
                    content: "❗ Invalid price! Please enter a valid number greater than or equal to 0.",
                    ephemeral: true,
                });
            }

            // Validate image URL if provided
            if (image && !validate.isURL(image)) {
                return await interaction.reply({
                    content: "❗ Invalid image URL! Please provide a valid URL or leave it empty.",
                    ephemeral: true,
                });
            }

            try {
                // Create new item
                const newItem = await ShopItems.create({
                    name: name,
                    description: description,
                    price: price,
                    image: image,
                });

                // Return to items settings page 1 to show the new item
                const { embeds, components } = await buildItemsSettings(1);
                await interaction.update({
                    embeds,
                    components,
                    ephemeral: true,
                });

                // Send success message
                await interaction.followUp({
                    content: `✅ Successfully created item **${name}** with ID **${newItem.id}** for **$${price.toFixed(2)}**!`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Error creating shop item:", error);
                await interaction.reply({
                    content: "❗ An error occurred while creating the item. Please try again.",
                    ephemeral: true,
                });
            }
        } else if (interaction?.customId?.startsWith("shop_items_prev-")) {
            // Handle previous page button
            const currentPage = parseInt(interaction.customId.split("-")[1], 10);
            const newPage = Math.max(1, currentPage - 1);

            const { embeds, components } = await buildItemsSettings(newPage);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId?.startsWith("shop_items_next-")) {
            // Handle next page button
            const currentPage = parseInt(interaction.customId.split("-")[1], 10);
            const newPage = currentPage + 1;

            const { embeds, components } = await buildItemsSettings(newPage);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId?.startsWith("shop_items_edit-")) {
            // Handle edit item select menu
            const page = parseInt(interaction.customId.split("-")[1], 10);
            const itemId = interaction.values[0];

            try {
                const item = await ShopItems.findByPk(itemId);
                if (!item) {
                    return await interaction.reply({
                        content: "❗ Item not found!",
                        ephemeral: true,
                    });
                }

                // Create modal for editing item
                const modal = new ModalBuilder()
                    .setCustomId(`shop_items_edit_submit-${itemId}-${page}`)
                    .setTitle(`Edit Item: ${item.name}`);

                const nameInput = new TextInputBuilder()
                    .setCustomId("shop_item_name")
                    .setLabel("Item Name")
                    .setStyle(TextInputStyle.Short)
                    .setValue(item.name)
                    .setRequired(true)
                    .setMaxLength(256);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId("shop_item_description")
                    .setLabel("Item Description")
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(item.description || "")
                    .setRequired(false)
                    .setMaxLength(3000);

                const priceInput = new TextInputBuilder()
                    .setCustomId("shop_item_price")
                    .setLabel("Item Price in Tokens")
                    .setStyle(TextInputStyle.Short)
                    .setValue(item.price.toString())
                    .setRequired(true)
                    .setMaxLength(10);

                const imageInput = new TextInputBuilder()
                    .setCustomId("shop_item_image")
                    .setLabel("Item Image URL")
                    .setStyle(TextInputStyle.Short)
                    .setValue(item.image || "")
                    .setRequired(false)
                    .setMaxLength(1000);

                const row1 = new ActionRowBuilder().addComponents(nameInput);
                const row2 = new ActionRowBuilder().addComponents(descriptionInput);
                const row3 = new ActionRowBuilder().addComponents(priceInput);
                const row4 = new ActionRowBuilder().addComponents(imageInput);

                modal.addComponents(row1, row2, row3, row4);

                await interaction.showModal(modal);
            } catch (error) {
                console.error("Error fetching item for edit:", error);
                await interaction.reply({
                    content: "❗ An error occurred while loading the item for editing.",
                    ephemeral: true,
                });
            }
        } else if (interaction?.customId?.startsWith("shop_items_edit_submit-")) {
            // Handle edit item modal submission
            const parts = interaction.customId.split("-");
            const itemId = parts[1];
            const page = parseInt(parts[2], 10);

            const name = interaction.fields.getTextInputValue("shop_item_name");
            const description = interaction.fields.getTextInputValue("shop_item_description") || null;
            const priceInput = interaction.fields.getTextInputValue("shop_item_price");
            const image = interaction.fields.getTextInputValue("shop_item_image") || null;

            // Validate price
            const price = parseFloat(priceInput);
            if (isNaN(price) || price < 0) {
                return await interaction.reply({
                    content: "❗ Invalid price! Please enter a valid number greater than or equal to 0.",
                    ephemeral: true,
                });
            }

            // Validate image URL if provided
            if (image && !validate.isURL(image)) {
                return await interaction.reply({
                    content: "❗ Invalid image URL! Please provide a valid URL or leave it empty.",
                    ephemeral: true,
                });
            }

            try {
                const item = await ShopItems.findByPk(itemId);
                if (!item) {
                    return await interaction.reply({
                        content: "❗ Item not found!",
                        ephemeral: true,
                    });
                }

                // Update item
                await item.update({
                    name: name,
                    description: description,
                    price: price,
                    image: image,
                });

                // Return to the same page
                const { embeds, components } = await buildItemsSettings(page);
                await interaction.update({
                    embeds,
                    components,
                    ephemeral: true,
                });

                // Send success message
                await interaction.followUp({
                    content: `✅ Successfully updated item **${name}** (ID: ${itemId}) with price **$${price.toFixed(2)}**!`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Error updating shop item:", error);
                await interaction.reply({
                    content: "❗ An error occurred while updating the item. Please try again.",
                    ephemeral: true,
                });
            }
        } else if (interaction?.customId?.startsWith("shop_items_delete-")) {
            // Handle delete item select menu
            const page = parseInt(interaction.customId.split("-")[1], 10);
            const itemId = interaction.values[0];

            await ShopItems.destroy({ where: { id: itemId } });

            const { embeds, components } = await buildItemsSettings(page);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "open_shop") {
            const settings = interaction.client.shopSettings;
            if (!settings.status) {
                return await interaction.reply({
                    content: "*❗ The shop is currently closed.*",
                    ephemeral: true,
                });
            }
            // Handle opening the shop for users
            const { embeds, components } = await shopEmbed(1, interaction);
            await interaction.reply({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId?.startsWith("shop_prev-")) {
            const settings = interaction.client.shopSettings;
            if (!settings.status) {
                return await interaction.reply({
                    content: "*❗ The shop is currently closed.*",
                    ephemeral: true,
                });
            }
            // Handle previous item button in user shop
            const currentPage = parseInt(interaction.customId.split("-")[1], 10);
            const newPage = Math.max(1, currentPage - 1);

            const { embeds, components } = await shopEmbed(newPage, interaction);
            await interaction.update({
                embeds,
                components,
            });
        } else if (interaction?.customId?.startsWith("shop_next-")) {
            const settings = interaction.client.shopSettings;
            if (!settings.status) {
                return await interaction.reply({
                    content: "*❗ The shop is currently closed.*",
                    ephemeral: true,
                });
            }
            // Handle next item button in user shop
            const currentPage = parseInt(interaction.customId.split("-")[1], 10);
            const newPage = currentPage + 1;

            const { embeds, components } = await shopEmbed(newPage, interaction);
            await interaction.update({
                embeds,
                components,
            });
        } else if (interaction?.customId?.startsWith("shop_buy-")) {
            const settings = interaction.client.shopSettings;
            if (!settings.status) {
                return await interaction.reply({
                    content: "*❗ The shop is currently closed.*",
                    ephemeral: true,
                });
            }
            // Handle buy button in user shop
            const itemId = interaction.customId.split("-")[1];

            const item = await ShopItems.findByPk(itemId);
            if (!item) {
                return await interaction.reply({
                    content: "❗ Item not found!",
                    ephemeral: true,
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${settings.tickets_title || "⭐ New Items Order!"}`)
                .setDescription(
                    `\`▸ Buyer :\` ${interaction.user}\n\`▸ Item  :\` ${item.name}\n\`▸ Price :\` ${item.price.toFixed(2)} Tokens\n\n${
                        settings.tickets_description || "*✔️ Staff will join the ticket soon!*"
                    }`
                )
                .setFooter({ text: "RGL-Arcade Shop" });

            if (settings.tickets_thumbnail) {
                embed.setThumbnail(settings.tickets_thumbnail);
                embed.setFooter({ text: "RGL-Arcade Shop", iconURL: settings.tickets_thumbnail });
            }
            if (settings.tickets_color) {
                embed.setColor(settings.tickets_color);
            }

            const closeTicketButton = new ButtonBuilder()
                .setCustomId("close_shop_ticket-" + interaction.user.id)
                .setLabel("🔒 Close Ticket")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeTicketButton);

            const channel = await createTicket(
                interaction.guild,
                settings.tickets_category,
                interaction.user,
                settings.tickets_admin_role,
                embed,
                [row]
            );

            await interaction.reply({
                content: `*✅ Successfully created a ticket ${channel}.*`,
                ephemeral: true,
            });
        } else if (interaction?.customId?.startsWith("close_shop_ticket-")) {
            const customerId = interaction.customId.split("-")[1];
            const settings = interaction.client.shopSettings;
            const transcript = await discordTranscripts.createTranscript(interaction.channel, {
                maxFileSize: 1048576,
                returnType: "attachment",
            });

            const logsChannel = await interaction.client.channels.fetch(settings.tickets_logs_channel).catch(() => null);
            if (logsChannel) {
                const transcriptFile = await logsChannel.send({ files: [transcript] });

                const embed = createTranscriptEmbed(
                    customerId,
                    interaction.user.id,
                    interaction.channel.name,
                    transcriptFile.url,
                    new Date(),
                    {}
                );

                await logsChannel.send({ embeds: [embed] });
            }
            await interaction.channel.send({
                content: `*⌛ Ticket being closed by ${interaction.user}. Please wait...*`,
            });
            await interaction.channel.delete();
        }

        ///////////////////////////////////////////////////
        ////////////////// GUESS GAME 1-1000 //////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId === "other_settings" && interaction?.values[0] && interaction?.values[0] === "guess_game_settings") {
            const { embeds, components } = await guessGameSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "guess_game_channel_select") {
            const channel = interaction.values[0];

            const settings = interaction.client.guessGameSettings;

            settings.channel_id = channel || null;
            await settings.save();
            const { embeds, components } = await guessGameSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "guess_game_announcements_channel_select") {
            const channel = interaction.values[0];

            const settings = interaction.client.guessGameSettings;

            settings.announcements_channel = channel || null;
            await settings.save();
            const { embeds, components } = await guessGameSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "guess_game_edit_settings") {
            // CREATE MODAL TO EDIT SETTINGS
            const settings = interaction.client.guessGameSettings;
            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the game is active.",
                    ephemeral: true,
                });
            }

            const modal = new ModalBuilder().setCustomId("guess_game_settings_submit").setTitle("Edit 1-1000 Settings");

            const prizeInput = new TextInputBuilder()
                .setCustomId("guess_game_prize")
                .setLabel("Prize Name")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.prize || "")
                .setRequired(true)
                .setMaxLength(1000);

            const prizeTokensInput = new TextInputBuilder()
                .setCustomId("guess_game_prize_tokens")
                .setLabel("Prize Worth in Tokens")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.prize_tokens?.toString() || "0")
                .setRequired(true)
                .setMaxLength(10);

            const textInput = new TextInputBuilder()
                .setCustomId("guess_game_text")
                .setLabel("Information Text")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(settings.text || "")
                .setRequired(true)
                .setMaxLength(3000);

            const thumbnailInput = new TextInputBuilder()
                .setCustomId("guess_game_thumbnail")
                .setLabel("Thumbnail URL")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.thumbnail || "")
                .setRequired(false)
                .setMaxLength(1000);

            // show modal
            const row1 = new ActionRowBuilder().addComponents(prizeInput);
            const row2 = new ActionRowBuilder().addComponents(prizeTokensInput);
            const row3 = new ActionRowBuilder().addComponents(textInput);
            const row4 = new ActionRowBuilder().addComponents(thumbnailInput);
            modal.addComponents(row1, row2, row3, row4);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "guess_game_settings_submit") {
            const prize = interaction.fields.getTextInputValue("guess_game_prize");
            const prizeTokens = interaction.fields.getTextInputValue("guess_game_prize_tokens");
            const text = interaction.fields.getTextInputValue("guess_game_text");
            const thumbnail = interaction.fields.getTextInputValue("guess_game_thumbnail");

            if (isNaN(prizeTokens) || parseFloat(prizeTokens) < 0) {
                return await interaction.reply({
                    content: "❗ Invalid prize tokens. Please enter a valid number.",
                    ephemeral: true,
                });
            }

            // update settings
            const settings = interaction.client.guessGameSettings;
            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the game is active.",
                    ephemeral: true,
                });
            }
            settings.prize = prize;
            settings.prize_tokens = parseFloat(prizeTokens);
            settings.text = text;
            settings.thumbnail = thumbnail;

            await settings.save();

            const { embeds, components } = await guessGameSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "guess_game_status") {
            const settings = interaction.client.guessGameSettings;

            if (!settings.channel_id) {
                return await interaction.reply({
                    content: "❗ Please set a channel first.",
                    ephemeral: true,
                });
            }
            const channel = await interaction.client.channels.fetch(settings.channel_id).catch((e) => null);
            if (!channel) {
                return await interaction.reply({
                    content: "❗ Channel not found! Please set a valid channel for the game.",
                    ephemeral: true,
                });
            }

            settings.status = !settings.status;

            if (settings.status) {
                // generate random number between 1 and 1000
                settings.number = Math.floor(Math.random() * 1000) + 1;

                const embed = new EmbedBuilder()
                    .setTitle("<:games:1381870887623594035> 1-1000 Guessing Game")
                    .setDescription(
                        `${settings.text || "Guess the number between 1 and 1000!"}\n\n` +
                            `<:trophy:1387963764397179040> **Prize:** ${settings.prize || "Not Set."} (${settings.prize_tokens} Tokens)\n`
                    )
                    .setFooter({ text: "Arcade - Guess Game" });

                if (interaction.client.serverSettings.color) {
                    embed.setColor(interaction.client.serverSettings.color);
                }
                if (settings.thumbnail && settings.thumbnail.length > 0) {
                    embed.setThumbnail(settings.thumbnail);
                    embed.setFooter({ text: "Arcade - Guess Game", iconURL: settings.thumbnail });
                }

                await channel.send({
                    embeds: [embed],
                });
            } else {
                const embed = new EmbedBuilder()
                    .setDescription("*❌ The game has been turned off.*")
                    .setColor("ff0000")
                    .setFooter({ text: "Arcade - Guess Game" });

                if (settings.thumbnail && settings.thumbnail.length > 0) {
                    embed.setThumbnail(settings.thumbnail);
                    embed.setFooter({ text: "Arcade - Guess Game", iconURL: settings.thumbnail });
                }
                await channel.send({
                    embeds: [embed],
                });
            }

            await settings.save();

            const { embeds, components } = await guessGameSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        }

        ///////////////////////////////////////////////////
        ////////////////// JACKPOT ////////////////////////
        ///////////////////////////////////////////////////
        else if (interaction?.customId === "other_settings" && interaction?.values[0] && interaction?.values[0] === "jackpot_settings") {
            const { embeds, components } = await buildJackpotSettingsEmbed(interaction);

            await interaction.reply({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "jackpot_style_settings") {
            const settings = await JackpotSettings.findOne({ where: { id: 0 } });

            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the jackpot is active.",
                    ephemeral: true,
                });
            }

            // create modal
            const modal = new ModalBuilder().setCustomId("jackpot_style_settings_submit").setTitle("Edit Jackpot Settings");
            const thumbnailInput = new TextInputBuilder()
                .setCustomId("jackpot_thumbnail")
                .setLabel("Thumbnail URL")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.thumbnail || "")
                .setRequired(false)
                .setMaxLength(1000);

            const colorInput = new TextInputBuilder()
                .setCustomId("jackpot_color")
                .setLabel("Color (Hex without #)")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.color || "FFFFFF")
                .setRequired(false)
                .setMaxLength(6);

            const imageInput = new TextInputBuilder()
                .setCustomId("jackpot_image")
                .setLabel("Image URL")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.image || "")
                .setRequired(false)
                .setMaxLength(1000);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("jackpot_description")
                .setLabel("Description")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(settings.description || "")
                .setRequired(false)
                .setMaxLength(3000);

            // show modal
            const row1 = new ActionRowBuilder().addComponents(thumbnailInput);
            const row2 = new ActionRowBuilder().addComponents(colorInput);
            const row3 = new ActionRowBuilder().addComponents(imageInput);
            const row4 = new ActionRowBuilder().addComponents(descriptionInput);

            modal.addComponents(row1, row2, row3, row4);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "jackpot_style_settings_submit") {
            const thumbnail = interaction.fields.getTextInputValue("jackpot_thumbnail");
            const color = interaction.fields.getTextInputValue("jackpot_color");
            const image = interaction.fields.getTextInputValue("jackpot_image");
            const description = interaction.fields.getTextInputValue("jackpot_description");

            // validate color
            if (color && !validate.isHexColor(`#${color}`)) {
                return await interaction.reply({
                    content: "❗ Invalid color! Please provide a valid hex color without #.",
                    ephemeral: true,
                });
            }

            // validate image and thumbnail URLs
            if (thumbnail && !validate.isURL(thumbnail)) {
                return await interaction.reply({
                    content: "❗ Invalid thumbnail URL! Please provide a valid URL.",
                    ephemeral: true,
                });
            }
            if (image && !validate.isURL(image)) {
                return await interaction.reply({
                    content: "❗ Invalid image URL! Please provide a valid URL.",
                    ephemeral: true,
                });
            }

            // update settings
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
            });

            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the jackpot is active.",
                    ephemeral: true,
                });
            }

            settings.thumbnail = thumbnail || null;
            settings.color = color || "FFFFFF";
            settings.image = image || null;
            settings.description = description || null;
            await settings.save();

            const { embeds, components } = await buildJackpotSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "jackpot_tickets_settings") {
            const settings = await JackpotSettings.findOne({ where: { id: 0 } });

            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the jackpot is active.",
                    ephemeral: true,
                });
            }

            const modal = new ModalBuilder().setCustomId("jackpot_tickets_settings_submit").setTitle("Edit Jackpot Tickets Settings");

            const ticketPriceInput = new TextInputBuilder()
                .setCustomId("jackpot_ticket_price")
                .setLabel("Ticket Price")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.ticket_price?.toString() || "0")
                .setRequired(true)
                .setMaxLength(10);

            const availableTicketsInput = new TextInputBuilder()
                .setCustomId("jackpot_available_tickets")
                .setLabel("Available Tickets (1-50)")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.available_tickets?.toString() || "0")
                .setRequired(true)
                .setMaxLength(2);

            const payoutPercent = new TextInputBuilder()
                .setCustomId("jackpot_payout_percent")
                .setLabel("Payout Percent (0-100)")
                .setStyle(TextInputStyle.Short)
                .setValue(settings.payout_percent?.toString() || "0");

            const row1 = new ActionRowBuilder().addComponents(ticketPriceInput);
            const row2 = new ActionRowBuilder().addComponents(availableTicketsInput);
            const row3 = new ActionRowBuilder().addComponents(payoutPercent);

            modal.addComponents(row1, row2, row3);
            await interaction.showModal(modal);
        } else if (interaction?.customId === "jackpot_tickets_settings_submit") {
            const ticketPrice = parseFloat(interaction.fields.getTextInputValue("jackpot_ticket_price"));
            const availableTickets = parseInt(interaction.fields.getTextInputValue("jackpot_available_tickets"), 10);
            const payoutPercent = parseFloat(interaction.fields.getTextInputValue("jackpot_payout_percent"));

            if (isNaN(ticketPrice) || ticketPrice < 0) {
                return await interaction.reply({
                    content: "❗ Invalid ticket price! Please provide a valid number.",
                    ephemeral: true,
                });
            }

            if (isNaN(availableTickets) || availableTickets < 1 || availableTickets > 50) {
                return await interaction.reply({
                    content: "❗ Invalid available tickets! Please provide a number between 1 and 50.",
                    ephemeral: true,
                });
            }

            if (isNaN(payoutPercent) || payoutPercent < 0 || payoutPercent > 100) {
                return await interaction.reply({
                    content: "❗ Invalid payout percent! Please provide a number between 0 and 100.",
                    ephemeral: true,
                });
            }

            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
            });

            if (settings.status) {
                return await interaction.reply({
                    content: "❗ You can't edit settings while the jackpot is active.",
                    ephemeral: true,
                });
            }

            settings.ticket_price = ticketPrice;
            settings.available_tickets = availableTickets;
            settings.payout_percent = payoutPercent;
            await settings.save();

            const { embeds, components } = await buildJackpotSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "jackpot_channel_select") {
            const channel = interaction.values[0];
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
                defaults: { id: 0 },
            });

            settings.channel = channel || null;
            await settings.save();
            const { embeds, components } = await buildJackpotSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "jackpot_toggle_button") {
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
            });

            settings.status = !settings.status;

            const channel = await interaction.client.channels.fetch(settings.channel).catch((e) => null);

            if (!channel) {
                return await interaction.reply({
                    content: "❗ Channel not found! Please set a valid channel for the jackpot.",
                    ephemeral: true,
                });
            }

            if (settings.status) {
                settings.next_draw_date = new Date(Date.now() + 24 * 60 * 60 * 1000); // next draw in 24 hours

                const embed = new EmbedBuilder()
                    .setTitle(`${process.env.JACKPOT_EMOJI || "🍯"} RGL-Arcade Jackpot!`)
                    .setDescription(
                        `${settings.description || "Join the jackpot!"}\n\n⌛ **Next draw:** ${
                            settings.next_draw_date ? time(settings.next_draw_date) : "TBA"
                        }`
                    )
                    .setFooter({ text: "RGL - Jackpot" });

                if (settings.color) {
                    embed.setColor(settings.color);
                }
                if (settings.thumbnail && settings.thumbnail.length > 0) {
                    embed.setThumbnail(settings.thumbnail);
                    embed.setFooter({ text: "RGL - Jackpot", iconURL: settings.thumbnail });
                }
                if (settings.image && settings.image.length > 0) {
                    embed.setImage(settings.image);
                }
                const buyButton = new ButtonBuilder()
                    .setCustomId("jackpot_buy_ticket")
                    .setLabel(`🎫 Buy Tickets`)
                    .setStyle(ButtonStyle.Primary);
                const checkTickets = new ButtonBuilder()
                    .setCustomId("jackpot_check_tickets")
                    .setLabel("🔍 Check Tickets")
                    .setStyle(ButtonStyle.Secondary);

                const actionRow = new ActionRowBuilder().addComponents(buyButton, checkTickets);

                await channel.send({ embeds: [embed], components: [actionRow] });
            } else {
                const embed = new EmbedBuilder()
                    .setDescription("❌ **Jackpot have been canceled. All tickets have been refunded.**")
                    .setFooter({ text: "RGL - Jackpot" });
                if (settings.color) {
                    embed.setColor(settings.color);
                }
                if (settings.thumbnail && settings.thumbnail.length > 0) {
                    embed.setFooter({ text: "RGL - Jackpot", iconURL: settings.thumbnail });
                }
                if (settings.image && settings.image.length > 0) {
                    embed.setImage(settings.image);
                }

                // refund tickets
                const tickets = await JackpotTickets.findAll();

                for (const ticket of tickets) {
                    const [user] = await User.findOrCreate({
                        where: { discord_id: ticket.discord_id },
                        defaults: { discord_id: ticket.discord_id },
                    });
                    user.balance += settings.ticket_price;
                    await user.save();
                }
                await JackpotTickets.destroy({ where: {} }); // clear all tickets

                await channel.send({ embeds: [embed] });
            }

            await settings.save();

            const { embeds, components } = await buildJackpotSettingsEmbed(interaction);
            await interaction.update({
                embeds,
                components,
                ephemeral: true,
            });
        } else if (interaction?.customId === "jackpot_buy_ticket") {
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
                defaults: { id: 0 },
            });

            if (!settings.status) {
                return await interaction.reply({
                    content: "❗ Jackpot is not active!",
                    ephemeral: true,
                });
            }

            // create modal to ask for ticket number
            const modal = new ModalBuilder().setCustomId("jackpot_buy_ticket_submit").setTitle("Buy Jackpot Ticket");

            const ticketNumberInput = new TextInputBuilder()
                .setCustomId("jackpot_ticket_number")
                .setLabel("Ticket Number (1-50)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter a ticket number between 1 and 50")
                .setRequired(true)
                .setMaxLength(2);
            modal.addComponents(new ActionRowBuilder().addComponents(ticketNumberInput));
            await interaction.showModal(modal);
        } else if (interaction?.customId === "jackpot_buy_ticket_submit") {
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
                defaults: { id: 0 },
            });

            if (!settings.status) {
                return await interaction.reply({
                    content: "❗ Jackpot is not active!",
                    ephemeral: true,
                });
            }

            const [user] = await User.findOrCreate({
                where: { discord_id: interaction.user.id },
                defaults: { discord_id: interaction.user.id },
            });
            if (user.balance < settings.ticket_price) {
                return await interaction.reply({
                    content: "❗ You don't have enough tokens to buy a ticket!",
                    ephemeral: true,
                });
            }
            const ticketNumber = parseInt(interaction.fields.getTextInputValue("jackpot_ticket_number"), 10);

            if (isNaN(ticketNumber) || ticketNumber < 1 || ticketNumber > 50) {
                return await interaction.reply({
                    content: "❗ Invalid ticket number! Please provide a number between 1 and 50.",
                    ephemeral: true,
                });
            }
            // check if user already has a ticket with this number
            const existingTicket = await JackpotTickets.findOne({
                where: {
                    ticket_number: ticketNumber,
                },
            });
            if (existingTicket) {
                return await interaction.reply({
                    content: "❗ This ticket number is taken already!",
                    ephemeral: true,
                });
            }
            // create ticket
            await JackpotTickets.create({
                ticket_number: ticketNumber,
                discord_id: interaction.user.id,
            });
            // deduct tokens
            user.balance -= settings.ticket_price;
            await user.save();
            await interaction.reply({
                content: `✅ You have successfully bought a ticket number **${ticketNumber}** for **${settings.ticket_price.toFixed(
                    2
                )}** tokens!`,
                ephemeral: true,
            });

            const ticketCount = await JackpotTickets.count();

            const embed = new EmbedBuilder()
                .setDescription(`🎫 User ${interaction.user} just bought a ticket number **#${ticketNumber}**!`)
                .setFooter({ text: `${ticketCount}/${settings.available_tickets} Tickets Sold` });
            if (settings.color) {
                embed.setColor(settings.color);
            }
            const channel = await interaction.client.channels.fetch(settings.channel).catch((e) => null);
            if (channel) {
                await channel.send({ embeds: [embed] });
            }
            if (ticketCount >= settings.available_tickets) {
                // if all tickets are sold, roll the winners
                await jackpotRollWinners(interaction.client);
            }
        } else if (interaction?.customId === "jackpot_check_tickets") {
            const [settings] = await JackpotSettings.findOrCreate({
                where: { id: 0 },
                defaults: { id: 0 },
            });

            if (!settings.status) {
                return await interaction.reply({
                    content: "❗ Jackpot is not active!",
                    ephemeral: true,
                });
            }

            const tickets = await JackpotTickets.findAll();

            let availableNumbers = [];
            for (let i = 1; i <= 50; i++) {
                const existingTicket = tickets.find((ticket) => ticket.ticket_number === i);
                if (!existingTicket) {
                    availableNumbers.push(i);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("🎫 Jackpot Tickets")
                .setDescription(`**▸ Available Numbers**\n${availableNumbers.join(", ")}`)
                .setFooter({ text: "RGL - Jackpot" });
            if (settings.color) {
                embed.setColor(settings.color);
            }
            if (settings.thumbnail && settings.thumbnail.length > 0) {
                embed.setThumbnail(settings.thumbnail);
                embed.setFooter({ text: "RGL - Jackpot", iconURL: settings.thumbnail });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        }

        ///////////////////////////////////////////////////
        ////////////////// GIVEAWAYS //////////////////////
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
