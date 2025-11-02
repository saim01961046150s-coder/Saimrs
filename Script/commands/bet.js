const fs = require("fs");
const path = __dirname + "/coinxbalance.json";

// coinxbalance.json না থাকলে বানানো
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}, null, 2));
}

// ব্যালেন্স পড়া
function getBalance(userID) {
  const data = JSON.parse(fs.readFileSync(path));
  if (data[userID]?.balance != null) return data[userID].balance;

  if (userID === "61566961113103") return 50000000; // তুমি 50M$
  return 100; // অন্যরা 100$
}

// ব্যালেন্স আপডেট
function setBalance(userID, balance) {
  const data = JSON.parse(fs.readFileSync(path));
  data[userID] = { balance };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// ব্যালেন্স ফরম্যাটিং
function formatBalance(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + "T$";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + "B$";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + "M$";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, '') + "k$";
  return num + "$";
}

module.exports.config = {
  name: "bet",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Akash × ChatGPT",
  description: "Place a bet: win 3x,4x,8x,20x,50x coins!",
  commandCategory: "Economy",
  usages: "bet <amount>",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  let balance = getBalance(senderID);

  if (!args[0] || isNaN(args[0])) return api.sendMessage("❌ Please enter a valid bet amount.", threadID, messageID);

  let betAmount = parseInt(args[0]);
  if (betAmount <= 0) return api.sendMessage("❌ Bet amount must be greater than 0.", threadID, messageID);
  if (betAmount > balance) return api.sendMessage("❌ You don't have enough Coins to bet that amount.", threadID, messageID);

  const multipliers = [3, 4, 8, 20, 50];
  const chosenMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];

  const win = Math.random() < 0.5; // 50% chance

  if (win) {
    const winAmount = betAmount * chosenMultiplier;
    balance += winAmount;
    setBalance(senderID, balance);
    return api.sendMessage(
      `🎉 You won the bet!\n💰 Bet: ${formatBalance(betAmount)}\n⚡ Multiplier: ${chosenMultiplier}x\n📌 New Balance: ${formatBalance(balance)}`,
      threadID,
      messageID
    );
  } else {
    balance -= betAmount;
    if (balance < 0) balance = 0;
    setBalance(senderID, balance);
    return api.sendMessage(
      `❌ You lost the bet!\n💰 Bet: ${formatBalance(betAmount)}\n📌 New Balance: ${formatBalance(balance)}`,
      threadID,
      messageID
    );
  }
};
