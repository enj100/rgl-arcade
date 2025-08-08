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
	async createFpLiveGif(interaction) {
		const encoder = new GIFEncoder(1200, 1000);

		// use node-canvas
		const canvas = createCanvas(1200, 1000);
		const ctx = canvas.getContext("2d");
		const background = await loadImage(path.join(__dirname, `../assets/background.jpg`));

		const stream = new PassThrough(); // Memory stream
		let buffers = [];

		// Collect data into buffer array
		stream.on("data", (chunk) => buffers.push(chunk));

		const assorted = await loadImage(path.join(__dirname, `../assets/assorted.png`));
		const blue = await loadImage(path.join(__dirname, `../assets/blue.png`));
		const mixed = await loadImage(path.join(__dirname, `../assets/mixed.png`));
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

		let handBob = new Array();
		let handHans = new Array();
		for (let index = 0; index < 5; index++) {
			handBob.push(flowers[Math.floor(Math.random() * flowers.length)]);
			handHans.push(flowers[Math.floor(Math.random() * flowers.length)]);
		}
		const handBobNames = handBob.map((flower) => flower.name);
		const handHansNames = handHans.map((flower) => flower.name);

		const bobHand = evaluateHand(handBobNames);
		const hansHand = evaluateHand(handHansNames);

		let winningHand = "";
		const winner = compareHands(bobHand, hansHand);
		// 0 - tie
		// 1 - bob
		// 2 - hans

		let winnerText = winner.winner === 0 ? "Tie" : winner.winner === 1 ? "Bob" : "Hans";

		return {
			winnerId: winnerText,
			gif: await new Promise((resolve, reject) => {
				stream.on("end", () => resolve(Buffer.concat(buffers))); // Resolve when GIF is finished
				stream.on("error", reject);

				encoder.createReadStream().pipe(stream);

				encoder.start();
				encoder.setRepeat(-1); // 0 for repeat, -1 for no-repeat
				encoder.setDelay(1000); // frame delay in ms
				encoder.setQuality(3); // image quality. 10 is default.
				ctx.drawImage(background, 0, 0, 1200, 1000);
				encoder.addFrame(ctx);

				ctx.font = "25px Arial";
				ctx.fillStyle = "#ffffff";
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#ff0000";

				if (winner > 0) {
					winnerText += `(${winningHand})`;
				}
				ctx.drawImage(handBob[0].image, 590, 430, 95, 95);
				ctx.drawImage(handHans[0].image, 430, 430, 95, 95);
				encoder.addFrame(ctx);

				ctx.drawImage(handBob[1].image, 590, 500, 100, 100);
				ctx.drawImage(handHans[1].image, 420, 500, 100, 100);
				encoder.addFrame(ctx);

				ctx.drawImage(handBob[2].image, 600, 560, 105, 105);
				ctx.drawImage(handHans[2].image, 410, 560, 105, 105);
				encoder.addFrame(ctx);

				ctx.drawImage(handBob[3].image, 610, 650, 110, 110);
				ctx.drawImage(handHans[3].image, 390, 650, 110, 110);
				encoder.addFrame(ctx);

				ctx.drawImage(handBob[4].image, 620, 750, 120, 120);
				ctx.drawImage(handHans[4].image, 380, 750, 120, 120);
				encoder.addFrame(ctx);

				ctx.font = "80px Arial";
				ctx.fillStyle = `${winner.winner === 0 ? "#FFFF00" : winner.winner === 1 ? "#00FF00" : "#ff0000"}`;
				ctx.textBaseline = "middle";
				ctx.textAlign = "center";

				ctx.fillText(`${winnerText === "Tie" ? "TIE" : `${winnerText}(${winner.hand})`}`, 600, 920);
				encoder.addFrame(ctx);

				encoder.finish();
			}),
		};
	},
};
