require("dotenv").config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const proxyUrl = `https://raagneet.vercel.app/api/telegram/bot${token}/getMe`;
  console.log("Testing Vercel proxy by calling getMe...");
  console.log("URL:", proxyUrl);
  
  const response = await fetch(proxyUrl);
  console.log("Response Status:", response.status);
  const text = await response.text();
  console.log("Response Text:", text);
}

main().catch(console.error);
