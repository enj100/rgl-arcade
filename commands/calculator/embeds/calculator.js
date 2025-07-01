const { EmbedBuilder, codeBlock } = require("discord.js");

// Configurable fee percentages (you can modify these)
const DEPOSIT_FEE_PERCENTAGE = 8; // 8% fee for deposits (except crypto)
const CRYPTO_DEPOSIT_FEE_PERCENTAGE = 0; // 0% fee for crypto deposits
const WITHDRAWAL_FEE_PERCENTAGE = 7.5; // 7.5% fee for withdrawals
const WITHDRAWAL_FEE_OSRS = 0;

/**
 * Creates an embed showing RGL-Token deposit and withdrawal calculations.
 * @param {number} amount - The amount of RGL-Tokens to calculate for.
 * @param {Object} settings - The server settings object.
 * @returns {EmbedBuilder} The embed displaying calculator info.
 */
function createCalculatorEmbed(amount, settings) {
	// Calculate deposit costs
	const baseAmount = amount; // 1 token = $1
	const regularDepositFee = (baseAmount * DEPOSIT_FEE_PERCENTAGE) / 100;
	const totalRegularDepositCost = baseAmount + regularDepositFee;
	const cryptoDepositFee = (baseAmount * CRYPTO_DEPOSIT_FEE_PERCENTAGE) / 100;
	const totalCryptoDepositCost = baseAmount + cryptoDepositFee;

	// Calculate withdrawal amounts
	const withdrawalFee = (baseAmount * WITHDRAWAL_FEE_PERCENTAGE) / 100;
	const finalWithdrawalAmount = baseAmount - withdrawalFee;

	const embed = new EmbedBuilder()
		.setColor(0x00ae86)
		.setTitle(`🧮 RGL-Arcade Calculator`)
		.setDescription(`### ▸ Amount: ${amount.toFixed(2)} <:rgl_token:1387626234413846638> RGL-Tokens`)
		.addFields(
			{
				name: `💳 DEPOSITS`,
				value:
					`**Crypto (${CRYPTO_DEPOSIT_FEE_PERCENTAGE}%):** BTC, ETH, LTC, USDT\n` +
					`**Base Amount:** ${codeBlock(`${baseAmount.toFixed(2)} RGL-Tokens`)}` +
					`**Fee:** ${codeBlock(`$${cryptoDepositFee.toFixed(2)}`)}` +
					`**Total Cost:** ${codeBlock(`$${totalCryptoDepositCost.toFixed(2)}`)}\n\n` +
					`**Standard Methods (${DEPOSIT_FEE_PERCENTAGE}%):** CashApp, Zelle, Venmo\n` +
					`**Base Amount:** ${codeBlock(`${baseAmount.toFixed(2)} RGL-Tokens`)}` +
					`**Fee:** ${codeBlock(`$${regularDepositFee.toFixed(2)}`)}` +
					`**Total Cost:** ${codeBlock(`$${totalRegularDepositCost.toFixed(2)}`)}`,
				inline: true,
			},
			{
				name: `💸 WITHDRAWALS`,
				value:
					`**Payment Methods:** Crypto, CashApp, Zelle, Venmo, OSRS GP (0.00%)\n` +
					`**Requested Amount:** ${codeBlock(`${baseAmount.toFixed(2)} RGL-Tokens`)}` +
					`**Fee (${WITHDRAWAL_FEE_PERCENTAGE}%):** ${codeBlock(`$${withdrawalFee.toFixed(2)}`)}` +
					`**You Receive:** ${codeBlock(`$${finalWithdrawalAmount.toFixed(2)}`)}\n\n`,
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

module.exports = { createCalculatorEmbed, DEPOSIT_FEE_PERCENTAGE, CRYPTO_DEPOSIT_FEE_PERCENTAGE, WITHDRAWAL_FEE_PERCENTAGE };
