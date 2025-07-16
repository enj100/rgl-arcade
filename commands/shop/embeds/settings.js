const {
    EmbedBuilder,
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    channelMention,
} = require("discord.js");

async function buildShopSettings(interaction) {
    const settings = interaction.client.shopSettings;

    const embed = new EmbedBuilder()
        .setTitle("🛒 Shop Settings")
        .setColor(settings.color || "#0099ff")
        .setDescription(`Soon to be added`);

    const shopStatus = new ButtonBuilder()
        .setCustomId("shop_status")
        .setLabel(settings.shop_status ? "Turn OFF" : "Turn ON")
        .setStyle(settings.shop_status ? ButtonStyle.Success : ButtonStyle.Danger);

    const editTickets = new ButtonBuilder().setCustomId("shop_edit_tickets").setLabel("Tickets Settings").setStyle(ButtonStyle.Secondary);

    const shopFrontButton = new ButtonBuilder().setCustomId("shop_edit_main_settings").setLabel("Edit Shop").setStyle(ButtonStyle.Primary);

    const shopChannelSelect = new ChannelSelectMenuBuilder()
        .setCustomId("shop_channel_select")
        .setPlaceholder("ℹ️ Choose a Channel to Post Shop")
        .setChannelTypes(ChannelType.GuildText) // 0 is for GUILD_TEXT channels
        .setMinValues(1)
        .setMaxValues(1);

    const shopTicketsCategorySelect = new ChannelSelectMenuBuilder()
        .setCustomId("shop_tickets_category_select")
        .setPlaceholder("ℹ️ Choose a Category for Shop Tickets")
        .setChannelTypes(ChannelType.GuildCategory) // 4 is for GUILD_CATEGORY channels
        .setMinValues(1)
        .setMaxValues(1);

    const row1 = new ActionRowBuilder().addComponents(shopFrontButton, editTickets, shopStatus);
    const row2 = new ActionRowBuilder().addComponents(shopChannelSelect);
    const row3 = new ActionRowBuilder().addComponents(shopTicketsCategorySelect);

    return {
        embeds: [embed],
        components: [row1, row2, row3],
    };
}

module.exports = buildShopSettings;
