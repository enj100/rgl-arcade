const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const GoodiebagSettings = sequelize.define("goodiebag_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	goodiebag_image: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	price: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
	users_paid: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
	payout: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
});

module.exports = GoodiebagSettings;
