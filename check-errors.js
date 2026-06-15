const { getBuildErrors } = require("./vercel-handler");
require("dotenv").config();

async function main() {
  const deploymentId = "dpl_31gwqthJv8mGQMg9ZZbP1VaPxf8Z";
  const token = process.env.VERCEL_TOKEN;
  console.log("Checking Vercel build errors...");
  const errors = await getBuildErrors(deploymentId, token);
  console.log("Build Errors:\n", errors);
}

main().catch(console.error);
