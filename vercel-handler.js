/**
 * Handler to query the Vercel REST API to track deployment progress and status.
 */

/**
 * Fetches the latest deployment for a given Vercel Project.
 * @param {string} projectId 
 * @param {string} token 
 * @returns {Promise<{ uid: string, url: string, readyState: string, meta: object } | null>}
 */
async function getLatestDeployment(projectId, token) {
  try {
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel API responded with ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    if (data.deployments && data.deployments.length > 0) {
      return data.deployments[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching Vercel deployment status:", error);
    throw error;
  }
}

/**
 * Fetches the permanent production public URL configured for a given Vercel Project.
 * @param {string} projectId 
 * @param {string} token 
 * @returns {Promise<string | null>}
 */
async function getProjectProductionUrl(projectId, token) {
  try {
    const url = `https://api.vercel.com/v9/projects/${projectId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Vercel API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if targets.production.url exists
    if (data.targets && data.targets.production && data.targets.production.url) {
      return data.targets.production.url;
    }
    
    // Fallback: use project name configured on Vercel
    if (data.name) {
      return `${data.name}.vercel.app`;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching project production URL:", error);
    return null;
  }
}

/**
 * Fetches the detailed build errors for a failed Vercel deployment.
 * Filters for stderr and command failures, reversed to chronological order.
 * @param {string} deploymentId 
 * @param {string} token 
 * @returns {Promise<string>}
 */
async function getBuildErrors(deploymentId, token) {
  try {
    const url = `https://api.vercel.com/v2/deployments/${deploymentId}/events?direction=backward&limit=100`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Vercel Events API responded with status ${response.status}`);
    }
    
    const events = await response.json();
    if (!Array.isArray(events)) {
      return "No build log events could be parsed.";
    }
    
    // Filter standard errors, failed command prints, and compile exceptions
    const errorLogs = events
      .filter(event => {
        const text = (event.payload?.text || event.text || "").toLowerCase();
        return event.type === 'stderr' || text.includes('error') || text.includes('failed') || text.includes('err:');
      })
      .map(event => event.payload?.text || event.text || "")
      .reverse() // Reverse to show chronological progress of the compilation error
      .join("\n");
      
    if (!errorLogs) {
      console.log("[Vercel Log Fallback] No explicit stderr logs found. Returning last 30 generic log lines...");
      return events
        .slice(0, 30)
        .map(event => event.payload?.text || event.text || "")
        .reverse()
        .join("\n") || "No build log events could be parsed.";
    }
      
    return errorLogs;
  } catch (error) {
    console.error("Error fetching build errors:", error);
    return `Could not retrieve Vercel build logs: ${error.message}`;
  }
}

module.exports = { getLatestDeployment, getProjectProductionUrl, getBuildErrors };
