const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    logChannelModal() {
        const modal = new ModalBuilder()
            .setCustomId('modal-settings-logChannel')
            .setTitle('Change Log Channel');

        const logChannelId = new TextInputBuilder()
            .setCustomId('logChannelId')
            .setLabel("Enter Log Channel ID")
            .setStyle(TextInputStyle.Short);


        const firstActionRow = new ActionRowBuilder().addComponents(logChannelId);

        modal.addComponents(firstActionRow);
        return modal;
    }
};