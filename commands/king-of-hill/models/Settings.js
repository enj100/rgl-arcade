const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const KothSettings = sequelize.define("koth_settings", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        primaryKey: true,
        defaultValue: 0,
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
    winners_amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
    },
    auto_run: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
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
    color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "FF0000",
    },
});

module.exports = KothSettings;
