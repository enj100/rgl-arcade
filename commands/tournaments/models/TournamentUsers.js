const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const TournamentUsers = sequelize.define("tournament_users", {
	discord_id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
});

module.exports = TournamentUsers;
