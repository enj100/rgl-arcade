const GIFEncoder = require("gifencoder");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");

function evaluateHand(flowers) {
	let counts = {};
	flowers.forEach((flower) => {
		counts[flower] = (counts[flower] || 0) + 1;
	});

	let pairs = 0;
	let threeOak = false;
	let fourOak = false;
	let fiveOak = false;
	let fh = false;

	Object.values(counts).forEach((count) => {
		if (count === 2) pairs++;
		if (count === 3) threeOak = true;
		if (count === 4) fourOak = true;
		if (count === 5) fiveOak = true;
	});
	if (pairs === 1 && threeOak) {
		fh = true;
	}

	return { pairs, threeOak, fourOak, fiveOak, fh };
}

function compareHands(hand1, hand2) {
	let winningHand = "";
	if (hand1.fiveOak && !hand2.fiveOak) {
		winningHand = "5OAK";
		return { winner: 1, hand: winningHand };
	}
	if (hand2.fiveOak && !hand1.fiveOak) {
		winningHand = "5OAK";
		return { winner: 2, hand: winningHand };
	}

	if (hand1.fourOak && !hand2.fourOak) {
		winningHand = "4OAK";
		return { winner: 1, hand: winningHand };
	}
	if (hand2.fourOak && !hand1.fourOak) {
		winningHand = "4OAK";
		return { winner: 2, hand: winningHand };
	}

	if (hand1.fh && !hand2.fh) {
		winningHand = "FH";
		return { winner: 1, hand: winningHand };
	}
	if (hand2.fh && !hand1.fh) {
		winningHand = "FH";
		return { winner: 2, hand: winningHand };
	}

	if (hand1.threeOak && !hand2.threeOak) {
		winningHand = "3OAK";
		return { winner: 1, hand: winningHand };
	}
	if (hand2.threeOak && !hand1.threeOak) {
		winningHand = "3OAK";
		return { winner: 2, hand: winningHand };
	}

	if (hand1.pairs > hand2.pairs) {
		winningHand = `${hand1.pairs}P`;
		return { winner: 1, hand: winningHand };
	}
	if (hand2.pairs > hand1.pairs) {
		winningHand = `${hand2.pairs}P`;
		return { winner: 2, hand: winningHand };
	}

	return { winner: 0, hand: null }; // tie
}

module.exports = {
	async createFpGif(player1, player2, interaction) {
		const encoder = new GIFEncoder(488, 320);

		// use node-canvas
		const canvas = createCanvas(488, 320);
		const ctx = canvas.getContext("2d");
		const background = await loadImage(path.join(__dirname, `../assets/fp.png`));

		const stream = new PassThrough(); // Memory stream
		let buffers = [];

		// Collect data into buffer array
		stream.on("data", (chunk) => buffers.push(chunk));

		//get players
		const user1 = await interaction.client.users.fetch(player1).catch((err) => null);
		const user2 = await interaction.client.users.fetch(player2).catch((err) => null);

		const assorted = await loadImage(path.join(__dirname, `../assets/assorted.png`));
		const blue = await loadImage(path.join(__dirname, `../assets/blue.png`));
		const mixed = await loadImage(path.join(__dirname, `../assets/mix.png`));
		const orange = await loadImage(path.join(__dirname, `../assets/orange.png`));
		const purple = await loadImage(path.join(__dirname, `../assets/purple.png`));
		const red = await loadImage(path.join(__dirname, `../assets/red.png`));
		const yellow = await loadImage(path.join(__dirname, `../assets/yellow.png`));

		const flowers = [
			{ name: "assorted", image: assorted },
			{ name: "blue", image: blue },
			{ name: "mix", image: mixed },
			{ name: "orange", image: orange },
			{ name: "purple", image: purple },
			{ name: "red", image: red },
			{ name: "yellow", image: yellow },
		];

		let hand1 = new Array();
		let hand2 = new Array();
		for (let index = 0; index < 5; index++) {
			hand1.push(flowers[Math.floor(Math.random() * flowers.length)]);
			hand2.push(flowers[Math.floor(Math.random() * flowers.length)]);
		}
		const hand1Names = hand1.map((flower) => flower.name);
		const hand2Names = hand2.map((flower) => flower.name);

		const player1Hand = evaluateHand(hand1Names);
		const player2Hand = evaluateHand(hand2Names);
		let winningHand = "";
		const winner = compareHands(player1Hand, player2Hand);
		// 0 - tie
		// 1 - player1
		// 2 - player2

		let winnerText = winner.winner === 0 ? "Tie" : winner.winner === 1 ? user1.tag : user2.tag;
		const winnerId = winner.winner === 0 ? "Tie" : winner.winner === 1 ? player1 : player2;

		return {
			winnerId,
			gif: await new Promise((resolve, reject) => {
				stream.on("end", () => resolve(Buffer.concat(buffers))); // Resolve when GIF is finished
				stream.on("error", reject);

				encoder.createReadStream().pipe(stream);

				encoder.start();
				encoder.setRepeat(-1); // 0 for repeat, -1 for no-repeat
				encoder.setDelay(1000); // frame delay in ms
				encoder.setQuality(3); // image quality. 10 is default.
				ctx.drawImage(background, 0, 0, 488, 320);
				encoder.addFrame(ctx);

				ctx.font = "25px Arial";
				ctx.fillStyle = "#ffffff";
				ctx.textBaseline = "middle";
				ctx.fillText(user1.tag, 75, 70);
				ctx.fillStyle = "#ff0000";
				ctx.fillText(user2.tag, 75, 177);

				if (winner > 0) {
					winnerText += `(${winningHand})`;
				}
				ctx.drawImage(hand1[0].image, 77, 94, 45, 45);
				ctx.drawImage(hand2[0].image, 77, 201, 45, 45);
				encoder.addFrame(ctx);

				ctx.drawImage(hand1[1].image, 149, 94, 45, 45);
				ctx.drawImage(hand2[1].image, 149, 201, 45, 45);
				encoder.addFrame(ctx);

				ctx.drawImage(hand1[2].image, 219, 94, 45, 45);
				ctx.drawImage(hand2[2].image, 219, 201, 45, 45);
				encoder.addFrame(ctx);

				ctx.drawImage(hand1[3].image, 289, 94, 45, 45);
				ctx.drawImage(hand2[3].image, 289, 201, 45, 45);
				encoder.addFrame(ctx);

				ctx.drawImage(hand1[4].image, 361, 94, 45, 45);
				ctx.drawImage(hand2[4].image, 361, 201, 45, 45);
				encoder.addFrame(ctx);

				ctx.font = "25px Arial";
				ctx.fillStyle = `${winner.winner === 0 ? "#FFFF00" : winner.winner === 1 ? "#ffffff" : "#ff0000"}`;
				ctx.textBaseline = "left";

				ctx.fillText(`${winnerText === "Tie" ? "TIE" : `${winnerText}(${winner.hand})`}`, 170, 295);
				encoder.addFrame(ctx);

				encoder.finish();
			}),
		};
	},
};
