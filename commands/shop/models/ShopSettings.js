const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const ShopSettings = sequelize.define("shop_settings", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        primaryKey: true,
        defaultValue: 0,
    },
});

module.exports = ShopSettings;
