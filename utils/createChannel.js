const { ChannelType, PermissionFlagsBits, userMention, roleMention } = require("discord.js");

/**
 * Creates a channel or ticket in a specified category and sends a message with optional embed and components.
 *
 * @param {Object} guild - The guild where the channel will be created.
 * @param {string} categoryId - The ID of the category where the channel will be created.
 * @param {Object} user - The user for whom the channel is being created.
 * @param {string} [roleToTag=null] - The ID of the role to tag in the channel (optional).
 * @param {Object} [embed=null] - The embed to send in the channel (optional).
 * @param {Array} [components=[]] - The buttons or other components to send in the channel (optional).
 * @returns {Promise<Object>} - The created channel.
 */
async function createTicket(guild, categoryId, user, roleToAdd, embed = null, components = []) {
	try {
		// Fetch the category
		const category = guild.channels.cache.get(categoryId);
		if (!category || category.type !== ChannelType.GuildCategory) {
			throw new Error("Invalid category ID or category not found.");
		}

		// Create the channel
		const channel = await guild.channels.create({
			name: `ticket-${user.username}`,
			type: ChannelType.GuildText,
			parent: categoryId,
			permissionOverwrites: [
				{
					id: guild.id, // Deny access to everyone
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: user.id, // Allow access to the user
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
				},
				{
					id: roleToAdd, // Allow access to the user
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
				},
			],
		});

		// Send the embed and components if provided
		const msg = await channel.send({
			content: `${user} ${roleMention(roleToAdd) || ""}`,
			embeds: embed ? [embed] : [],
			components: components?.length > 0 ? components : [],
		});

		await msg.pin();

		return channel;
	} catch (error) {
		console.error("Error creating channel:", error);
		throw error;
	}
}

module.exports = { createTicket };
