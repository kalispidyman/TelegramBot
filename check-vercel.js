const { getLatestDeployment } = require("./vercel-handler");
require("dotenv").config();

async function main() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const token = process.env.VERCEL_TOKEN;
  console.log("Checking Vercel project deployment status...");
  const deployment = await getLatestDeployment(projectId, token);
  console.log("Deployment Details:", JSON.stringify(deployment, null, 2));
}

main().catch(console.error);
