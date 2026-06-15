const { Octokit } = require("@octokit/rest");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

const updatedProxyCode = `export const config = {
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

  // Extract subpath from rewrite path query or fallback to original req.url
  let subpath = '';
  if (req.query.path) {
    subpath = '/' + req.query.path;
  } else {
    const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
    subpath = url.pathname.replace(/^\\/api\\/telegram/, '');
  }

  // Handle raw query params
  const urlObj = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
  const searchParams = urlObj.searchParams;
  searchParams.delete('path'); // remove the proxy route helper param if present
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
  console.log("Updating Vercel proxy configuration and code in raagneet repository...");

  // 1. Update api/telegram.js
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: "api/telegram.js",
    ref: "main"
  });

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "api/telegram.js",
    message: "feat: enhance serverless telegram proxy to support rewritten query paths",
    content: Buffer.from(updatedProxyCode).toString("base64"),
    sha: fileData.sha,
    branch: "main"
  });
  console.log("api/telegram.js updated successfully.");

  // 2. Update vercel.json
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
    message: "fix: rewrite wildcard api/telegram/* paths to serverless function",
    content: Buffer.from(JSON.stringify(updatedVercelConfig, null, 2)).toString("base64"),
    sha: vercelData.sha,
    branch: "main"
  });
  console.log("vercel.json updated successfully.");
  console.log("All changes committed! Re-triggering Vercel build.");
}

main().catch(console.error);
