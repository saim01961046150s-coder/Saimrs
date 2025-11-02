const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "bet",       // Command name
    version: "1.2.0",
    aliases: ["gamble", "slots"],
    credits: "VK. SAIM",
    description: "Casino game showing user name, profile picture, and result",
    commandCategory: "fun",
    usages: "{pn} [coin|slot]",
    hasPermssion: 0
};

// Generate casino result image
async function generateCasinoImage(username, profilePicUrl, resultText) {
    const canvas = createCanvas(500, 300);
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 500, 300);

    // load profile picture
    let avatar;
    try {
        avatar = await loadImage(profilePicUrl);
    } catch {
        avatar = null;
    }

    // draw profile picture
    if (avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 50, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 20, 20, 100, 100);
        ctx.restore();
    }

    // username
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(username, 150, 60);

    // result text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(resultText, 250, 180);

    // save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('bet_result.png', buffer);
    return fs.createReadStream('bet_result.png');
}

module.exports.run = async ({ api, event, args }) => {
    if (!args[0]) return api.sendMessage("❌ Please choose a game: coin or slot\nExample: bet coin", event.threadID, event.messageID);

    const game = args[0].toLowerCase();

    // get user info
    let userName = "Player";
    let userAvatar = null;
    try {
        const userInfo = await api.getUserInfo(event.senderID);
        const user = userInfo[event.senderID];
        userName = user.name;
        userAvatar = user.profileUrl || user.avatar || null;
    } catch {}

    if (game === "coin") {
        const outcome = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
        const win = Math.random() < 0.5 ? "You Win! 🎉" : "You Lose! 😢";
        const img = await generateCasinoImage(userName, userAvatar, outcome + " | " + win);
        return api.sendMessage({ body: "Coin Flip Result:", attachment: img }, event.threadID, () => fs.unlinkSync('bet_result.png'), event.messageID);
    }

    if (game === "slot") {
        const emojis = ["🍒", "🍋", "🍉", "🍇", "⭐"];
        const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot3 = emojis[Math.floor(Math.random() * emojis.length)];

        let result = "You Lose! 😢";
        if (slot1 === slot2 && slot2 === slot3) result = "Jackpot! 🎉";
        else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) result = "Small Win! ✨";

        const img = await generateCasinoImage(userName, userAvatar, `${slot1} | ${slot2} | ${slot3}\n${result}`);
        return api.sendMessage({ body: "🎰 Slot Result:", attachment: img }, event.threadID, () => fs.unlinkSync('bet_result.png'), event.messageID);
    }

    return api.sendMessage("❌ Invalid game. Choose 'coin' or 'slot'.", event.threadID, event.messageID);
};
