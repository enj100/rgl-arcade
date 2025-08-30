const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("mass-roles")
		.setDescription("⭐ | Mass Roles Assignment(all server users).")
		.setDefaultMemberPermissions("0")
		.addRoleOption((option) => option.setName("role").setDescription("Select the role to assign.").setRequired(true)),
	async execute(interaction) {
		const role = interaction.options.getRole("role");
		const guild = interaction.guild;

		if (!guild) {
			return await interaction.reply({ content: "❗ This command can only be used in a server.", ephemeral: true });
		}

		await interaction.reply({
			content: `*⏳ Adding role <@&${role.id}> to all members. This may take a while... ⛏️ You will be notified when it's done.*`,
		});

		const members = await guild.members.fetch();
		const membersWithoutRole = members.filter((member) => !member.user.bot && !member.roles.cache.has(role.id));
		const membersArray = Array.from(membersWithoutRole.values());

		let processed = 0;
		for (let i = 0; i < membersArray.length; i += 5) {
			const batch = membersArray.slice(i, i + 5);
			await Promise.all(batch.map((member) => member.roles.add(role).catch(() => null)));
			processed += batch.length;
			// Wait 3 seconds between batches, unless it's the last batch
			if (i + 5 < membersArray.length) {
				await new Promise((res) => setTimeout(res, 3000));
			}
		}

		await interaction.followUp({ content: `*✅ Done! Added role to ${processed} members.*` });
	},
};
