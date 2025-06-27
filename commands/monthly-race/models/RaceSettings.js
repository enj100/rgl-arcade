const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const MonthlyRaceSettings = sequelize.define("monthly_race_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	channel: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	message: {
		type: DataTypes.STRING(64),
		allowNull: true,
		defaultValue: null,
	},
	winners_amount: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 1,
	},
	status: {
		type: DataTypes.BOOLEAN,
		allowNull: true,
		defaultValue: false,
	},
});

module.exports = MonthlyRaceSettings;
