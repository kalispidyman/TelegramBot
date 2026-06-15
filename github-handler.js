const { Octokit } = require("@octokit/rest");
require("dotenv").config();

function getOctokit(token) {
  const authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken) {
    throw new Error("No GitHub token provided. Please configure GITHUB_TOKEN in your environment or enter it on the dashboard.");
  }
  return new Octokit({
    auth: authToken,
  });
}

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH || "main";

/**
 * Commits multiple files in a single batch.
 * @param {Array<{ filePath: string, content: string }>} files 
 * @param {string} message 
 * @param {string} token
 */
async function commitBatch(files, message, token) {
  try {
    const octokit = getOctokit(token);
    // 1. Get the current commit SHA of the branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const baseCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the base commit
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: baseCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create a new tree with the file changes
    const tree = files.map(file => ({
      path: file.filePath,
      mode: "100644",
      type: "blob",
      content: file.content,
    }));

    const { data: newTreeData } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 4. Create a new commit
    const { data: newCommitData } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTreeData.sha,
      parents: [baseCommitSha],
    });

    // 5. Update the branch reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommitData.sha,
    });

    return newCommitData;
  } catch (error) {
    console.error("GitHub Batch Commit Error:", error);
    throw error;
  }
}

/**
 * Fetches the recursive list of all file paths in the repository.
 * @param {string} token
 * @returns {Promise<Array<string>>}
 */
async function getRepoFiles(token) {
  try {
    const octokit = getOctokit(token);
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const baseCommitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: baseCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: baseTreeSha,
      recursive: "true",
    });

    return treeData.tree
      .filter(node => node.type === "blob")
      .map(node => node.path);
  } catch (error) {
    console.error("Error fetching repository file tree:", error);
    return [];
  }
}

/**
 * Fetches the recursive list of all file paths with last commit metadata.
 * @param {string} token
 * @returns {Promise<Array<{ path: string, lastModified: string|null }>>}
 */
async function getRepoFilesWithMeta(token) {
  try {
    const paths = await getRepoFiles(token);
    const octokit = getOctokit(token);

    // Batch fetch last commit date for each file (5 at a time to avoid rate limits)
    const chunkSize = 5;
    const results = [];

    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (filePath) => {
          try {
            const { data: commits } = await octokit.repos.listCommits({
              owner,
              repo,
              path: filePath,
              per_page: 1,
            });
            const lastModified = commits.length > 0
              ? commits[0].commit.committer.date || commits[0].commit.author.date
              : null;
            return { path: filePath, lastModified };
          } catch (err) {
            return { path: filePath, lastModified: null };
          }
        })
      );
      results.push(...chunkResults);
      // Small breathing room between batches
      if (i + chunkSize < paths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching repository files with meta:", error);
    return [];
  }
}

/**
 * Fetches the recursive list of all text files and their content in the repository.
 * @param {string} token
 * @returns {Promise<Array<{ filePath: string, content: string }>>}
 */
async function getRepoFilesWithContent(token) {
  try {
    const filePaths = await getRepoFiles(token);
    const octokit = getOctokit(token);
    
    // Extensions that contain text we want to pass to the LLM
    const textExtensions = [".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".json", ".config.js", ".config.ts"];
    
    const filteredPaths = filePaths.filter(path => {
      // Exclude lock files or binary/build folders if they were committed
      if (path.includes("package-lock.json") || path.includes("yarn.lock") || path.includes("pnpm-lock.yaml")) return false;
      if (path.startsWith("dist/") || path.includes("node_modules/")) return false;
      
      const extIndex = path.lastIndexOf(".");
      if (extIndex === -1) return false;
      const ext = path.slice(extIndex).toLowerCase();
      return textExtensions.includes(ext);
    });

    console.log(`[GitHub] Fetching contents for ${filteredPaths.length} text files (using chunked batching)...`);

    const results = [];
    const chunkSize = 5; // Concurrency limit of 5 simultaneous requests
    for (let i = 0; i < filteredPaths.length; i += chunkSize) {
      const chunk = filteredPaths.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (filePath) => {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch,
          });

          let content = "";
          if (data.encoding === "base64" && data.content) {
            content = Buffer.from(data.content, "base64").toString("utf8");
          } else if (typeof data === "string") {
            content = data;
          } else if (data && data.content) {
            content = data.content;
          }
          
          return { filePath, content };
        } catch (err) {
          console.error(`[GitHub] Failed to fetch content for file ${filePath}:`, err);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(item => item !== null));

      // Short breathing interval to avoid hitting API rate/socket limits
      if (i + chunkSize < filteredPaths.length) {
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching repository files with content:", error);
    return [];
  }
}

/**
 * Fetches the content of a single file from the repository.
 * @param {string} filePath
 * @param {string} token
 * @returns {Promise<string>}
 */
async function getFileContent(filePath, token) {
  try {
    const octokit = getOctokit(token);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    let content = "";
    if (data.encoding === "base64" && data.content) {
      content = Buffer.from(data.content, "base64").toString("utf8");
    } else if (typeof data === "string") {
      content = data;
    } else if (data && data.content) {
      content = data.content;
    }
    return content;
  } catch (error) {
    console.error(`[GitHub] Error fetching content for single file ${filePath}:`, error);
    throw error;
  }
}

module.exports = { commitBatch, getRepoFiles, getRepoFilesWithContent, getFileContent, getRepoFilesWithMeta };

