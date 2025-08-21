const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const Rate = sequelize.define("rate", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	rate: {
		type: DataTypes.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
});

module.exports = Rate;
