const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const execAsync = util.promisify(exec);

/**
 * Truncates and optimizes training data context to fit within strict LLM input limits (e.g. Alibaba 30720 chars)
 */
function getOptimizedTrainingData(rawContent, maxChars = 8000) {
  if (!rawContent) return "";
  if (rawContent.length <= maxChars) return rawContent;
  const head = rawContent.substring(0, 3000);
  const tail = rawContent.substring(rawContent.length - 5000);
  return `${head}\n\n... [TRUNCATED FOR CONTEXT LIMITS] ...\n\n${tail}`;
}

/**
 * Robust XML self-healing pre-processor to handle partial truncations or cutoffs
 * by dynamically closing any opened tags prior to regex parsing.
 */
function ensureXmlClosed(text) {
  let cleaned = text.trim();
  
  // Find all file tags that open
  const openTags = [];
  const openTagRegex = /<file\s+path="([^"]+)">/g;
  let match;
  while ((match = openTagRegex.exec(cleaned)) !== null) {
    openTags.push({ path: match[1], index: match.index });
  }

  // Count closing tags
  const closeTagRegex = /<\/file>/g;
  let closeCount = 0;
  while (closeTagRegex.exec(cleaned) !== null) {
    closeCount++;
  }

  // If there are more open tags than close tags, it means the API truncated the response!
  if (openTags.length > closeCount) {
    const diff = openTags.length - closeCount;
    throw new Error(`API_TRUNCATION_ERROR: The AI response was cut off abruptly while generating a file (missing ${diff} closing tags). The file is too large for a single generation. Please simplify your request or ask for modular changes to avoid token limits!`);
  }

  // Also check if <commit_message> is opened but not closed
  if (cleaned.includes("<commit_message>") && !cleaned.includes("</commit_message>")) {
    throw new Error("API_TRUNCATION_ERROR: The AI response was cut off abruptly before finishing the commit message.");
  }

  return cleaned;
}

/**
 * Dynamically resolves the chat completion endpoint URL based on activeKeyType and CUSTOM_API_BASE
 */
const getResolvedApiUrl = () => {
  const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
  let apiBaseUrl = "https://openrouter.ai/api/v1";
  
  if (activeKeyType === 'alibaba') {
    const aliBase = process.env.ALIBABA_API_BASE || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    apiBaseUrl = aliBase.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
  } else if (activeKeyType === 'google') {
    apiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
  } else if (activeKeyType === 'custom' && process.env.CUSTOM_API_BASE) {
    apiBaseUrl = process.env.CUSTOM_API_BASE.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
  } else if (activeKeyType === 'bluesminds') {
    apiBaseUrl = (process.env.BLUESMINDS_API_BASE || "https://api.bluesminds.com/v1").replace(/\/chat\/completions$/, '').replace(/\/$/, '');
  } else if (activeKeyType === 'openrouter') {
    apiBaseUrl = (process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1").replace(/\/chat\/completions$/, '').replace(/\/$/, '');
  }
  
  return `${apiBaseUrl}/chat/completions`;
}

/**
 * Dynamically resolves the active model name based on activeKeyType, custom endpoint, and fallbacks
 */
function resolveActiveModelName(dynamicModel) {
  const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
  let preferredModel = dynamicModel || 'deepseek/deepseek-chat';

  if (preferredModel && preferredModel.includes('gemini-3') && preferredModel.includes('preview')) {
    if (preferredModel.includes('pro')) {
      preferredModel = 'gemini-3.1-pro';
    } else {
      preferredModel = 'gemini-3-flash';
    }
  }
  
  if (!preferredModel) {
    if (activeKeyType === 'custom') {
      const customBase = process.env.CUSTOM_API_BASE || '';
      if (customBase.includes('dashscope') || customBase.includes('aliyuncs')) {
        return 'qwen-max';
      }
      return 'gpt-4o';
    }
    if (activeKeyType === 'alibaba') {
      return 'qwen-max';
    }
    if (activeKeyType === 'google') {
      return 'gemini-1.5-flash';
    }
    if (activeKeyType === 'bluesminds') {
      return 'meta-llama/Llama-3.3-70B-Instruct';
    }
    if (activeKeyType === 'openrouter') {
      return 'deepseek/deepseek-chat';
    }
    return 'deepseek/deepseek-chat';
  }
  
  if (activeKeyType === 'google') {
    if (preferredModel.includes('gemini-3')) {
      if (preferredModel.includes('pro')) {
        return 'gemini-1.5-pro';
      }
      return 'gemini-1.5-flash';
    }
    const isGemini = preferredModel.startsWith('gemini-');
    if (!isGemini) {
      return 'gemini-1.5-flash';
    }
  }

  if (activeKeyType === 'alibaba') {
    const isQwen = preferredModel.startsWith('qwen-');
    if (!isQwen) {
      if (preferredModel.includes('pro') || preferredModel.includes('thinking') || preferredModel.includes('opus')) {
        return 'qwen-max';
      }
      return 'qwen-plus';
    }
  }

  if (activeKeyType === 'custom') {
    const customBase = process.env.CUSTOM_API_BASE || '';
    const isDashScope = customBase.includes('dashscope') || customBase.includes('aliyuncs');
    if (isDashScope) {
      const isQwen = preferredModel.startsWith('qwen-');
      if (!isQwen) {
        return 'qwen-max';
      }
      // Removed boaModels logic
    }
  }
  
  return preferredModel;
}

/**
 * Intelligently limits context size to ensure LLM token/character boundaries are respected.
 */
function optimizeRepoFilesContext(repoFiles, userPrompt, maxTotalChars = 80000) {
  if (!repoFiles || repoFiles.length === 0) return [];
  
  let totalChars = repoFiles.reduce((sum, f) => sum + (f.content || "").length, 0);
  if (totalChars <= maxTotalChars) {
    return repoFiles;
  }
  
  console.log(`[Context Optimization] Repo size ${totalChars} chars exceeds limit ${maxTotalChars}. Optimizing...`);
  const promptLower = userPrompt.toLowerCase();
  
  return repoFiles.map(file => {
    const content = file.content || "";
    const len = content.length;
    
    if (len < 5000) {
      return file;
    }
    
    const baseName = file.filePath.split('/').pop().toLowerCase();
    const isRelevant = promptLower.includes(baseName) || 
                      (baseName.includes('.') && promptLower.includes(baseName.split('.')[0]));
                      
    if (isRelevant) {
      if (len > 20000) {
        console.log(`[Context Optimization] Truncating large relevant file: ${file.filePath}`);
        return {
          filePath: file.filePath,
          content: content.substring(0, 15000) + `\n\n... [TRUNCATED ${len - 20000} CHARS FOR CONTEXT LIMITS] ...\n\n` + content.substring(len - 5000)
        };
      }
      return file;
    }
    
    console.log(`[Context Optimization] Omitting body of large non-relevant file: ${file.filePath} (${len} chars)`);
    return {
      filePath: file.filePath,
      content: `// [File content of ${file.filePath} omitted to save context space. Size: ${len} characters. Mention the file name in your prompt if you need the AI to inspect or edit it.]`
    };
  });
}

/**
 * Directly query the Bay of Assets API.
 */
async function getFileEdits(userPrompt, repoFiles = [], base64Image = null, lastError = null, abortSignal = null, dynamicApiKey = null, dynamicModel = null) {
  let apiKey = dynamicApiKey;
  if (!apiKey) {
    const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
    if (activeKeyType === 'alibaba') {
      apiKey = process.env.ALIBABA_API_KEY;
    } else if (activeKeyType === 'google') {
      apiKey = process.env.GOOGLE_API_KEY;
    } else if (activeKeyType === 'custom') {
      apiKey = process.env.CUSTOM_API_KEY;
    } else if (activeKeyType === 'bluesminds') {
      apiKey = process.env.BLUESMINDS_API_KEY;
    } else if (activeKeyType === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY;
    } else {
      
    }
  }
  const preferredModel = resolveActiveModelName(dynamicModel);
  if (!apiKey) {
    throw new Error("No API key provided. Please configure GOOGLE_API_KEY, ALIBABA_API_KEY, CUSTOM_API_KEY, in your server environment or enter it on the dashboard.");
  }

  const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
  const customBase = process.env.CUSTOM_API_BASE || '';
  const isDashScope = activeKeyType === 'alibaba' || customBase.includes('dashscope') || customBase.includes('aliyuncs');
  const maxContextChars = isDashScope ? 12000 : 80000;

  const optimizedFiles = optimizeRepoFilesContext(repoFiles, userPrompt, maxContextChars);
  const existingFilesContext = optimizedFiles.length > 0 
    ? `The repository currently contains the following files:
${repoFiles.map(f => ` - ${f.filePath}`).join("\n")}

Below is the EXACT CURRENT CONTENT of the relevant text/code files in the repository. Inspect this content carefully to understand the styling system (e.g. Tailwind CSS, global CSS classes, responsive grids), the routing setup, the component dependencies, and how everything is connected:

${optimizedFiles.map(f => `
=========================================
FILE PATH: ${f.filePath}
=========================================
${f.content}
=========================================
`).join("\n")}

CRITICAL DEVELOPMENT RULES:
1. When modifying, enhancing, or styling an existing component or page, you MUST overwrite the correct existing file (e.g. edit 'src/components/Navbar.jsx' instead of creating a duplicate like 'src/components/Navbar.tsx' or 'src/Navbar.js'). Do NOT create parallel duplicate files with different extensions if the files already exist.
2. Inspect the imports in existing files. Make sure any new components you create are imported correctly using absolute or relative paths that actually resolve.
3. If you use an external package that is NOT listed in the 'dependencies' of the 'package.json' above (e.g., 'framer-motion', 'react-icons', etc.), you MUST also modify the 'package.json' file to include the new package in its dependencies list!
4. DOUBLE-CHECK SYNTAX AND BRACKETS: Ensure all JSX tags are properly opened and closed, all CSS/JS brackets '{}' are perfectly balanced without any unclosed blocks, and all imported components exist and are spelled exactly right. The Vercel deployment will fail instantly if you leave an unclosed bracket or syntax error!
5. Do NOT create duplicate routes or break existing pages. Preserve all other pages and functionality unless requested otherwise.
6. Make sure your styling integrates beautifully with the existing CSS or Tailwind classes. Do not drop existing utility classes or configurations unless requested.`
    : `No repository file structure context was provided (the repository is empty or brand new).
Initialize a clean, fully-functional modern Vite React website from scratch.
You MUST output the following standard boilerplate files:
1. 'package.json' (configured with react, react-dom, react-router-dom, lucide-react, tailwindcss, postcss, autoprefixer, vite, etc., and a '"build": "vite build"' script).
2. 'vite.config.js' (configured with the react plugin).
3. 'tailwind.config.js' and 'postcss.config.js' (configured for Tailwind CSS).
4. 'index.html' (including a root div and mounting main.jsx).
5. 'src/main.jsx' (rendering the App component).
6. 'src/index.css' (including the @tailwind directives).
7. 'src/App.jsx' (setting up Routing and importing standard layout components like Navbar, Footer).
8. 'src/components/Navbar.jsx' and 'src/components/Footer.jsx' (beautiful premium components).
9. 'src/pages/Home.jsx' (a gorgeous premium homepage).`;

  let selfCorrectionPrompt = "";
  if (lastError) {
    selfCorrectionPrompt = `
    ⚠️ ATTENTION: THE PREVIOUS DEPLOYMENT ATTEMPT FAILED WITH THE FOLLOWING BUILD ERROR/LOGS:
    --------------------------------------------------
    ${lastError.message}
    --------------------------------------------------

    CRITICAL INSTRUCTIONS FOR AUTO-HEALING (ERROR PLAYBOOK):
    1. Analyze the build logs carefully. Identify the exact file path, line number, or package reference that caused the failure.
    2. Follow these specific rules to resolve common Vite/Esbuild/Vercel issues:
       - **Esbuild JSX Syntax Errors ("Expected ... but found ..."):** NEVER place JSX comments (like \`{/* comment */}\`) directly inside the opening tag or properties of a React component. Either remove the comment entirely or move it outside the tag.
       - **Module Not Found / Unresolved Dependency:** If the error says a module or package is missing, YOU MUST add the required NPM package to \`package.json\` in the \`dependencies\` block, in addition to fixing any bad import paths.
       - **Casing Mismatches:** Vercel uses a case-sensitive filesystem (Linux). If you import 'Navbar.jsx' but the file is named 'navbar.jsx', the build WILL crash. Correct the import path to match the exact file casing.
       - **ReferenceError / Undefined Variables:** Ensure all hooks, components, or variables used in a file are correctly imported at the top of the file.
       - **React Hook Rules:** Ensure hooks (like \`useState\`, \`useEffect\`) are called at the top level of the component and NOT conditionally or inside nested loops/functions.
       - **Duplicate file paths or conflicting extensions:** Ensure you don't create both '.jsx' and '.tsx' for the same component name.
    3. You must completely resolve the error. Output the exact corrected file content for the affected files (and \`package.json\` if dependencies were missing). Do not leave broken code.
    `;
  }

  let trainingData = "";
  try {
    const trainingPath = path.join(__dirname, "training");
    if (fs.existsSync(trainingPath)) {
      const raw = fs.readFileSync(trainingPath, "utf8");
      trainingData = getOptimizedTrainingData(raw);
    }
  } catch (e) {
    console.error("Error reading training file:", e);
  }

  const systemInstruction = `
    You are an AI assistant that helps build and modify software projects in a GitHub repository.
    You are powered by the AI model: ${preferredModel}.
    Your job is to determine all the files that need to be created, modified, or updated to fulfill the request.

    PERSONALITY & CHARACTER GUIDELINES (CRITICAL):
    You are Neet's Bot. Underneath your coding expertise, you are a super chill, sarcastic, Gita-loving, dad-life developer. You MUST draw personality context (wifey warnings, calisthenics tips, agricultural B.Sc exams, Free Fire/BGMI tournaments, twin babies care) from the training dataset below:
    --------------------------------------------------
    ${trainingData}
    --------------------------------------------------

    ${existingFilesContext}

    ${selfCorrectionPrompt}

    DESIGN & AESTHETIC GUIDELINES (CRITICAL):
    1. **Modern Premium Theme**: Always use high-end color palettes (e.g. sleek dark modes, vibrant tailored HSL colors, elegant gradients, glowing border highlights). Avoid generic boring colors.
    2. **Glassmorphism & Depth**: Implement premium styling like glassmorphism (backdrop-filter: blur, semi-transparent borders), subtle box shadows, and floating cards.
    3. **Typography**: Use elegant, modern sans-serif fonts (e.g. Inter, Outfit, Roboto) with excellent letter spacing, line heights, and hierarchy.
    4. **Interactive Micro-Animations**: Add smooth transition and hover states on all interactive elements (buttons, links, cards) using standard CSS transitions or Tailwind utility classes.
    5. **Responsive & Mobile-First**: Every layout must be fully responsive, scaling beautifully from mobile screens to 4K monitors using clean Tailwind flex/grid layouts.
    6. **No Placeholders**: Never output mock descriptions, "lorem ipsum", or broken images. Populate every component with highly realistic, professional, and copy-written text.
    7. **Token-Efficiency (CRITICAL FOR SAVING TOKENS)**:
       - ONLY return files that actually need modifications or additions. If a file is completely unchanged, DO NOT output it.
       - Inside files you modify, keep your code clean, concise, and modular. Do not output massive, bloated boilerplate code unless absolutely necessary.
       - Prefer targeted modular edits to keep response sizes small.

    You MUST output your proposed file changes using this exact XML tag structure. Do NOT wrap the tags in markdown code blocks (like \`\`\`xml or \`\`\`json). Just return the raw tags:
    
    <file path="src/components/Navbar.jsx">
    // your React code content here...
    </file>
    
    <file path="src/components/Navbar.css">
    /* your CSS content here */
    </file>
    
    <commit_message>
    Describe the changes made (e.g. Implement navbar popups and fix white header)
    </commit_message>

    Make sure every <file> tag is closed with a corresponding </file> tag.
  `;

  // Prepend critical formatting rules directly to the user prompt to maximize prompt weight and formatting adherence!
  const formattedUserPrompt = `
  CRITICAL INSTRUCTION: You MUST format your response using EXACTLY the XML tag structure described in the system instructions:
  - Every file change must reside inside a <file path="[filename]">[code]</file> tag block.
  - The commit message must reside inside <commit_message>[message]</commit_message>.
  - Do NOT wrap files in markdown code blocks (\`\`\`).
  
  User Request:
  ${userPrompt}
  `;

  const fullPrompt = `${systemInstruction}\n\nUser Request:\n${formattedUserPrompt}`;

  try {
    let aiText = "";
    let apiUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    
    const GOOGLE_FALLBACK_LIST = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    const ALIBABA_FALLBACK_LIST = [
      "qwen-max",
      "qwen-plus",
      "qwen-turbo"
    ];

    const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
    let fallbackList = [];
    
    if (activeKeyType === 'google') fallbackList = GOOGLE_FALLBACK_LIST;
    else if (activeKeyType === 'alibaba') fallbackList = ALIBABA_FALLBACK_LIST;
    else if (activeKeyType === 'bluesminds') {
      fallbackList = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash", "qwen-plus"];
    } else if (activeKeyType === 'openrouter') {
      fallbackList = ["deepseek/deepseek-chat", "anthropic/claude-3.5-sonnet", "google/gemini-pro-1.5"];
    } else if (activeKeyType === 'custom') {
      fallbackList = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash", "qwen-plus"];
    }

    const modelsToTry = [preferredModel, ...fallbackList.filter(m => m !== preferredModel)];
    let lastFetchError = null;
    let primaryError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`>>> Calling AI API using model ${model}...`);
        
        const messages = [
          { role: "system", content: systemInstruction }
        ];

        if (base64Image) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: formattedUserPrompt },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          });
        } else {
          messages.push({
            role: "user",
            content: formattedUserPrompt
          });
        }

        const response = await fetch(getResolvedApiUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://raagneet.vercel.app",
            "X-Title": "Neet Telegram Bot"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 16384,
            stream: true
          }),
          signal: abortSignal
        });

        if (!response.ok) {
          const errText = await response.text();
          let errJson;
          try { errJson = JSON.parse(errText); } catch (_) {}
          let errMsg = response.statusText;
          if (errJson) {
            if (Array.isArray(errJson) && errJson[0]?.error?.message) {
              errMsg = errJson[0].error.message;
            } else if (errJson.error?.message) {
              errMsg = errJson.error.message;
            } else {
              errMsg = errText;
            }
          } else if (errText) {
            errMsg = errText;
          }
          throw new Error(`Model ${model} error: ${errMsg}`);
        }

        const responseText = await response.text();
        const contentType = response.headers.get("content-type") || "";
        
        if (contentType.includes("text/event-stream") || responseText.trim().startsWith("data:")) {
          console.log(">>> Detected streaming response in getFileEdits. Parsing SSE chunks...");
          let parsedText = "";
          const lines = responseText.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const chunkVal = trimmed.substring(5).trim();
            if (chunkVal === "[DONE]") continue;
            try {
              const chunkJson = JSON.parse(chunkVal);
              const deltaContent = chunkJson.choices?.[0]?.delta?.content || chunkJson.choices?.[0]?.message?.content || "";
              parsedText += deltaContent;
              if (chunkJson.usage) {
                apiUsage = chunkJson.usage;
              }
            } catch (e) {
              console.warn("Error parsing SSE chunk:", e.message, chunkVal);
            }
          }
          aiText = parsedText;
        } else {
          const data = JSON.parse(responseText);
          aiText = data.choices[0].message.content;
          if (data.usage) {
            apiUsage = data.usage;
          }
        }
        console.log(`>>> Raw Bay of Assets response received using model ${model}.`);
        lastFetchError = null;
        primaryError = null;
        break;
      } catch (fetchError) {
        console.warn(`[API Call] Model ${model} failed: ${fetchError.message}`);
        if (model === preferredModel) primaryError = fetchError;
        lastFetchError = fetchError;
      }
    }

    if (lastFetchError) {
      if (primaryError) {
        throw new Error(`Your selected model '${preferredModel}' failed: ${primaryError.message}\n(Fallbacks also failed)`);
      }
      throw new Error(`All models failed. Last error: ${lastFetchError.message}`);
    }

    // Apply self-healing pre-processor to guarantee all opened tags are safely closed
    aiText = ensureXmlClosed(aiText);

    // Parse the XML-like tags using regex
    const files = [];
    const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
    let match;
    
    while ((match = fileRegex.exec(aiText)) !== null) {
      files.push({
        filePath: match[1].trim(),
        content: match[2].trim()
      });
    }

    const commitRegex = /<commit_message>([\s\S]*?)<\/commit_message>/;
    const commitMatch = commitRegex.exec(aiText);
    const commitMessage = commitMatch ? commitMatch[1].trim() : "Modify repository files";

    if (files.length === 0) {
      console.error("Failed to parse files from AI output. Raw output was:", aiText);
      throw new Error("No files were parsed. Ensure you use the exact <file path=\"...\">...</file> tags.");
    }

    console.log(`Successfully parsed ${files.length} files from AI tags.`);
    
    return { files, commitMessage, usage: apiUsage, rawResponse: aiText };

  } catch (error) {
    console.error("AI Generation error:", error);
    throw new Error(`Could not generate the project files: ${error.message}`);
  }
}

/**
 * Determines if the user's prompt is a code modification request or general chat, and generates a casual reply.
 * Routes visual prompts and text prompts to Google Gemini CLI!
 * 
 * @param {string} userPrompt 
 * @param {string|null} base64Image Optional Base64 Data URL of the image reference
 * @param {AbortSignal|null} abortSignal Optional abort signal
 * @param {string|null} dynamicApiKey Optional dynamic API key from frontend Google Sign-in
 * @param {string|null} dynamicModel Optional model override
 * @returns {Promise<{ isCodeRequest: boolean, reply: string, usage: object }>}
 */
async function handleChatOrIntent(userPrompt, base64Image = null, abortSignal = null, dynamicApiKey = null, dynamicModel = null, activeKeyType = 'openrouter') {
  let apiKey = dynamicApiKey;
  if (!apiKey) {
    if (activeKeyType === 'alibaba') {
      apiKey = process.env.ALIBABA_API_KEY;
    } else if (activeKeyType === 'google') {
      apiKey = process.env.GOOGLE_API_KEY;
    } else if (activeKeyType === 'custom') {
      apiKey = process.env.CUSTOM_API_KEY;
    } else if (activeKeyType === 'bluesminds') {
      apiKey = process.env.BLUESMINDS_API_KEY;
    } else if (activeKeyType === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY;
    } else {
      
    }
  }
  if (!apiKey) {
    // If no API key is present at all, return a helpful setup response
    return {
      isCodeRequest: false,
      reply: "Hey bro! 🤖 Before we can build some cool stuff, please visit the dashboard website and add your API key so I can cook up some code for you! 🍺",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  const preferredModel = resolveActiveModelName(dynamicModel);

  let trainingData = "";
  try {
    const trainingPath = path.join(__dirname, "training");
    if (fs.existsSync(trainingPath)) {
      const raw = fs.readFileSync(trainingPath, "utf8");
      trainingData = getOptimizedTrainingData(raw);
    }
  } catch (e) {
    console.error("Error reading training file:", e);
  }

  const systemInstruction = `
    You are a super chill, casual AI coding assistant called "Neet's Bot". You are currently powered by the AI model: ${preferredModel}. You talk like a friendly dude/bro (e.g. use "man", "dude", "bro", "sweet", "awesome").
    
    CRITICAL PERSONALITY AND INTERACTION TRAINING DATA:
    Here is your official training dataset. You MUST match this exact personality, sarcasm, tone, references, and responses based on the triggering conditions and user statements described below:
    --------------------------------------------------
    ${trainingData}
    --------------------------------------------------

    Respond to user inputs matching these examples with the exact same tone and humor (including calisthenics tips, fatherhood, B.Sc Agriculture soils/crops, Bhagavad Gita lessons when frustrated/stressed, and BGMI/Free Fire esports tournament organizing). Keep it extremely authentic!

    You need to determine if they are just chatting/asking a question, OR if they are asking you to modify/add/create code in their GitHub repository.
    
    If they are just chatting or asking a general question:
    Respond with a JSON object where "isCodeRequest" is false, and "reply" is your casual response answering their question or chatting back. If they ask what model you are, you must answer based on the model provided above.
    
    If they are asking to modify the website, add a feature, fix a bug, or change the repo:
    Respond with a JSON object where "isCodeRequest" is true, and "reply" is a short acknowledgment like "Alright dude, I'm on it! Let me fire up the code editor. 🍺".
    
    If they are asking to generate, create, or draw an image (e.g. "generate an image of a cat"):
    Respond with a JSON object where "isImageRequest" is true, "isCodeRequest" is false, "imagePrompt" is a highly descriptive prompt for the image generator (under 200 words), and "reply" is a casual response like "Hold on bro, generating that image right now! 🎨".

    Respond ONLY with the JSON object. Do NOT wrap it in markdown code blocks.
    
    Format:
    {
      "isCodeRequest": boolean,
      "isImageRequest": boolean,
      "imagePrompt": "string (only if isImageRequest is true)",
      "reply": "your casual response here"
    }
  `;

  const fullPrompt = `${systemInstruction}\n\nUser Request: ${userPrompt || "Analyze this request, bro."}`;

  try {
    let aiText = "";
    let apiUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    
    const GOOGLE_FALLBACK_LIST = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    const ALIBABA_FALLBACK_LIST = [
      "qwen-max",
      "qwen-plus",
      "qwen-turbo"
    ];

    const activeKeyType = process.env.ACTIVE_KEY_TYPE || 'openrouter';
    let fallbackList = [];
    
    if (activeKeyType === 'google') fallbackList = GOOGLE_FALLBACK_LIST;
    else if (activeKeyType === 'alibaba') fallbackList = ALIBABA_FALLBACK_LIST;
    else if (activeKeyType === 'bluesminds') {
      fallbackList = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash", "qwen-plus"];
    } else if (activeKeyType === 'openrouter') {
      fallbackList = ["deepseek/deepseek-chat", "anthropic/claude-3.5-sonnet", "google/gemini-pro-1.5"];
    } else if (activeKeyType === 'custom') {
      fallbackList = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-flash", "qwen-plus"];
    }

    const modelsToTry = [preferredModel, ...fallbackList.filter(m => m !== preferredModel)];
    let lastFetchError = null;
    let primaryError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`>>> Checking intent via Bay of Assets model ${model}...`);
        const messages = [
          { role: "system", content: systemInstruction }
        ];

        if (base64Image) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: `User Request: ${userPrompt || "Analyze this request, bro."}` },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          });
        } else {
          messages.push({
            role: "user",
            content: `User Request: ${userPrompt || "Analyze this request, bro."}`
          });
        }

        const response = await fetch(getResolvedApiUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://raagneet.vercel.app",
            "X-Title": "Neet Telegram Bot"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 1024,
            stream: true
          }),
          signal: abortSignal
        });

        if (!response.ok) {
          const errText = await response.text();
          let errJson;
          try { errJson = JSON.parse(errText); } catch (_) {}
          let errMsg = response.statusText;
          if (errJson) {
            if (Array.isArray(errJson) && errJson[0]?.error?.message) {
              errMsg = errJson[0].error.message;
            } else if (errJson.error?.message) {
              errMsg = errJson.error.message;
            } else {
              errMsg = errText;
            }
          } else if (errText) {
            errMsg = errText;
          }
          throw new Error(`Model ${model} error: ${errMsg}`);
        }

        const responseText = await response.text();
        const contentType = response.headers.get("content-type") || "";
        
        if (contentType.includes("text/event-stream") || responseText.trim().startsWith("data:")) {
          console.log(">>> Detected streaming response in handleChatOrIntent. Parsing SSE chunks...");
          let parsedText = "";
          const lines = responseText.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const chunkVal = trimmed.substring(5).trim();
            if (chunkVal === "[DONE]") continue;
            try {
              const chunkJson = JSON.parse(chunkVal);
              const deltaContent = chunkJson.choices?.[0]?.delta?.content || chunkJson.choices?.[0]?.message?.content || "";
              parsedText += deltaContent;
              if (chunkJson.usage) {
                apiUsage = chunkJson.usage;
              }
            } catch (e) {
              console.warn("Error parsing SSE chunk:", e.message, chunkVal);
            }
          }
          aiText = parsedText;
        } else {
          const data = JSON.parse(responseText);
          aiText = data.choices[0].message.content;
          if (data.usage) {
            apiUsage = data.usage;
          }
        }
        lastFetchError = null;
        primaryError = null;
        break;
      } catch (fetchError) {
        console.warn(`[API Call] Intent check model ${model} failed: ${fetchError.message}`);
        if (model === preferredModel) primaryError = fetchError;
        lastFetchError = fetchError;
      }
    }

    if (lastFetchError) {
      if (primaryError) {
        throw new Error(`Your selected model '${preferredModel}' failed: ${primaryError.message}\n(Fallbacks also failed)`);
      }
      throw new Error(`All models failed for intent check. Last error: ${lastFetchError.message}`);
    }

    let result;
    const jsonStr = aiText.replace(/```json|```/g, "").trim();
    try {
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn("Failed to parse intent JSON:", parseErr.message, "Raw AI Text:", aiText);
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          result = { isCodeRequest: false, isImageRequest: false, reply: aiText.trim() || "No response received, bro." };
        }
      } else {
        result = { isCodeRequest: false, isImageRequest: false, reply: aiText.trim() || "No response received, bro." };
      }
    }
    
    result.usage = apiUsage;
    
    return result;
  } catch (error) {
    console.error("Intent determination error:", error);
    return { 
      isCodeRequest: false, 
      reply: `❌ **API Connection Error:**\n\`\`\`\n${error.message}\n\`\`\``,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }
}

module.exports = { getFileEdits, handleChatOrIntent };
