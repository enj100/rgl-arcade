const { EmbedBuilder, codeBlock } = require("discord.js");

// Configurable fee percentages (you can modify these)
const DEPOSIT_FEE_PERCENTAGE = 8; // 8% fee for deposits
const WITHDRAWAL_FEE_PERCENTAGE = 7.5; // 7.5% fee for withdrawals

/**
 * Creates an embed showing RGL-Token deposit and withdrawal calculations.
 * @param {number} amount - The amount of RGL-Tokens to calculate for.
 * @param {Object} settings - The server settings object.
 * @returns {EmbedBuilder} The embed displaying calculator info.
 */
function createCalculatorEmbed(amount, settings) {
	// Calculate deposit costs
	const baseAmount = amount; // 1 token = $1
	const depositFee = (baseAmount * DEPOSIT_FEE_PERCENTAGE) / 100;
	const totalDepositCost = baseAmount + depositFee;

	// Calculate withdrawal amounts
	const withdrawalFee = (baseAmount * WITHDRAWAL_FEE_PERCENTAGE) / 100;
	const finalWithdrawalAmount = baseAmount - withdrawalFee;

	const embed = new EmbedBuilder()
		.setColor(0x00ae86)
		.setTitle(`🧮 RGL-Arcade Calculator`)
		.setDescription(`### ▸ Amount: ${amount.toFixed(2)} RGL-Tokens`)
		.addFields(
			{
				name: `💳 DEPOSITS`,
				value:
					`**Payment Methods:** Crypto, ApplePay, Interac, CashApp, Venmo, Zelle, PayPal, Chime, Revolut, Wise\n` +
					`**Base Amount:** ${codeBlock(`$${baseAmount.toFixed(2)}`)}` +
					`**Fee (${DEPOSIT_FEE_PERCENTAGE}%):** ${codeBlock(`$${depositFee.toFixed(2)}`)}` +
					`**Total Cost:** ${codeBlock(`$${totalDepositCost.toFixed(2)}`)}\n`,
				inline: true,
			},
			{
				name: `💸 WITHDRAWALS`,
				value:
					`**Payment Methods:** Crypto, ApplePay, Interac, CashApp, Venmo, Zelle, PayPal, Chime, Revolut, Wise\n` +
					`**Requested Amount:** ${codeBlock(`$${baseAmount.toFixed(2)}`)}` +
					`**Fee (${WITHDRAWAL_FEE_PERCENTAGE}%):** ${codeBlock(`$${withdrawalFee.toFixed(2)}`)}` +
					`**You Receive:** ${codeBlock(`$${finalWithdrawalAmount.toFixed(2)}`)}`,
				inline: true,
			}
		)
		.setTimestamp();

	// Apply server settings
	if (settings?.color) {
		embed.setColor(settings.color);
	}
	if (settings?.thumbnail) {
		embed.setThumbnail(settings.thumbnail);
		embed.setFooter({
			text: settings.brand_name || "RGL-Arcade",
			iconURL: settings.thumbnail,
		});
	}

	return embed;
}

module.exports = { createCalculatorEmbed, DEPOSIT_FEE_PERCENTAGE, WITHDRAWAL_FEE_PERCENTAGE };
