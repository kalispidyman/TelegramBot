const { Telegraf } = require('telegraf');
const bot = new Telegraf('8873649790:AAHIR5-A3ZdLLF1u4Q69P__7Jmm1iYOEAP0');
bot.telegram.sendMessage(1498407124, "Ping from Antigravity: I just verified the cloud bot again. Are you getting this?").then(() => console.log("Success!")).catch(console.error);
