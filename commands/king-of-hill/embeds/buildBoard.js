const { EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, channelMention, AttachmentBuilder } = require("discord.js");

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const KothLeaderboard = require("../models/Leaderboard");

async function generateKothImage(users = null, client) {
    if (!users) {
        users = await KothLeaderboard.findAll({
            order: [["wins", "DESC"]],
            limit: 5,
        });
    }

    const canvas = createCanvas(4256, 2632);
    const context = canvas.getContext("2d");
    const background = await loadImage(path.join(__dirname, "../assets/koth.jpg"));
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.font = "bold 115px verdana";
    context.fillStyle = "#FFFFFF";

    context.textAlign = "center";
    context.textBaseline = "middle";

    if (users[0]) {
        const userObj = await client.users.fetch(users[0]?.discord_id);
        if (userObj) {
            context.fillText(userObj.username, 3670, 1640);
            context.fillText(`${users[0].wins} Win(s)`, 3670, 1490);
        }
    }
    if (users[1]) {
        const userObj = await client.users.fetch(users[1]?.discord_id);
        if (userObj) {
            context.fillText(userObj.username, 2870, 1800);
            context.fillText(`${users[1].wins} Wins`, 2870, 1650);
        }
    }
    if (users[2]) {
        const userObj = await client.users.fetch(users[2]?.discord_id);
        if (userObj) {
            context.fillText(userObj.username, 2070, 1960);
            context.fillText(`${users[2].wins} Wins`, 2070, 1810);
        }
    }
    if (users[3]) {
        const userObj = await client.users.fetch(users[3]?.discord_id);
        if (userObj) {
            context.fillText(userObj.username, 1280, 2140);
            context.fillText(`${users[3].wins} Wins`, 1280, 1990);
        }
    }
    if (users[4]) {
        const userObj = await client.users.fetch(users[4]?.discord_id);
        if (userObj) {
            context.fillText(userObj.username, 500, 2240);
            context.fillText(`${users[4].wins} Wins`, 500, 2090);
        }
    }

    // let y = 130;
    // const startIndex = 1;
    // for (let index = 0; index < 5; index++) {
    //     const displayIndex = startIndex + index + 1;
    //     const displayIndexText = `${displayIndex < 10 ? "0" : ""}${displayIndex}`;
    //     context.fillText(displayIndexText, 55, y);

    //     const user = users[startIndex + index];
    //     if (user) {
    //         const userObj = await client.users.fetch(user?.discord_id);
    //         if (userObj) {
    //             context.fillText(userObj.username, 435, y);
    //             context.fillText(`${user.wins.toFixed(2)}`, 840, y);
    //         }
    //     }

    //     y += 40.5;
    // }

    const buffer = canvas.toBuffer("image/jpeg");
    const filePath = path.join(__dirname, `../assets/koth-active.jpg`);
    fs.writeFileSync(filePath, buffer);
}

async function buildKothLeaderboard(client, page = 0, needsRegeneration = false, users = null) {
    // Generate images if they don't exist or if we need to regenerate them.
    for (let i = 0; i < 1; i++) {
        const filePath = path.join(__dirname, `../assets/koth-active.jpg`);
        if (!fs.existsSync(filePath) || needsRegeneration) {
            await generateKothImage(users, client);
            break;
        }
    }

    const filePath = path.join(__dirname, `../assets/koth-active.jpg`);
    const attachment = new AttachmentBuilder(filePath);
    const filename = path.basename(filePath);

    return { files: [attachment], components: [], filename };
}

module.exports = { buildKothLeaderboard, generateKothImage };
