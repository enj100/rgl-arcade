const { EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, channelMention, AttachmentBuilder } = require("discord.js");

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const MonthlyRaceBoard = require("../models/MonthlyRaceBoard");

async function generateLeaderboardImages(users = null, client) {
	if (!users) {
		users = await MonthlyRaceBoard.findAll({
			order: [["total", "DESC"]],
		});
	}

	for (let page = 0; page < 2; page++) {
		const canvas = createCanvas(960, 540);
		const context = canvas.getContext("2d");
		const background = await loadImage(path.join(__dirname, "../assets/race.png"));
		context.drawImage(background, 0, 0, canvas.width, canvas.height);

		context.font = "bold 25px verdana";
		context.fillStyle = "#FFFFFF";

		context.textAlign = "center";
		context.textBaseline = "middle";

		let y = 130;
		const startIndex = page * 10;
		for (let index = 0; index < 10; index++) {
			const displayIndex = startIndex + index + 1;
			const displayIndexText = `${displayIndex < 10 ? "0" : ""}${displayIndex}`;
			context.fillText(displayIndexText, 65, y);

			const user = users[startIndex + index];
			if (user) {
				const userObj = await client.users.fetch(user?.discord_id);
				if (userObj) {
					context.fillText(userObj.username, 470, y);
					context.fillText(`${user.total.toFixed(2)}`, 850, y);
				}
			}

			y += 40.5;
		}

		const buffer = canvas.toBuffer("image/jpeg");
		const filePath = path.join(__dirname, `../assets/monthly_board_${page}.jpg`);
		fs.writeFileSync(filePath, buffer);
	}
}

async function buildMonthlyLeaderboard(client, page = 0, needsRegeneration = false, users = null) {
	// Generate images if they don't exist or if we need to regenerate them.
	for (let i = 0; i < 2; i++) {
		const filePath = path.join(__dirname, `../assets/monthly_board_${i}.jpg`);
		if (!fs.existsSync(filePath) || needsRegeneration) {
			await generateLeaderboardImages(users, client);
			break;
		}
	}

	const filePath = path.join(__dirname, `../assets/monthly_board_${page}.jpg`);
	const attachment = new AttachmentBuilder(filePath);

	const back = new ButtonBuilder().setCustomId(`monthly_board_back-${page}`).setEmoji("⬅️").setStyle(ButtonStyle.Secondary);

	const next = new ButtonBuilder().setCustomId(`monthly_board_next-${page}`).setEmoji("➡️").setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder().addComponents(back, next);

	return { files: [attachment], components: [row] };
}

module.exports = { buildMonthlyLeaderboard, generateLeaderboardImages };
