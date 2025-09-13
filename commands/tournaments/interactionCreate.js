const buildTournamentsSettingsEmbed = require("./embeds/settingsEmbed");

module.exports = {
	async execute(interaction) {
		// Handle tournament-specific interactions here
		if (interaction?.customId === "other_settings" && interaction?.values[0] === "tournaments_settings") {
			const { components, flags } = await buildTournamentsSettingsEmbed(interaction);
			return interaction.update({
				embeds: [],
				components: components,
				flags: flags,
			});
		}
	},
};
