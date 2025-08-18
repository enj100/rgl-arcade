const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const KothLeaderboard = sequelize.define("koth_leaderboard", {
    discord_id: {
        type: DataTypes.STRING,
        allowNull: true,
        primaryKey: true,
    },
    wins: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = KothLeaderboard;
