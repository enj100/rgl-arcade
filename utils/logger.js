const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "log",
	async logToChannel(message, logsChannel, color = "FF0000") {
		const embed = new EmbedBuilder()
			.setTitle("🆕 New Log")
			.setDescription(message ?? "-")
			.setColor(color)
			.setTimestamp();
		if (logsChannel) {
			try {
				await logsChannel.send({ embeds: [embed] });
			} catch (error) {
				console.error("Error sending log message:", error);
			}
		}
	},
};
