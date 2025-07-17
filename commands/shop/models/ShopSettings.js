const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const ShopSettings = sequelize.define("shop_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	tickets_category: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	tickets_title: {
		type: DataTypes.STRING(256),
		allowNull: true,
		defaultValue: null,
	},
	tickets_description: {
		type: DataTypes.STRING(3000),
		allowNull: true,
		defaultValue: null,
	},
	tickets_thumbnail: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	tickets_color: {
		type: DataTypes.STRING(6),
		allowNull: true,
		defaultValue: "FF0000",
	},
	tickets_admin_role: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	shop_image: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
});

module.exports = ShopSettings;
