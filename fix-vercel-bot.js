const { Octokit } = require("@octokit/rest");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

const botProxyCode = `export const config = {
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

  // Extract the bot path after "/api/bot"
  // For req.url = "/api/botTOKEN/getMe", path will be "TOKEN/getMe"
  let subpath = '';
  if (req.query.path) {
    subpath = '/bot' + req.query.path;
  } else {
    const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
    subpath = url.pathname.replace(/^\\/api\\/bot/, '/bot');
  }

  // Clean the proxy parameter from search query
  const urlObj = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
  const searchParams = urlObj.searchParams;
  searchParams.delete('path');
  const searchStr = searchParams.toString();
  
  const targetUrl = 'https://api.telegram.org' + subpath + (searchStr ? '?' + searchStr : '');

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

const updatedVercelConfig = {
  "rewrites": [
    { "source": "/api/bot(.*)", "destination": "/api/bot?path=$1" },
    { "source": "/api/telegram(.*)", "destination": "/api/telegram?path=$1" },
    { "source": "/((?!api/).*)", "destination": "/" }
  ]
};

async function main() {
  console.log("Committing new api/bot.js and updating vercel.json wildcard rewrite...");

  // 1. Get api/bot.js metadata to get SHA if it exists
  let botFileSha = null;
  try {
    const { data: botFileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: "api/bot.js",
      ref: "main"
    });
    botFileSha = botFileData.sha;
  } catch (e) {
    console.log("api/bot.js does not exist yet or failed to fetch. Creating a new one...");
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "api/bot.js",
    message: "feat: add api/bot serverless proxy function",
    content: Buffer.from(botProxyCode).toString("base64"),
    sha: botFileSha || undefined,
    branch: "main"
  });
  console.log("api/bot.js created.");

  // 2. Update vercel.json to rewrite /api/bot(.*)
  const { data: vercelData } = await octokit.repos.getContent({
    owner,
    repo,
    path: "vercel.json",
    ref: "main"
  });

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "vercel.json",
    message: "fix: rewrite wildcard api/bot* paths to api/bot serverless proxy",
    content: Buffer.from(JSON.stringify(updatedVercelConfig, null, 2)).toString("base64"),
    sha: vercelData.sha,
    branch: "main"
  });
  console.log("vercel.json updated.");
  console.log("All changes committed! Re-triggering Vercel build.");
}

main().catch(console.error);
