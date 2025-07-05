const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const GiveawayExtraEntriesSets = sequelize.define("giveaways_extra_entries_sets", {
	id: {
		type: DataTypes.INTEGER,
		allowNull: true,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	extra_entries: {
		type: DataTypes.STRING(2000),
		allowNull: true,
		defaultValue: null,
	},
});

module.exports = GiveawayExtraEntriesSets;
