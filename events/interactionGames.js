const {
	ActionRowBuilder,
	ButtonBuilder,
	Events,
	userMention,
	ButtonStyle,
	EmbedBuilder,
	AttachmentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");
const User = require("../commands/wallet/models/User");
const path = require("path");
const fs = require("fs");
const { processGameResult } = require("../utils/winners");
const validate = require("validator");

const buildFeedbackSettingsEmbed = require("../commands/feedback/feedbackSettingsEmbed");
const Feedbacks = require("../commands/feedback/models/feedbacks");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		///////////////////////////////////////////////////
		////////////////// FEEDBACKS //////////////////
		///////////////////////////////////////////////////
		else if (
			interaction?.customId === "other_settings" &&
			interaction?.values[0] &&
			interaction?.values[0] === "feedback_settings"
		) {
			const { embed, components } = await buildFeedbackSettingsEmbed(interaction);
			await interaction.reply({
				embeds: [embed],
				components: [...components],
				ephemeral: true,
			});
		} else if (interaction?.customId === "feedback_settings_channel") {
			const channelId = interaction.values[0];
			const channel = await interaction.guild.channels.fetch(channelId);
			if (!channel) {
				return await interaction.reply({
					content: "❗️ Invalid channel selected.",
					ephemeral: true,
				});
			}

			interaction.client.feedbackSettings.feedbacks_channel = channelId;

			await interaction.client.feedbackSettings.save();

			const { embed, components } = await buildFeedbackSettingsEmbed(interaction);

			await interaction.update({
				embeds: [embed],
				components: [...components],
			});

			await interaction.followUp({
				content: `✅ Feedback channel updated to ${channel}.`,
				ephemeral: true,
			});
		} else if (interaction?.customId === "feedback_settings_edit") {
			const settings = interaction.client.feedbackSettings;
			const modal = new ModalBuilder().setCustomId("feedback_settings_edit_submit").setTitle("Edit Feedback Settings");

			const colorInput = new TextInputBuilder()
				.setCustomId("color_input")
				.setLabel("Enter the color for the embed (hex code):")
				.setStyle(TextInputStyle.Short)
				.setValue(settings.color || "000000")
				.setRequired(true)
				.setMinLength(6)
				.setMaxLength(6)
				.setPlaceholder("000000");

			const thumbnailInput = new TextInputBuilder()
				.setCustomId("thumbnail_input")
				.setLabel("Enter the thumbnail URL:")
				.setStyle(TextInputStyle.Short)
				.setValue(settings.thumbnail || "")
				.setRequired(false)
				.setMaxLength(2000)
				.setPlaceholder("https://example.com/thumbnail.png");

			const imageInput = new TextInputBuilder()
				.setCustomId("image_input")
				.setLabel("Enter the image URL:")
				.setStyle(TextInputStyle.Short)
				.setValue(settings.image || "")
				.setMaxLength(2000)
				.setRequired(false)
				.setPlaceholder("https://example.com/image.png");

			const descriptionInput = new TextInputBuilder()
				.setCustomId("description_input")
				.setLabel("Feedback Embed Description:")
				.setStyle(TextInputStyle.Paragraph)
				.setValue(settings.feedback_description || "")
				.setRequired(false)
				.setMaxLength(2000)
				.setPlaceholder("Use buttons bellow to leave a feedback.");

			const row1 = new ActionRowBuilder().addComponents(colorInput);
			const row2 = new ActionRowBuilder().addComponents(thumbnailInput);
			const row3 = new ActionRowBuilder().addComponents(imageInput);
			const row4 = new ActionRowBuilder().addComponents(descriptionInput);

			modal.addComponents(row1, row2, row3, row4);
			await interaction.showModal(modal);
		} else if (interaction?.customId === "feedback_settings_edit_submit") {
			const color = interaction.fields.getTextInputValue("color_input");
			const thumbnail = interaction.fields.getTextInputValue("thumbnail_input");
			const image = interaction.fields.getTextInputValue("image_input");
			const description = interaction.fields.getTextInputValue("description_input");

			if (!validate.isHexColor(color)) {
				return await interaction.reply({
					content: "❗️ Invalid color format. Please enter a valid hex code.",
					ephemeral: true,
				});
			}

			if (thumbnail && thumbnail.length > 0 && !validate.isURL(thumbnail)) {
				return await interaction.reply({
					content: "❗️ Invalid thumbnail URL. Please enter a valid URL.",
					ephemeral: true,
				});
			}

			if (image && image.length > 0 && !validate.isURL(image)) {
				return await interaction.reply({
					content: "❗️ Invalid image URL. Please enter a valid URL.",
					ephemeral: true,
				});
			}

			interaction.client.feedbackSettings.color = color;
			interaction.client.feedbackSettings.thumbnail = thumbnail;
			interaction.client.feedbackSettings.image = image;
			interaction.client.feedbackSettings.feedback_description = description;

			await interaction.client.feedbackSettings.save();
			const { embed, components } = await buildFeedbackSettingsEmbed(interaction);
			await interaction.update({
				embeds: [embed],
				components: [...components],
			});
			await interaction.followUp({
				content: "✅ Feedback settings updated successfully.",
				ephemeral: true,
			});
		} else if (interaction?.customId?.startsWith("feedback_form_open-")) {
			const rating = interaction.customId.split("-")[1];
			const userId = interaction.customId.split("-")[2];
			const issuedBy = interaction.customId.split("-")[3];

			if (interaction.user.id !== userId) {
				return await interaction.reply({
					content: "❗️ You are not allowed to submit feedback!",
					ephemeral: true,
				});
			}

			// modal to add feedback
			const modal = new ModalBuilder()
				.setCustomId("feedback_form_submit-" + rating + "-" + userId + "-" + issuedBy)
				.setTitle(`Feedback Form`);

			const feedbackInput = new TextInputBuilder()
				.setCustomId("feedback_input")
				.setLabel(`Enter your feedback - (${rating}/5):`)
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(2000)
				.setPlaceholder("Your feedback here...");
			const row = new ActionRowBuilder().addComponents(feedbackInput);
			modal.addComponents(row);
			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("feedback_form_submit-")) {
			const rating = interaction.customId.split("-")[1];
			const customer = interaction.customId.split("-")[2];
			const issuedBy = interaction.customId.split("-")[3];
			const feedback = interaction.fields.getTextInputValue("feedback_input");
			const settings = interaction.client.feedbackSettings;
			const serverSettings = interaction.client.serverSettings;

			if (interaction.user.id !== customer) {
				return await interaction.reply({
					content: "❗️ You are not allowed to submit feedback!",
					ephemeral: true,
				});
			}

			if (!settings.feedbacks_channel) {
				return await interaction.reply({
					content: "❗️ Feedbacks channel is not set.",
					ephemeral: true,
				});
			}

			const channel = await interaction.client.channels.fetch(settings.feedbacks_channel);

			if (!channel) {
				return await interaction.reply({
					content: "❗️ Feedbacks channel not found.",
					ephemeral: true,
				});
			}

			let stars = "";

			for (let i = 0; i < rating; i++) {
				stars += "<:yellowstar:1389456622832582706>";
			}

			const customerText = `${process.env.FEEDBACK_CUSTOMER_EMOJI || "👥"} | \`Customer :\` <@${customer}>\n`;
			const ratingText = `${process.env.FEEDBACK_RATING_EMOJI || "👍🏻"} | \`Rating   :\` ${stars} (${rating}/5)\n`;
			const feedbackText = `${process.env.FEEDBACK_EMOJI || "💭"} | \`Feedback :\` ${feedback}\n`;

			const embed = new EmbedBuilder()
				.setTitle(`${process.env.FEEDBACK_TITLE_EMOJI || "⭐"} New Feedback`)
				.setDescription(`Thank you for your feedback!\n\n${customerText}${ratingText}${feedbackText}`)
				.setTimestamp();

			if (settings.color) {
				embed.setColor(settings.color);
			}
			if (settings.thumbnail && settings.thumbnail.length > 0) {
				embed.setThumbnail(settings.thumbnail);
			}
			if (settings.image && settings.image.length > 0) {
				embed.setImage(settings.image);
			}

			if (serverSettings.thumbnail && serverSettings.thumbnail.length > 0) {
				if (serverSettings.brand_name && serverSettings.brand_name.length > 0) {
					embed.setFooter({ text: serverSettings.brand_name, iconURL: serverSettings.thumbnail });
				} else {
					embed.setFooter({ text: "Feedbacks", iconURL: serverSettings.thumbnail });
				}
			} else {
				embed.setFooter({ text: "Feedbacks" });
			}

			const thankyouButton = new ButtonBuilder()
				.setCustomId("feedback_thankyou")
				.setLabel("❤️ Thank You!")
				.setStyle(ButtonStyle.Success)
				.setDisabled(true);

			await channel.send({ embeds: [embed] });

			await Feedbacks.create({
				customer: customer,
				rating: rating,
				feedback: feedback,
				issued_by: issuedBy,
			});

			const row = new ActionRowBuilder().addComponents(thankyouButton);

			await interaction.update({
				components: [row],
			});

			await interaction.followUp({
				content: `✅ Thank you for your feedback! You rated ${rating}/5.`,
				ephemeral: true,
			});
		}
		///////////////////////////////////////////////////
		////////////////// DICE DUEL //////////////////
		///////////////////////////////////////////////////
		else if (interaction?.customId?.startsWith("diceduel_accept-")) {
			const [action, player1, player2, amount] = interaction.customId.split("-");
			// Handle the acceptance of the dice duel
			if (isNaN(amount) || parseFloat(amount) <= 0) {
				return await interaction.reply({
					content: `*❗ Invalid amount specified!*`,
					ephemeral: true,
				});
			}
			if (!interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot accept this dice duel!*`,
					ephemeral: true,
				});
			}

			const [player1Wallet] = await User.findOrCreate({
				where: { discord_id: player1 },
				defaults: { discord_id: player1 },
			});
			const [player2Wallet] = await User.findOrCreate({
				where: { discord_id: player2 },
				defaults: { discord_id: player2 },
			});

			if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
				return await interaction.reply({
					content: `*❗ One of the players does not have enough RGL-Tokens to play this dice duel!*`,
					ephemeral: true,
				});
			}

			const player1Dice = Math.floor(Math.random() * 100) + 1;
			const player2Dice = Math.floor(Math.random() * 100) + 1;
			const winner = player1Dice > player2Dice ? player1 : player2Dice > player1Dice ? player2 : "Tie";

			await processGameResult({
				player1,
				player2,
				winner,
				amount,
				player1Score: player1Dice,
				player2Score: player2Dice,
				gameName: "🎲 Dice Duel",
				interaction,
			});

			await interaction.update({ components: [] });
			await interaction.followUp({
				content: `🎲 ${userMention(player1)} rolled... **${player1Dice}**!`,
			});
			setTimeout(async () => {
				await interaction.followUp({
					content: `🎲 ${userMention(player2)} rolled... **${player2Dice}**!`,
				});
			}, 1000);
			setTimeout(async () => {
				await interaction.followUp({
					content: `${winner === "Tie" ? "🎲 It's a tie!" : `🎲 The winner is ${userMention(winner)}🥳`}`,
				});
			}, 2000);
		} else if (interaction?.customId?.startsWith("diceduel_decline-")) {
			const [action, player1, player2] = interaction.customId.split("-");
			if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot decline this dice duel!*`,
					ephemeral: true,
				});
			}

			const canceledBtn = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`diceduel_canceled-${player1}-${player2}`)
					.setLabel("❌ Duel Canceled")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);

			await interaction.update({
				content: `*❌ ${interaction.user} has declined the Dice Duel.*`,
				components: [canceledBtn],
				ephemeral: true,
			});
		}
		///////////////////////////////////////////////////
		////////////////// WHIP DUEL //////////////////
		///////////////////////////////////////////////////
		else if (interaction?.customId?.startsWith("whip_accept-")) {
			const [action, player1, player2, amount] = interaction.customId.split("-");
			// Handle the acceptance of the dice duel
			if (isNaN(amount) || parseFloat(amount) <= 0) {
				return await interaction.reply({
					content: `*❗ Invalid amount specified!*`,
					ephemeral: true,
				});
			}
			if (!interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot accept this whip duel!*`,
					ephemeral: true,
				});
			}

			const [player1Wallet] = await User.findOrCreate({
				where: { discord_id: player1 },
				defaults: { discord_id: player1 },
			});
			const [player2Wallet] = await User.findOrCreate({
				where: { discord_id: player2 },
				defaults: { discord_id: player2 },
			});

			if (player1Wallet.balance < parseFloat(amount) || player2Wallet.balance < parseFloat(amount)) {
				return await interaction.reply({
					content: `*❗ One of the players does not have enough RGL-Tokens to play this whip duel!*`,
					ephemeral: true,
				});
			}

			// 1. Randomly pick winner side
			const sides = ["left", "right"];
			const winnerSide = sides[Math.floor(Math.random() * sides.length)];

			// we know the winner already
			const winner = winnerSide === "left" ? player1 : player2;

			await processGameResult({
				player1,
				player2,
				winner,
				amount,
				player1Score: "-",
				player2Score: "-",
				gameName: "⚔️ Whip Duel",
				interaction,
			});

			const gifsDir = path.join(__dirname, `../commands/whip/assets/${winnerSide}`);
			const gifFiles = fs.readdirSync(gifsDir);
			const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
			console.log(`Selected GIF: ${randomGif}`);
			const gifPath = path.join(gifsDir, randomGif);
			const attachment = new AttachmentBuilder(gifPath, { name: randomGif });

			const editedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

			editedEmbed.setImage(`attachment://${randomGif}`);

			await interaction.update({
				embeds: [editedEmbed],
				files: [attachment],
				components: [],
			});
		} else if (interaction?.customId?.startsWith("whip_decline-")) {
			const [action, player1, player2] = interaction.customId.split("-");
			if (!interaction.user.id.includes(player1) && !interaction.user.id.includes(player2)) {
				return await interaction.reply({
					content: `*❗ You cannot decline this whip duel!*`,
					ephemeral: true,
				});
			}

			const canceledBtn = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`whip_canceled-${player1}-${player2}`)
					.setLabel("❌ Whip Duel Canceled")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);

			await interaction.update({
				content: `*❌ ${interaction.user} has declined the Whip Duel.*`,
				components: [canceledBtn],
				ephemeral: true,
			});
		}
	},
};
