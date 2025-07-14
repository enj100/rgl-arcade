const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const JackpotTickets = sequelize.define("jackpot_tickets", {
	ticket_number: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
	},
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: false,
	},
});

module.exports = JackpotTickets;
