const { Events, EmbedBuilder } = require("discord.js");
const User = require("../commands/wallet/models/User");

module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		const { guessGameSettings } = interaction?.client || {};
		if (guessGameSettings.status) {
			if (guessGameSettings?.channel_id === interaction.channelId) {
				const guessNumber = +interaction.content;

				if (guessNumber === guessGameSettings.number) {
					guessGameSettings.status = false;

					const embed = new EmbedBuilder()
						.setTitle("<:games:1381870887623594035> 1-1000 Guessing Game")
						.setDescription(
							`${interaction.author} Guessed The Right Number For a **${guessGameSettings?.prize}**!\n\`Your prize was added to your wallet!\``
						)
						.setColor("FFFFFF");

					await interaction.reply({ embeds: [embed] });

					const [wallet] = await User.findOrCreate({
						where: { discord_id: interaction.author.id },
						defaults: { discord_id: interaction.author.id },
					});
					wallet.balance += guessGameSettings.prize_tokens;
					await wallet.save();

					await guessGameSettings.save();

					// announce in the other channel too
					if (guessGameSettings.announcements_channel) {
						const channel = await interaction.client.channels.fetch(guessGameSettings.announcements_channel).catch((e) => null);
						if (channel) {
							embed.setTitle("<:trophy:1387963764397179040> Guessing Game Winner!");
							await channel.send({ embeds: [embed] });
						}
					}
				}
			}
		}
	},
};
