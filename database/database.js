const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_LOGIN, process.env.DB_PW, {
	host: process.env.DB_HOST,
	dialect: "mysql",
	logging: false,
});

module.exports = sequelize;

// pool: {
// 	max: 15, // Increase max connections
// 	min: 5, // Keep some connections alive
// 	acquire: 60000, // Increase timeout to 60s
// },
// logging: (sql, timing) => {
// 	// Extract operation type
// 	const operationMatch = sql.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|SHOW|DESCRIBE)/i);
// 	const operation = operationMatch ? operationMatch[1] : "QUERY";

// 	// Multiple patterns to catch table names
// 	let tableName = "unknown";

// 	// Try different patterns in order
// 	const patterns = [
// 		/(?:FROM|INTO|UPDATE|JOIN)\s+`?(\w+)`?/i, // Standard FROM/INTO/UPDATE
// 		/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i, // CREATE TABLE
// 		/ALTER TABLE\s+`?(\w+)`?/i, // ALTER TABLE
// 		/DROP TABLE\s+(?:IF EXISTS\s+)?`?(\w+)`?/i, // DROP TABLE
// 		/SHOW\s+.*?FROM\s+`?(\w+)`?/i, // SHOW ... FROM table
// 		/DESCRIBE\s+`?(\w+)`?/i, // DESCRIBE table
// 	];

// 	for (const pattern of patterns) {
// 		const match = sql.match(pattern);
// 		if (match) {
// 			tableName = match[1];
// 			break;
// 		}
// 	}

// 	console.log(`[${new Date().toISOString()}] ${operation} on table: ${tableName}`);
// 	if (timing) console.log(`Execution time: ${timing}ms`);

// 	// If still unknown, log the actual SQL for debugging
// 	if (tableName === "unknown") {
// 		console.log(`Unknown SQL pattern: ${sql.substring(0, 100)}...`);
// 	}
// },
// benchmark: true, // Shows execution time
