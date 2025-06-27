const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const rankSystemEmbed = require("./embeds/rankSystem");
const Rank = require("./models/Ranks");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) return;
		// RANK SYSTEM SETTINGS
		else if (interaction?.customId === "other_settings" && interaction?.values[0] === "rank_system_settings") {
			const { embeds, components } = await rankSystemEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "rank_system_add_rank") {
			const rankId = interaction.values[0];
			const rank = interaction.client.ranks.find((r) => r.role_id === rankId);
			if (interaction.client.ranks.length >= 25) {
				return await interaction.reply({
					content: "*❗ Maximum number of ranks reached(25)!*",
					ephemeral: true,
				});
			}
			if (rank) {
				return await interaction.reply({
					content: "*❗ Rank already exists!*",
					ephemeral: true,
				});
			}

			// create modal for adding rank
			const modal = new ModalBuilder().setCustomId("rank_system_add_rank_submit-" + rankId).setTitle("Add Rank");

			const requirementInput = new TextInputBuilder()
				.setCustomId("requirement")
				.setLabel("Requirement (in RGL-Tokens)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("e.g. 100.00")
				.setRequired(true);

			const rakebackInput = new TextInputBuilder()
				.setCustomId("rakeback")
				.setLabel("Rakeback Percentage (0-100)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("e.g. 5.00")
				.setRequired(true);

			// show modal
			modal.addComponents(
				new ActionRowBuilder().addComponents(requirementInput),
				new ActionRowBuilder().addComponents(rakebackInput)
			);
			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("rank_system_add_rank_submit-")) {
			const requirement = parseFloat(interaction.fields.getTextInputValue("requirement"));
			const rakeback = parseFloat(interaction.fields.getTextInputValue("rakeback"));
			const rankId = interaction.customId.split("-")[1];

			if (isNaN(requirement) || requirement <= 0) {
				return await interaction.reply({
					content: "*❗ Invalid requirement value!*",
					ephemeral: true,
				});
			}
			if (isNaN(rakeback) || rakeback < 0 || rakeback > 100) {
				return await interaction.reply({
					content: "*❗ Invalid rakeback percentage! It should be between 0 and 100.*",
					ephemeral: true,
				});
			}
			const rank = interaction.client.ranks.find((r) => r.role_id === rankId);
			if (rank) {
				return await interaction.reply({
					content: "*❗ Rank already exists!*",
					ephemeral: true,
				});
			}
			if (interaction.client.ranks.length >= 25) {
				return await interaction.reply({
					content: "*❗ Maximum number of ranks reached(25)!*",
					ephemeral: true,
				});
			}

			await Rank.create({
				role_id: rankId,
				requirement: requirement,
			});

			interaction.client.ranks = await Rank.findAll({ order: [["requirement", "DESC"]] });
			const { embeds, components } = await rankSystemEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "rank_system_remove_rank") {
			const rankId = interaction.values[0];
			const rank = interaction.client.ranks.find((r) => r.role_id === rankId);
			if (!rank) {
				return await interaction.reply({
					content: "*❗ Rank not found!*",
					ephemeral: true,
				});
			}
			await Rank.destroy({ where: { role_id: rankId } });
			interaction.client.ranks = await Rank.findAll({ order: [["requirement", "DESC"]] });
			const { embeds, components } = await rankSystemEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		} else if (interaction?.customId === "rank_system_edit_rank") {
			const rankId = interaction.values[0];
			const rank = interaction.client.ranks.find((r) => r.role_id === rankId);
			if (!rank) {
				return await interaction.reply({
					content: "*❗ Rank not found!*",
					ephemeral: true,
				});
			}

			// create modal for editing rank
			const modal = new ModalBuilder().setCustomId("rank_system_edit_rank_submit-" + rankId).setTitle("Edit Rank");

			const requirementInput = new TextInputBuilder()
				.setCustomId("requirement")
				.setLabel("Requirement (in RGL-Tokens)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("e.g. 100.00")
				.setRequired(true)
				.setValue(rank.requirement.toString());

			const rakebackInput = new TextInputBuilder()
				.setCustomId("rakeback")
				.setLabel("Rakeback Percentage (0-100)")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("e.g. 5.00")
				.setRequired(true)
				.setValue(rank.rakeback.toString());

			modal.addComponents(
				new ActionRowBuilder().addComponents(requirementInput),
				new ActionRowBuilder().addComponents(rakebackInput)
			);
			await interaction.showModal(modal);
		} else if (interaction?.customId?.startsWith("rank_system_edit_rank_submit-")) {
			const requirement = parseFloat(interaction.fields.getTextInputValue("requirement"));
			const rakeback = parseFloat(interaction.fields.getTextInputValue("rakeback"));
			const rankId = interaction.customId.split("-")[1];

			if (isNaN(requirement) || requirement <= 0) {
				return await interaction.reply({
					content: "*❗ Invalid requirement value!*",
					ephemeral: true,
				});
			}
			if (isNaN(rakeback) || rakeback < 0 || rakeback > 100) {
				return await interaction.reply({
					content: "*❗ Invalid rakeback percentage! It should be between 0 and 100.*",
					ephemeral: true,
				});
			}
			const rank = interaction.client.ranks.find((r) => r.role_id === rankId);
			if (!rank) {
				return await interaction.reply({
					content: "*❗ Rank not found!*",
					ephemeral: true,
				});
			}

			await Rank.update({ requirement, rakeback }, { where: { role_id: rankId } });
			interaction.client.ranks = await Rank.findAll({ order: [["requirement", "DESC"]] });
			const { embeds, components } = await rankSystemEmbed(interaction);
			await interaction.update({
				embeds,
				components,
				ephemeral: true, // Make the reply visible only to the user who invoked the command
			});
		}
	},
};
