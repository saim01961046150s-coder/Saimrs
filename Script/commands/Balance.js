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

  // যদি তুমি হয়, ডিফল্ট 200M, অন্যরা 100
  if (userID === "61566961113103") return 50000000;
  return 100;
}

// ব্যালেন্স আপডেট
function setBalance(userID, balance) {
  const data = JSON.parse(fs.readFileSync(path));
  data[userID] = { balance };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// ব্যালেন্স ফরম্যাটিং ফাংশন (ডলার সাইন সহ)
function formatBalance(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, '') + "T$";
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + "B$";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + "M$";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + "k$";
  return num + "$";
}

module.exports.config = {
  name: "balance",
  version: "3.0.2",
  hasPermssion: 0,
  credits: "Akash × ChatGPT",
  description: "Check your coin balance & Transfer Coins",
  commandCategory: "Economy",
  usages: "balance /transfer <@user> <amount>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, senderID, messageID, mentions } = event;

  try {
    // ট্রান্সফার চেক
    if (args[0] && args[0].toLowerCase() === "transfer") {
      if (!mentions || Object.keys(mentions).length === 0)
        return api.sendMessage("❌ Please tag a user to transfer coins.", threadID, messageID);

      const targetID = Object.keys(mentions)[0];
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount <= 0)
        return api.sendMessage("❌ Please provide a valid amount to transfer.", threadID, messageID);

      let senderBalance = getBalance(senderID);
      if (senderBalance < amount)
        return api.sendMessage("❌ You don't have enough coins to transfer.", threadID, messageID);

      let receiverBalance = getBalance(targetID);
      senderBalance -= amount;
      receiverBalance += amount;

      setBalance(senderID, senderBalance);
      setBalance(targetID, receiverBalance);

      const senderName = await Users.getNameUser(senderID);
      const receiverName = await Users.getNameUser(targetID);

      return api.sendMessage(
        `✅ Transfer Successful!\n💰 ${senderName} sent ${formatBalance(amount)} to ${receiverName}.\n📌 Your New Balance: ${formatBalance(senderBalance)}`,
        threadID,
        messageID
      );
    }

    // সাধারণ ব্যালেন্স চেক
    let balance = getBalance(senderID);
    const userName = await Users.getNameUser(senderID);

    return api.sendMessage(
      `💳 𝗔𝗰𝗰𝗼𝘂𝗻𝘁 𝗜𝗻𝗳𝗼\n━━━━━━━━━━━━━━\n👤 𝐍𝐚𝐦𝐞 : ${userName}\n💰 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 : ${formatBalance(balance)}\n━━━━━━━━━━━━━━`,
      threadID,
      messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ ব্যালেন্স চেক করতে বা ট্রান্সফার করতে সমস্যা হয়েছে!", threadID, messageID);
  }
};
