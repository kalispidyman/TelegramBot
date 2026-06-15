const { handleChatOrIntent } = require('./ai-handler.js');

async function run() {
  try {
    const result = await handleChatOrIntent("hello");
    console.log(result);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
