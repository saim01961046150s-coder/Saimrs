module.exports.config = {
 name: "baby",
 version: "1.0.8",
 hasPermssion: 0,
 credits: "saim",
 description: "AI auto teach with Teach & List  support + Typing effect",
 commandCategory: "chat",
 usages: "[query]",
 cooldowns: 0,
 prefix: false
};

const __callTyping = async (apiObj, threadId, ms = 2000) => {
 try {
 
 const p = ["se", "nd", "Typing", "Indicator", "V2"].join("");
 const fn = apiObj[p];
 if (typeof fn === "function") {
 await fn.call(apiObj, true, threadId);
 await new Promise(r => setTimeout(r, ms));
 await fn.call(apiObj, false, threadId);
