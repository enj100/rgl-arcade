const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const CommunityRafflePrizes = sequelize.define("community_raffle_prizes", {
	place: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
	},
	prize: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = CommunityRafflePrizes;
