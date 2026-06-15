process.env.TELEGRAM_BOT_TOKEN = "OLD_TOKEN";
const fs = require('fs');
fs.writeFileSync('.test-env', 'TELEGRAM_BOT_TOKEN="NEW_TOKEN"\n');
require('dotenv').config({ path: '.test-env', override: true });
console.log(process.env.TELEGRAM_BOT_TOKEN);
