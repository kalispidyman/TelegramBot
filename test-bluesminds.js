const fs = require("fs");

async function run() {
  try {
    const sessionData = JSON.parse(fs.readFileSync("session.json", "utf8"));
    const activeKey = sessionData.bluesmindsApiKey;
    if (!activeKey) {
      console.log("No Bluesminds API Key found in session.");
      return;
    }
    
    console.log("Key found (length " + activeKey.length + ")");
    const baseUrl = "https://api.bluesminds.com/v1/models";
    
    console.log("Fetching from:", baseUrl);
    const response = await fetch(baseUrl, {
      headers: { "Authorization": `Bearer ${activeKey}` }
    });
    console.log("Status:", response.status);
    
    const text = await response.text();
    console.log("Raw response text preview:", text.substring(0, 300));
    
    try {
      const data = JSON.parse(text);
      console.log("Is array?", Array.isArray(data));
      console.log("Keys:", Object.keys(data));
      if (!Array.isArray(data)) {
         console.log("data.models type:", typeof data.models);
         console.log("data.data type:", typeof data.data);
      }
    } catch(e) {
      console.log("Not valid JSON");
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
