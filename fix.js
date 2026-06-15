const { getFileContent, commitBatch } = require('./github-handler.js');

async function fixVercelError() {
  try {
    console.log("Fetching Home.jsx from GitHub...");
    
    // We use process.env or currentSession in the handler, but the handler reads from .env via dotenv
    let content = await getFileContent("src/pages/Home.jsx");
    
    console.log("Fixing the JSX comment syntax error...");
    // Fix the syntax error by removing the invalid comment inside the tag
    content = content.replace(/to="\/packages"\s*\{\/\*\s*UPDATED: now points to the new Packages page\s*\*\/\}/g, 'to="/packages"');
    
    console.log("Committing fix to GitHub...");
    await commitBatch([{ filePath: "src/pages/Home.jsx", content }], "fix: remove invalid JSX comment inside Link tag");
    
    console.log("✅ Successfully pushed to GitHub! Vercel will now rebuild.");
  } catch(e) {
    console.error("❌ Failed to push fix:", e.message);
  }
}

fixVercelError();
