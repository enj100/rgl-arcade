const GIFEncoder = require("gifencoder");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");

module.exports = {
	async createCommunityRaffleGif(winners, interaction) {
		const encoder = new GIFEncoder(1024, 1024);
		// use node-canvas
		const canvas = createCanvas(1024, 1024);
		const ctx = canvas.getContext("2d");
		const background = await loadImage(path.join(__dirname, `../assets/title.jpg`));
		const ticket = await loadImage(path.join(__dirname, `../assets/ticket.jpg`));

		const stream = new PassThrough(); // Memory stream
		let buffers = [];

		// Collect data into buffer array
		stream.on("data", (chunk) => buffers.push(chunk));

		return new Promise((resolve, reject) => {
			stream.on("end", () => resolve(Buffer.concat(buffers))); // Resolve when GIF is finished
			stream.on("error", reject);

			encoder.createReadStream().pipe(stream);

			encoder.start();
			encoder.setRepeat(-1); // 0 for repeat, -1 for no-repeat
			encoder.setDelay(2500); // frame delay in ms
			encoder.setQuality(6); // image quality. 10 is default.
			ctx.drawImage(background, 0, 0, 1024, 1024);
			encoder.addFrame(ctx);

			ctx.font = "60px Arial";
			ctx.fillStyle = "black";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			for (let i = 0; i < winners.length; i++) {
				const username = winners[i].username;
				const prize = winners[i].prize;
				ctx.drawImage(ticket, 0, 0, 1024, 1024);
				ctx.fillText(username, 420, 460);
				ctx.fillText(prize, 420, 520);
				encoder.addFrame(ctx);
			}

			encoder.finish();
		});
	},
};
