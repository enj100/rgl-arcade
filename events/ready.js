const { Events } = require("discord.js");
const Settings = require("../models/settings");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    try {
      await Settings.sync({ alter: true });
      await Settings.findOrCreate({
        where: { id: 0 },
        defaults: {
          id: 0
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
