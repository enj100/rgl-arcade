const { userMention } = require("discord.js");

const { logToChannel } = require("./logger");
const User = require("../commands/wallet/models/User");
const MonthlyRaceSettings = require("../commands/monthly-race/models/RaceSettings");
const MonthlyRaceBoard = require("../commands/monthly-race/models/MonthlyRaceBoard");

/**
 * Process the result of a two-player game.
 * @param {Object} params
 * @param {string} params.player1 - Discord ID of player 1
 * @param {string} params.player2 - Discord ID of player 2
 * @param {string} params.winner - Discord ID of winner or "Tie"
 * @param {number|string} params.amount - Bet amount
 * @param {number} params.player1Score - Player 1's score/roll
 * @param {number} params.player2Score - Player 2's score/roll
 * @param {string} params.gameName - Name of the game (for logs)
 * @param {Object} params.interaction - Discord interaction object
 */
async function processGameResult({ player1, player2, winner, amount, player1Score, player2Score, gameName, interaction }) {
	amount = parseFloat(amount);

	const [player1Wallet] = await User.findOrCreate({
		where: { discord_id: player1 },
		defaults: { discord_id: player1 },
	});
	const [player2Wallet] = await User.findOrCreate({
		where: { discord_id: player2 },
		defaults: { discord_id: player2 },
	});

	if (winner !== "Tie") {
		player1Wallet.balance -= amount;
		player2Wallet.balance -= amount;

		if (winner === player1) {
			player1Wallet.balance += amount * 2;
			player1Wallet.games_won += 1;
			player1Wallet.total_won += amount;
			player1Wallet.wager += amount;
			// P2
			player2Wallet.total_lost += amount;
			player2Wallet.wager += amount;
			player2Wallet.games_lost += 1;
		} else if (winner === player2) {
			player2Wallet.balance += amount * 2;
			player2Wallet.games_won += 1;
			player2Wallet.total_won += amount;
			player2Wallet.wager += amount;
			// P1
			player1Wallet.total_lost += amount;
			player1Wallet.wager += amount;
			player1Wallet.games_lost += 1;
		}
	} else {
		player1Wallet.wager += amount;
		player2Wallet.wager += amount;
	}
	await player1Wallet.save();
	await player2Wallet.save();

	const monthlyRaceSettings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
	if (monthlyRaceSettings?.status) {
		const [player1Board] = await MonthlyRaceBoard.findOrCreate({
			where: { discord_id: player1 },
			defaults: { discord_id: player1 },
		});
		const [player2Board] = await MonthlyRaceBoard.findOrCreate({
			where: { discord_id: player2 },
			defaults: { discord_id: player2 },
		});
		player1Board.total += amount;
		player2Board.total += amount;
		await player1Board.save();
		await player2Board.save();
	}

	const message =
		`🎮 ${gameName} between ${userMention(player1)} and ${userMention(player2)}\n` +
		`🟢 Player 1 (${userMention(player1)}) scored: **${player1Score}**\n` +
		`🔴 Player 2 (${userMention(player2)}) scored: **${player2Score}**\n` +
		`🥇 ${winner === "Tie" ? "It's a tie!" : `The winner is ${userMention(winner)}!`}\n` +
		`__💵 Bet Amount: ${amount.toFixed(2)} RGL-Tokens__\n`;

	await logToChannel(message, interaction.client.logsChannel);
}

module.exports = { processGameResult };
