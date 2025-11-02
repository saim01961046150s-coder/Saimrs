const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

const coinsFile = path.join(__dirname, 'coins.json');

// Load or initialize coins data
let coinsData = {};
if (fs.existsSync(coinsFile)) {
    try {
        coinsData = JSON.parse(fs.readFileSync(coinsFile, 'utf-8'));
    } catch {
        coinsData = {};
    }
}

// Save coins
function saveCoins() {
    fs.writeFileSync(coinsFile, JSON.stringify(coinsData, null, 2));
}

module.exports.config = {
    name: "bet",
    version: "1.5.0",
    aliases: ["gamble", "slots"],
    credits: "VK. SAIM",
    description: "Casino game with coins and profile picture",
    commandCategory: "fun",
    usages: "{pn} [coin|slot]",
    hasPermssion: 0
};

// Generate result image
async function generateImage(username, avatarUrl, resultText, coins) {
    const canvas = createCanvas(500, 350);
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 500, 350);

    // profile picture
    let avatar;
    try { avatar = await loadImage(avatarUrl); } catch { avatar = null; }
    if (avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 50, 0, Math.PI * 2);
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
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(resultText, 250, 180);

    // coins
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Coins: ${coins}`, 250, 280);

    fs.writeFileSync('bet_result.png', canvas.toBuffer('image/png'));
    return fs.createReadStream('bet_result.png');
}

module.exports.run = async ({ api, event, args }) => {
    if (!args[0]) return api.sendMessage("❌ Please choose a game: coin or slot\nExample: bet coin", event.threadID, event.messageID);
    const game = args[0].toLowerCase();

    // get user info
    let userName = "Player";
    let userAvatar = null;
    try {
        const info = await api.getUserInfo(event.senderID);
        const user = info[event.senderID];
        userName = user.name || "Player";
        userAvatar = user.profileUrl || user.avatar || null;
    } catch {}

    // initialize coins
    if (!coinsData[event.senderID]) {
        if (event.senderID === "61566961113103") {
            coinsData[event.senderID] = 100000000; // Admin coins
        } else {
            coinsData[event.senderID] = 100; // normal users start
        }
    }

    let coins = coinsData[event.senderID];
    let resultText = "";

    if (game === "coin") {
        const outcome = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
        const win = Math.random() < 0.5;

        if (win) {
            coins += 20;
            resultText = `${outcome} | You Win! 🎉`;
        } else {
            coins -= 15;
            resultText = `${outcome} | You Lose! 😢`;
        }

    } else if (game === "slot") {
        const emojis = ["🍒","🍋","🍉","🍇","⭐"];
        const slot1 = emojis[Math.floor(Math.random()*emojis.length)];
        const slot2 = emojis[Math.floor(Math.random()*emojis.length)];
        const slot3 = emojis[Math.floor(Math.random()*emojis.length)];

        if (slot1 === slot2 && slot2 === slot3) {
            coins += 500;
            resultText = `${slot1} | ${slot2} | ${slot3}\nJackpot! 🎉`;
        } else if (slot1===slot2 || slot2===slot3 || slot1===slot3) {
            coins += 50;
            resultText = `${slot1} | ${slot2} | ${slot3}\nSmall Win! ✨`;
        } else {
            coins -= 15;
            resultText = `${slot1} | ${slot2} | ${slot3}\nYou Lose! 😢`;
        }
    } else {
        return api.sendMessage("❌ Invalid game. Choose 'coin' or 'slot'.", event.threadID, event.messageID);
    }

    // save coins
    coinsData[event.senderID] = coins;
    saveCoins();

    const img = await generateImage(userName, userAvatar, resultText, coins);
    return api.sendMessage({ body: "🎲 Bet Result:", attachment: img }, event.threadID, () => fs.unlinkSync('bet_result.png'), event.messageID);
};
