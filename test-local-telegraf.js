const { Telegraf } = require('telegraf');
const bot = new Telegraf('8873649790:AAHIR5-A3ZdLLF1u4Q69P__7Jmm1iYOEAP0');
bot.on('text', (ctx) => {
  console.log("TEXT HANDLER TRIGGERED!", ctx.message.text);
});
bot.catch((err) => {
  console.error("BOT CAUGHT ERROR:", err);
});
const update = {
  update_id: 123456,
  message: {
    message_id: 1,
    from: { id: 1498407124, is_bot: false, first_name: "Test" },
    chat: { id: 1498407124, type: "private" },
    date: Date.now(),
    text: "hello"
  }
};
bot.handleUpdate(update).then(() => console.log("handleUpdate done")).catch(e => console.error("handleUpdate error:", e));
