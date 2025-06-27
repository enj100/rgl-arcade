const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const MonthlyRaceBoard = sequelize.define("monthly_race_board", {
	discord_id: {
		type: DataTypes.STRING(64),
		allowNull: true,
		primaryKey: true,
	},
	total: {
		type: DataTypes.FLOAT,
		allowNull: true,
		defaultValue: 0.0,
	},
});

module.exports = MonthlyRaceBoard;
