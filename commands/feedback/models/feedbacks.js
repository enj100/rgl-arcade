const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../../database/database");

const Feedbacks = sequelize.define("feedbacks", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	issued_by: {
		type: DataTypes.STRING(50),
		allowNull: true,
		defaultValue: null,
	},
	customer: {
		type: DataTypes.STRING(50),
		allowNull: true,
		defaultValue: null,
	},
	feedback: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
	rating: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 5,
	},
});

module.exports = Feedbacks;
