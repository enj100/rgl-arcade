const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	channelMention,
	userMention,
	time,
} = require("discord.js");
const JackpotSettings = require("../models/settings");
const JackpotTickets = require("../models/tickets");
const User = require("../../wallet/models/User");

async function jackpotRollWinners(client) {
	let settings = await JackpotSettings.findOne({ where: { id: 0 } });

	if (!settings) {
		settings = await JackpotSettings.create({ id: 0 });
	}
	settings.status = false; // disable the jackpot
	settings.next_draw_date = new Date(Date.now() + 24 * 60 * 60 * 1000); // next draw in 24 hours
	await settings.save();
	const tickets = await JackpotTickets.findAll();

	const channel = await client.channels.fetch(settings.channel).catch((e) => null);
	if (!channel) {
		for (const ticket of tickets) {
			const [user] = await User.findOrCreate({
				where: { discord_id: ticket.discord_id },
				defaults: { discord_id: ticket.discord_id },
			});
			user.balance += settings.ticket_price;
			await user.save();
		}
		await JackpotTickets.destroy({ where: {} }); // clear all tickets
		return;
	}

	if (tickets.length === 0) {
		await channel.send("❌ **No tickets have been sold.**");

		const embed = new EmbedBuilder()
			.setTitle(`${process.env.JACKPOT_EMOJI || "🍯"} RGL-Arcade Jackpot!`)
			.setDescription(
				`${settings.description || "Join the jackpot!"}\n\n⌛ **Next draw:** ${
					settings.next_draw_date ? time(settings.next_draw_date) : "TBA"
				}`
			)
			.setFooter({ text: "RGL - Jackpot" });

		if (settings.color) {
			embed.setColor(settings.color);
		}
		if (settings.thumbnail && settings.thumbnail.length > 0) {
			embed.setThumbnail(settings.thumbnail);
			embed.setFooter({ text: "RGL - Jackpot", iconURL: settings.thumbnail });
		}
		if (settings.image && settings.image.length > 0) {
			embed.setImage(settings.image);
		}
		const buyButton = new ButtonBuilder()
			.setCustomId("jackpot_buy_ticket")
			.setLabel(`🎫 Buy Tickets`)
			.setStyle(ButtonStyle.Primary);
		const checkTickets = new ButtonBuilder()
			.setCustomId("jackpot_check_tickets")
			.setLabel("🔍 Check Tickets")
			.setStyle(ButtonStyle.Secondary);

		const actionRow = new ActionRowBuilder().addComponents(buyButton, checkTickets);

		await channel.send({ embeds: [embed], components: [actionRow] });
		return;
	}

	const winningNumbers = tickets.map((ticket) => ticket.ticket);
	const drawnNumbers = new Set();

	const rollInterval = setInterval(async () => {
		if (drawnNumbers.size >= 50) {
			clearInterval(rollInterval);
			channel.send("❌ All numbers have been drawn, but no winner was found.");
			return;
		}

		let randomNumber;
		do {
			randomNumber = Math.floor(Math.random() * 50) + 1;
		} while (drawnNumbers.has(randomNumber));

		drawnNumbers.add(randomNumber);

		const winner = tickets.find((ticket) => ticket.ticket_number === randomNumber);

		if (winner) {
			clearInterval(rollInterval);
			const payout = (settings.payout_percent / 100) * tickets.length * settings.ticket_price;

			const embedWinner = new EmbedBuilder()
				.setDescription(
					`🎉 Congratulations ${userMention(winner.discord_id)}! You have won the jackpot (*${payout.toFixed(
						2
					)} Tokens*) with the number **${randomNumber}**!`
				)
				.setColor("00FF00")
				.setFooter({ text: "RGL - Jackpot" });
			channel.send({ embeds: [embedWinner] });
			// announcements channel
			const announceChannel = await client.channels.fetch(settings.announce_channel).catch(() => null);
			if (announceChannel) {
				announceChannel.send({ embeds: [embedWinner] });
			}
			const [user] = await User.findOrCreate({
				where: { discord_id: winner.discord_id },
				defaults: { discord_id: winner.discord_id },
			});
			user.balance += payout;
			await user.save();
			await JackpotTickets.destroy({ where: {} });

			settings.next_draw_date = new Date(Date.now() + 4 * 60 * 60 * 1000); // next draw in 24 hours

			const embed = new EmbedBuilder()
				.setTitle(`${process.env.JACKPOT_EMOJI || "🍯"} Token Jackpot! ${process.env.JACKPOT_EMOJI || "🍯"}`)
				.setDescription(
					`${settings.description || "Join the jackpot!"}\n\n<:trophy:1387963764397179040> **Next draw:** ${
						settings.next_draw_date ? time(settings.next_draw_date) : "TBA"
					}`
				)
				.setFooter({ text: "RGL - Jackpot" });

			if (settings.color) {
				embed.setColor(settings.color);
			}
			if (settings.thumbnail && settings.thumbnail.length > 0) {
				embed.setThumbnail(settings.thumbnail);
				embed.setFooter({ text: "RGL - Jackpot", iconURL: settings.thumbnail });
			}
			if (settings.image && settings.image.length > 0) {
				embed.setImage(settings.image);
			}
			const buyButton = new ButtonBuilder()
				.setCustomId("jackpot_buy_ticket")
				.setLabel(`🎫 Buy Tickets`)
				.setStyle(ButtonStyle.Primary);
			const checkTickets = new ButtonBuilder()
				.setCustomId("jackpot_check_tickets")
				.setLabel("🔍 Check Tickets")
				.setStyle(ButtonStyle.Secondary);

			const actionRow = new ActionRowBuilder().addComponents(buyButton, checkTickets);

			await channel.send({ embeds: [embed], components: [actionRow] });
			settings.status = true;
			await settings.save();
		} else {
			channel.send(`🔮 The number drawn is **${randomNumber}**. No winner yet.`);
		}
	}, 2500);
}

module.exports = jackpotRollWinners;
