const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const CommunityRafflePrizes = sequelize.define("community_raffle_prizes", {
    raffle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    place: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    prize: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = CommunityRafflePrizes;
