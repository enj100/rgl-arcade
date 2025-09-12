const MonthlyRaceSettings = require("../commands/monthly-race/models/RaceSettings");
const MonthlyRaceBoard = require("../commands/monthly-race/models/MonthlyRaceBoard");
const KothSettings = require("../commands/king-of-hill/models/Settings");
const KothLeaderboard = require("../commands/king-of-hill/models/Leaderboard");

async function updateWinnerStats(user, amount, won, multiplier) {
	user.balance -= amount;
	user.wager += amount;
	if (won) {
		user.balance += amount * multiplier;
		user.games_won += 1;
		user.total_won += amount * multiplier;
	} else {
		user.games_lost += 1;
		user.total_lost += amount;
	}
	await user.save();

	const monthlyRaceSettings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
	if (monthlyRaceSettings.status) {
		const [board] = await MonthlyRaceBoard.findOrCreate({
			where: { discord_id: user.discord_id },
			defaults: { discord_id: user.discord_id },
		});
		board.total += amount;
		await board.save();
	}

	const kothSettings = await KothSettings.findOne({ where: { id: 0 } });
	if (kothSettings && kothSettings.status) {
		if (won) {
			const [entry] = await KothLeaderboard.findOrCreate({
				where: { discord_id: user.discord_id },
				defaults: { discord_id: user.discord_id, wins: 0 },
			});

			await KothLeaderboard.increment("wins", { by: 1, where: { discord_id: user.discord_id } });
		}
	}
}

module.exports = { updateWinnerStats };
