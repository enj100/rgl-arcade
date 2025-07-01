const {
	SlashCommandBuilder,
	ActionRowBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	userMention,
	AttachmentBuilder,
	spoiler,
} = require("discord.js");
const CommunityRaffleTickets = require("./models/RaffleTickets");
const CommunityRaffleSettings = require("./models/RaffleSettings");
const CommunityRafflePrizes = require("./models/RafflePrizes");
const { createCommunityRaffleGif } = require("./embeds/generateVideo");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("com_raffle")
		.setDefaultMemberPermissions("0")
		.setDescription("⭐ | Community Raffle: add, remove tickets.")
		.addStringOption((option) =>
			option
				.setName("action")
				.setDescription("Select an action")
				.addChoices({ name: "➕ Add Tickets", value: "add" }, { name: "➖ Remove Tickets", value: "remove" })
				.setRequired(true)
		)
		.addUserOption((option) => option.setName("user").setDescription("Select an user").setRequired(true))
		.addNumberOption((option) => option.setName("amount").setDescription("Amount of tickets").setRequired(true).setMinValue(1)),
	async execute(interaction) {
		const action = interaction.options.getString("action");
		const user = interaction.options.getUser("user");
		const amount = interaction.options.getNumber("amount");

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

		const spamChannel = await interaction.client.channels.fetch(settings.spam_channel).catch(() => null);
		const channel = await interaction.client.channels.fetch(settings.channel).catch(() => null);
		if (!channel) {
			return await interaction.reply({
				content: "*❗ Raffle channel not found!*",
				ephemeral: true,
			});
		}

		if (action === "add") {
			let ticketsCount = await CommunityRaffleTickets.count();

			if (ticketsCount + amount > settings.tickets_amount) {
				return await interaction.reply({
					content: `*❗ There are only ${settings.tickets_amount - ticketsCount} tickets remaining!*`,
					ephemeral: true,
				});
			}

			const ticketNumbers = [];
			for (let index = 0; index < amount; index++) {
				const ticket = await CommunityRaffleTickets.create({ discord_id: user.id });
				ticketNumbers.push(ticket.ticket_number);
			}

			// Add tickets logic
			const embed = new EmbedBuilder()
				.setDescription(`:tickets: ${user} just bought **${amount} ticket(s)!**\n▸ Ticket Numbers: ${ticketNumbers.join(", ")}`)
				.setColor("ffffff")
				.setFooter({ text: `${ticketsCount + amount}/${settings.tickets_amount} ticket(s)` });

			await channel.send({
				embeds: [embed],
			});
			await interaction.reply({ content: `✅ Added ${amount} tickets for ${user}`, ephemeral: true });

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
		} else if (action === "remove") {
			// Remove tickets logic
			const userTickets = await CommunityRaffleTickets.findAll({ where: { discord_id: user.id } });
			if (userTickets.length < amount) {
				return await interaction.reply({
					content: `*❗ ${user} has only ${userTickets.length} ticket(s)!*`,
					ephemeral: true,
				});
			}
			const ticketNumbers = [];
			for (let index = 0; index < amount; index++) {
				if (userTickets[index]) {
					await userTickets[index].destroy();
					ticketNumbers.push(userTickets[index].ticket_number);
				}
			}

			const allTickets = await CommunityRaffleTickets.count();

			const embed = new EmbedBuilder()
				.setDescription(`🎟️ Removed **${amount}** ticket(s) from ${user}!\n▸ Ticket Numbers: ${ticketNumbers.join(", ")}`)
				.setColor("ff0000")
				.setFooter({ text: `${allTickets}/${settings.tickets_amount} tickets` });

			await channel.send({
				embeds: [embed],
			});
			await interaction.reply({ content: `✅ Removed ${amount} tickets from ${user}`, ephemeral: true });
		}
	},
};
