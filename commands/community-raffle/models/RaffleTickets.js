const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const CommunityRaffleTickets = sequelize.define("community_raffle_tickets", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    raffle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ticket_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    discord_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = CommunityRaffleTickets;
