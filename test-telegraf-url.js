const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, {
  telegram: {
    apiRoot: 'https://raagneet.vercel.app/api/telegram/'
  }
});
bot.telegram.options.apiRoot = 'https://raagneet.vercel.app/api/telegram/';

console.log("Telegraf configured apiRoot:", bot.telegram.options.apiRoot);

bot.telegram.getMe()
  .then(res => console.log("Success:", res))
  .catch(err => {
    console.log("Error URL or Message:", err.message);
    console.log("Full Error Object:", err);
  });
