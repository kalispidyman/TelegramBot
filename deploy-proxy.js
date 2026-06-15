const { commitBatch } = require("./github-handler");

const proxyCode = `export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract the subpath after "/api/telegram"
  // On Vercel, req.url contains the full path /api/telegram/botTOKEN/method
  const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
  const subpath = url.pathname.replace(/^\\/api\\/telegram/, '');
  const targetUrl = 'https://api.telegram.org' + subpath + url.search;

  try {
    // Read raw body from stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const headers = {};
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }
    if (req.headers['content-length']) {
      headers['content-length'] = req.headers['content-length'];
    }

    const fetchOptions = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = bodyBuffer;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}`;

async function main() {
  console.log("Committing Serverless Telegram Proxy function to raagneet repository...");
  await commitBatch(
    [{ filePath: "api/telegram.js", content: proxyCode }],
    "feat: add serverless telegram api proxy endpoint"
  );
  console.log("Proxy function committed successfully! Vercel build triggered.");
}

main().catch(console.error);
