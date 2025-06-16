const {
    ActionRowBuilder,
    ButtonBuilder,
    Events,
    EmbedBuilder,
    ButtonStyle
} = require("discord.js");
const { selectMenu } = require("./selectMenu");
const { logChannel, color, thumnail, serverName } = require("./buttons");
const { logChannelModal } = require("./modals/logChannelModal");
const Settings = require("../../models/settings");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) return;
        /* 
            ---------- Settings SelectMenu
        */
        if (interaction.customId.includes("settings-selectMenu")) {
            const settings = await Settings.findOne({ where: { id: 0 } });
            const logChannelId = (settings && settings.log_channel.length > 0 ? settings.log_channel : null);

            const embed = new EmbedBuilder()
                .setTitle("Server Settings")
                .setDescription(`Log Channel: ${logChannelId ? "<#" + logChannelId + ">" : "-"}`);

            const select = selectMenu();

            const selectMenuRow = new ActionRowBuilder()
                .addComponents(select);

            const buttons = new ActionRowBuilder()
                .addComponents(logChannel, color, thumnail, serverName);

            await interaction.update({ embeds: [embed], components: [selectMenuRow, buttons] });
        }
        /* 
            ---------- Server Settings Buttons
            button-settings-logChannel
        */
        else if (interaction.customId.includes("button-settings")) {
            if (interaction.customId.includes("logChannel")) {
                const modal = logChannelModal();
                await interaction.showModal(modal);
            }
        }
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === "modal-settings-logChannel") {
                const settings = await Settings.findOne({ where: { id: 0 } });
                const logChannel = interaction.fields.getTextInputValue('logChannelId');

                const channel = interaction.client.channels.cache.get(logChannel);

                if (!channel) {
                    await interaction.reply({ content: "❗Channel do not exist!", ephemeral: true });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle("Server Settings")
                    .setDescription(`Log Channel: <#${logChannel}>`);


                await interaction.update({ embeds: [embed] });

                settings.log_channel = logChannel;
                await settings.save();
            }
        }
    },
};
