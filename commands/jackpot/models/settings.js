const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const JackpotSettings = sequelize.define("jackpot_setings", {
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
	image: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	ticket_price: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0,
	},
	available_tickets: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 0,
	},
	description: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	next_draw_date: {
		type: DataTypes.DATE,
		allowNull: true,
		defaultValue: null,
	},
	payout_percent: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0,
	},
});

module.exports = JackpotSettings;
