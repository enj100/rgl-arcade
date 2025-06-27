const { Events, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");
const monthlyRaceSettingsEmbed = require("./embeds/settings");
const MonthlyRaceSettings = require("./models/RaceSettings");
const MonthlyRacePrizes = require("./models/MonthlyRacePrizes");
const { buildMonthlyLeaderboard } = require("./embeds/buildBoard");
const MonthlyRaceBoard = require("./models/MonthlyRaceBoard");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction?.customId === "other_settings" && interaction?.values[0] === "monthly_race_settings") {
			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "monthly_race_change_channel") {
			const selectedChannelId = interaction.values[0];
			const settings = await MonthlyRaceSettings.findOne({
				where: { id: 0 },
			});
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the channel while the race is active.*",
					ephemeral: true,
				});
			}
			settings.channel = selectedChannelId;
			await settings.save();

			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "monthly_race_change_winners") {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the winners amount while the race is active.*",
					ephemeral: true,
				});
			}
			const modal = new ModalBuilder().setCustomId("monthly_race_change_winners_submit").setTitle("Change Winners Amount");

			const winnersInput = new TextInputBuilder()
				.setCustomId("monthly_race_winners_input")
				.setLabel("Enter the new winners amount:")
				.setValue(settings.winners_amount.toString())
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const actionRow = new ActionRowBuilder().addComponents(winnersInput);
			modal.addComponents(actionRow);

			await interaction.showModal(modal);
		} else if (interaction?.customId === "monthly_race_change_winners_submit") {
			const winnersInput = interaction.fields.getTextInputValue("monthly_race_winners_input");
			const winners = parseInt(winnersInput, 10);
			if (isNaN(winners) || winners <= 0) {
				return await interaction.reply({
					content: "❗ Please enter a valid number of winners.",
					ephemeral: true,
				});
			}
			if (winners > 20) {
				return await interaction.reply({
					content: "❗ The maximum number of winners is 20.",
					ephemeral: true,
				});
			}
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the winners amount while the race is active.*",
					ephemeral: true,
				});
			}
			settings.winners_amount = winners;
			await settings.save();

			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "monthly_race_prize_edit") {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the prize while the race is active.*",
					ephemeral: true,
				});
			}
			const place = interaction.values[0];
			const prize = await MonthlyRacePrizes.findOne({ where: { place } });
			const modal = new ModalBuilder()
				.setCustomId(`monthly_race_prize_edit-${place}`)
				.setTitle(`Edit Prize`)
				.addComponents(
					new ActionRowBuilder().addComponents(
						new TextInputBuilder()
							.setCustomId(`prize`)
							.setLabel("Enter the new prize:")
							.setValue(`${prize?.prize || ""}`)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(100)
							.setRequired(true)
					)
				);

			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("monthly_race_prize_edit-")) {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the prize while the race is active.*",
					ephemeral: true,
				});
			}
			const place = interaction.customId.split("-")[1];
			const prizeInput = interaction.fields.getTextInputValue("prize");
			const prize = await MonthlyRacePrizes.findOne({ where: { place } });
			if (prize) {
				prize.prize = prizeInput;
				await prize.save();
			}
			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "monthly_race_change_status") {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			settings.status = !settings.status;
			await MonthlyRaceBoard.destroy({ where: {} });

			if (settings.status) {
				if (!settings.channel) {
					return await interaction.reply({
						content: "*❗ You need to set a channel before starting the race.*",
						ephemeral: true,
					});
				}
				const channel = await interaction.client.channels.fetch(settings.channel).catch(() => null);
				if (channel) {
					const { files, components } = await buildMonthlyLeaderboard(interaction.client, 0, true);

					const msg = await channel.send({
						files,
						components,
					});
					settings.message = msg.id;
				}
			} else {
				const channel = await interaction.client.channels.fetch(settings.channel).catch(() => null);
				if (channel) {
					// delete the message if it exists
					const msg = await channel.messages.fetch(settings.message).catch(() => null);
					if (msg) {
						await msg.delete();
					}
					settings.message = null;
				}
			}

			await settings.save();
			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});

			await interaction.followUp({
				content: `📢 Monthly race has been ${settings.status ? "__started__" : "__stopped__"}.`,
				ephemeral: true,
			});
		} else if (
			interaction?.customId?.startsWith("monthly_board_next-") ||
			interaction?.customId?.startsWith("monthly_board_back-")
		) {
			const page = parseInt(interaction.customId.split("-")[1], 10);
			const pageIndex = +page === 0 ? 1 : 0;
			const { files, components } = await buildMonthlyLeaderboard(interaction.client, pageIndex, false);
			await interaction.update({
				files,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "monthly_race_draw_winners") {
			const settings = await MonthlyRaceSettings.findOne({ where: { id: 0 } });
			const serverSettings = interaction.client.serverSettings;
			if (!settings.status) {
				return await interaction.reply({
					content: "*❗ Monthly race is not active.*",
					ephemeral: true,
				});
			}
			const channel = await interaction.client.channels.fetch(settings?.channel).catch(() => null);
			if (!channel) {
				return await interaction.reply({
					content: "*❗ Channel not found. I can't draw the winners!*",
					ephemeral: true,
				});
			}
			const msg = await channel.messages.fetch(settings?.message).catch(() => null);
			if (!msg) {
				return await interaction.reply({
					content: "*❗ Message not found. I can't draw the winners!*",
					ephemeral: true,
				});
			}
			msg.edit({
				components: [],
			});

			const results = await MonthlyRaceBoard.findAll({
				order: [["total", "DESC"]],
				limit: settings.winners_amount,
			});
			const prizes = await MonthlyRacePrizes.findAll({ order: [["place", "ASC"]] });

			let text = "";
			for (let index = 0; index < prizes.length; index++) {
				if (results[prizes[index].place - 1]) {
					text += `${index + 1}. <@${results[prizes[index].place - 1].discord_id}> won **${prizes[index].prize}**!\n`;
				}
			}

			const embed = new EmbedBuilder()
				.setDescription(`### 🥳 The RGL-Arcade Monthly Race Winners!\n` + text)
				.setFooter({
					text: ` Race Winners`,
				})
				.setColor("FFFFFF");

			if (serverSettings?.thumbnail) {
				embed.setThumbnail(serverSettings.thumbnail);
			}
			if (serverSettings?.color) {
				embed.setColor(serverSettings.color);
			}
			await channel.send({
				embeds: [embed],
			});

			await MonthlyRaceBoard.destroy({ where: {} });
			settings.status = false;
			settings.message = null;
			await settings.save();

			const { embeds, components } = await monthlyRaceSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
			await interaction.followUp({
				content: `🏁 Monthly race has been finished!`,
				ephemeral: true,
			});
		}
	},
};
