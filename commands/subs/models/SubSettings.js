const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../../database/database");

const SubSettings = sequelize.define("subscriptions_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	price_tokens: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	role_id: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	logs_channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	description: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = SubSettings;
