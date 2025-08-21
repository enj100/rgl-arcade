const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const User = sequelize.define("user", {
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: false,
		primaryKey: true,
	},
	balance: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	games_won: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	games_lost: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	total_won: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	total_lost: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	wager: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
	rank: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	total_bought: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
	cashback: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
});

module.exports = User;
