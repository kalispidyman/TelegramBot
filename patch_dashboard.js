const fs = require('fs');
let code = fs.readFileSync('src/dashboard.jsx', 'utf8');

// 1. Inject Import
if (!code.includes('import CredentialManagerUI')) {
    code = code.replace("import {", "import CredentialManagerUI from './components/CredentialManagerUI';\nimport {");
}

// 2. Inject ctx before return (
const ctxCode = `
    const ctx = {
        session, activeCredentialsTab, setActiveCredentialsTab,
        selectedKeyType, setSelectedKeyType, handleActivateKeyType, isActivatingKey,
        cardPasswordInput, setCardPasswordInput, cardPasswordError, setCardPasswordError,
        activePasswordCard, setActivePasswordCard, setPasswordTargetAction, handleCardPasswordSubmit,
        isEditingKey, setIsEditingKey, isSavingKey, handleSaveKey, boaKey, setBoaKey,
        showBoaKeyInput, setShowBoaKeyInput, revealBoaConfigured, setRevealBoaConfigured,
        isEditingGithubToken, setIsEditingGithubToken, isSavingGithubToken, handleSaveGithubToken, githubToken, setGithubToken,
        showGithubTokenInput, setShowGithubTokenInput, revealGithubConfigured, setRevealGithubConfigured,
        isEditingCustomKey, setIsEditingCustomKey, isSavingCustomKey, handleSaveCustomKey, customKey, setCustomKey, customBase, setCustomBase,
        showCustomKeyInput, setShowCustomKeyInput, revealCustomConfigured, setRevealCustomConfigured,
        isEditingAlibabaKey, setIsEditingAlibabaKey, isSavingAlibabaKey, handleSaveAlibabaKey, alibabaKey, setAlibabaKey, alibabaBase, setAlibabaBase,
        showAlibabaKeyInput, setShowAlibabaKeyInput, revealAlibabaConfigured, setRevealAlibabaConfigured,
        isEditingGoogleKey, setIsEditingGoogleKey, isSavingGoogleKey, handleSaveGoogleKey, googleKey, setGoogleKey,
        showGoogleKeyInput, setShowGoogleKeyInput, revealGoogleConfigured, setRevealGoogleConfigured,
        isEditingBluesmindsKey, setIsEditingBluesmindsKey, isSavingBluesmindsKey, handleSaveBluesmindsKey, bluesmindsKey, setBluesmindsKey, bluesmindsBase, setBluesmindsBase,
        showBluesmindsKeyInput, setShowBluesmindsKeyInput, revealBluesmindsConfigured, setRevealBluesmindsConfigured,
    };
`;

if (!code.includes('const ctx = {')) {
    code = code.replace("return (\n        <div className=\"h-[100dvh] w-full bg-[#020308]", ctxCode + "\n    return (\n        <div className=\"h-[100dvh] w-full bg-[#020308]");
}

// 3. Replace Desktop Popover (from {/* Active Key Selector */} down to just before {/* Green Package Dock Item */})
const desktopStart = code.indexOf('{/* Active Key Selector */}');
const desktopEndStr = '{/* Green Package Dock Item */}';
const desktopEnd = code.indexOf(desktopEndStr);

if (desktopStart !== -1 && desktopEnd !== -1) {
    code = code.substring(0, desktopStart) + "<CredentialManagerUI ctx={ctx} isMobile={false} />\n                            " + code.substring(desktopEnd);
}

// 4. Replace Mobile Config Engine (from {/* API Credentials */} down to just before {/* Model Selection (Mobile) */})
const mobileStart = code.indexOf('{/* API Credentials */}');
const mobileEndStr = '{/* Model Selection (Mobile) */}';
const mobileEnd = code.indexOf(mobileEndStr);

if (mobileStart !== -1 && mobileEnd !== -1) {
    code = code.substring(0, mobileStart) + "<CredentialManagerUI ctx={ctx} isMobile={true} />\n                        " + code.substring(mobileEnd);
}

fs.writeFileSync('src/dashboard.jsx', code);
console.log('Successfully patched dashboard.jsx');
