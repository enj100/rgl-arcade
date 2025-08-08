const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../../database/database");

const Sub = sequelize.define("subscriptions", {
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: false,
		primaryKey: true,
	},
	expiry_date: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW,
	},
});

module.exports = Sub;
