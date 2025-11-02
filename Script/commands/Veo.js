// veo.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "veo",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "VK. SAIM",
  description: "Generate video from text using CYBER ULLASH API with status messages and better error handling",
  commandCategory: "Utilities",
  usages: "/veo <text>",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const textPrompt = args.join(" ");
  if (!textPrompt) return api.sendMessage("❎ টেক্সট দিন ভিডিও তৈরি করার জন্য।", event.threadID);

  const API_URL = "https://mahbub-ullash.cyberbot.top/api/gh";
  api.sendMessage("🎬 ভিডিও তৈরি হচ্ছে...", event.threadID);

  try {
    const response = await axios.post(API_URL, { prompt: textPrompt });

    if (!response.data) {
      console.error("API returned empty response");
      return api.sendMessage("❎ API থেকে কোন উত্তর আসেনি। আবার চেষ্টা করুন।", event.threadID);
    }

    if (!response.data.status) {
      console.error("API Error:", response.data);
      return api.sendMessage(`❎ ভিডিও তৈরি ব্যর্থ! কারণ: ${response.data.message || "Unknown error"}`, event.threadID);
    }

    const videoUrl = response.data.video;
    if (!videoUrl) {
      console.error("Video URL missing in API response", response.data);
      return api.sendMessage("❎ ভিডিও URL পাওয়া যায়নি। আবার চেষ্টা করুন।", event.threadID);
    }

    const filePath = path.join(__dirname, `veo_${Date.now()}.mp4`);
    const videoResponse = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    videoResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        { body: "✅ ভিডিও তৈরি সফল! দেখুন নিচে ⬇️", attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });

    writer.on("error", (err) => {
      console.error("Error writing video file:", err);
      api.sendMessage("❎ ভিডিও সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID);
    });

  } catch (error) {
    console.error("Axios / Network Error:", error.message);
    api.sendMessage(`❎ ভিডিও তৈরি করতে সমস্যা হয়েছে। কারণ: ${error.message}`, event.threadID);
  }
};
