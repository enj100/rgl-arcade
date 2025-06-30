const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("feedback")
		.setDescription("⭐ Create a feedback form.")
		.setDefaultMemberPermissions("0")
		.addUserOption((option) => option.setName("user").setDescription("Select an user").setRequired(true)),
	async execute(interaction) {
		const feedbackSettings = interaction.client.feedbackSettings;
		const userOption = interaction.options.getUser("user");

		if (userOption.id === interaction.user.id) {
			return await interaction.reply({
				content: "❗️ You cannot send a feedback form to yourself.",
				ephemeral: true,
			});
		}

		if (feedbackSettings.feedbacks_channel) {
			const issuedBy = `\`▸ Issued By :\` ${interaction.user}\n`;
			const customer = `\`▸ Customer  :\` ${userOption}\n`;

			const embed = new EmbedBuilder()
				.setTitle("⭐️ Feedback Form")
				.setDescription(`${feedbackSettings.feedback_description || "Thank you!"}\n\n${issuedBy}${customer}`)
				.setColor(feedbackSettings.color || "#0099ff");

			if (feedbackSettings.thumbnail && feedbackSettings.thumbnail.length > 0) {
				embed.setThumbnail(feedbackSettings.thumbnail);
			}

			const starOneButton = new ButtonBuilder()
				.setCustomId("feedback_form_open-1-" + userOption.id + "-" + interaction.user.id)
				.setLabel("⭐ 1")
				.setStyle(ButtonStyle.Secondary);

			const starTwoButton = new ButtonBuilder()
				.setCustomId("feedback_form_open-2-" + userOption.id + "-" + interaction.user.id)
				.setLabel("⭐ 2")
				.setStyle(ButtonStyle.Secondary);
			const starThreeButton = new ButtonBuilder()
				.setCustomId("feedback_form_open-3-" + userOption.id + "-" + interaction.user.id)
				.setLabel("⭐ 3")
				.setStyle(ButtonStyle.Secondary);
			const starFourButton = new ButtonBuilder()
				.setCustomId("feedback_form_open-4-" + userOption.id + "-" + interaction.user.id)
				.setLabel("⭐ 4")
				.setStyle(ButtonStyle.Secondary);
			const starFiveButton = new ButtonBuilder()
				.setCustomId("feedback_form_open-5-" + userOption.id + "-" + interaction.user.id)
				.setLabel("⭐ 5")
				.setStyle(ButtonStyle.Secondary);

			const row1 = new ActionRowBuilder().addComponents(
				starOneButton,
				starTwoButton,
				starThreeButton,
				starFourButton,
				starFiveButton
			);

			await interaction.reply({
				embeds: [embed],
				components: [row1],
			});
		} else {
			return await interaction.reply({
				content: "❗️ Feedbacks channel is not set.",
				ephemeral: true,
			});
		}
	},
};
