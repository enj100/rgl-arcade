const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const HouseGamesProfit = sequelize.define("house_games_profit", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	whip_duel: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
});

module.exports = HouseGamesProfit;
