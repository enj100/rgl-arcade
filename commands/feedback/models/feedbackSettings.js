const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../../database/database");

const FeedbackSettings = sequelize.define("feedback_settings", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		defaultValue: 0,
	},
	thumbnail: {
		type: DataTypes.STRING(1000),
		allowNull: true,
		defaultValue: null,
	},
	color: {
		type: DataTypes.STRING(6),
		allowNull: true,
		defaultValue: "FFFFFF",
	},
	brand_name: {
		type: DataTypes.STRING(255),
		allowNull: true,
		defaultValue: null,
	},
	feedbacks_channel: {
		type: DataTypes.STRING(255),
		allowNull: true,
		defaultValue: null,
	},
	image: {
		type: DataTypes.STRING(1000),
		allowNull: true,
		defaultValue: null,
	},
	feedback_description: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = FeedbackSettings;
