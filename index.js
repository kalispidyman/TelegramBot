const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
// DNS servers are no longer overridden here as it causes EAI_AGAIN lookup timeouts on Hugging Face Spaces.
// The OS provided DNS is used instead.

const originalLog = console.log;
const originalError = console.error;
const activityLogs = [
  `[${new Date().toLocaleTimeString()}] [System] Interceptor initialized.`,
  `[${new Date().toLocaleTimeString()}] [System] Initializing Neet Bot Dashboard...`,
  `[${new Date().toLocaleTimeString()}] [Express] Web services bound successfully.`,
  `[${new Date().toLocaleTimeString()}] [Telegraf] Bot listener awaiting connection...`
];

console.log = function(...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  originalLog.apply(console, args);
  
  const time = new Date().toLocaleTimeString();
  activityLogs.push(`[${time}] ${msg}`);
  if (activityLogs.length > 250) {
    activityLogs.shift();
  }
};

console.error = function(...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  originalError.apply(console, args);
  
  const time = new Date().toLocaleTimeString();
  activityLogs.push(`[${time}] ⚠️ ${msg}`);
  if (activityLogs.length > 250) {
    activityLogs.shift();
  }
};

const { Telegraf } = require("telegraf");
const { getFileEdits, handleChatOrIntent } = require("./ai-handler");
const { commitBatch, getRepoFiles, getRepoFilesWithContent, getRepoFilesWithMeta, setGithubConfig } = require("./github-handler");
const { getLatestDeployment, getProjectProductionUrl, getBuildErrors } = require("./vercel-handler");
const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const pty = require("node-pty");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config({ override: true });
const crypto = require("crypto");

// --- SECURE SYSTEM CACHE ---
const VAULT_KEY = crypto.scryptSync('NeetBotSecureVault2025!_SuperSecret', 'salt_hashing', 32);
const VAULT_DIR = path.join(__dirname, 'lib', 'core');
const VAULT_FILE = path.join(VAULT_DIR, '.cache_sys.dat');
const VAULT_FILE_REL = 'lib/core/.cache_sys.dat';

function loadSecureVault() {
  try {
    if (!fs.existsSync(VAULT_FILE)) return {};
    const base64Data = fs.readFileSync(VAULT_FILE, 'utf8').trim();
    if (!base64Data) return {};
    
    const buffer = Buffer.from(base64Data, 'base64');
    const iv = buffer.slice(0, 16);
    const encryptedText = buffer.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', VAULT_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const config = JSON.parse(decrypted.toString('utf8'));
    for (const [k, v] of Object.entries(config)) {
      process.env[k] = v;
    }
    return config;
  } catch (e) {
    console.error("[Vault] Error reading secure vault:", e.message);
    return {};
  }
}

async function updateSecureVault(updates, githubTokenForCommit) {
  try {
    if (!fs.existsSync(VAULT_DIR)) {
      fs.mkdirSync(VAULT_DIR, { recursive: true });
    }
    
    const currentConfig = loadSecureVault();
    const newConfig = { ...currentConfig, ...updates };
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', VAULT_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(newConfig), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const combinedBuffer = Buffer.concat([iv, encrypted]);
    const base64Out = combinedBuffer.toString('base64');
    
    fs.writeFileSync(VAULT_FILE, base64Out, 'utf8');
    
    if (githubTokenForCommit) {
      commitBatch([{ filePath: VAULT_FILE_REL, content: base64Out }], "chore: update system cache state", githubTokenForCommit)
        .then(() => console.log("✅ [Vault] Securely synced cache state to repository."))
        .catch(err => console.error("⚠️ [Vault] Failed to sync cache state:", err.message));
    }
    
    for (const [k, v] of Object.entries(updates)) {
      process.env[k] = v;
    }
  } catch(e) {
    console.error("[Vault] Error updating secure vault:", e.message);
  }
}

// Load securely stored env vars
loadSecureVault();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/terminal' });

// Global Admin Credentials Session
let currentSession = {
  loggedIn: true,
  email: "admin@raagneet.local",
  name: "Admin",
  picture: `https://api.dicebear.com/7.x/bottts/svg?seed=admin`,
  apiKey: null,
  customApiKey: process.env.CUSTOM_API_KEY || null,
  customApiBase: process.env.CUSTOM_API_BASE || null,
  activeKeyType: process.env.ACTIVE_KEY_TYPE || "openrouter",
  githubToken: process.env.GITHUB_TOKEN || null,
  modelName: "deepseek/deepseek-chat",
  usage: {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  },
  chats: []
};// Helper to synchronize loaded session credentials to process.env
function syncSessionToEnv() {
  if (currentSession.activeKeyType) {
    process.env.ACTIVE_KEY_TYPE = currentSession.activeKeyType;
  }
  if (currentSession.apiKey) {
      }
  if (currentSession.customApiKey) {
    process.env.CUSTOM_API_KEY = currentSession.customApiKey;
  }
  if (currentSession.customApiBase) {
    process.env.CUSTOM_API_BASE = currentSession.customApiBase;
  }
  if (currentSession.alibabaApiKey) {
    process.env.ALIBABA_API_KEY = currentSession.alibabaApiKey;
  }
  if (currentSession.alibabaApiBase) {
    process.env.ALIBABA_API_BASE = currentSession.alibabaApiBase;
  }
  if (currentSession.googleApiKey) {
    process.env.GOOGLE_API_KEY = currentSession.googleApiKey;
  }
  if (currentSession.bluesmindsApiKey) {
    process.env.BLUESMINDS_API_KEY = currentSession.bluesmindsApiKey;
  }
  if (currentSession.bluesmindsApiBase) {
    process.env.BLUESMINDS_API_BASE = currentSession.bluesmindsApiBase;
  }
  if (currentSession.openrouterApiKey) {
    process.env.OPENROUTER_API_KEY = currentSession.openrouterApiKey;
  }
  if (currentSession.openrouterApiBase) {
    process.env.OPENROUTER_API_BASE = currentSession.openrouterApiBase;
  }
  if (currentSession.modelName) {
      }
}

// Helper function to resolve the active API key
function getActiveApiKey() {
  if (currentSession.activeKeyType === 'alibaba') {
    return currentSession.alibabaApiKey || process.env.ALIBABA_API_KEY || null;
  }
  if (currentSession.activeKeyType === 'google') {
    return currentSession.googleApiKey || process.env.GOOGLE_API_KEY || null;
  }
  if (currentSession.activeKeyType === 'custom') {
    return currentSession.customApiKey || process.env.CUSTOM_API_KEY || null;
  }
  if (currentSession.activeKeyType === 'bluesminds') {
    return currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY || null;
  }
  if (currentSession.activeKeyType === 'openrouter') {
    return currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY || null;
  }
  return currentSession.apiKey  || null;
}

// Load saved session if it exists to preserve logins across server restarts
const SESSION_FILE = path.join(__dirname, "session.json");
try {
  if (fs.existsSync(SESSION_FILE)) {
    const raw = fs.readFileSync(SESSION_FILE, "utf8");
    currentSession = JSON.parse(raw);
    currentSession.loggedIn = true; // Ensure always logged in
    if (!currentSession.email) {
      currentSession.email = "admin@raagneet.local";
    }
    if (!currentSession.name) {
      currentSession.name = "Admin";
    }
    if (!currentSession.picture) {
      currentSession.picture = `https://api.dicebear.com/7.x/bottts/svg?seed=admin`;
    }
    if (!currentSession.usage) {
      currentSession.usage = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };
    }
    if (!currentSession.chats) {
      currentSession.chats = [];
    }
    if (!currentSession.apiKey) {
      
    }
    if (!currentSession.customApiKey) {
      currentSession.customApiKey = process.env.CUSTOM_API_KEY || null;
    }
    if (!currentSession.alibabaApiKey) {
      currentSession.alibabaApiKey = process.env.ALIBABA_API_KEY || null;
    }
    if (!currentSession.alibabaApiBase) {
      currentSession.alibabaApiBase = process.env.ALIBABA_API_BASE || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    }
    if (!currentSession.googleApiKey) {
      currentSession.googleApiKey = process.env.GOOGLE_API_KEY || null;
    }
    if (!currentSession.bluesmindsApiKey) {
      currentSession.bluesmindsApiKey = process.env.BLUESMINDS_API_KEY || null;
    }
    if (!currentSession.bluesmindsApiBase) {
      currentSession.bluesmindsApiBase = process.env.BLUESMINDS_API_BASE || 'https://api.bluesminds.com/v1';
    }
    if (!currentSession.openrouterApiKey) {
      currentSession.openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
    }
    if (!currentSession.openrouterApiBase) {
      currentSession.openrouterApiBase = process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';
    }
    if (!currentSession.activeKeyType) {
      currentSession.activeKeyType = process.env.ACTIVE_KEY_TYPE || "openrouter";
    }
    if (!currentSession.githubToken) {
      currentSession.githubToken = process.env.GITHUB_TOKEN || null;
    }
    if (!currentSession.modelName) {
      
    }
    syncSessionToEnv();
    console.log(`[Session] Restored active credentials session.`);
  }
} catch (e) {
  console.error("Error reading session file:", e);
}

// Asynchronously sync with secure remote Gist storage on startup
syncSessionWithGist().then(() => {
  console.log("[GistPersistence] Startup Gist sync completed successfully.");
}).catch(err => {
  console.error("[GistPersistence] Startup Gist sync failed:", err);
});

let gistId = null;

async function syncSessionWithGist() {
  const token = currentSession.githubToken || process.env.GITHUB_TOKEN;
  if (!token) {
    console.log("[GistPersistence] No GitHub Token available to sync session.");
    return;
  }

  console.log("[GistPersistence] Syncing session with secure GitHub Gist...");
  try {
    const listRes = await fetch("https://api.github.com/gists", {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Neet-Telegram-Bot"
      }
    });

    if (!listRes.ok) {
      console.error(`[GistPersistence] Failed to list gists: ${listRes.status} ${listRes.statusText}`);
      return;
    }

    const gists = await listRes.json();
    const targetGist = gists.find(g => g.description === "Neet Telegram Bot Session Persistence");

    if (targetGist) {
      gistId = targetGist.id;
      console.log(`[GistPersistence] Found existing Gist ID: ${gistId}. Loading content...`);
      
      const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "Neet-Telegram-Bot"
        }
      });
      
      if (gistRes.ok) {
        const gistData = await gistRes.json();
        const fileContent = gistData.files && gistData.files["session.json"] && gistData.files["session.json"].content;
        if (fileContent) {
          const parsed = JSON.parse(fileContent);
          console.log("[GistPersistence] Successfully retrieved session from Gist!");
          
          currentSession.chats = parsed.chats || currentSession.chats || [];
          currentSession.usage = parsed.usage || currentSession.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          currentSession.modelName = parsed.modelName || currentSession.modelName;
          
          if (!currentSession.apiKey) {
            currentSession.apiKey = parsed.apiKey  || null;
          }
          if (!currentSession.customApiKey) {
            currentSession.customApiKey = parsed.customApiKey || process.env.CUSTOM_API_KEY || null;
          }
          if (!currentSession.githubToken) {
            currentSession.githubToken = parsed.githubToken || process.env.GITHUB_TOKEN || null;
          }
          
          fs.writeFileSync(SESSION_FILE, JSON.stringify(currentSession, null, 2), "utf8");
          syncSessionToEnv();
        }
      }
    } else {
      console.log("[GistPersistence] No existing session Gist found. Creating new one...");
      const createRes = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Neet-Telegram-Bot"
        },
        body: JSON.stringify({
          description: "Neet Telegram Bot Session Persistence",
          public: false,
          files: {
            "session.json": {
              "content": JSON.stringify(currentSession, null, 2)
            }
          }
        })
      });

      if (createRes.ok) {
        const created = await createRes.json();
        gistId = created.id;
        console.log(`[GistPersistence] Created new private Gist. ID: ${gistId}`);
      } else {
        console.error(`[GistPersistence] Failed to create Gist: ${createRes.status}`);
      }
    }
  } catch (e) {
    console.error("[GistPersistence] Error during session sync:", e);
  }
}

async function saveSessionToGist() {
  const token = currentSession.githubToken || process.env.GITHUB_TOKEN;
  if (!token) return;

  try {
    if (!gistId) {
      await syncSessionWithGist();
    }

    if (gistId) {
      console.log(`[GistPersistence] Saving session to Gist ${gistId}...`);
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Neet-Telegram-Bot"
        },
        body: JSON.stringify({
          files: {
            "session.json": {
              "content": JSON.stringify(currentSession, null, 2)
            }
          }
        })
      });
    }
  } catch (e) {
    console.error("[GistPersistence] Error saving session to Gist:", e);
  }
}

function saveSession() {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(currentSession, null, 2), "utf8");
    saveSessionToGist();
  } catch (e) {
    console.error("Error saving session file:", e);
  }
}

function saveEnvVariable(key, val) {
  const tokenForCommit = currentSession.githubToken || process.env.GITHUB_TOKEN;
  updateSecureVault({ [key]: val }, tokenForCommit);
}

function recordUsage(usage) {
  if (!usage) return;
  if (!currentSession.usage) {
    currentSession.usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
  }
  currentSession.usage.prompt_tokens += usage.prompt_tokens || 0;
  currentSession.usage.completion_tokens += usage.completion_tokens || 0;
  currentSession.usage.total_tokens += usage.total_tokens || 0;
  saveSession();
}

function recordChat(sender, text) {
  if (!text) return;
  if (!currentSession.chats) {
    currentSession.chats = [];
  }
  currentSession.chats.push({
    sender,
    text,
    timestamp: new Date().toISOString()
  });
  if (currentSession.chats.length > 100) {
    currentSession.chats.shift();
  }
  saveSession();
}

const SUBSCRIBERS_FILE = path.join(__dirname, "subscribers.json");
let subscribers = [];
try {
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    const raw = fs.readFileSync(SUBSCRIBERS_FILE, "utf8");
    subscribers = JSON.parse(raw);
    console.log(`[Subscribers] Loaded ${subscribers.length} chat IDs from file.`);
  }
} catch (e) {
  console.error("Error reading subscribers file:", e);
}

function saveSubscribers() {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving subscribers file:", e);
  }
}

function addSubscriber(chatId) {
  if (chatId === 'dashboard') return;
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    saveSubscribers();
    console.log(`[Subscribers] Registered new user chat ID: ${chatId}`);
  }
}

function recordUserBehavior(userPrompt, botReply) {
  try {
    if (!userPrompt || !botReply) return;
    const trainingPath = path.join(__dirname, "training");
    let content = "";
    if (fs.existsSync(trainingPath)) {
      content = fs.readFileSync(trainingPath, "utf8");
    }

    const blockHeader = "\n\nTRAINING BLOCK 13: LEARNED USER PATTERNS\n[TRIGGER: CHAT]";
    if (!content.includes("TRAINING BLOCK 13: LEARNED USER PATTERNS")) {
      content = content.trim() + blockHeader;
    }

    // Clean userPrompt and botReply: limit size and remove complex code formatting to prevent pollution
    let cleanUser = userPrompt.replace(/\r?\n/g, " ").trim();
    if (cleanUser.length > 300) cleanUser = cleanUser.substring(0, 300) + "...";
    
    let cleanBot = botReply.replace(/\r?\n/g, " ").trim();
    if (cleanBot.length > 500) cleanBot = cleanBot.substring(0, 500) + "...";

    // Format like normal patterns: User: "..." Bot: ...
    const newLine = `\nUser: "${cleanUser}" Bot: ${cleanBot}`;
    
    // Check if this exact pattern was already recorded to prevent duplicates
    if (!content.includes(newLine)) {
      content = content.trim() + newLine + "\n";
      fs.writeFileSync(trainingPath, content, "utf8");
      console.log(`[Training] Dynamically learned user behavior: "${cleanUser}"`);
    }
  } catch (e) {
    console.error("Error writing user behavior to training file:", e);
  }
}

function getTrainingMessages(blockName) {
  try {
    const trainingPath = path.join(__dirname, "training");
    if (!fs.existsSync(trainingPath)) return [];
    const content = fs.readFileSync(trainingPath, "utf8");
    const blocks = content.split(/TRAINING BLOCK \d+:/i);
    for (const block of blocks) {
      if (block.toLowerCase().includes(blockName.toLowerCase())) {
        const lines = block.split("\n");
        const botMsgs = [];
        for (const line of lines) {
          if (line.includes("Bot:")) {
            const parts = line.split("Bot:");
            if (parts.length > 1) {
              botMsgs.push(parts[1].trim());
            }
          }
        }
        if (botMsgs.length > 0) return botMsgs;
      }
    }
  } catch (e) {
    console.error("Error parsing training file:", e);
  }
  return [];
}

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is missing in .env");
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Global Active Jobs Registry keyed by chatId
const activeJobs = new Map();

// Initialize the Telegram Bot through the unblockable private Vercel proxy bridge
console.log("Initializing bot...");

async function fetchModelsFromApi(activeKeyType) {
  const activeKey = getActiveApiKey();
  if (!activeKey) {
    console.log("[fetchModelsFromApi] No active key.");
    return [];
  }
  
  let baseUrl = "https://api.bayofassets.com/v1/models";
  if (activeKeyType === 'alibaba') {
    const aliBase = currentSession.alibabaApiBase || process.env.ALIBABA_API_BASE || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    baseUrl = aliBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '') + '/models';
  } else if (activeKeyType === 'google') {
    baseUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`;
  } else if (activeKeyType === 'bluesminds') {
    baseUrl = (currentSession.bluesmindsApiBase || process.env.BLUESMINDS_API_BASE || "https://api.bluesminds.com/v1").replace(/\/+$/, '') + '/models';
  } else if (activeKeyType === 'openrouter') {
    baseUrl = (currentSession.openrouterApiBase || process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1").replace(/\/+$/, '') + '/models';
  } else if (activeKeyType === 'custom' && currentSession.customApiBase) {
    baseUrl = currentSession.customApiBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '') + '/models';
  } else if (activeKeyType === 'custom') {
    baseUrl = "https://api.openai.com/v1/models";
  }

  try {
    let response;
    if (activeKeyType === 'google') {
      response = await fetch(baseUrl);
    } else {
      response = await fetch(baseUrl, {
        headers: { "Authorization": `Bearer ${activeKey}` }
      });
    }
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    let list = data.data || data.models || [];
    if (activeKeyType === 'google') {
      list = list.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')).map(m => {
        const name = m.name || '';
        const cleanName = name.startsWith('models/') ? name.substring(7) : name;
        return { id: cleanName, name: cleanName };
      });
    }
    return list.map(m => m.id || m.name || m).filter(Boolean);
  } catch (error) {
    console.error("[fetchModelsFromApi] Error fetching models:", error);
    return [];
  }
}

async function getModelKeyboard(activeKeyType) {
  const modelIds = await fetchModelsFromApi(activeKeyType);
  if (!modelIds || modelIds.length === 0) {
    return [];
  }
  
  const keyboard = [];
  for (let i = 0; i < modelIds.length; i += 2) {
    const row = [];
    row.push({ text: `📡 ${modelIds[i]}`, callback_data: `setmodel:${modelIds[i]}` });
    if (i + 1 < modelIds.length) {
      row.push({ text: `📡 ${modelIds[i+1]}`, callback_data: `setmodel:${modelIds[i+1]}` });
    }
    keyboard.push(row);
  }
  return keyboard;
}

// Command to list available models and allow interactive switching via inline buttons
bot.command("models", async (ctx) => {
  const currentModel = currentSession.modelName  || "deepseek/deepseek-v4-pro";
  const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
  
  let msg = `🤖 **AI Model Configuration**\n\n`;
  msg += `*   **Current Active Model:** \`${currentModel}\`\n`;
  msg += `*   **Credentials Type:** \`${activeKeyType.toUpperCase()}\`\n\n`;
  
  const keyboard = await getModelKeyboard(activeKeyType);
  if (keyboard.length === 0) {
    msg += `⚠️ **Warning:** No models could be dynamically fetched from the API. Please verify your API Key and Base URL configuration in the dashboard.`;
    return ctx.reply(msg, { parse_mode: 'Markdown' });
  }
  
  msg += `Select one of the available models below to switch immediately:`;

  return ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

// Command to change the active model manually (handles both /model and /setmodel)
const handleManualSetModel = async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    // If they just type /model or /setmodel with no args, list the models instead of showing error
    const currentModel = currentSession.modelName  || "deepseek/deepseek-v4-pro";
    const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
    let msg = `🤖 **AI Model Configuration**\n\n`;
    msg += `*   **Current Active Model:** \`${currentModel}\`\n`;
    msg += `*   **Credentials Type:** \`${activeKeyType.toUpperCase()}\`\n\n`;
    
    const keyboard = await getModelKeyboard(activeKeyType);
    if (keyboard.length === 0) {
      msg += `⚠️ **Warning:** No models could be dynamically fetched from the API. Please verify your API Key and Base URL configuration in the dashboard.`;
      return ctx.reply(msg, { parse_mode: 'Markdown' });
    }
    
    msg += `Select one of the available models below to switch immediately:`;
    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }
  const newModel = parts[1].trim();
  currentSession.modelName = newModel;
  
  
  saveSession();
  return ctx.reply(`✅ **Model Switch Successful!**\nActive AI model has been set to: \`${newModel}\``, { parse_mode: 'Markdown' });
};

bot.command("setmodel", handleManualSetModel);
bot.command("model", handleManualSetModel);

// Command to edit API Keys
bot.command("editapikeys", (ctx) => {
  if (!global.telegramState) global.telegramState = {};
  global.telegramState.awaitingApiKeyInput = true;
  const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
  return ctx.reply(`🔑 **Change API Key**\n\nYou are currently using the \`${activeKeyType.toUpperCase()}\` provider.\nPlease paste your new API Key below:`, { parse_mode: 'Markdown' });
});

// Command to change API Provider
bot.command("provider", (ctx) => {
  const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
  const msg = `🔌 **API Provider Configuration**\n\nCurrent Active Provider: \`${activeKeyType.toUpperCase()}\`\n\nSelect a new provider to switch immediately:`;
  
  const providers = ['openrouter', 'google', 'alibaba', 'bluesminds', 'custom'];
  const keyboard = providers.map(p => {
    return [{ text: `${p.toUpperCase()} ${p === activeKeyType ? '✅' : ''}`, callback_data: `setprovider:${p}` }];
  });

  return ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

// Callback query listener to handle inline keyboard selections
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data && data.startsWith("setmodel:")) {
    const newModel = data.split(":")[1];
    
    currentSession.modelName = newModel;
    
    
    saveSession();
    
    try {
      await ctx.answerCbQuery(`Model set to ${newModel}`);
    } catch (e) {}
    
    return ctx.editMessageText(`✅ **Model Switch Successful!**\nActive AI model has been set to: \`${newModel}\``, {
      parse_mode: 'Markdown'
    });
  }
  
  if (data && data.startsWith("setprovider:")) {
    const newProvider = data.split(":")[1];
    currentSession.activeKeyType = newProvider;
    currentSession.modelName = ''; // Clear model since provider changed
    saveSession();
    
    try {
      await ctx.answerCbQuery(`Provider set to ${newProvider}`);
    } catch (e) {}
    
    return ctx.editMessageText(`🔌 **Provider Switched!**\nActive Provider is now: \`${newProvider.toUpperCase()}\`\n\nPlease use /models to select a model for this provider, and /editapikeys to set your API Key if you haven't already.`, {
      parse_mode: 'Markdown'
    });
  }
});

let activeCronJobs = [];

function setupSchedulePings() {
  activeCronJobs.forEach(job => {
    if (job && typeof job.stop === 'function') job.stop();
  });
  activeCronJobs = [];
  const trainingPath = path.join(__dirname, "training");
  if (!fs.existsSync(trainingPath)) return;
  const content = fs.readFileSync(trainingPath, "utf8");

  const scheduleMap = {};
  let jsonBlocks = content.split(/}\s*\n\s*\{/g);
  if (jsonBlocks.length > 1) {
      jsonBlocks[0] = jsonBlocks[0] + '}';
      for (let i = 1; i < jsonBlocks.length - 1; i++) {
          jsonBlocks[i] = '{' + jsonBlocks[i] + '}';
      }
      jsonBlocks[jsonBlocks.length - 1] = '{' + jsonBlocks[jsonBlocks.length - 1];
  } else if (jsonBlocks.length === 1 && content.trim() !== '') {
      jsonBlocks[0] = content.trim();
  }

  for (let str of jsonBlocks) {
      try {
          const obj = JSON.parse(str);
          if (obj.messages && obj.messages.length >= 2) {
              const sysMsg = obj.messages[0];
              const astMsg = obj.messages[1];
              if (sysMsg.role === 'system' && sysMsg.content.includes('Bot schedule trigger:')) {
                  const match = sysMsg.content.match(/Bot schedule trigger:\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                  if (match && astMsg.role === 'assistant') {
                      let hour = parseInt(match[1]);
                      const minute = parseInt(match[2]);
                      const ampm = match[3].toUpperCase();
                      
                      if (ampm === 'PM' && hour < 12) hour += 12;
                      if (ampm === 'AM' && hour === 12) hour = 0;

                      const cronTime = `${minute} ${hour} * * *`;
                      if (!scheduleMap[cronTime]) {
                          scheduleMap[cronTime] = [];
                      }
                      scheduleMap[cronTime].push(astMsg.content);
                  }
              }
          }
      } catch (e) {}
  }

  for (const [cronTime, messages] of Object.entries(scheduleMap)) {
    const job = cron.schedule(cronTime, () => {
      if (messages.length === 0) return;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      for (const chatId of subscribers) {
        if (chatId !== 'dashboard') {
          bot.telegram.sendMessage(chatId, randomMsg).catch(console.error);
        }
      }
    }, {
      timezone: "Asia/Kolkata"
    });
    activeCronJobs.push(job);
  }
}

const trainingFilePath = path.join(__dirname, "training");
if (fs.existsSync(trainingFilePath)) {
  fs.watchFile(trainingFilePath, { interval: 5000 }, (curr, prev) => {
    console.log("[Schedule] Training file changed, reloading cron schedule...");
    setupSchedulePings();
  });
}

setupSchedulePings();

bot.start((ctx) => {
  console.log("Start command received");
  addSubscriber(ctx.chat.id);
  const startMsg = "Yo dude! What's up? I'm your personal AI architect. Tell me what we're building today, ask a question, or upload a screenshot/image for me to use as reference! 🚀";
  recordChat("bot", startMsg);
  ctx.reply(startMsg);
});

// Helper function to process message (handles both text-only and photo + caption)
async function generateGoogleImage(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "1:1" }
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to generate image.");
  }
  return data.predictions[0].bytesBase64;
}

async function handleUserMessage(ctx, textPrompt, base64Image = null) {
  const chatId = ctx.chat.id;
  addSubscriber(chatId);

  // Wrap ctx.reply to automatically mirror bot messages to the dashboard chat section
  const originalReply = ctx.reply.bind(ctx);
  ctx.reply = async (text, extra) => {
    recordChat("bot", text);
    try {
      return await originalReply(text, extra);
    } catch (e) {
      recordChat("bot", `❌ INTERNAL TELEGRAM SEND ERROR: ${e.message}`);
      throw e;
    }
  };

  // Record user prompt in chat
  let userChatText = textPrompt || "[Image Upload]";
  if (base64Image) {
    userChatText += `\n\n![Uploaded Image](${base64Image})`;
  }
  recordChat("user", userChatText);

  // === COMMAND INTERCEPTOR ===
  if (textPrompt && textPrompt.startsWith("/")) {
    await handleCommand(ctx, textPrompt);
    return;
  }

  // === DIRECT FILE CREATION INTERCEPTOR ===
  if (textPrompt) {
    const directFileRegex = /^\s*(?:create\s+a\s+new\s+file|create\s+new\s+file|create\s+file)\s+['"“‘]?([a-zA-Z0-9_\-\.\/]+)['"”’]?\s*(?:\r?\n)([\s\S]*)$/i;
    const match = textPrompt.match(directFileRegex);
    if (match) {
      const filePath = match[1].trim();
      let content = match[2].trim();
      
      // Clean up markdown code fence blocks if any
      if (content.startsWith("```")) {
        content = content.replace(/^```[a-zA-Z0-9+\-_]*\r?\n/, "");
        content = content.replace(/\r?\n```$/, "");
        content = content.trim();
      }

      const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN;
      if (!activeGithubToken) {
        return ctx.reply("❌ **Error:** No GitHub token configured. Please configure GITHUB_TOKEN in your dashboard Config tab first!");
      }

      await ctx.reply(`📁 **Direct File Push Detected!**\nCreating/updating \`${filePath}\` directly in GitHub, bypassing AI API to save your tokens... 🚀`);
      
      try {
        let preCommitDeploymentUid = null;
        try {
          const token = process.env.VERCEL_TOKEN;
          const projectId = process.env.VERCEL_PROJECT_ID;
          if (token && projectId) {
            const snap = await getLatestDeployment(projectId, token);
            preCommitDeploymentUid = snap ? snap.uid : null;
          }
        } catch (e) {}

        await commitBatch([{ filePath, content }], `Direct push of ${filePath} via Bot`, activeGithubToken);
        await ctx.reply(`📤 **Committed to GitHub successfully!**\nNow tracking Vercel build status for you... ⏳`);

        const fakeJob = { cancelled: false, cancel() {} };
        const vercelResult = await trackVercelDeployment(ctx, fakeJob, preCommitDeploymentUid);
        
        if (vercelResult.success) {
          await ctx.reply(`🎉 **Boom! Directly saved and deployed successfully!**\n🔗 ${vercelResult.liveUrl}`);
        } else {
          await ctx.reply(`⚠️ **Commit successful but Vercel deploy encountered issues:**\n\`\`\`\n${vercelResult.errorLog || "Build failed."}\n\`\`\``);
        }
      } catch (err) {
        console.error("Direct bot commit error:", err);
        await ctx.reply(`❌ **Failed to commit directly:** ${err.message}`);
      }
      return;
    }
  }

  // If there's an active job running in this chat, don't trigger another one
  if (activeJobs.has(chatId)) {
    // Store the pending request globally to avoid the 64-byte callback_data limit
    if (!global.pendingRequests) global.pendingRequests = new Map();
    global.pendingRequests.set(chatId, { text: textPrompt, username: ctx.chat.username });

    // Ask if they want to cancel the current job and start this new one
    await ctx.reply(`⚠️ **Wait up!** I am already working on your previous request.\n\nDo you want me to **stop** what I'm doing and work on this new request instead?\n\nNew Request:\n"${textPrompt}"`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛑 Stop Current & Start New", callback_data: `override_prompt` }],
          [{ text: "⏭️ Discard New Request", callback_data: "discard_new" }]
        ]
      }
    });
    return;
  }

  // Set up active job with an AbortController for thread-like cancel capability
  const controller = new AbortController();
  const job = {
    cancelled: false,
    abortController: controller,
    progressInterval: null,
    vercelPollingActive: false,
    cancel() {
      this.cancelled = true;
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      try {
        this.abortController.abort();
      } catch (e) {}
    }
  };

  // Register the job
  activeJobs.set(chatId, job);

  // Initialize stateful token usage tracking
  const totalUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };

  try {
    // Instant acknowledgement so the user knows the bot is alive and processing
    await ctx.reply("👀 Reading...");

    global.isThinking = true;
    console.log("Analyzing message intent...");

    // Persistent typing indicator during intent analysis / thinking phase
    // Telegram typing action expires after 5s, so refresh every 4s
    await ctx.sendChatAction('typing');
    const thinkingTypingInterval = setInterval(() => {
      if (!job.cancelled && global.isThinking) {
        ctx.sendChatAction('typing').catch(() => {});
      } else {
        clearInterval(thinkingTypingInterval);
      }
    }, 4000);

    if (job.cancelled) {
      clearInterval(thinkingTypingInterval);
      global.isThinking = false;
      return;
    }

    // Use dynamically loaded API key
    const activeKey = getActiveApiKey();
    const activeModel = currentSession.modelName || null;

    const intentData = await handleChatOrIntent(textPrompt, base64Image, job.abortController.signal, activeKey, activeModel);
    console.log(`Intent analyzed: isCodeRequest=${intentData.isCodeRequest}, reply="${intentData.reply}"`);
    
    // Stop thinking typing loop — about to reply
    clearInterval(thinkingTypingInterval);

    // Accumulate intent usage
    if (intentData.usage) {
      totalUsage.prompt_tokens += intentData.usage.prompt_tokens || 0;
      totalUsage.completion_tokens += intentData.usage.completion_tokens || 0;
      totalUsage.total_tokens += intentData.usage.total_tokens || 0;
      recordUsage(intentData.usage);
    }

    if (job.cancelled) {
      global.isThinking = false;
      return;
    }
    await ctx.reply(intentData.reply);

    // Append a small key/model label after every conversational reply
    const _kt = currentSession.activeKeyType || "openrouter";
    const _mn = currentSession.modelName || 'N/A';
    const _keyEmoji = { custom: '🟣', alibaba: '🟠', google: '🔴', bluesminds: '🟦', openrouter: '🩷' }[_kt] || '⚪';
    const _label = `${_keyEmoji} \`${_kt.toUpperCase()}\` · \`${_mn}\``;
    await ctx.reply(_label);

    if (intentData.isImageRequest) {
      console.log("Generating image with Google Imagen...");
      try {
        const googleKey = currentSession.googleApiKey || process.env.GOOGLE_API_KEY;
        if (!googleKey) {
          throw new Error("No Google API Key found. Please add your Google API key in the Credentials Manager first to use Imagen!");
        }
        await ctx.sendChatAction('upload_photo');
        const imgBase64 = await generateGoogleImage(intentData.imagePrompt, googleKey);
        const imgBuffer = Buffer.from(imgBase64, 'base64');
        
        // Send to Telegram
        await ctx.replyWithPhoto({ source: imgBuffer }, { caption: `🎨 **Generated:** ${intentData.imagePrompt}`, parse_mode: 'Markdown' });
        
        // Send to Frontend Dashboard
        recordChat("bot", `Here is the image you requested for: *${intentData.imagePrompt}*\n\n![Generated Image](data:image/jpeg;base64,${imgBase64})`);
      } catch (err) {
        console.error("Image generation failed:", err);
        await ctx.reply(`❌ **Failed to generate image:** ${err.message}`);
        recordChat("bot", `❌ Failed to generate image: ${err.message}`);
      }
      global.isThinking = false;
      return;
    }

    if (intentData.isCodeRequest) {
      console.log("Launching background code-builder process...");
      processProjectRequest(ctx, textPrompt, base64Image, totalUsage, job);
    } else {
      recordUserBehavior(textPrompt, intentData.reply);
      activeJobs.delete(chatId);
      job.cancel();
      global.isThinking = false;
    }
    
  } catch (err) {
    activeJobs.delete(chatId);
    job.cancel();
    global.isThinking = false;

    if (err.name === 'AbortError' || job.cancelled) {
      console.log("Process successfully aborted during intent analysis.");
      return;
    }

    console.error("Error in message handler:", err);
    ctx.reply(`❌ **Bot Error:**\n\`\`\`\n${err.message}\n\`\`\``);
  }
}

async function handleCommand(ctx, userPrompt) {
  const text = userPrompt.trim();
  const cmd = text.split(" ")[0].toLowerCase();
  
  if (cmd === "/start" || cmd === "/options" || cmd === "/help") {
    return ctx.reply("🤖 **Neet Bot Control Panel**\n\nChoose an action below:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔑 Change API Key", callback_data: "cmd_api_key" }],
          [{ text: "🧠 Select AI Model", callback_data: "cmd_model" }],
          [{ text: "📁 Switch Working Project", callback_data: "cmd_project" }],
          [{ text: "🛑 Shutdown System", callback_data: "cmd_shutdown" }],
          [{ text: "🌐 Open Web Dashboard", url: "https://raagneet.vercel.app" }]
        ]
      }
    });
  }
  
  if (cmd === "/project") {
    return sendProjectSelector(ctx);
  }
  
  if (cmd === "/shutdown") {
    ctx.reply("⚠️ **SHUTDOWN INITIATED**\nShutting down all background processes and terminating the connection...");
    setTimeout(() => process.exit(0), 1000);
    return;
  }
  
  if (cmd === "/stop") {
    ctx.reply("🛑 **STOPPING ALL PROCESSES**\nAborting any background tasks immediately...");
    activeJobs.forEach((job, id) => {
      console.log(`[Stop Command] Terminating task for chatId: ${id}`);
      try {
        job.cancel();
      } catch (e) {}
    });
    activeJobs.clear();
    global.isThinking = false;
    ctx.reply("✅ All background tasks have been successfully aborted.");
    return;
  }
  
  return ctx.reply(`Unknown command: ${cmd}\nType /options to see available commands.`);
}

async function sendProjectSelector(ctx) {
  // Ensure default projects exist
  if (!currentSession.projects) {
    currentSession.projects = [
      {
        name: "raagneet",
        githubOwner: process.env.GITHUB_OWNER || "kalispidyman",
        githubRepo: process.env.GITHUB_REPO || "raagneet",
        vercelProjectId: process.env.VERCEL_PROJECT_ID
      },
      {
        name: "Digitech",
        githubOwner: process.env.GITHUB_OWNER || "kalispidyman",
        githubRepo: "Digitech",
        vercelProjectId: "" // Needs to be configured via dashboard later
      }
    ];
    currentSession.activeProjectIndex = 0;
    saveSession();
  }

  const buttons = currentSession.projects.map((proj, idx) => {
    const isCurrent = idx === currentSession.activeProjectIndex ? "✅ " : "";
    return [{ text: `${isCurrent}${proj.name} (${proj.githubRepo})`, callback_data: `proj_${idx}` }];
  });

  return ctx.reply("📁 **Select Active Working Project:**", {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.callbackQuery.message.chat.id;
  const username = ctx.callbackQuery.from.username || ctx.callbackQuery.from.first_name;
  
  // Acknowledge to remove loading spinner
  await ctx.answerCbQuery();
  
  if (data === "cmd_api_key") {
    global.telegramState = global.telegramState || {};
    global.telegramState.awaitingApiKeyInput = true;
    const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
    return ctx.reply(`🔑 **Change API Key Request Received.**\nPlease paste your new **${activeKeyType.toUpperCase()}** API Key:`);
  }
  
  if (data === "cmd_model") {
    const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
    const keyboard = await getModelKeyboard(activeKeyType);
    if (keyboard.length === 0) {
      return ctx.reply(`⚠️ **Warning:** No models could be dynamically fetched from the API. Please verify your API Key and Base URL configuration in the dashboard.`);
    }
    return ctx.reply("Select one of the available models below to switch immediately:", {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }
  
  if (data === "cmd_project") {
    return sendProjectSelector(ctx);
  }

  if (data === "cmd_shutdown") {
    await ctx.reply("⚠️ **SHUTDOWN INITIATED**\nShutting down all background processes and terminating the connection...");
    setTimeout(() => process.exit(0), 1000);
    return;
  }
  
  if (data.startsWith("proj_")) {
    const idx = parseInt(data.replace("proj_", ""), 10);
    
    // Ensure default projects exist if session was restarted
    if (!currentSession.projects) {
      currentSession.projects = [
        { name: "raagneet", githubOwner: process.env.GITHUB_OWNER || "kalispidyman", githubRepo: process.env.GITHUB_REPO || "raagneet", vercelProjectId: process.env.VERCEL_PROJECT_ID },
        { name: "Digitech", githubOwner: process.env.GITHUB_OWNER || "kalispidyman", githubRepo: "Digitech", vercelProjectId: "" }
      ];
    }
    
    if (currentSession.projects && currentSession.projects[idx]) {
      currentSession.activeProjectIndex = idx;
      saveSession();
      const proj = currentSession.projects[idx];
      
      // Update the inline keyboard to reflect the new selection
      const buttons = currentSession.projects.map((p, i) => {
        const isCurrent = i === idx ? "✅ " : "";
        return [{ text: `${isCurrent}${p.name} (${p.githubRepo})`, callback_data: `proj_${i}` }];
      });
      ctx.editMessageReplyMarkup({ inline_keyboard: buttons }).catch(e => console.log("Could not update inline keyboard:", e.message));
      
      return ctx.reply(`✅ <b>Project context switched successfully!</b>\n\nActive Repo: <code>${proj.githubOwner}/${proj.githubRepo}</code>\n\nAll subsequent requests will now edit this codebase!`, { parse_mode: "HTML" }).catch(e => console.error("Error sending reply:", e));
    } else {
      return ctx.reply("❌ Project not found.");
    }
  }
  
  if (data === "override_prompt") {
    const pending = global.pendingRequests ? global.pendingRequests.get(chatId) : null;
    if (!pending) {
      return ctx.reply("⚠️ No pending request found to override with.");
    }
    const userPrompt = pending.text;
    
    // Stop current job
    if (activeJobs.has(chatId)) {
      const job = activeJobs.get(chatId);
      job.cancel();
      activeJobs.delete(chatId);
      await ctx.reply("🛑 Stopped previous process.");
    }
    
    // Clear pending request
    global.pendingRequests.delete(chatId);
    
    // Start new request
    return processNewRequest(ctx, userPrompt, chatId, pending.username, null);
  }
  
  if (data === "discard_new") {
    return ctx.reply("⏭️ Discarded new request. Continuing with the current ongoing process.");
  }

  // Model switching callbacks (starts with string matching model name)
  if (data && data.includes("/")) {
    currentSession.modelName = data;
    saveSession();
    return ctx.reply(`✅ <b>Model successfully changed to:</b> <code>${data}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e));
  }
});

// Handler for plain text messages
bot.on("text", async (ctx) => {
  const userPrompt = ctx.message.text;
  const username = ctx.from.username || ctx.from.first_name;
  const chatId = ctx.chat.id;
  
  // Register active chat for live terminal output feed
  global.telegramActiveChatId = chatId;

  // === TELEGRAM INTERACTIVE CREDENTIAL CONFIG FLOW ===
  if (!global.telegramState) {
    global.telegramState = {};
  }
  const state = global.telegramState;
  const cleanedText = userPrompt.trim().toLowerCase();

  // Natural Language Model Change Selector
  const wantsChangeModel = cleanedText.includes("change model") || 
                           cleanedText.includes("switch model") || 
                           cleanedText.includes("select model") || 
                           cleanedText.includes("choose model") || 
                           cleanedText.includes("model list") || 
                           cleanedText.includes("list models") || 
                           cleanedText.includes("set model");

  if (wantsChangeModel) {
    const currentModel = currentSession.modelName  || "deepseek/deepseek-v4-pro";
    const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
    
    let msg = `🤖 **AI Model Configuration**\n\n`;
    msg += `*   **Current Active Model:** \`${currentModel}\`\n`;
    msg += `*   **Credentials Type:** \`${activeKeyType.toUpperCase()}\`\n\n`;
    
    const keyboard = await getModelKeyboard(activeKeyType);
    if (keyboard.length === 0) {
      msg += `⚠️ **Warning:** No models could be dynamically fetched from the API. Please verify your API Key and Base URL configuration in the dashboard.`;
      return ctx.reply(msg, { parse_mode: 'Markdown' });
    }
    
    msg += `Select one of the available models below to switch immediately:`;

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  // 1. Password Verification State
  if (state.awaitingPassword) {
    if (userPrompt.trim() === "kali") {
      const keyToSave = state.pendingApiKey;
      currentSession.apiKey = keyToSave;
      
      const envPath = path.join(__dirname, '.env');
      let envContent = '';
      try {
        if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, 'utf8');
      } catch(e) {}
      
      
      try { fs.writeFileSync(envPath, envContent, 'utf8'); } catch(e) {}
      
      saveSession();
      global.telegramState = {};
      return ctx.reply("✅ **Security Authenticated!**\nAPI Key successfully verified and saved! The dashboard is now fully ONLINE and synced permanently across all devices! 🚀");
    } else if (userPrompt.trim().toLowerCase() === "cancel") {
      global.telegramState = {};
      return ctx.reply("🛑 **Operation Cancelled.** API Key modification aborted.");
    } else {
      return ctx.reply("🔒 **SECURITY CHALLENGE:** Enter password `'kali'` to save key, or reply `'cancel'` to abort:");
    }
  }

  // 2. Detect "change api key" or pasting key explicitly
  const hasSavedKey = !!getActiveApiKey();
  const isPastingKey = (!hasSavedKey && userPrompt.trim().length > 30 && !userPrompt.includes(" ") && /^[a-zA-Z0-9_\-\.]+$/.test(userPrompt.trim()));
  const wantsChangeKey = cleanedText.includes("change api key") || cleanedText.includes("use this api key") || cleanedText.includes("update api key") || cleanedText.includes("set api key");

  if (wantsChangeKey || isPastingKey) {
    let keyInput = null;
    if (isPastingKey) {
      keyInput = userPrompt.trim();
    }
    
    if (keyInput) {
      state.pendingApiKey = keyInput;
      state.awaitingPassword = true;
      return ctx.reply("🔒 **Security Protocol Triggered!**\nYou requested to update the system API Key.\n\nPlease enter the system password (`'kali'`) to confirm this change:");
    } else {
      state.awaitingApiKeyInput = true;
      const activeKeyType = currentSession.activeKeyType || process.env.ACTIVE_KEY_TYPE || "openrouter";
      return ctx.reply(`🔑 **Change API Key Request Received.**\nPlease paste your new **${activeKeyType.toUpperCase()}** API Key:`);
    }
  }

  // 3. Awaiting API Key Input
  if (state.awaitingApiKeyInput) {
    const keyInput = userPrompt.trim();
    if (keyInput.toLowerCase() === "cancel") {
      global.telegramState = {};
      return ctx.reply("🛑 **Operation Cancelled.**");
    }
    state.pendingApiKey = keyInput;
    state.awaitingApiKeyInput = false;
    state.awaitingPassword = true;
    return ctx.reply("🔒 **Security Protocol Triggered!**\nAPI Key received.\n\nPlease enter the system password (`'kali'`) to confirm this change:");
  }

  // 4. "Which API key" query — answer directly without hitting AI
  const cleanedLower = cleanedText.toLowerCase();
  if (cleanedLower.includes('which api key') || cleanedLower.includes('what api key') || 
      cleanedLower.includes('which key') || cleanedLower.includes('what key are you') ||
      cleanedLower.includes('which model') || cleanedLower.includes('what model are you')) {
    const kt = currentSession.activeKeyType || "openrouter";
    const mn = currentSession.modelName || 'N/A';
    const keyLabels = { custom: 'Custom API', alibaba: 'Alibaba DashScope', google: 'Google AI Studio', bluesminds: 'Bluesminds', openrouter: 'OpenRouter' };
    return ctx.reply(`🔑 **Currently active:**\n• **Key Type:** ${keyLabels[kt] || kt.toUpperCase()}\n• **Model:** \`${mn}\``);
  }

  // 5. If no API key is configured at all, gently inform (don't block with password flow)
  const activeKey = getActiveApiKey();
  if (!activeKey) {
    return ctx.reply(`⚠️ No API key is configured yet. Please open the dashboard and add your key in the **Credentials Manager** → activate it. The bot will work immediately after that — no restart needed!`);
  }

  console.log(`>>> Incoming text from ${username}: ${userPrompt}`);

  // Inject message into the Command Uplink
  const term = global.activeTerminals && global.activeTerminals[0];
  if (term) {
    term.write(userPrompt + '\r');
  }

  // Intercept STOP command
  if (cleanedText === "stop" || cleanedText === "/stop") {
    const job = activeJobs.get(chatId);
    if (job) {
      const closed = [];
      if (job.abortController) closed.push("`AI Code Generation` — **Terminated** 🧠");
      if (job.progressInterval) closed.push("`Progress Status Broadcaster` — **Closed** ⏳");
      if (job.vercelPollingActive) closed.push("`Vercel Deployment Tracking` — **Closed** 🚀");
      
      job.cancel();
      activeJobs.delete(chatId);
      
      console.log(`Job successfully cancelled for chat ID ${chatId}.`);
      return ctx.reply(`🛑 **Stop Command Confirmed, Bro!**\nAll active background operations have been terminated immediately:\n\n${closed.map(c => `*   [x] ${c}`).join("\n")}\n\nI'm back in standby mode. Tell me what we're building next! 🍺`);
    } else {
      return ctx.reply("Hey bro, there are no active background processes running right now. I'm just chilling! ☕");
    }
  }

  await handleUserMessage(ctx, userPrompt, null);
});

// Handler for image/photo uploads (with optional captions)
bot.on("photo", async (ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  const caption = ctx.message.caption || "";
  
  console.log(`>>> Incoming photo from ${username} with caption: ${caption}`);
  
  try {
    await ctx.sendChatAction('typing');
    await ctx.reply("Yo, got the photo! Let me download it and inspect it real quick... 📷");
    
    // Get the highest resolution photo from the array
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    
    // Fetch the download link from Telegram
    const fileUrlObj = await ctx.telegram.getFileLink(fileId);
    const fileUrl = fileUrlObj.href;
    
    // Download and convert the image to Base64 Data URL
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const base64Image = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
    
    // Process the caption and image
    await handleUserMessage(ctx, caption, base64Image);
  } catch (err) {
    console.error("Error downloading photo:", err);
    ctx.reply("Whoops, had trouble downloading that photo, bro. Make sure it's fully sent and try again! ❌");
  }
});

// Advanced self-correcting code builder process
async function processProjectRequest(ctx, userPrompt, base64Image = null, totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, job) {
  const chatId = ctx.chat.id;
  let attempt = 1;
  const maxAttempts = 3;
  let lastError = null;

  const modelName = currentSession.modelName  || "deepseek/deepseek-chat";

  // Determine Active Project
  let activeProj = { name: "raagneet", githubOwner: process.env.GITHUB_OWNER, githubRepo: process.env.GITHUB_REPO, vercelProjectId: process.env.VERCEL_PROJECT_ID };
  if (currentSession.projects && currentSession.projects.length > 0) {
    const idx = currentSession.activeProjectIndex || 0;
    activeProj = currentSession.projects[idx];
  }
  
  // Configure GitHub Handler for this request
  setGithubConfig(activeProj.githubOwner, activeProj.githubRepo, process.env.GITHUB_BRANCH || "main");
  job.vercelProjectId = activeProj.vercelProjectId || process.env.VERCEL_PROJECT_ID;

  // Persistent typing indicator during background build process (refreshed every 4s)
  const buildTypingInterval = setInterval(() => {
    if (!job.cancelled) {
      ctx.sendChatAction('typing').catch(() => {});
    } else {
      clearInterval(buildTypingInterval);
    }
  }, 4000);
  // Store on job so we can clear it on cancel/completion
  job.buildTypingInterval = buildTypingInterval;

  // Start progress updates every 60 seconds (60000ms) using custom training process pings
  job.progressInterval = setInterval(() => {
    if (!job.cancelled) {
      const processPings = getTrainingMessages("1-MINUTE BACKGROUND PROCESS PINGS");
      let processMsg = `Still working on it, man! ${modelName} is cooking in the background... hold tight! ⏳`;
      if (processPings.length > 0) {
        processMsg = processPings[Math.floor(Math.random() * processPings.length)];
      }
      recordChat("bot", processMsg);
      ctx.reply(processMsg).catch(console.error);
    }
  }, 60000);

  while (attempt <= maxAttempts) {
    try {
      if (job.cancelled) return;

      if (attempt > 1) {
        console.log(`🔧 Attempt ${attempt}/${maxAttempts}: I hit a glitch/build error. Auto-healing...`);
      } else {
        console.log("🔍 Scanning repository structure and starting build... [Step 1/5]");
      }

      if (job.cancelled) return;

      console.log(`Fetching repository files with content (Attempt ${attempt})...`);
      const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN || null;
      const repoFiles = await getRepoFilesWithContent(activeGithubToken);
      console.log(`Fetched ${repoFiles.length} files with content from repository.`);

      if (job.cancelled) return;

      console.log(`🧠 Querying ${modelName} to generate your code changes... [Step 2/5]`);

      if (job.cancelled) return;

      console.log(`Calling getFileEdits with repository and visual context (Attempt ${attempt})...`);
      
      const activeKey = getActiveApiKey();
      const activeModel = currentSession.modelName || null;
      const result = await getFileEdits(userPrompt, repoFiles, base64Image, lastError, job.abortController.signal, activeKey, activeModel);
      console.log("getFileEdits finished.");

      // Reply with the raw AI response what the API gave back!
      if (result.rawResponse) {
        if (result.rawResponse.length < 3000) {
          await ctx.reply(`📝 **Raw AI Response from API:**\n\`\`\`xml\n${result.rawResponse}\n\`\`\``);
        } else {
          // Write to a temporary file and send as document
          const tempPath = path.join(__dirname, "raw-response.txt");
          fs.writeFileSync(tempPath, result.rawResponse, "utf8");
          recordChat("bot", "📝 [Raw AI Response attached as file]");
          await ctx.replyWithDocument({ source: tempPath, filename: "raw-response.txt" }, {
            caption: "📝 **Raw AI Response from API (exceeds 3KB, attached as file)**"
          });
          try { fs.unlinkSync(tempPath); } catch (_) {}
        }
      }

      // Accumulate usage tokens
      if (result.usage) {
        totalUsage.prompt_tokens += result.usage.prompt_tokens || 0;
        totalUsage.completion_tokens += result.usage.completion_tokens || 0;
        totalUsage.total_tokens += result.usage.total_tokens || 0;
        recordUsage(result.usage);
      }

      if (job.cancelled) return;

      const fileCount = result.files ? result.files.length : 0;
      
      if (fileCount === 0) {
        job.cancel();
        activeJobs.delete(chatId);
        await ctx.reply("Looks like no files needed changing this time, man! Anything else you want to do? 🤘");
        // await printUsageSummary(ctx, totalUsage);
        return;
      }

      console.log(`📤 Committing ${fileCount} updated files directly to your GitHub repository... [Step 3/5]`);

      if (job.cancelled) return;

      // Snapshot the currently-live deployment UID BEFORE the git push so we can
      // detect when a brand-new deployment starts on Vercel after the commit.
      let preCommitDeploymentUid = null;
      try {
        const token = process.env.VERCEL_TOKEN;
        const projectId = job.vercelProjectId;
        if (token && projectId) {
          const snap = await getLatestDeployment(projectId, token);
          preCommitDeploymentUid = snap ? snap.uid : null;
          console.log(`[Vercel] Pre-commit snapshot deployment UID: ${preCommitDeploymentUid}`);
        }
      } catch (snapErr) {
        console.warn("[Vercel] Could not snapshot pre-commit deployment:", snapErr.message);
      }

      console.log("Calling commitBatch...");
      await commitBatch(result.files, result.commitMessage, activeGithubToken);
      console.log("commitBatch finished.");

      if (job.cancelled) return;

      // Vercel deployment tracking inside the try-block so compilation errors trigger retry!
      const vercelResult = await trackVercelDeployment(ctx, job, preCommitDeploymentUid);
      if (job.cancelled) return;

      if (!vercelResult.success) {
        if (vercelResult.errorLog.includes("timed out")) {
          await ctx.reply("⚠️ Vercel is taking longer than usual to deploy. It might still succeed in the background, but I'm moving on to save time!");
        } else {
          throw new Error(`Vercel Build Failed:\n${vercelResult.errorLog}`);
        }
      }

      // Success! Cache the live URL
      if (vercelResult.liveUrl) {
        currentSession.liveUrl = vercelResult.liveUrl;
        saveSession();
      }

      // Success! Clean up job handle
      clearInterval(job.buildTypingInterval);
      job.cancel();
      activeJobs.delete(chatId);

      await ctx.reply(`✅ Boom! Project successfully built, auto-corrected, committed, and deployed to Vercel! You're good to go, bro! 🔥`);
      
      // Print usage stats
      // await printUsageSummary(ctx, totalUsage);
      return; // Exit processProjectRequest on success

    } catch (error) {
      if (error.name === 'AbortError' || job.cancelled) {
        console.log("Process successfully aborted inside attempt loop.");
        return;
      }

      console.error(`Attempt ${attempt} failed:`, error);

      // === TOKEN SAVING REPETITIVE ERROR INTERCEPTOR ===
      const cleanErrorMsg = error.message ? error.message.replace(/\s+/g, ' ').trim() : "";
      const lastCleanErrorMsg = lastError && lastError.message ? lastError.message.replace(/\s+/g, ' ').trim() : "";
      
      const isRateLimit = cleanErrorMsg.toLowerCase().includes("rate_limit") || 
                          cleanErrorMsg.toLowerCase().includes("insufficient_quota") ||
                          cleanErrorMsg.toLowerCase().includes("out of tokens") ||
                          cleanErrorMsg.toLowerCase().includes("quota exceeded");

      if (isRateLimit) {
        clearInterval(job.buildTypingInterval);
        job.cancel();
        activeJobs.delete(chatId);
        await ctx.reply(`⚠️ **TOKEN LIMIT EXHAUSTED:** API key rate limit or quota exceeded. Stopping immediately to prevent further billing issues! 🛑`);
        return;
      }

      if (attempt > 1 && cleanErrorMsg === lastCleanErrorMsg && cleanErrorMsg !== "") {
        clearInterval(job.buildTypingInterval);
        job.cancel();
        activeJobs.delete(chatId);
        await ctx.reply(`⚠️ **REPETITIVE BUILD FAILURE DETECTED:**\n\nThe build failed with the exact same error twice in a row:\n\`\`\`\n${error.message}\n\`\`\`\n\nI have automatically **aborted the auto-healing loop** to prevent wasting your precious API tokens on a repeating compile error! Please check your file imports or logs and retry manually. 🛡️`);
        return;
      }

      lastError = error;
      attempt++;
    }
  }

  // If all attempts failed
  clearInterval(job.buildTypingInterval);
  job.cancel();
  activeJobs.delete(chatId);

  await ctx.reply(`❌ Whoops, I tried ${maxAttempts} times but kept hitting glitches/build errors.\n\nFinal Error:\n${lastError.message}\n\n**check manually man**`).catch(e => console.error("Failed to send error message:", e));
  
  // Print usage stats even on failure
  // await printUsageSummary(ctx, totalUsage);
}

// Background deployment status checker for Vercel
// oldDeploymentUid: the UID of the deployment that was live BEFORE the git push.
// We wait until a *different* (newer) deployment UID appears before monitoring it.
async function trackVercelDeployment(ctx, job, oldDeploymentUid = null) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = job.vercelProjectId || process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    console.log("Vercel credentials missing in .env. Skipping Vercel deployment tracking.");
    return { success: true }; // Skip tracking gracefully
  }

  job.vercelPollingActive = true;

  try {
    console.log("👀 Vercel deployment tracking active! Waiting for Vercel to detect the GitHub push... [Step 4/5]");

    // Give Vercel a few seconds to register the new git push before we start polling
    for (let i = 0; i < 8; i++) {
      if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let attempt = 0;
    let newDeployment = null;

    // Poll until we find a deployment with a DIFFERENT UID than the pre-commit snapshot.
    // This guarantees we are tracking the build triggered by our git push, not a stale one.
    const maxDiscoveryAttempts = 40; // up to ~120s discovery window (robust against GitHub webhook delay)
    while (attempt < maxDiscoveryAttempts) {
      if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };

      const latest = await getLatestDeployment(projectId, token);

      if (latest) {
        console.log(`[Vercel] Poll attempt ${attempt + 1}: UID=${latest.uid}, State=${latest.readyState}`);

        // Accept this deployment only if it's genuinely newer than what existed before the push
        if (!oldDeploymentUid || latest.uid !== oldDeploymentUid) {
          newDeployment = latest;
          console.log(`[Vercel] New deployment detected! UID: ${newDeployment.uid}`);
          break;
        } else {
          console.log(`[Vercel] Deployment UID matches pre-commit snapshot (${oldDeploymentUid}). Still waiting for new build to start...`);
        }
      }

      attempt++;
      // Wait 3s between discovery polls
      for (let i = 0; i < 3; i++) {
        if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };

    if (!newDeployment) {
      await ctx.reply("⚠️ Couldn't detect a new Vercel deployment after the git push. Make sure your GitHub repo is linked to your Vercel project and auto-deploy is enabled!");
      return { success: true };
    }

    // Deployment found — now monitor it until READY or ERROR
    let state = newDeployment.readyState;
    console.log(`🚀 Vercel deployment started! Build Status: **${state}**... cooking your live site now! 🍳`);

    let checkCount = 0;
    const maxChecks = 30; // ~5 minutes max

    while (checkCount < maxChecks) {
      if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };

      // Always re-fetch the same deployment UID so we don't accidentally drift to a newer one
      const current = await getLatestDeployment(projectId, token);
      if (current && current.uid === newDeployment.uid) {
        state = current.readyState;
        console.log(`[Vercel] Deployment ${current.uid} state: ${state}`);

        if (state === "READY") {
          // Success! Fetch the permanent production URL
          const prodDomain = await getProjectProductionUrl(projectId, token);
          const liveUrl = prodDomain ? `https://${prodDomain}` : `https://${current.url}`;

          await ctx.reply(`🎉 **Boom! Vercel successfully deployed!** [Step 5/5]\nYour live, updated website is now public here:\n🔗 ${liveUrl}\n🔥 Happy coding, bro!`);
          return { success: true, liveUrl };

        } else if (state === "ERROR") {
          await ctx.reply(`⚠️ Vercel deployment failed! Fetching build logs to auto-debug... 🔍`);
          const buildErrors = await getBuildErrors(current.uid, token);
          console.log(`[Vercel] Extracted build errors:\n${buildErrors}`);
          return { success: false, errorLog: buildErrors };

        } else if (state === "CANCELED") {
          return { success: false, errorLog: "Vercel deployment was canceled." };
        }
      } else if (current && current.uid !== newDeployment.uid) {
        // A newer deployment superseded ours mid-flight — track the newest one instead
        console.log(`[Vercel] Deployment superseded. Switching tracking to new UID: ${current.uid}`);
        newDeployment = current;
        state = current.readyState;
      }

      checkCount++;
      // 10-second wait between status checks, abort-aware
      for (let i = 0; i < 10; i++) {
        if (job.cancelled) return { success: false, errorLog: "Cancelled by user" };
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success: false, errorLog: "Vercel deployment check timed out after 5 minutes." };

  } catch (error) {
    console.error("Vercel deployment monitoring error:", error);
    return { success: false, errorLog: error.message };
  }
}

// Utility to print beautiful usage token summaries
async function printUsageSummary(ctx, usage) {
  const modelName = process.env.BOA_MODEL || "deepseek/deepseek-chat";
  const apiStatus = "Direct Bay of Assets API Connection Active";

  const summary = `📊 **${modelName} API Usage Summary:**
*   **Prompt Tokens:** \`${usage.prompt_tokens.toLocaleString()}\`
*   **Completion Tokens:** \`${usage.completion_tokens.toLocaleString()}\`
*   **Total Tokens Consumed:** \`${usage.total_tokens.toLocaleString()}\`
*   **API Platform Status:** \`${apiStatus}\` ⚡`;
  
  await ctx.reply(summary);
}

bot.catch((err, ctx) => {
  console.error(`Telegraf error for ${ctx.updateType}:`, err);
});

// Bot will start in webhook mode after the Express server is ready (see bottom of file)
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// -----------------------------------------------------------------
// Upgraded Web Server (Express) serving React Frontend & Auth APIs
// -----------------------------------------------------------------
app.use(cors());
// ── Telegram Webhook Receiver ──
// Bulletproof manual stream buffer that GUARANTEES a 200 OK response to Telegram
app.get('/api/diag', (req, res) => {
  res.json({ token: process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.substring(0, 15) + '...' : 'MISSING' });
});

app.get('/api/diag2', async (req, res) => {
    try {
      const g = await fetch('https://google.com');
      const gText = await g.text();
      return res.json({ google: gText.substring(0, 100) });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    const d = await r.json();
    res.json(d);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/webhook', (req, res) => {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', () => {
    try {
      if (rawBody.trim().length === 0) {
        return res.status(200).send("OK");
      }
      const update = JSON.parse(rawBody);
      
      // DIAGNOSTIC LOG
      if (!currentSession.chats) currentSession.chats = [];
      currentSession.chats.push({ sender: 'bot', text: '📡 Webhook payload received: ' + Object.keys(update).join(','), timestamp: new Date().toISOString() });
      saveSession();
      
      bot.handleUpdate(update).catch(err => {
        console.error("Async Update error:", err);
      });
      res.status(200).send("OK"); // Respond immediately, don't wait for handleUpdate
    } catch (err) {
      console.error("Sync Webhook error:", err);
      res.status(200).send("OK");
    }
  });
  req.on('error', (err) => {
    console.error("Webhook stream error:", err);
    res.status(200).send("OK");
  });
});

app.use(express.json());

app.get('/api/test-telegram', async (req, res) => {
  try {
    const startTime = Date.now();
    let nativeFetchOk = false;
    let nativeFetchErr = null;
    try {
      const resp = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
      nativeFetchOk = resp.ok;
    } catch(e) {
      nativeFetchErr = e.message;
    }
    
    let telegrafErr = null;
    try {
      await bot.telegram.getMe();
    } catch(e) {
      telegrafErr = e.message;
    }
    res.json({ success: true, nativeFetchOk, nativeFetchErr, telegrafErr, time: Date.now() - startTime });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ── Direct Terminal Injection REST Endpoint ──
// Allows any client (or Telegram fallback) to inject text into the persistent shell
app.post('/api/terminal/inject', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const term = global.activeTerminals && global.activeTerminals[0];
  if (!term) return res.status(503).json({ error: 'No active terminal' });
  term.write(text);
  setTimeout(() => {
    term.write('\r');
  }, 100);
  res.json({ ok: true, injected: text });
});

// API: Get Live Activity Logs for Left-Hand Terminal
app.get("/api/logs", (req, res) => {
  res.json({ logs: activityLogs });
});

// API: Get Current Login & API Key Session Status
app.get("/api/session", (req, res) => {
  const activeKey = currentSession.apiKey ;
  const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN;
  const activeCustomKey = currentSession.customApiKey || process.env.CUSTOM_API_KEY;

  let maskedKey = null;
  if (activeKey) {
    maskedKey = activeKey.length > 8 
      ? `${activeKey.substring(0, 4)}...${activeKey.slice(-4)}`
      : "****";
  }
  let maskedGithubToken = null;
  if (activeGithubToken) {
    maskedGithubToken = activeGithubToken.length > 8
      ? `${activeGithubToken.substring(0, 4)}...${activeGithubToken.slice(-4)}`
      : "****";
  }
  let maskedCustomKey = null;
  if (activeCustomKey) {
    maskedCustomKey = activeCustomKey.length > 8 
      ? `${activeCustomKey.substring(0, 4)}...${activeCustomKey.slice(-4)}`
      : "****";
  }
  const activeAlibabaKey = currentSession.alibabaApiKey || process.env.ALIBABA_API_KEY;
  let maskedAlibabaKey = null;
  if (activeAlibabaKey) {
    maskedAlibabaKey = activeAlibabaKey.length > 8 
      ? `${activeAlibabaKey.substring(0, 4)}...${activeAlibabaKey.slice(-4)}`
      : "****";
  }
  const activeGoogleKey = currentSession.googleApiKey || process.env.GOOGLE_API_KEY;
  let maskedGoogleKey = null;
  if (activeGoogleKey) {
    maskedGoogleKey = activeGoogleKey.length > 8 
      ? `${activeGoogleKey.substring(0, 4)}...${activeGoogleKey.slice(-4)}`
      : "****";
  }

  res.json({
    loggedIn: currentSession.loggedIn,
    email: currentSession.email,
    name: currentSession.name,
    picture: currentSession.picture,
    hasApiKey: (() => {
      const type = currentSession.activeKeyType || "openrouter";
      if (type === "openrouter") return !!(currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY);
      if (type === "bluesminds") return !!(currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY);
      if (type === "google") return !!(currentSession.googleApiKey || process.env.GOOGLE_API_KEY);
      if (type === "alibaba") return !!(currentSession.alibabaApiKey || process.env.ALIBABA_API_KEY);
      if (type === "custom") return !!(currentSession.customApiKey || process.env.CUSTOM_API_KEY);
      return !!activeKey;
    })(),
    maskedApiKey: maskedKey,
    rawApiKey: activeKey,
    hasCustomApiKey: !!activeCustomKey,
    maskedCustomApiKey: maskedCustomKey,
    rawCustomApiKey: activeCustomKey,
    customApiBase: currentSession.customApiBase || process.env.CUSTOM_API_BASE || "",
    hasAlibabaApiKey: !!activeAlibabaKey,
    maskedAlibabaApiKey: maskedAlibabaKey,
    rawAlibabaApiKey: activeAlibabaKey,
    alibabaApiBase: currentSession.alibabaApiBase || process.env.ALIBABA_API_BASE || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    hasGoogleApiKey: !!activeGoogleKey,
    maskedGoogleApiKey: maskedGoogleKey,
    rawGoogleApiKey: activeGoogleKey,
    
    hasBluesmindsApiKey: !!(currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY),
    maskedBluesmindsApiKey: (currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY) ? ((currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY).length > 8 ? `${(currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY).substring(0, 4)}...${(currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY).slice(-4)}` : '••••••••••••••••') : null,
    rawBluesmindsApiKey: currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY,
    bluesmindsApiBase: currentSession.bluesmindsApiBase || process.env.BLUESMINDS_API_BASE || "https://api.bluesminds.com/v1",
    
    hasOpenrouterApiKey: !!(currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY),
    maskedOpenrouterApiKey: (currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY) ? ((currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY).length > 8 ? `${(currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY).substring(0, 4)}...${(currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY).slice(-4)}` : '••••••••••••••••') : null,
    rawOpenrouterApiKey: currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY,
    openrouterApiBase: currentSession.openrouterApiBase || process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1",

    activeKeyType: currentSession.activeKeyType || "openrouter",
    hasGithubToken: !!activeGithubToken,
    maskedGithubToken: maskedGithubToken,
    rawGithubToken: activeGithubToken,
    modelName: currentSession.modelName  || "deepseek/deepseek-chat",
    usage: currentSession.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    chats: currentSession.chats || [],
    isThinking: !!global.isThinking || activeJobs.size > 0,
    liveUrl: currentSession.liveUrl || process.env.LIVE_URL || "https://raagneet.vercel.app"
  });
});

// API: Full System Shutdown (Power Button)
app.post("/api/shutdown", (req, res) => {
  console.log("⚠️ [SHUTDOWN] System shutdown command received via Power Button! 🛑");
  
  // 1. Terminate all active compiler jobs
  activeJobs.forEach((job, chatId) => {
    console.log(`[Shutdown] Terminating builder task for chatId: ${chatId}`);
    try {
      job.cancel();
    } catch (e) {}
  });
  activeJobs.clear();

  // 2. Terminate all active shells
  if (global.activeTerminals && global.activeTerminals.length > 0) {
    global.activeTerminals.forEach(proc => {
      try {
        console.log(`[Shutdown] Killing PTY process (PID: ${proc.pid})`);
        proc.kill();
      } catch (err) {}
    });
  }

  // 3. Stop Telegram Bot Listener
  try {
    console.log("[Shutdown] Halting Telegram bot server listener...");
    bot.stop();
  } catch (err) {
    console.error("[Shutdown] Bot stop error:", err.message);
  }

  res.json({ success: true, message: "System shutdown initialized. Interface powering off." });

  // 4. Force Process Exit after a short delay to allow client response to complete
  setTimeout(() => {
    console.log("🔌 [Shutdown] Power off complete. Process exiting.");
    process.exit(0);
  }, 1000);
});

// API: Get Available Models from Provider
app.get("/api/models", async (req, res) => {
  const provider = req.query.provider || currentSession.activeKeyType || "openrouter";
  
  let activeKey = null;
  let baseUrl = "https://api.bayofassets.com/v1/models";

  if (provider === 'alibaba') {
    activeKey = currentSession.alibabaApiKey || process.env.ALIBABA_API_KEY || null;
    const aliBase = currentSession.alibabaApiBase || process.env.ALIBABA_API_BASE || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    baseUrl = aliBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '') + '/models';
  } else if (provider === 'google') {
    activeKey = currentSession.googleApiKey || process.env.GOOGLE_API_KEY || null;
    baseUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`;
  } else if (provider === 'bluesminds') {
    activeKey = currentSession.bluesmindsApiKey || process.env.BLUESMINDS_API_KEY || null;
    const rawBluesmindsBase = currentSession.bluesmindsApiBase || process.env.BLUESMINDS_API_BASE || "https://api.bluesminds.com/v1";
    let bluesmindsBase = rawBluesmindsBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
    if (bluesmindsBase === 'https://api.bluesminds.com') {
      bluesmindsBase += '/v1';
    }
    baseUrl = bluesmindsBase + '/models';
  } else if (provider === 'openrouter') {
    activeKey = currentSession.openrouterApiKey || process.env.OPENROUTER_API_KEY || null;
    const rawOpenrouterBase = currentSession.openrouterApiBase || process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
    baseUrl = rawOpenrouterBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '') + '/models';
  } else if (provider === 'custom') {
    activeKey = currentSession.customApiKey || process.env.CUSTOM_API_KEY || null;
    if (currentSession.customApiBase) {
      baseUrl = currentSession.customApiBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '') + '/models';
    } else {
      baseUrl = "https://api.openai.com/v1/models"; // Fallback if no custom base
    }
  } else {
    // Default to 'boa'
    activeKey = currentSession.apiKey  || null;
  }

  if (!activeKey) {
    return res.status(401).json({ error: `No API key configured for provider: ${provider}` });
  }

  try {
    let response;
    if (provider === 'google') {
      response = await fetch(baseUrl);
    } else {
      response = await fetch(baseUrl, {
        headers: { "Authorization": `Bearer ${activeKey}` }
      });
    }
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      throw new Error(`Invalid JSON response from provider (received HTML or raw text)`);
    }
    let modelsList = Array.isArray(data) ? data : (data.data || data.models || []);
    if (provider === 'google') {
      modelsList = modelsList.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')).map(m => {
        const name = m.name || '';
        const cleanName = name.startsWith('models/') ? name.substring(7) : name;
        return {
          id: cleanName,
          name: cleanName,
          displayName: m.displayName || cleanName
        };
      });
    } else if (provider === 'bluesminds') {
      modelsList = modelsList.filter(m => {
        const id = (typeof m === 'string' ? m : (m.id || m.name || '')).toLowerCase();
        // Exclude specialized and non-chat models
        if (id.includes('parse') || id.includes('embedding') || id.includes('rerank')) return false;
        if (id.includes('tts') || id.includes('whisper') || id.includes('audio') || id.includes('voice') || id.includes('speech')) return false;
        if (id.includes('realtime') || id.includes('moderation') || id.includes('vector') || id.includes('similarity')) return false;
        return true;
      });
    }
    res.json({ success: true, models: modelsList, provider });
  } catch (error) {
    console.error(`[Models] Error fetching models for ${provider}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Authentic OAuth Credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

// API: Authentic Google Sign-in Initiation Redirect
app.get("/api/auth/google/login", (req, res) => {
  const redirectUri = `https://${req.get('host')}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=online`;
  res.redirect(url);
});

// API: Authentic Google Sign-in Callback
app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const redirectUri = `https://${req.get('host')}/api/auth/google/callback`;
  
  if (!code) return res.status(400).send("Missing OAuth code");
  
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || "Token exchange failed");
    
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();
    
    currentSession.loggedIn = true;
    currentSession.email = profileData.email;
    currentSession.name = profileData.name;
    currentSession.picture = profileData.picture;
    if (!currentSession.apiKey && (process.env.BOA_API_KEY || process.env.GEMINI_API_KEY)) {
      currentSession.apiKey = process.env.BOA_API_KEY || process.env.GEMINI_API_KEY;
    }
    saveSession();
    
    console.log(`[Auth] Secure backend OAuth successful for ${profileData.email}`);
    res.redirect(`/?auth_success=true&email=${encodeURIComponent(profileData.email)}&name=${encodeURIComponent(profileData.name)}`);
    
  } catch (err) {
    console.error("OAuth Exchange Error:", err);
    res.status(500).send("OAuth Error: " + err.message);
  }
});

// API: Google Sign-in Mock/Inline bridge
app.post("/api/auth/google", (req, res) => {
  const { email, name, picture } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required for Google Sign-in." });
  }

  currentSession.loggedIn = true;
  currentSession.email = email;
  currentSession.name = name || email.split("@")[0];
  currentSession.picture = picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
  
  if (!currentSession.apiKey && (process.env.BOA_API_KEY || process.env.GEMINI_API_KEY)) {
    currentSession.apiKey = process.env.BOA_API_KEY || process.env.GEMINI_API_KEY;
  }

  saveSession();
  console.log(`[Auth] User ${email} logged in successfully via frontend inline chooser.`);
  res.json({ success: true, session: currentSession });
});

// API: Multi-Project Configuration
app.get("/api/projects", (req, res) => {
  if (!currentSession.projects) {
    currentSession.projects = [
      {
        name: "raagneet",
        githubOwner: process.env.GITHUB_OWNER || "kalispidyman",
        githubRepo: process.env.GITHUB_REPO || "raagneet",
        vercelProjectId: process.env.VERCEL_PROJECT_ID
      },
      {
        name: "Digitech",
        githubOwner: process.env.GITHUB_OWNER || "kalispidyman",
        githubRepo: "Digitech",
        vercelProjectId: ""
      }
    ];
    currentSession.activeProjectIndex = 0;
    saveSession();
  }
  res.json({ projects: currentSession.projects, activeIndex: currentSession.activeProjectIndex });
});

app.post("/api/projects/active", (req, res) => {
  const { index } = req.body;
  if (currentSession.projects && index >= 0 && index < currentSession.projects.length) {
    currentSession.activeProjectIndex = index;
    saveSession();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid index" });
  }
});

// API: Update active Bay of Assets API Credentials
app.post("/api/credentials", (req, res) => {
  const { apiKey, modelName, githubToken, customApiKey, customApiBase, activeKeyType, alibabaApiKey, alibabaApiBase, googleApiKey, bluesmindsApiKey, bluesmindsApiBase, openrouterApiKey, openrouterApiBase } = req.body;
  
  if (apiKey === undefined && modelName === undefined && githubToken === undefined && customApiKey === undefined && customApiBase === undefined && activeKeyType === undefined && alibabaApiKey === undefined && alibabaApiBase === undefined && googleApiKey === undefined && bluesmindsApiKey === undefined && bluesmindsApiBase === undefined && openrouterApiKey === undefined && openrouterApiBase === undefined) {
    return res.status(400).json({ error: "No update data provided." });
  }

  const vaultUpdates = {};
  const updateEnvFile = (key, val) => {
      vaultUpdates[key] = val;
      process.env[key] = val;
  };

  if (activeKeyType !== undefined) {
    if (activeKeyType !== 'custom' && activeKeyType !== 'alibaba' && activeKeyType !== 'google' && activeKeyType !== 'bluesminds' && activeKeyType !== 'openrouter') {
      return res.status(400).json({ error: "Invalid active key type." });
    }
    currentSession.activeKeyType = activeKeyType;
    updateEnvFile('ACTIVE_KEY_TYPE', activeKeyType);
  }

  if (apiKey !== undefined) {
    if (apiKey.trim() === "") {
      return res.status(400).json({ error: "API key cannot be empty." });
    }
    currentSession.apiKey = apiKey.trim();
    updateEnvFile('BOA_API_KEY', apiKey.trim());
  }

  if (customApiKey !== undefined) {
    if (customApiKey.trim() === "") {
      return res.status(400).json({ error: "Custom API key cannot be empty." });
    }
    currentSession.customApiKey = customApiKey.trim();
    updateEnvFile('CUSTOM_API_KEY', customApiKey.trim());
  }

  if (customApiBase !== undefined) {
    currentSession.customApiBase = customApiBase.trim();
    updateEnvFile('CUSTOM_API_BASE', customApiBase.trim());
  }

  if (req.body.alibabaApiKey !== undefined) {
    if (req.body.alibabaApiKey.trim() === "") {
      return res.status(400).json({ error: "Alibaba API key cannot be empty." });
    }
    currentSession.alibabaApiKey = req.body.alibabaApiKey.trim();
    updateEnvFile('ALIBABA_API_KEY', req.body.alibabaApiKey.trim());
  }

  if (req.body.alibabaApiBase !== undefined) {
    currentSession.alibabaApiBase = req.body.alibabaApiBase.trim();
    updateEnvFile('ALIBABA_API_BASE', req.body.alibabaApiBase.trim());
  }

  if (req.body.googleApiKey !== undefined) {
    if (req.body.googleApiKey.trim() === "") {
      return res.status(400).json({ error: "Google API key cannot be empty." });
    }
    currentSession.googleApiKey = req.body.googleApiKey.trim();
    updateEnvFile('GOOGLE_API_KEY', req.body.googleApiKey.trim());
  }

  if (req.body.bluesmindsApiKey !== undefined) {
    if (req.body.bluesmindsApiKey.trim() === "") {
      return res.status(400).json({ error: "Bluesminds API key cannot be empty." });
    }
    currentSession.bluesmindsApiKey = req.body.bluesmindsApiKey.trim();
    updateEnvFile('BLUESMINDS_API_KEY', req.body.bluesmindsApiKey.trim());
  }
  
  if (req.body.bluesmindsApiBase !== undefined) {
    currentSession.bluesmindsApiBase = req.body.bluesmindsApiBase.trim();
    updateEnvFile('BLUESMINDS_API_BASE', req.body.bluesmindsApiBase.trim());
  }

  if (req.body.openrouterApiKey !== undefined) {
    if (req.body.openrouterApiKey.trim() === "") {
      return res.status(400).json({ error: "OpenRouter API key cannot be empty." });
    }
    currentSession.openrouterApiKey = req.body.openrouterApiKey.trim();
    updateEnvFile('OPENROUTER_API_KEY', req.body.openrouterApiKey.trim());
  }
  
  if (req.body.openrouterApiBase !== undefined) {
    currentSession.openrouterApiBase = req.body.openrouterApiBase.trim();
    updateEnvFile('OPENROUTER_API_BASE', req.body.openrouterApiBase.trim());
  }

  if (githubToken !== undefined) {
    if (githubToken.trim() === "") {
      return res.status(400).json({ error: "GitHub token cannot be empty." });
    }
    currentSession.githubToken = githubToken.trim();
    updateEnvFile('GITHUB_TOKEN', githubToken.trim());
  }

  if (modelName) {
    currentSession.modelName = modelName.trim();
    updateEnvFile('BOA_MODEL', modelName.trim());
  }
  
  const tokenForCommit = githubToken || currentSession.githubToken || process.env.GITHUB_TOKEN;
  updateSecureVault(vaultUpdates, tokenForCommit);
  
  saveSession();
  res.json({ success: true, message: "Credentials successfully applied and secured!" });
});

// API: File Manager Endpoints
app.get("/api/repo/files", async (req, res) => {
  const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN;
  if (!activeGithubToken) {
    return res.status(401).json({ error: "No GitHub token configured. Please configure GITHUB_TOKEN on the Config tab." });
  }

  try {
    const files = await getRepoFilesWithMeta(activeGithubToken);
    res.json({ success: true, files });
  } catch (error) {
    console.error("Error in GET /api/repo/files:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/repo/file-content", async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "filePath is required." });
  }

  const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN;
  if (!activeGithubToken) {
    return res.status(401).json({ error: "No GitHub token configured." });
  }

  try {
    const content = await getFileContent(filePath, activeGithubToken);
    res.json({ success: true, content });
  } catch (error) {
    if (error.status === 404) {
      return res.json({ success: true, content: "" });
    }
    console.error(`Error in POST /api/repo/file-content for ${filePath}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/repo/save-file", async (req, res) => {
  const { filePath, content, commitMessage } = req.body;
  if (!filePath || content === undefined) {
    return res.status(400).json({ error: "filePath and content are required." });
  }

  const activeGithubToken = currentSession.githubToken || process.env.GITHUB_TOKEN;
  if (!activeGithubToken) {
    return res.status(401).json({ error: "No GitHub token configured." });
  }

  const msg = commitMessage || `Update ${filePath} directly from File Manager`;

  try {
    console.log(`[File Manager] Committing direct update for ${filePath}...`);
    await commitBatch([{ filePath, content }], msg, activeGithubToken);
    console.log(`[File Manager] Successfully saved ${filePath} directly to GitHub.`);
    res.json({ success: true, message: `Successfully committed ${filePath} directly to GitHub!` });
  } catch (error) {
    console.error(`Error saving file ${filePath} directly to GitHub:`, error);
    res.status(500).json({ error: error.message });
  }
});

// API: Dashboard to API Direct Interaction
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const text = message.trim();
  console.log(`[Dashboard] Admin interacting directly with AI: "${text}"`);

  // Construct a simulated Telegram context
  const pseudoCtx = {
    chat: { id: "dashboard" },
    message: { text: text },
    sendChatAction: async () => {}, // Mock typing action
    replyWithDocument: async (doc, extra) => {
      recordChat("bot", extra.caption || "📝 [Document attached]");
      for (const chatId of subscribers) {
        try { await bot.telegram.sendDocument(chatId, doc, extra); } catch (e) {}
      }
    },
    reply: async (replyText, extra) => {
      // Optional: Broadcast AI's responses to actual Telegram subscribers so they see what it's building
      for (const chatId of subscribers) {
        try {
          await bot.telegram.sendMessage(chatId, replyText, extra);
        } catch (e) {}
      }
    }
  };

  // Dispatch the message into the core AI workflow. (handleUserMessage records the user chat and bot responses locally automatically)
  handleUserMessage(pseudoCtx, text).catch(e => console.error("Dashboard AI processing error:", e));

  res.json({ success: true, message: "Request dispatched to AI engine." });
});

// API: Log out / Switch accounts
app.post("/api/logout", (req, res) => {
  console.log(`[Auth] User ${currentSession.email} logged out.`);
  currentSession.loggedIn = false;
  currentSession.email = null;
  currentSession.name = null;
  currentSession.picture = null;
  currentSession.apiKey = null;
  currentSession.customApiKey = null;
  currentSession.activeKeyType = 'openrouter';
  saveSession();

  res.json({ success: true });
});

// API: Secure Live Web Terminal shell executor
const { exec } = require("child_process");
app.post("/api/terminal", (req, res) => {
  if (!currentSession.loggedIn) {
    return res.status(401).json({ error: "Unauthorized. Please login with Google first." });
  }

  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Command is required." });
  }

  console.log(`[Terminal] Executing command: ${command}`);

  // Append user's command to server logs so everyone sees it typed
  activityLogs.push(`[${new Date().toLocaleTimeString()}] $ ${command}`);

  exec(command, { 
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    env: {
      ...process.env,
      
    }
  }, (error, stdout, stderr) => {
    // Append outputs line-by-line to retro CRT server logs
    if (stdout) {
      stdout.split("\n").forEach(line => {
        if (line.trim()) activityLogs.push(`[${new Date().toLocaleTimeString()}] ${line}`);
      });
    }
    if (stderr) {
      stderr.split("\n").forEach(line => {
        if (line.trim()) activityLogs.push(`[${new Date().toLocaleTimeString()}] ⚠️ ${line}`);
      });
    }
    if (error) {
      activityLogs.push(`[${new Date().toLocaleTimeString()}] ❌ Exit code: ${error.code}`);
    }

    // Keep log array bounded
    while (activityLogs.length > 250) {
      activityLogs.shift();
    }

    res.json({
      stdout: stdout || "",
      stderr: stderr || (error ? error.message : ""),
      exitCode: error ? error.code : 0
    });
  });
});

// Serve compiled static assets from React/Vite
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  console.log("[Express] Serving static compiled frontend from: " + distPath);
  app.use(express.static(distPath));
} else {
  console.log("[Express] WARNING: dist/ directory not found. Please compile frontend with `npm run build`!");
}

// Fallback HTML page for Single Page Application routing or loading message
app.get(/^\/(?!api).*/, (req, res) => {
  if (req.url.startsWith("/api")) {
    return res.status(404).json({ error: "API Route Not Found" });
  }
  
  const indexHtmlPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <head>
          <title>Neet Bot Dashboard</title>
          <style>
            body { background: #0B0F19; color: #E5E7EB; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; max-width: 450px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
            h1 { color: #60A5FA; margin-top: 0; font-size: 1.5rem; }
            p { line-height: 1.6; color: #9CA3AF; }
            .badge { background: #F59E0B; color: #000; font-weight: bold; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; display: inline-block; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">INITIALIZING UI</span>
            <h1>Neet Bot Console Dashboard</h1>
            <p>The backend is fully active and listening, bro! Let's compile the React production build to view the gorgeous glassmorphic dashboard frontend.</p>
            <p style="font-size:0.85rem; color:#4B5563;">Status: Bot online 🟢 | Express server listening</p>
          </div>
        </body>
      </html>
    `);
  }
});

// ============================================================================
// PERSISTENT CLOUD SHELL — Stays alive 24/7 even when no browser is connected.
// Telegram can inject commands anytime. Browser just "attaches" when it opens.
// ============================================================================

const SCROLLBACK_LIMIT = 500000; // max chars to buffer for new browser connections
let shellScrollback = '';       // rolling output buffer so reconnecting browser can see history
const browserClients = new Set(); // track all connected WebSocket browser clients

let telegramBuffer = '';
let telegramThrottleTimeout = null;

function handleTelegramOutputFeed(data) {
  if (!global.telegramActiveChatId) return;

  // Clean ANSI control characters, style escapes, and console cursor movements
  const cleanData = data.toString()
    .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  if (!cleanData) return;

  telegramBuffer += cleanData;

  // Throttle terminal output updates to 1.2s to prevent message rate-limiting
  if (telegramThrottleTimeout) clearTimeout(telegramThrottleTimeout);
  telegramThrottleTimeout = setTimeout(() => {
    sendBufferedOutputToTelegram();
  }, 1200);
}

async function sendBufferedOutputToTelegram() {
  const textToSend = telegramBuffer.trim();
  if (!textToSend || !global.telegramActiveChatId) {
    telegramBuffer = '';
    return;
  }

  // Clear buffer immediately to avoid overlap
  telegramBuffer = '';

  try {
    let formattedText = textToSend;
    if (formattedText.length > 3500) {
      formattedText = '... (truncated scrollback) ...\n' + formattedText.slice(-3000);
    }

    // Disabled per user request to avoid Telegram spam. Terminal logs will only show in the web UI.
    /*
    await bot.telegram.sendMessage(
      global.telegramActiveChatId,
      `🖥️ **Live Terminal Feed:**\n\`\`\`text\n${formattedText}\n\`\`\``,
      { parse_mode: 'Markdown' }
    );
    */
  } catch (err) {
    console.error('[TerminalFeed] Failed to push terminal log to Telegram:', err.message);
  }
}

function spawnPersistentShell() {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  let targetCwd = '/home/raag/Desktop/github/raagneet';

  // Dynamic directory resolving & cloud auto-cloning!
  if (!fs.existsSync(targetCwd)) {
    console.log(`[PersistentShell] Local target CWD ${targetCwd} not found. Running in Cloud/Isolated mode.`);
    
    const token = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : '';
    const owner = (process.env.GITHUB_OWNER || 'kalispidyman').trim();
    const repo = (process.env.GITHUB_REPO || 'raagneet').trim();
    const cloudRepoPath = path.join(process.cwd(), 'raagneet');
    const isGitRepo = fs.existsSync(cloudRepoPath) && fs.existsSync(path.join(cloudRepoPath, '.git'));
    
    if (!isGitRepo) {
      // Clean up any broken empty/corrupted directory from failed or interrupted clones
      if (fs.existsSync(cloudRepoPath)) {
        console.log(`[PersistentShell] Cleaning up broken target CWD: ${cloudRepoPath}`);
        try {
          fs.rmSync(cloudRepoPath, { recursive: true, force: true });
        } catch (rmErr) {
          console.error(`[PersistentShell] Failed to clean broken dir:`, rmErr.message);
        }
      }
      
      console.log(`[PersistentShell] Cloning ${owner}/${repo} into ${cloudRepoPath}...`);
      try {
        const cloneUrl = token 
          ? `https://${token}@github.com/${owner}/${repo}.git`
          : `https://github.com/${owner}/${repo}.git`;
        
        require('child_process').execSync(`git clone ${cloneUrl} "${cloudRepoPath}"`, { stdio: 'inherit' });
        console.log(`[PersistentShell] Successfully cloned ${repo} in cloud!`);
      } catch (err) {
        console.error(`[PersistentShell] Failed to clone repo:`, err.message);
      }
    }
    
    // Strict verification: only spawn inside the cloud repo path if it was successfully cloned
    const validCloudPathExists = fs.existsSync(cloudRepoPath) && fs.existsSync(path.join(cloudRepoPath, '.git'));
    targetCwd = validCloudPathExists ? cloudRepoPath : process.cwd();
  }

  console.log(`[PersistentShell] Spawning shell in directory: ${targetCwd}`);

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 220,
    rows: 50,
    cwd: targetCwd,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
  });

  // Register globally for Telegram injection
  global.activeTerminals = [ptyProcess];
  console.log('[PersistentShell] Background shell spawned! PID:', ptyProcess.pid);

  // Authenticate Git with Token automatically on startup!
  const tokenRaw = process.env.GITHUB_TOKEN;
  if (tokenRaw) {
    const token = tokenRaw.trim();
    const owner = (process.env.GITHUB_OWNER || 'kalispidyman').trim();
    const repo = (process.env.GITHUB_REPO || 'raagneet').trim();
    const authenticatedRemote = `https://${token}@github.com/${owner}/${repo}.git`;
    setTimeout(() => {
      ptyProcess.write(`git remote set-url origin ${authenticatedRemote} 2>/dev/null || git remote add origin ${authenticatedRemote} 2>/dev/null\r\n`);
      ptyProcess.write('clear\r\n');
    }, 1000);
  }

  ptyProcess.onData((data) => {
    // 1. Append to rolling scrollback buffer (trim old lines to stay under limit)
    shellScrollback += data;
    if (shellScrollback.length > SCROLLBACK_LIMIT) {
      shellScrollback = shellScrollback.slice(shellScrollback.length - SCROLLBACK_LIMIT);
    }
    // 2. Broadcast to ALL currently connected browser clients
    browserClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    // 3. Mirror live text to active Telegram chat
    handleTelegramOutputFeed(data);
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.warn(`[PersistentShell] Shell exited with code ${exitCode}. Respawning in 2s...`);
    global.activeTerminals = [];
    setTimeout(spawnPersistentShell, 2000); // auto-respawn if shell crashes
  });

  return ptyProcess;
}

// Spawn the immortal shell on server boot
spawnPersistentShell();

// Browser clients ATTACH to the existing shell - they do NOT create or kill it
wss.on('connection', (ws) => {
  console.log('[WebSocket] Browser terminal attached to persistent shell!');
  browserClients.add(ws);

  // Replay recent history so user sees what happened while they were away
  if (shellScrollback.length > 0) {
    ws.send(shellScrollback);
  }

  // Forward browser keystrokes into the persistent shell (or handle resize commands)
  ws.on('message', (msg) => {
    const term = global.activeTerminals[0];
    if (!term) return;

    try {
      const dataStr = msg.toString();
      if (dataStr.startsWith('{') && dataStr.endsWith('}')) {
        const payload = JSON.parse(dataStr);
        if (payload.type === 'resize' && payload.cols && payload.rows) {
          term.resize(payload.cols, payload.rows);
          console.log(`[PTY] Shell resized to cols: ${payload.cols}, rows: ${payload.rows}`);
          return;
        }
      }
    } catch (_) {}

    // Treat as raw keyboard stdin data
    term.write(msg);
  });

  ws.on('close', () => {
    browserClients.delete(ws);
    console.log('[WebSocket] Browser detached — persistent shell remains alive in background!');
  });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, async () => {
  console.log(`Express API & WebSockets & Static Server listening on port ${PORT}`);

  // ── Register Telegram Webhook ──
  // We check for Render or Hugging Face
  const isCloud = process.env.SPACE_ID || process.env.RENDER || process.env.NODE_ENV === 'production' || __dirname.includes('/app') || process.env.RENDER_EXTERNAL_URL;
  
  if (isCloud) {
    let webhookUrl = `https://neetne-neet-telegram-bot.hf.space/api/webhook`;
    if (process.env.RENDER_EXTERNAL_URL) {
      webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/api/webhook`;
    }
    
    bot.telegram.setWebhook(webhookUrl)
      .then(() => {
        console.log(`[Webhook] Registered: ${webhookUrl}`);
        // Register slash commands for Telegram Menu
        bot.telegram.setMyCommands([
          { command: "options", description: "Open Neet Bot Control Panel" },
          { command: "project", description: "Switch Working Project" },
          { command: "stop", description: "Stop all active background processes" },
          { command: "shutdown", description: "Shutdown System" }
        ]).catch(e => console.error("Failed to register commands:", e));
      })
      .catch(err => {
        console.error('[Webhook] Failed to set webhook:', err.message);
      });
  } else {
    // Local dev: use long polling
    console.log('[Bot] No SPACE_HOST found — using long-polling for local dev.');
    bot.telegram.deleteWebhook()
      .then(() => {
        return bot.launch();
      })
      .then(() => {
        console.log('[Bot] Long-poll mode active.');
        return bot.telegram.setMyCommands([
          { command: 'models', description: 'View and select an AI Model' },
          { command: 'provider', description: 'Change your active API Provider' },
          { command: 'editapikeys', description: 'Update your API Key' },
          { command: 'setmodel', description: 'Manually set a model name' }
        ]);
      })
      .catch(err => console.error('[Bot] Failed to launch:', err.message));
  }
});

// 1. Keep-Alive Self-Pinging Loop to prevent Render Free tier suspension (pings every 10 mins)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  console.log(`[Keep-Alive] Active! Self-pinging endpoint: ${RENDER_URL}`);
  setInterval(async () => {
    try {
      const res = await fetch(RENDER_URL);
      console.log(`[Keep-Alive] Self-ping successful! Status: ${res.status}`);
    } catch (err) {
      console.error(`[Keep-Alive] Self-ping failed:`, err);
    }
  }, 600000); // 10 minutes
} else {
  console.log("[Keep-Alive] RENDER_EXTERNAL_URL not configured. Skipping self-ping loop.");
}

// 2. Interactive Pings: Disabled per user request to stop sending messages every 30 minutes
// setInterval(() => {
//   if (subscribers.length === 0) return;
// 
//   const idlePings = getTrainingMessages("30-MINUTE IDLE PINGS");
//   let randomMsg = "Chilling... ☕ Neet Bot is alive!";
//   if (idlePings.length > 0) {
//     randomMsg = idlePings[Math.floor(Math.random() * idlePings.length)];
//   } else {
//     const pingMessages = [
//       "Hello! 👋 Just checking in, bro!",
//       "Yo! 🤖 Neet's Bot is online and ready!",
//       "👋",
//       "🤖",
//       "What's up? 🚀 Tell me what we are cooking today!",
//       "Chilling... ☕ Neet Bot is alive!",
//       "🔥",
//       "Beer time? 🍺 Let's write some beautiful code!",
//       "🤘"
//     ];
//     randomMsg = pingMessages[Math.floor(Math.random() * pingMessages.length)];
//   }
// 
//   console.log(`[Keep-Alive-Ping] Sending 30-minute ping to ${subscribers.length} subscribers: "${randomMsg}"`);
//   recordChat("bot", randomMsg);
// 
//   subscribers.forEach(chatId => {
//     bot.telegram.sendMessage(chatId, randomMsg).catch(err => {
//       console.error(`[Keep-Alive-Ping] Failed to send message to ${chatId}:`, err);
//     });
//   });
// }, 1800000); // 30 minutes
