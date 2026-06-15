require("dotenv").config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const proxyUrl = `https://raagneet.vercel.app/api/telegram/bot${token}/getWebhookInfo`;
  console.log("Checking Telegram webhook registration status...");
  console.log("URL:", proxyUrl);
  
  const response = await fetch(proxyUrl);
  console.log("Response Status:", response.status);
  const data = await response.json();
  console.log("Webhook Info:\n", JSON.stringify(data, null, 2));
}

main().catch(console.error);
