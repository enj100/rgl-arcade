const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const FpLiveBets = sequelize.define("fp_live_bets", {
	discord_id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	bet_hans: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	bet_bob: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
});

module.exports = FpLiveBets;
