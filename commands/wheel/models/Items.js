const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const WheelItems = sequelize.define("wheel_items", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
	},
	item_name: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	item_value: {
		type: DataTypes.FLOAT,
		allowNull: true,
	},
	probability: {
		type: DataTypes.FLOAT,
		allowNull: true,
	},
});

module.exports = WheelItems;
