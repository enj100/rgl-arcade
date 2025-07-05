const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const GiveawayUsers = sequelize.define("giveaways_users", {
	giveaway_id: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	discord_id: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	extra_entries: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
});

module.exports = GiveawayUsers;
