const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const Giveaway = sequelize.define("giveaways", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "New Giveaway",
	},
	description: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "-",
	},
	image_url: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	thumbnail_url: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "ffffff",
	},
	channel: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	message: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	repetitive: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	endDate: {
		type: DataTypes.DATE,
		allowNull: true,
		defaultValue: null,
	},
	duration: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	roles: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
	extra_entries: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
	winners_amount: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 1,
	},
	prize: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	prize_osrs: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	prize_rgl: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	prize_usd: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	prize_rc: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	status: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "creating",
	},
});

module.exports = Giveaway;
