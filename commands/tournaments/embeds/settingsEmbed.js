const {
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	channelMention,
	ChannelSelectMenuBuilder,
	ChannelType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ContainerBuilder,
	MessageFlags,
} = require("discord.js");
const TournamentSettings = require("../models/Settings");

async function buildTournamentsSettingsEmbed(interaction) {
	const [settings] = await TournamentSettings.findOrCreate({ where: { id: 0 } });

	const titleText = `${settings.title || "Not Set."}\n`;
	const descriptionText = `${settings.description || "Not Set."}\n`;
	const maxUsersText = `▸ **Max Users:** ${settings.max_users || "Not Set."}\n`;
	const priceText = `▸ **Price:** ${settings.price || "Not Set."} RGL-Tokens\n`;
	const channel = `▸ **Channel:** ${settings.channel ? channelMention(settings.channel) : "Not Set."}\n`;
	const announcementsChannel = `▸ **Announcements Channel:** ${
		settings.announcements_channel ? channelMention(settings.announcements_channel) : "Not Set."
	}\n`;
	const status = `▸ **Status:** ${settings.status ? "🟢 Enabled" : "🔴 Disabled"}\n`;

	const colorNumber = parseInt(settings.color.replace(/^0x/i, ""), 16);

	const whipContainer = new ContainerBuilder()
		.setAccentColor(colorNumber)
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## ⚙️ Tournaments Settings`))
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### ${titleText}`))
				.setThumbnailAccessory((thumbnail) => thumbnail.setURL(settings.thumbnail || "https://i.imgur.com/aI8nCE1.gif"))
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`${descriptionText}`))
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder().setCustomId(`tournaments_edit_message`).setLabel("🖊️ Edit Message").setStyle(ButtonStyle.Secondary)
			)
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(`${maxUsersText}${priceText}${channel}${announcementsChannel}${status}`)
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder().setCustomId(`tournaments_edit_main_settings`).setLabel("⚙️").setStyle(ButtonStyle.Secondary)
			)
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ChannelSelectMenuBuilder()
					.setCustomId("tournaments_channel_select")
					.setPlaceholder("ℹ️ Change Channel")
					.setChannelTypes(ChannelType.GuildText)
			)
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ChannelSelectMenuBuilder()
					.setCustomId("tournaments_announcements_channel_select")
					.setPlaceholder("ℹ️ Change Announcements Channel")
					.setChannelTypes(ChannelType.GuildText)
			)
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`tournaments_change_status`)
					.setLabel(`${settings.status ? "🔴 Disable" : "🟢 Enable"}`)
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId(`tournaments_check_users`).setLabel("ℹ️ Check Users").setStyle(ButtonStyle.Secondary)
			)
		);

	// .addSectionComponents((section) =>
	// 	section.setButtonAccessory((button) =>
	// 		button.setCustomId("tournaments_edit_message").setLabel("🖊️ Edit Message").setStyle(ButtonStyle.Primary)
	// 	)
	// );
	// .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## ⚔️ Whip Duel ⚔️`))
	// .addMediaGalleryComponents((gallery) =>
	// 	gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
	// )
	// .addSectionComponents((section) =>
	// 	section
	// 		.addTextDisplayComponents((textDisplay) =>
	// 			textDisplay.setContent(
	// 				`▸ **Bettor:** ${interaction.user}\n${bet}\n${multiplierText}\n▸ **Last Results:** ${
	// 					displayStreak?.length > 0 ? displayStreak : "-"
	// 				}`
	// 			)
	// 		)
	// 		.setButtonAccessory((button) =>
	// 			button
	// 				.setLabel(`${side === "left" ? "Jaxson ⬅️" : "Jason ➡️"}`)
	// 				.setStyle(ButtonStyle.Secondary)
	// 				.setCustomId(`test`)
	// 				.setDisabled(true)
	// 		)
	// )
	// .addMediaGalleryComponents((gallery) =>
	// 	gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
	// )
	// .addMediaGalleryComponents((gallery) =>
	// 	gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`attachment://${randomGif}`))
	// )
	// .addMediaGalleryComponents((gallery) =>
	// 	gallery.addItems((item) => item.setDescription("Whip Duel").setURL(`https://i.imgur.com/aI8nCE1.gif`))
	// )
	// .addActionRowComponents((actionRow) =>
	// 	actionRow.addComponents(
	// 		new ButtonBuilder()
	// 			.setCustomId(`whip_house_repeat-${userId}-${amount}-${side}`)
	// 			.setLabel("🔁 Play Again!")
	// 			.setStyle(ButtonStyle.Secondary)
	// 	)
	// );

	return {
		components: [whipContainer],
		flags: [MessageFlags.IsComponentsV2],
	};
}

module.exports = buildTournamentsSettingsEmbed;
