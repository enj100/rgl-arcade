const {
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    logChannel: new ButtonBuilder()
        .setCustomId('button-settings-logChannel')
        .setLabel('Change Log Channel')
        .setStyle(ButtonStyle.Primary),
    color: new ButtonBuilder()
        .setCustomId('button-settings-color')
        .setLabel('Change Color')
        .setStyle(ButtonStyle.Primary),
    thumnail: new ButtonBuilder()
        .setCustomId('button-settings-thumbnail')
        .setLabel('Change Thumbnail')
        .setStyle(ButtonStyle.Primary),
    serverName: new ButtonBuilder()
        .setCustomId('button-settings-serverName')
        .setLabel('Change Server Name')
        .setStyle(ButtonStyle.Primary),
}; 
