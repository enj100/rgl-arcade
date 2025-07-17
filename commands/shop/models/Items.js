const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const ShopItems = sequelize.define("shop_items", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING(256),
		allowNull: false,
		defaultValue: "Unnamed Item",
	},
	description: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	price: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	image: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = ShopItems;
