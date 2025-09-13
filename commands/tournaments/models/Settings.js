const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const TournamentSettings = sequelize.define("tournament_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		defaultValue: 0,
	},
	title: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "Tournament",
	},
	description: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "Join the tournament and compete with others!",
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING(6),
		allowNull: false,
		defaultValue: "FFD700",
	},
	maxUsers: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 16,
	},
	price: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 10.0,
	},
	channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	announcements_channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
});

module.exports = TournamentSettings;
