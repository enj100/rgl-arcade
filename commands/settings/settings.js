const {
    SlashCommandBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require("discord.js");
const Settings = require("../../models/settings");
const { selectMenu } = require("./selectMenu");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("settings")
        .setDefaultMemberPermissions("0")
        .setDescription("⭐ | Server settings."),
    async execute(interaction) {
        const settings = await Settings.findOne({ where: { id: 0 } });

        const settingsEmbed = new EmbedBuilder()
            .setTitle('Settings')
            .setDescription('> Select settings bellow to set them or modify them.')
            .setColor((settings.color && settings.color.length > 0) ? settings.color : null);

        const select = selectMenu();

        const row = new ActionRowBuilder()
            .addComponents(select);
        await interaction.reply({ embeds: [settingsEmbed], components: [row] });
    }
};
