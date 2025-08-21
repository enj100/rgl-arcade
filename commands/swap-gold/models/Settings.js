const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const GoldSwapSettings = sequelize.define("gold_swap_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	category: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "FF0000",
	},
	thumbnail: {
		type: DataTypes.STRING(1000),
		allowNull: true,
		defaultValue: null,
	},
	ticket_message: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	staff_role: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	logs_channel: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = GoldSwapSettings;
