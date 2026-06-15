const fs = require('fs');

function removeBoa(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    if (filePath.includes('CredentialManagerUI.jsx')) {
        // Remove Bay of Assets from providers array
        content = content.replace(/\{ id: 'boa', name: 'Bay of Assets'[\s\S]*?\},/g, '');
        // Remove case 'boa' from switch statement
        content = content.replace(/case 'boa': return \{[\s\S]*?\}\n/g, '');
        
        // Remove props passed to CredentialManagerUI related to boa
        content = content.replace(/boaKey, setBoaKey,\s*/g, '');
        content = content.replace(/showBoaKeyInput, setShowBoaKeyInput,\s*/g, '');
        content = content.replace(/revealBoaConfigured, setRevealBoaConfigured,\s*/g, '');
    }

    if (filePath.includes('dashboard.jsx')) {
        content = content.replace(/const \[boaModelsList, setBoaModelsList\] = useState\(\[\]\);\n/g, '');
        content = content.replace(/const \[boaKey, setBoaKey\] = useState\(''\);\n/g, '');
        content = content.replace(/const \[showBoaKeyInput, setShowBoaKeyInput\] = useState\(false\);\n/g, '');
        content = content.replace(/const \[revealBoaConfigured, setRevealBoaConfigured\] = useState\(false\);\n/g, '');
        
        content = content.replace(/if \(card === 'boa'\) \{[\s\S]*?\}\n/g, '');
        
        content = content.replace(/if \(provider === 'boa' \|\| !provider\) \{[\s\S]*?\}\n/g, '');
        content = content.replace(/if \(type === 'boa' && isEditingKey && boaKey\.trim\(\)\) body\.apiKey = boaKey\.trim\(\);\n/g, '');
        
        content = content.replace(/boa: 'Boa',\s*/g, '');
        content = content.replace(/if \(type === 'boa'\) setIsEditingKey\(false\);\n/g, '');
        
        // Replace activeKeyType 'boa' defaults with 'openrouter'
        content = content.replace(/activeKeyType: 'boa'/g, "activeKeyType: 'openrouter'");
        content = content.replace(/useState\('boa'\)/g, "useState('openrouter')");
        
        content = content.replace(/boaKey, setBoaKey,\s*/g, '');
        content = content.replace(/showBoaKeyInput, setShowBoaKeyInput, revealBoaConfigured, setRevealBoaConfigured,\s*/g, '');
        
        content = content.replace(/boaModelsList=\{boaModelsList\}\n/g, '');
        
        content = content.replace(/\{session\.activeKeyType !== 'boa' && \(/g, "{session.activeKeyType !== 'openrouter' && (");
    }

    if (filePath.includes('index.js')) {
        // Remove BOA env vars and fallbacks
        content = content.replace(/apiKey: process\.env\.BOA_API_KEY \|\| null,/g, 'apiKey: null,');
        content = content.replace(/modelName: process\.env\.BOA_MODEL \|\| "deepseek\/deepseek-chat",/g, 'modelName: "deepseek/deepseek-chat",');
        
        content = content.replace(/process\.env\.BOA_API_KEY = currentSession\.apiKey;\n/g, '');
        content = content.replace(/process\.env\.BOA_MODEL = currentSession\.modelName;\n/g, '');
        
        content = content.replace(/\|\| process\.env\.BOA_API_KEY/g, '');
        content = content.replace(/\|\| process\.env\.BOA_MODEL/g, '');
        
        content = content.replace(/currentSession\.apiKey = process\.env\.BOA_API_KEY \|\| null;/g, '');
        content = content.replace(/currentSession\.modelName = process\.env\.BOA_MODEL \|\| "deepseek\/deepseek-chat";/g, '');
        
        content = content.replace(/parsed\.apiKey \|\| process\.env\.BOA_API_KEY \|\| null;/g, 'parsed.apiKey || null;');
        
        content = content.replace(/saveEnvVariable\('BOA_MODEL', newModel\);/g, '');
        content = content.replace(/process\.env\.BOA_MODEL = newModel;/g, '');
        
        // Remove interactive credential config BOA blocks
        content = content.replace(/const regex = new RegExp\(`\^BOA_API_KEY=\.\*`, 'm'\);[\s\S]*?process\.env\.BOA_API_KEY = keyToSave;/g, '');
        
        content = content.replace(/BOA_API_KEY: getActiveApiKey\(\) \|\| ''/g, '');
    }

    if (filePath.includes('ai-handler.js')) {
        content = content.replace(/let preferredModel = dynamicModel \|\| process\.env\.BOA_MODEL;/g, "let preferredModel = dynamicModel || 'deepseek/deepseek-chat';");
        content = content.replace(/return process\.env\.BOA_MODEL \|\| 'meta-llama\/Llama-3.3-70B-Instruct';/g, "return 'meta-llama/Llama-3.3-70B-Instruct';");
        content = content.replace(/return process\.env\.BOA_MODEL \|\| 'deepseek\/deepseek-chat';/g, "return 'deepseek/deepseek-chat';");
        
        content = content.replace(/apiKey = process\.env\.BOA_API_KEY;/g, '');
        content = content.replace(/or BOA_API_KEY /g, '');
        
        content = content.replace(/const BOA_MODELS_FALLBACK_LIST = \[[\s\S]*?\];/g, '');
        content = content.replace(/if \(activeKeyType === 'boa'\) fallbackList = BOA_MODELS_FALLBACK_LIST;/g, '');
        
        content = content.replace(/let apiBaseUrl = "https:\/\/api\.bayofassets\.com\/v1";/g, 'let apiBaseUrl = "https://openrouter.ai/api/v1";');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

['src/components/CredentialManagerUI.jsx', 'src/dashboard.jsx', 'index.js', 'ai-handler.js'].forEach(f => {
    removeBoa('/home/raag/Desktop/telegram/' + f);
});
