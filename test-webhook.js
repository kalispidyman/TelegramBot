const update = {
  update_id: Date.now(),
  message: {
    message_id: Date.now(),
    from: { id: 1498407124, is_bot: false, first_name: "Navneet", username: "Spyboyshadow" },
    chat: { id: 1498407124, first_name: "Navneet", username: "Spyboyshadow", type: "private" },
    date: Math.floor(Date.now() / 1000),
    text: "bhak bhak bhak bahk"
  }
};

fetch('https://neetne-neet-telegram-bot.hf.space/api/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(update)
}).then(res => {
  console.log("Status:", res.status);
  return res.text();
}).then(console.log).catch(console.error);
