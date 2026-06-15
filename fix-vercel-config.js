const { Octokit } = require("@octokit/rest");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

async function main() {
  console.log("Updating vercel.json in raagneet repository to exclude /api/ paths...");
  
  // 1. Get vercel.json metadata to get SHA
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: "vercel.json",
    ref: "main"
  });
  
  const updatedConfig = {
    "rewrites": [
      { "source": "/((?!api/).*)", "destination": "/" }
    ]
  };
  
  // 2. Commit the new vercel.json
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "vercel.json",
    message: "fix: exclude /api/ routes from vercel SPA rewrites to enable serverless proxy function",
    content: Buffer.from(JSON.stringify(updatedConfig, null, 2)).toString("base64"),
    sha: fileData.sha,
    branch: "main"
  });
  
  console.log("vercel.json successfully fixed and pushed! Re-triggering Vercel build.");
}

main().catch(console.error);
