const {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require("discord.js");

module.exports = {
    selectMenu() {
        return new StringSelectMenuBuilder()
            .setCustomId('settings-selectMenu')
            .setPlaceholder('Click here to select settings.')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Server Settings')
                    .setDescription('Logging, thumbnail, color, server name and more.')
                    .setValue('settings-serverSettings'),
            );
    }

};