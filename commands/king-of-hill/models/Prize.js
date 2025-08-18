const { DataTypes } = require("sequelize");
const sequelize = require("../../../database/database");

const KothPrize = sequelize.define("koth_prizes", {
    place: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    prize_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    prize_tokens: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
});

module.exports = KothPrize;
