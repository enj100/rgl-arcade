const {
	Events,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	userMention,
	AttachmentBuilder,
	spoiler,
} = require("discord.js");
const communityRaffleSettingsEmbed = require("./embeds/settingsEmbed");
const CommunityRaffleSettings = require("./models/RaffleSettings");
const CommunityRafflePrizes = require("./models/RafflePrizes");
const CommunityRaffleTickets = require("./models/RaffleTickets");
const User = require("../wallet/models/User");
const { createCommunityRaffleGif } = require("./embeds/generateVideo");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		else if (interaction?.customId === "other_settings" && interaction?.values[0] === "community_raffle_settings") {
			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "community_raffle_change_spam_channel") {
			const selectedChannelId = interaction.values[0];
			const settings = await CommunityRaffleSettings.findOne({
				where: { id: 0 },
			});

			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the channel while the raffle is active.*",
					ephemeral: true,
				});
			}
			settings.spam_channel = selectedChannelId;
			await settings.save();

			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_change_channel") {
			const selectedChannelId = interaction.values[0];
			const settings = await CommunityRaffleSettings.findOne({
				where: { id: 0 },
			});

			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the channel while the raffle is active.*",
					ephemeral: true,
				});
			}
			settings.channel = selectedChannelId;
			await settings.save();

			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_general_settings") {
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change general settings while the raffle is active.*",
					ephemeral: true,
				});
			}

			const modal = new ModalBuilder().setCustomId("community_raffle_general_settings_submit").setTitle("General Settings");

			const winnersAmountInput = new TextInputBuilder()
				.setCustomId("winners")
				.setLabel("Winners Amount")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Enter the number of winners")
				.setValue(`${settings.winners_amount}`)
				.setRequired(true);

			const ticketsInput = new TextInputBuilder()
				.setCustomId("tickets")
				.setLabel("Tickets Amount")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Enter the tickets amount")
				.setValue(`${settings.tickets_amount}`)
				.setRequired(true);

			const ticketPrice = new TextInputBuilder()
				.setCustomId("price")
				.setLabel("Ticket Price (in RGL-Tokens)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Enter the ticket price in tokens")
				.setValue(`${settings.ticket_price_tokens}`)
				.setRequired(true);

			const row1 = new ActionRowBuilder().addComponents(winnersAmountInput);
			const row2 = new ActionRowBuilder().addComponents(ticketsInput);
			const row3 = new ActionRowBuilder().addComponents(ticketPrice);

			modal.addComponents(row1, row2, row3);
			await interaction.showModal(modal);
		} else if (interaction?.customId === "community_raffle_general_settings_submit") {
			const winnersInput = interaction.fields.getTextInputValue("winners");
			const ticketsInput = interaction.fields.getTextInputValue("tickets");
			const priceInput = interaction.fields.getTextInputValue("price");

			const winners = parseInt(winnersInput, 10);
			const tickets = parseInt(ticketsInput, 10);
			const price = parseFloat(priceInput);

			if (isNaN(winners) || winners <= 0) {
				return await interaction.reply({
					content: "❗ Please enter a valid number of winners.",
					ephemeral: true,
				});
			}
			if (isNaN(tickets) || tickets <= 0) {
				return await interaction.reply({
					content: "❗ Please enter a valid tickets amount.",
					ephemeral: true,
				});
			}
			if (isNaN(price) || price <= 0) {
				return await interaction.reply({
					content: "❗ Please enter a valid ticket price.",
					ephemeral: true,
				});
			}
			if (winners > tickets) {
				return await interaction.reply({
					content: "❗ Winners amount cannot be greater than tickets amount.",
					ephemeral: true,
				});
			}

			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });

			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the general settings while the raffle is active.*",
					ephemeral: true,
				});
			}
			settings.winners_amount = winners;
			settings.tickets_amount = tickets;
			settings.ticket_price_tokens = price;
			await settings.save();

			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_edit_embed") {
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (!settings) {
				return await interaction.reply({
					content: "*❗ Raffle settings not found!*",
					ephemeral: true,
				});
			}
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot edit the embed while the raffle is active.*",
					ephemeral: true,
				});
			}

			const modal = new ModalBuilder().setCustomId("community_raffle_edit_embed_submit").setTitle("Edit Raffle Embed");

			const messageInput = new TextInputBuilder()
				.setCustomId("message")
				.setLabel("Raffle Message")
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder("Enter the raffle message")
				.setValue(`${settings.message || ""}`)
				.setMaxLength(2000) // Set a maximum length for the message
				.setRequired(false);

			const thumbnailInput = new TextInputBuilder()
				.setCustomId("thumbnail")
				.setLabel("Thumbnail URL")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Enter the thumbnail URL (optional)")
				.setValue(`${settings.thumbnail || ""}`)
				.setRequired(false);

			const row1 = new ActionRowBuilder().addComponents(messageInput);
			const row2 = new ActionRowBuilder().addComponents(thumbnailInput);

			modal.addComponents(row1, row2);
			await interaction.showModal(modal);
		} else if (interaction?.customId === "community_raffle_edit_embed_submit") {
			const message = interaction.fields.getTextInputValue("message");
			const thumbnail = interaction.fields.getTextInputValue("thumbnail");

			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (!settings) {
				return await interaction.reply({
					content: "*❗ Raffle settings not found!*",
					ephemeral: true,
				});
			}
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot edit the embed while the raffle is active.*",
					ephemeral: true,
				});
			}

			settings.message = message.length > 0 ? message : null;
			settings.thumbnail = thumbnail;
			await settings.save();

			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_prize_edit") {
			const prizeId = interaction.values[0];
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the prize while the raffle is active.*",
					ephemeral: true,
				});
			}
			const prize = await CommunityRafflePrizes.findOne({ where: { place: prizeId } });
			if (!prize) {
				return await interaction.reply({
					content: "*❗ Prize not found!*",
					ephemeral: true,
				});
			}
			const modal = new ModalBuilder()
				.setCustomId(`community_raffle_prize_edit-${prizeId}`)
				.setTitle(`Edit Prize`)
				.addComponents(
					new ActionRowBuilder().addComponents(
						new TextInputBuilder()
							.setCustomId("prize")
							.setLabel("Enter the prize:")
							.setValue(prize.prize || "")
							.setStyle(TextInputStyle.Short)
							.setMaxLength(100)
							.setRequired(true)
					)
				);
			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("community_raffle_prize_edit-")) {
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (settings.status) {
				return await interaction.reply({
					content: "*❗ You cannot change the prize while the raffle is active.*",
					ephemeral: true,
				});
			}
			const place = interaction.customId.split("-")[1];
			const prizeInput = interaction.fields.getTextInputValue("prize");
			const prize = await CommunityRafflePrizes.findOne({ where: { place } });
			if (!prize) {
				return await interaction.reply({
					content: "*❗ Prize not found!*",
					ephemeral: true,
				});
			}
			prize.prize = prizeInput;
			await prize.save();
			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_change_status") {
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (!settings) {
				return await interaction.reply({
					content: "*❗ Raffle settings not found!*",
					ephemeral: true,
				});
			}

			const channel = await interaction.client.channels.fetch(settings.channel).catch(() => null);
			const spamChannel = await interaction.client.channels.fetch(settings.spam_channel).catch(() => null);

			if (!channel) {
				return await interaction.reply({
					content: "*❗ Raffle channel not found!*",
					ephemeral: true,
				});
			}
			settings.status = !settings.status;

			if (!settings.status) {
				// announce that raffle was canceled
				// delete all tickets

				const embed = new EmbedBuilder()
					.setDescription(`📢 **Community Raffle was canceled!**`)
					.setColor("ff0000")
					.setFooter({ text: `❌ Canceled` });
				await CommunityRaffleTickets.destroy({ where: {}, truncate: true });

				await channel.send({ embeds: [embed] });
				if (spamChannel) {
					await spamChannel.send({ embeds: [embed] });
				}
			} else {
				if (settings.ticket_price_tokens <= 0) {
					return await interaction.reply({
						content: "*❗ You need to set a ticket price before starting the raffle.*",
						ephemeral: true,
					});
				}
				const allPrizes = await CommunityRafflePrizes.findAll({ order: [["place", "ASC"]] });

				let prizes = "";
				for (let index = 0; index < settings.winners_amount; index++) {
					if (index + 1 === 1) {
						prizes += `**( 1st )** ➛ ${allPrizes[0].prize || "No Prize"}\n`;
					} else if (index + 1 === 2) {
						prizes += `**( 2nd )** ➛ ${allPrizes[1].prize || "No Prize"}\n`;
					} else if (index + 1 === 3) {
						prizes += `**( 3rd )** ➛ ${allPrizes[2].prize || "No Prize"}\n`;
					} else {
						prizes += `**( ${index + 1}th )** ➛ ${allPrizes[index].prize || "No Prize"}\n`;
					}
				}

				const embed = new EmbedBuilder()
					.setTitle(`🎊 Community Raffle 🎊`)
					.setDescription(
						`\n🎟️ **${settings.tickets_amount} TICKETS AVAILABLE! 🎟️**\n\n${settings.message || ""}\n### 🎁 Prizes:\n${prizes}\n${
							settings.text || ""
						}`
					)
					.setColor("ffffff")
					.setFooter({ text: `🎉 Community Raffle!` });

				const buyWithRgl = new ButtonBuilder()
					.setCustomId(`community_raffle_buy_ticket`)
					.setLabel("Buy with RGL-Tokens")
					.setEmoji("🛒")
					.setStyle(ButtonStyle.Secondary);

				const row = new ActionRowBuilder().addComponents(buyWithRgl);

				if (settings.thumbnail) {
					embed.setThumbnail(settings.thumbnail);
				}
				await channel.send({
					embeds: [embed],
					components: [row],
				});
				if (spamChannel) {
					const embed = new EmbedBuilder()
						.setTitle(`🎟️ Community Raffle 🎟️`)
						.setColor("FF0000")
						.setDescription(`**▸ Community Raffle has started! 🥳 Join now: ** ${channel}`)
						.setFooter({ text: `🎉 New Raffle!` })
						.setTimestamp();
					await spamChannel.send({
						embeds: [embed],
					});
				}
			}

			await settings.save();

			const { embeds, components } = await communityRaffleSettingsEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true,
			});
		} else if (interaction?.customId === "community_raffle_buy_ticket") {
			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (!settings) {
				return await interaction.reply({
					content: "*❗ Community Raffle settings not found!*",
					ephemeral: true,
				});
			}
			if (!settings.status) {
				return await interaction.reply({
					content: "*❗ Community Raffle is currently inactive!*",
					ephemeral: true,
				});
			}

			// show modal to enter amount of tickets
			const modal = new ModalBuilder().setCustomId("community_raffle_buy_ticket_submit").setTitle("Buy Raffle Tickets");

			const ticketAmountInput = new TextInputBuilder()
				.setCustomId("community_raffle_buy_ticket_amount")
				.setLabel("Enter the number of tickets you want to buy:")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const modalContent = new ActionRowBuilder().addComponents(ticketAmountInput);
			modal.addComponents(modalContent);

			await interaction.showModal(modal);
		} else if (interaction?.customId === "community_raffle_buy_ticket_submit") {
			const ticketAmountInput = interaction.fields.getTextInputValue("community_raffle_buy_ticket_amount");
			const amount = parseInt(ticketAmountInput, 10);
			if (isNaN(amount) || amount <= 0) {
				return await interaction.reply({
					content: "*❗ Please enter a valid number of tickets!*",
					ephemeral: true,
				});
			}

			const settings = await CommunityRaffleSettings.findOne({ where: { id: 0 } });
			if (!settings) {
				return await interaction.reply({
					content: "*❗ Community Raffle settings not found!*",
					ephemeral: true,
				});
			}
			if (!settings.status) {
				return await interaction.reply({
					content: "*❗ Community Raffle is currently inactive!*",
					ephemeral: true,
				});
			}
			const channel = await interaction.client.channels.fetch(settings.channel).catch(() => null);
			const spamChannel = await interaction.client.channels.fetch(settings.spam_channel).catch(() => null);

			if (!channel) {
				return await interaction.reply({
					content: "*❗ Raffle channel not found!*",
					ephemeral: true,
				});
			}

			let ticketsCount = await CommunityRaffleTickets.count();

			if (ticketsCount + amount > settings.tickets_amount) {
				return await interaction.reply({
					content: `*❗ There are only ${settings.tickets_amount - ticketsCount} tickets remaining!*`,
					ephemeral: true,
				});
			}

			const totalPrice = settings.ticket_price_tokens * amount;
			const [userWallet] = await User.findOrCreate({
				where: { discord_id: interaction.user.id },
				defaults: { discord_id: interaction.user.id },
			});
			if (userWallet.balance < totalPrice) {
				return await interaction.reply({
					content: `*❗ You don't have enough RGL-Tokens to buy ${amount} ticket(s)! You need ${totalPrice} RGL-Tokens.*`,
					ephemeral: true,
				});
			}
			userWallet.balance -= totalPrice;
			await userWallet.save();

			const ticketNumbers = [];

			for (let index = 0; index < amount; index++) {
				const ticket = await CommunityRaffleTickets.create({ discord_id: interaction.user.id });
				ticketNumbers.push(ticket.ticket_number);
			}

			// Add tickets logic
			const embed = new EmbedBuilder()
				.setDescription(
					`:tickets: ${interaction.user} just bought **${amount} ticket(s)!**\n▸ Ticket Numbers: ${ticketNumbers.join(", ")}`
				)
				.setColor("ffffff")
				.setFooter({ text: `${ticketsCount + amount}/${settings.tickets_amount} ticket(s)` });

			await channel.send({
				embeds: [embed],
			});

			await interaction.reply({
				content: `*✅ You just bought ${amount} community raffle ticket(s)!*`,
				ephemeral: true,
			});

			// check if tickets are sold and run the raffle!
			if (ticketsCount + amount === settings.tickets_amount) {
				settings.status = false;
				const allPrizes = await CommunityRafflePrizes.findAll({ order: [["place", "ASC"]] });
				const allTickets = await CommunityRaffleTickets.findAll();

				// start the raffle
				for (let i = allTickets.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[allTickets[i], allTickets[j]] = [allTickets[j], allTickets[i]]; // Swap elements
				}
				// pick x amount of winners
				let winners = [];
				for (let index = 0; index < settings.winners_amount; index++) {
					const rnd = Math.floor(Math.random() * allTickets.length);
					winners.push({ user: allTickets[rnd].discord_id, ticket_number: allTickets[rnd].ticket_number });
					allTickets.splice(rnd, 1);
				}

				// Prepare winners info array with username and prize
				let winnersInfo = [];
				for (let index = 0; index < winners.length; index++) {
					const userId = winners[index].user;
					const user = await interaction.client.users.fetch(userId).catch(() => null);
					winnersInfo.push({
						username: user ? user.username : `Unknown (${userId})`,
						prize: allPrizes[index]?.prize || "No prize",
						ticket_number: winners[index].ticket_number,
					});
				}

				let winnersText = "";
				// add winnings to the looting bag
				for (let index = 0; index < winners.length; index++) {
					winnersText += `**(${index + 1})** ▸ ${userMention(winners[index].user)} (Ticket #${winners[index].ticket_number}) ▸ ${
						allPrizes[index].prize
					}\n`;
				}
				const img = await createCommunityRaffleGif(winnersInfo, interaction);
				const attachment = new AttachmentBuilder(img, { name: "winners.gif" });

				const embed = new EmbedBuilder().setTitle(`🏆 Raffle Winners 🏆`).setImage("attachment://winners.gif").setColor("ffffff");
				const embedWinners = new EmbedBuilder()
					.setTitle(`🏆 Raffle Winners 🏆`)
					.setDescription(`${winnersText.length > 0 ? spoiler(winnersText) : "-"}`)
					.setColor("ffffff");
				await channel.send({ embeds: [embed, embedWinners], files: [attachment] });

				// set raffle to inactive and destroy all tickets
				await CommunityRaffleTickets.destroy({ where: {}, truncate: true });
				settings.status = false;
				await settings.save();

				const spamEmbed = new EmbedBuilder()
					.setDescription(`🎉 **Community Raffle has ended!** Check the winners: ${channel}`)
					.setColor("FF0000")
					.setFooter({ text: `🏆 Winners announced!` })
					.setTimestamp();

				if (spamChannel) {
					await spamChannel.send({
						embeds: [spamEmbed],
					});
				}
			}
		}
	},
};
