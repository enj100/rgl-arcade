const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../../database/database");

const ChestItems = sequelize.define("chest_items", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	emoji: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	item_value: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0,
	},
	item_name: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = ChestItems;
