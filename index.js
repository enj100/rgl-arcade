const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");

require("dotenv").config();

const token = process.env.TOKEN;

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception thrown:", error);
});

const index = (async function () {
	const client = new Client({ intents: [GatewayIntentBits.Guilds] });

	client.commands = new Collection();
	client.serverSettings = null;
	client.ranks = new Collection();
	client.goodiebagSettings = null;
	client.goodiebagItems = null;
	client.logsChannel = null;
	client.gamesLogsChannel = null;
	const foldersPath = path.join(__dirname, "commands");
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith(".js"));
		for (const file of commandFiles) {
			const command = require(`./commands/${folder}/${file}`);
			if (command.data) {
				client.commands.set(command.data.name, command);
			}
		}

		const interactionFile = `./commands/${folder}/interactionCreate.js`;
		if (fs.existsSync(interactionFile)) {
			const interaction = require(interactionFile);
			client.on(interaction.name, (...args) => interaction.execute(...args, client));
		}
	}

	const eventsPath = path.join(__dirname, "events");
	const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);

		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}

	client.login(token);
})();
