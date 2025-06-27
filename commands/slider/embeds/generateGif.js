const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");

const { PassThrough } = require("stream");

async function loadImages() {
	// Define the array of images with their properties
	const imageData = [
		{ imgPath: "../assets/rune scimi.png", value: 10000, textValue: "0.01M", borderColor: "white" },
		{ imgPath: "../assets/maul.png", value: 610000, textValue: "0.61M", borderColor: "white" },
		{ imgPath: "../assets/dragon long.png", value: 60000, textValue: "0.06M", borderColor: "white" },
		{ imgPath: "../assets/rune plate.png", value: 40000, textValue: "0.04M", borderColor: "white" },
		{ imgPath: "../assets/addy kite.png", value: 4000, textValue: "0.004M", borderColor: "white" },
		{ imgPath: "../assets/guilded boots.png", value: 1700000, textValue: "1.70M", borderColor: "white" },
		{ imgPath: "../assets/str ammy.png", value: 1000, textValue: "0.001M", borderColor: "white" },

		{ imgPath: "../assets/whip.png", value: 2240000, textValue: "2.24M", borderColor: "yellow" },
		{ imgPath: "../assets/dboots.png", value: 200000, textValue: "0.20M", borderColor: "yellow" },
		{ imgPath: "../assets/dcb.png", value: 1130000, textValue: "1.13M", borderColor: "yellow" },
		{ imgPath: "../assets/bring.png", value: 4800000, textValue: "4.80M", borderColor: "yellow" },
		{ imgPath: "../assets/arma helm.png", value: 11450000, textValue: "11.45M", borderColor: "yellow" },
		{ imgPath: "../assets/dbow.png", value: 950000, textValue: "0.95M", borderColor: "yellow" },

		{ imgPath: "../assets/ags.png", value: 10400000, textValue: "10.40M", borderColor: "red" },
		{ imgPath: "../assets/tbow.png", value: 1481500000, textValue: "1481.50M", borderColor: "red" },
		{ imgPath: "../assets/dwh.png", value: 22360000, textValue: "22.36M", borderColor: "red" },
		{ imgPath: "../assets/ely.png", value: 795420000, textValue: "795.42M", borderColor: "red" },
		{ imgPath: "../assets/scythe.png", value: 1785500000, textValue: "1785.50M", borderColor: "red" },
		{ imgPath: "../assets/rapier.png", value: 33970000, textValue: "33.97M", borderColor: "red" },
		{ imgPath: "../assets/3rd age.png", value: 2147000000, textValue: "2147M", borderColor: "purple" },
	];

	// Load the images and attach their properties
	const imagesWithProperties = await Promise.all(
		imageData.map(async (data) => {
			const image = await loadImage(path.join(__dirname, data.imgPath));
			return {
				image,
				value: data.value,
				borderColor: data.borderColor,
				textValue: data.textValue,
			};
		})
	);

	return imagesWithProperties;
}

function generateRandomSequence(images, count = 150) {
	return Array.from({ length: count }, () => {
		const randomIndex = Math.floor(Math.random() * images.length);
		return images[randomIndex];
	});
}

// Easing function for rapid deceleration (ease-out exponential)
function easeOutExpo(t) {
	return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

module.exports = {
	async createSliderGIF(player1, player2) {
		const width = 600;
		const height = 200; // Increased height to accommodate two sliders
		const frameDelay = 1; // Lower delay = smoother animation
		const totalFrames = 60; // Fewer frames for a quick stop

		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		const encoder = new GIFEncoder(width, height);
		const stream = new PassThrough(); // Create a PassThrough stream to hold the GIF in memory
		encoder.createReadStream().pipe(stream); // Pipe the GIF data to the stream

		encoder.start();
		encoder.setRepeat(-1); // 0 = loop forever
		encoder.setDelay(frameDelay);
		encoder.setQuality(30); // Better quality (lower = better)

		const images = await loadImages();
		const sequence1 = generateRandomSequence(images, 150);
		const sequence2 = generateRandomSequence(images, 150);

		const maxSlide = totalFrames * 20; // Larger distance for fast spinning

		// Use the same random stopping offset for both sliders to align them
		const randomStopOffset = Math.random() * 100;

		let finalOffsetX; // To store the final offset for determining the stopping item

		for (let frame = 0; frame < totalFrames; frame++) {
			ctx.clearRect(0, 0, width, height);

			// Calculate eased offset for rapid deceleration
			const progress = frame / totalFrames;
			const easedProgress = easeOutExpo(progress);
			const offsetX = easedProgress * maxSlide + randomStopOffset;

			// Store the final offset for the last frame
			if (frame === totalFrames - 1) {
				finalOffsetX = offsetX;
			}

			// Draw the first slider
			let x1 = -offsetX;
			for (let i = 0; i < sequence1.length; i++) {
				const { image, value, textValue, borderColor } = sequence1[i];
				const imageSize = 50;
				const boxSize = 100;
				const padding = (boxSize - imageSize) / 2;

				ctx.drawImage(image, x1 + padding, padding, imageSize, imageSize);

				// Draw the random number below the image
				ctx.fillStyle = "white";
				ctx.font = "20px Arial";
				ctx.textAlign = "center";
				ctx.fillText(textValue, x1 + boxSize / 2, boxSize - 10);

				// Add a 1px red border around the box
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = 1;
				ctx.strokeRect(x1, 0, boxSize, boxSize);

				x1 += boxSize;
				if (x1 > width) break;
			}

			// Draw the second slider
			let x2 = -offsetX; // Use the same offset as the first slider
			for (let i = 0; i < sequence2.length; i++) {
				const { image, value, textValue, borderColor } = sequence2[i];
				const imageSize = 50;
				const boxSize = 100;
				const padding = (boxSize - imageSize) / 2;

				ctx.drawImage(image, x2 + padding, 100 + padding, imageSize, imageSize);

				// Draw the random number below the image
				ctx.fillStyle = "white";
				ctx.font = "20px Arial";
				ctx.textAlign = "center";
				ctx.fillText(textValue, x2 + boxSize / 2, 200 - 10);

				// Add a 1px red border around the box
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = 1;
				ctx.strokeRect(x2, 100, boxSize, boxSize);

				x2 += boxSize;
				if (x2 > width) break;
			}

			// Draw the arrow for the first slider
			ctx.fillStyle = "green"; // Arrow color
			ctx.beginPath();
			ctx.moveTo(width / 2, 20); // Bottom center (x = width / 2, y = 20)
			ctx.lineTo(width / 2 - 10, 0); // Top-left point
			ctx.lineTo(width / 2 + 10, 0); // Top-right point
			ctx.closePath();
			ctx.fill();

			// Draw the arrow for the second slider
			ctx.fillStyle = "red"; // Arrow color
			ctx.beginPath();
			ctx.moveTo(width / 2, 120); // Bottom center (x = width / 2, y = 120)
			ctx.lineTo(width / 2 - 10, 100); // Top-left point
			ctx.lineTo(width / 2 + 10, 100); // Top-right point
			ctx.closePath();
			ctx.fill();

			encoder.addFrame(ctx);
		}

		// Determine the stopping items
		const boxSize = 100;
		const stoppingIndex1 = Math.floor((finalOffsetX + width / 2) / boxSize) % sequence1.length;
		const stoppingIndex2 = Math.floor((finalOffsetX + width / 2) / boxSize) % sequence2.length;

		const stoppingItem1 = sequence1[stoppingIndex1].value;
		const stoppingItem2 = sequence2[stoppingIndex2].value;
		ctx.font = "45px Arial";
		ctx.textAlign = "center";

		if (stoppingItem1 === stoppingItem2) {
			ctx.fillStyle = "YELLOW"; // Arrow color
			ctx.fillText("TIE", 300, 100);
		} else if (stoppingItem1 > stoppingItem2) {
			ctx.fillStyle = "GREEN"; // Arrow color
			ctx.fillText(`WINNER\n${player1?.username ? player1.username : "Player 1"}`, 300, 100);
		} else if (stoppingItem1 < stoppingItem2) {
			ctx.fillStyle = "RED"; // Arrow color
			ctx.fillText(`WINNER\n${player2?.username ? player2.username : "Player 2"}`, 300, 100);
		}
		encoder.addFrame(ctx);
		encoder.finish();

		// Return the GIF and values as an object
		return new Promise((resolve, reject) => {
			const chunks = [];
			stream.on("data", (chunk) => chunks.push(chunk));
			stream.on("end", () => {
				const gifBuffer = Buffer.concat(chunks);
				resolve({
					gifBuffer, // The GIF buffer
					stoppingItem1, // Value for Slider 1
					stoppingItem2, // Value for Slider 2
				});
			});
			stream.on("error", (err) => reject(err));
		});
	},
};
