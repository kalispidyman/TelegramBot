require("dotenv").config();

async function run() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_API_KEY set!");
    return;
  }
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gemini-1.5-flash",
        messages: [{ role: "user", content: "Say ok in JSON format: {\"ok\": true}" }],
        max_tokens: 50,
        stream: true
      })
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response text:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
