const {
    EmbedBuilder,
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    channelMention,
    StringSelectMenuBuilder,
} = require("discord.js");
const KothSettings = require("../models/Settings");
const KothPrize = require("../models/Prize");

async function kothSettingsEmbed(interaction) {
    const settings = await KothSettings.findOne({ where: { id: 0 } });
    const prizes = await KothPrize.findAll({ order: [["place", "ASC"]] });

    let prizesString = prizes
        .filter((p) => p.place <= settings.winners_amount)
        .map((p) => `**${p.place}st Place:** ${p.prize_name} - ${p.prize_tokens} Tokens`)
        .join("\n");

    const channel = `**‣ Koth Channel:** ${settings.channel ? channelMention(settings.channel) : "None"}\n`;
    const winnersAmount = `**‣ Winners Amount:** ${settings.winners_amount || "Not Set"}\n`;
    const autoRun = `**‣ Auto Run:** ${settings.auto_run ? "Enabled" : "Disabled"}\n`;
    const status = `**‣ Status:** ${settings.status ? "Enabled" : "Disabled"}\n\n`;

    const embed = new EmbedBuilder()
        .setTitle("King of the Hill Settings")
        .setDescription(`${channel}${winnersAmount}${autoRun}${status}${prizesString}`)
        .setColor("FFFFFF");

    if (settings.color) {
        embed.setColor(settings.color);
    }
    if (settings.thumbnail) {
        embed.setThumbnail(settings.thumbnail);
    }

    const editButton = new ButtonBuilder().setCustomId("koth_settings_edit").setLabel("✏️ Edit").setStyle(ButtonStyle.Primary);

    const statusBtn = new ButtonBuilder()
        .setCustomId("koth_settings_status")
        .setLabel(settings.status ? "Turn OFF" : "Turn ON")
        .setStyle(settings.status ? ButtonStyle.Danger : ButtonStyle.Success);

    const drawWinnersBtn = new ButtonBuilder()
        .setCustomId("koth_settings_draw_winners")
        .setLabel("🎉 Draw Winners")
        .setStyle(ButtonStyle.Primary);

    const autoRunBtn = new ButtonBuilder()
        .setCustomId("koth_settings_auto_run")
        .setLabel(settings.auto_run ? "Turn OFF AutoRun" : "Turn ON AutoRun")
        .setStyle(settings.auto_run ? ButtonStyle.Danger : ButtonStyle.Success);

    const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId("koth_channel_select")
        .setPlaceholder("‣ Select a channel for koth")
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1);

    const prizeSelectOptions = [];
    for (let i = 1; i <= settings.winners_amount; i++) {
        prizeSelectOptions.push({
            label: `Edit ${i}st Place Prize`,
            value: `${i}`,
        });
    }

    const prizeSelect = new StringSelectMenuBuilder()
        .setCustomId("koth_prize_edit")
        .setPlaceholder("‣ Edit Prizes")
        .addOptions(prizeSelectOptions);

    const row1 = new ActionRowBuilder().addComponents(statusBtn, editButton, drawWinnersBtn, autoRunBtn);
    const row2 = new ActionRowBuilder().addComponents(channelSelect);
    const row3 = new ActionRowBuilder().addComponents(prizeSelect);

    return {
        embeds: [embed],
        components: [row1, row2, row3],
    };
}

module.exports = kothSettingsEmbed;
