const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const Rank = sequelize.define("ranks", {
	role_id: {
		type: DataTypes.STRING(64),
		allowNull: false,
		primaryKey: true,
	},
	requirement: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
	rakeback: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0.0,
	},
});

module.exports = Rank;
