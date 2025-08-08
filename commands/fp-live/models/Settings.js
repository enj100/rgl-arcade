const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const FpLiveSettings = sequelize.define("fp_live_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	channel_id: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	message_id: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	bets_status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	payout_percent: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 1.95,
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "FF0000",
	},
	footer: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "RGL Arcade - Live Flower Poker - Place Your Bets!",
	},
	profit: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
});

module.exports = FpLiveSettings;
