const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const MonthlyRacePrizes = sequelize.define("monthly_race_prizes", {
	place: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
	},
	prize: {
		type: DataTypes.STRING(100),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = MonthlyRacePrizes;
