const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Settings = sequelize.define("settings", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        primaryKey: true,
    },
    log_channel: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    server_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    log_status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    }
});

module.exports = Settings;
