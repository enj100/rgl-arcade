const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const WhipHouseLastBets = sequelize.define("whip_house_last_bets", {
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: false,
		primaryKey: true,
	},
	last_bets: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = WhipHouseLastBets;
