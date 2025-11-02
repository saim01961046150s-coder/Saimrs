// veo.js
// Mirai Bot Command: /veo
// Author: VK. SAIM

const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "veo",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "VK. SAIM",
  description: "Generate video from text using API, with status messages & full error handling",
  commandCategory: "Utilities",
  usages: "/veo <text>",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const textPrompt = args.join(" ");
  if (!textPrompt) {
    return api.sendMessage("❎ টেক্সট দিন ভিডিও তৈরি করার জন্য।", event.threadID);
  }

  const API_URL = "https://mahbub-ullash.cyberbot.top/api/gh";

  // Notify user that generation is starting
  api.sendMessage("🎬 ভিডিও তৈরি হচ্ছে...", event.threadID);

  try {
    const response = await axios.post(API_URL, { prompt: textPrompt });

    // Check if response data exists
    if (!response.data) {
      console.error("API returned no data:", response);
      return api.sendMessage("❎ API থেকে কোনো উত্তর আসেনি। আবার চেষ্টা করুন।", event.threadID);
    }

    // Check status field
    if (!response.data.status) {
      console.error("API Error:", response.data);
      return api.sendMessage(`❎ ভিডিও তৈরি ব্যর্থ! কারণ: ${response.data.message || "অজানা"}।`, event.threadID);
    }

    // Check video URL field
    const videoUrl = response.data.video;
    if (!videoUrl) {
      console.error("Video URL missing in API response:", response.data);
      return api.sendMessage("❎ ভিডিও URL পাওয়া যায়নি। আবার চেষ্টা করুন।", event.threadID);
    }

    // Prepare to download
    const filePath = path.join(__dirname, `veo_${Date.now()}.mp4`);
    const videoResponse = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    videoResponse.data.pipe(writer);

    writer.on("finish", () => {
      // On success: send the file
      api.sendMessage(
        { body: "✅ ভিডিও তৈরি সফল! দেখুন নিচে ⬇️", attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => {
          // Delete file after sending
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete file:", err);
          });
        }
      );
    });

    writer.on("error", (err) => {
      console.error("Error writing video file:", err);
      api.sendMessage("❎ ভিডিও সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID);
    });

  } catch (error) {
    console.error("Axios / Network Error:", error);
    if (error.response) {
      // Server responded with a status outside 2xx
      return api.sendMessage(`❎ ভিডিও তৈরি করতে সমস্যা হয়েছে। সার্ভার রেসপন্স কোড: ${error.response.status}`, event.threadID);
    } else if (error.request) {
      // Request was made but no response
      return api.sendMessage("❎ ভিডিও তৈরি করতে সমস্যা হয়েছে। সার্ভার রেসপন্স পাওয়া যায়নি।", event.threadID);
    } else {
      // Another error
      return api.sendMessage(`❎ ভিডিও তৈরি করতে সমস্যা হয়েছে। কারণ: ${error.message}`, event.threadID);
    }
  }
};
