const { Octokit } = require("@octokit/rest");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

async function main() {
  console.log("Checking if vercel.json exists in raagneet repository...");
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "vercel.json",
      ref: "main"
    });
    const content = Buffer.from(data.content, "base64").toString("utf8");
    console.log("vercel.json content:\n", content);
  } catch (e) {
    console.log("vercel.json was not found or failed to load:", e.message);
  }
}

main().catch(console.error);
