const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const CommunityRaffleSettings = sequelize.define("community_raffle_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	winners_amount: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 1,
	},
	channel: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	general_channel: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	message: {
		type: DataTypes.STRING(4000),
		allowNull: true,
		defaultValue: null,
	},
	text: {
		type: DataTypes.TEXT,
		allowNull: true,
		defaultValue: null,
	},
	tickets_amount: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 0,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	ticket_price_tokens: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0,
	},
	spam_channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	raffle_role: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = CommunityRaffleSettings;
