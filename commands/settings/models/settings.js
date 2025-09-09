const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const Settings = sequelize.define("settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING(6),
		allowNull: true,
		defaultValue: "FFFFFF",
	},
	brand_name: {
		type: DataTypes.STRING(255),
		allowNull: true,
		defaultValue: null,
	},
	logs_channel: {
		type: DataTypes.STRING(50),
		allowNull: true,
		defaultValue: null,
	},
	games_logs_channel: {
		type: DataTypes.STRING(50),
		allowNull: true,
		defaultValue: null,
	},
	transfers_logs_channel: {
		type: DataTypes.STRING(50),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = Settings;
