const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const CommunityRaffleTickets = sequelize.define("community_raffle_tickets", {
	ticket_number: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = CommunityRaffleTickets;
