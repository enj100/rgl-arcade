const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const GuessGameSettings = sequelize.define("guess_game_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		defaultValue: 0,
	},
	channel_id: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	prize: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	prize_tokens: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0,
	},
	text: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	number: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 0,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	announcements_channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = GuessGameSettings;
