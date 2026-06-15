const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace(
  `app.get('/api/diag2', async (req, res) => {`,
  `app.get('/api/diag2', async (req, res) => {
    try {
      const g = await fetch('https://google.com');
      const gText = await g.text();
      return res.json({ google: gText.substring(0, 100) });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }`
);
fs.writeFileSync('index.js', code);
