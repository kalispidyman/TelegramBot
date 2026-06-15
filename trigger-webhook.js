require("dotenv").config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const spaceHost = "neetne-neet-telegram-bot.hf.space";
  const webhookUrl = `https://${spaceHost}/api/webhook`;
  
  const registerUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  console.log("Registering webhook from local machine...");
  console.log("Target Webhook URL:", webhookUrl);
  
  const response = await fetch(registerUrl);
  const data = await response.json();
  
  console.log("Registration Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
