const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

async function main() {
  console.log("Reading index.css.tmp...");
  let content = fs.readFileSync("index.css.tmp", "utf8");
  
  // Cut off the incomplete utilities block and write the correct one
  const cleanContent = content.substring(0, content.lastIndexOf("@layer utilities"));
  
  const finalContent = cleanContent + `@layer utilities {
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
`;

  console.log("Committing fixed src/index.css back to raagneet repository...");
  
  // 1. Get latest ref
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });
  const latestCommitSha = refData.object.sha;

  // 2. Fetch the file metadata to get the current blob SHA
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: "src/index.css",
    ref: "main"
  });
  
  // 3. Update the file content
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "src/index.css",
    message: "fix: complete animate-float CSS selector and add float keyframes block to resolve postcss build crash",
    content: Buffer.from(finalContent).toString("base64"),
    sha: fileData.sha,
    branch: "main"
  });
  
  console.log("CSS file successfully fixed and pushed! Vercel build re-triggered.");
}

main().catch(console.error);
