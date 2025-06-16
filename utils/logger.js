const {
    EmbedBuilder
} = require("discord.js");
const Settings = require("../models/settings");

module.exports = {
    name: 'log',
    async logToChannel(interaction, message) {
        const settings = await Settings.findOne({ where: { id: 0 } });
        if (!settings) return;

        const logChannel = interaction.client.channels.cache.get(settings.log_channel);

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle("🆕 New Log")
                .setDescription(message ?? "-")
                .setColor("Blue");

            try {
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.log(error);
            }
        }
        return;
    },
};
