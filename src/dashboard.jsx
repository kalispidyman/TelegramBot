import React, { useState, useEffect, useRef } from 'react';
import CredentialManagerUI from './components/CredentialManagerUI';
import ModelSelectorDropdown from './components/ModelSelectorDropdown';
import {
    Menu, Clock, Power, Settings, Terminal, Key, Package,
    Brain, Edit2, Send, CheckCircle2, XCircle, Eye, EyeOff, Lock, RefreshCw,
    Maximize2, Minimize2, ZoomIn, ZoomOut, X
} from 'lucide-react';

// Helper: returns "2 min ago", "3 hrs ago", etc.
function timeAgo(isoString) {
    if (!isoString) return null;
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
    return (
      <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border backdrop-blur-3xl text-white text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />} 
        {msg}
      </div>
    );
}

const NeetBotStudioFinal = () => {
    const [session, setSession] = useState({
        loggedIn: false, email: null, name: null, picture: null,
        hasApiKey: false, maskedApiKey: null,
        hasCustomApiKey: false, maskedCustomApiKey: null,
        activeKeyType: 'openrouter',
        hasGithubToken: false, maskedGithubToken: null,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, chats: []
    });
    const [logs, setLogs] = useState([]);
        const [alibabaModelsList, setAlibabaModelsList] = useState([]);
    const [googleModelsList, setGoogleModelsList] = useState([]);
    const [bluesmindsModelsList, setBluesmindsModelsList] = useState([]);
    const [openrouterModelsList, setOpenrouterModelsList] = useState([]);
    const [customModelsList, setCustomModelsList] = useState([]);
    
    const [selectedKeyType, setSelectedKeyType] = useState('openrouter');
    const [isActivatingKey, setIsActivatingKey] = useState(false);

    useEffect(() => {
        if (session.activeKeyType) {
            setSelectedKeyType(session.activeKeyType);
        }
    }, [session.activeKeyType]);

        const [isEditingKey, setIsEditingKey] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    
    const [githubToken, setGithubToken] = useState('');
    const [isEditingGithubToken, setIsEditingGithubToken] = useState(false);
    const [isSavingGithubToken, setIsSavingGithubToken] = useState(false);

    const [customKey, setCustomKey] = useState('');
    const [customBase, setCustomBase] = useState('');
    const [isEditingCustomKey, setIsEditingCustomKey] = useState(false);
    const [isSavingCustomKey, setIsSavingCustomKey] = useState(false);

    const [alibabaKey, setAlibabaKey] = useState('');
    const [alibabaBase, setAlibabaBase] = useState('https://dashscope-intl.aliyuncs.com/compatible-mode/v1');
    const [isEditingAlibabaKey, setIsEditingAlibabaKey] = useState(false);
    const [isSavingAlibabaKey, setIsSavingAlibabaKey] = useState(false);

    const [googleKey, setGoogleKey] = useState('');
    const [isEditingGoogleKey, setIsEditingGoogleKey] = useState(false);
    const [isSavingGoogleKey, setIsSavingGoogleKey] = useState(false);

    const [bluesmindsKey, setBluesmindsKey] = useState('');
    const [bluesmindsBase, setBluesmindsBase] = useState('https://api.bluesminds.com/v1');
    const [isEditingBluesmindsKey, setIsEditingBluesmindsKey] = useState(false);
    const [isSavingBluesmindsKey, setIsSavingBluesmindsKey] = useState(false);

    const [openrouterKey, setOpenrouterKey] = useState('');
    const [openrouterBase, setOpenrouterBase] = useState('https://openrouter.ai/api/v1');
    const [isEditingOpenrouterKey, setIsEditingOpenrouterKey] = useState(false);
    const [isSavingOpenrouterKey, setIsSavingOpenrouterKey] = useState(false);

    const [customModelInput, setCustomModelInput] = useState('');

    const [chatDraft, setChatDraft] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'config', 'logs'
        const [showGithubTokenInput, setShowGithubTokenInput] = useState(false);
    const [showCustomKeyInput, setShowCustomKeyInput] = useState(false);
    const [showAlibabaKeyInput, setShowAlibabaKeyInput] = useState(false);
    const [showGoogleKeyInput, setShowGoogleKeyInput] = useState(false);
    const [showBluesmindsKeyInput, setShowBluesmindsKeyInput] = useState(false);
    const [showOpenrouterKeyInput, setShowOpenrouterKeyInput] = useState(false);
        const [revealGithubConfigured, setRevealGithubConfigured] = useState(false);
    const [revealCustomConfigured, setRevealCustomConfigured] = useState(false);
    const [revealAlibabaConfigured, setRevealAlibabaConfigured] = useState(false);
    const [revealGoogleConfigured, setRevealGoogleConfigured] = useState(false);
    const [revealBluesmindsConfigured, setRevealBluesmindsConfigured] = useState(false);
    const [revealOpenrouterConfigured, setRevealOpenrouterConfigured] = useState(false);
    const [activeCredentialsTab, setActiveCredentialsTab] = useState('openrouter');
    
    const [activePasswordCard, setActivePasswordCard] = useState(null); // 'boa', 'github', null
    const [passwordTargetAction, setPasswordTargetAction] = useState(null); // 'reveal', 'edit', null
    const [cardPasswordInput, setCardPasswordInput] = useState('');
    const [cardPasswordError, setCardPasswordError] = useState('');
    const [showPowerModal, setShowPowerModal] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [offlineLog, setOfflineLog] = useState([]);

    // File Manager & Preview States
    const [filesList, setFilesList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSavingFile, setIsSavingFile] = useState(false);
    const [newFilePath, setNewFilePath] = useState('');
    const [showNewFileInput, setShowNewFileInput] = useState(false);
    const [mobileSubTab, setMobileSubTab] = useState('explorer'); // 'explorer', 'editor'
    const [editorFontSize, setEditorFontSize] = useState(14); // editor text size
    const [commitMsgInput, setCommitMsgInput] = useState('');
    const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile', 'desktop'
    const [previewKey, setPreviewKey] = useState(0); // For reloading the iframe
    const [expandedPanel, setExpandedPanel] = useState(null);
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [showLogsPanel, setShowLogsPanel] = useState(true);
    const [showConfigPanel, setShowConfigPanel] = useState(true);
    const [showModelPopover, setShowModelPopover] = useState(false);
    const [showMetricsPopover, setShowMetricsPopover] = useState(false);
    const [showCredentialsPopover, setShowCredentialsPopover] = useState(false);


    const [projects, setProjects] = useState([]);
    const [activeProjectIndex, setActiveProjectIndex] = useState(0);

    const desktopContainerRef = useRef(null);
    const [desktopDimensions, setDesktopDimensions] = useState({ scale: 1, height: 350 });
    
    const mobileContainerRef = useRef(null);
    const [mobileContainerScale, setMobileContainerScale] = useState(1);

    useEffect(() => {
        if (!mobileContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const height = entries[0].contentRect.height;
                // Device height is 550px + we want a bit of padding (e.g., 30px)
                const targetHeight = 580;
                if (height < targetHeight) {
                    setMobileContainerScale(height / targetHeight);
                } else {
                    setMobileContainerScale(1);
                }
            }
        });
        observer.observe(mobileContainerRef.current);
        return () => observer.disconnect();
    }, [previewMode, showLivePreview, expandedPanel]);

    useEffect(() => {
        if (!desktopContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const width = entries[0].contentRect.width;
                setDesktopDimensions({
                    scale: width / 1280,
                    height: (width * (720 / 1280)) + 24 // 24px is the height of macOS top bar (h-6)
                });
            }
        });
        observer.observe(desktopContainerRef.current);
        return () => observer.disconnect();
    }, [previewMode, showLivePreview, expandedPanel]);

    const fetchFilesList = async () => {
        setIsLoadingFiles(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/repo/files`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // files is now Array<{ path, lastModified }>
                    setFilesList(data.files || []);
                }
            }
        } catch (err) {
            console.error("Failed to fetch files list:", err);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleSelectFile = async (fileItem) => {
        // fileItem can be { path, lastModified } or a plain string (legacy)
        const filePath = typeof fileItem === 'string' ? fileItem : fileItem.path;
        setSelectedFile(filePath);
        setMobileSubTab('editor');
        setIsLoadingContent(true);
        setCommitMsgInput('');
        try {
            const res = await fetch(`${BACKEND_URL}/api/repo/file-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setFileContent(data.content || '');
                }
            }
        } catch (err) {
            console.error("Failed to fetch file content:", err);
            setToast({ msg: 'Failed to read file content!', type: 'error' });
        } finally {
            setIsLoadingContent(false);
        }
    };

    const handleSaveFile = async () => {
        if (!selectedFile) return;
        setIsSavingFile(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/repo/save-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: selectedFile,
                    content: fileContent,
                    commitMessage: commitMsgInput.trim() || `Update ${selectedFile} directly from File Manager`
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setToast({ msg: 'File committed to GitHub!', type: 'success' });
                    setCommitMsgInput('');
                    fetchFilesList();
                } else {
                    setToast({ msg: data.error || 'Failed to save file', type: 'error' });
                }
            } else {
                const data = await res.json();
                setToast({ msg: data.error || 'Failed to save file', type: 'error' });
            }
        } catch (err) {
            console.error("Error saving file:", err);
            setToast({ msg: 'Network error saving file', type: 'error' });
        } finally {
            setIsSavingFile(false);
        }
    };

    const handleCreateFile = () => {
        if (!newFilePath.trim()) {
            setToast({ msg: 'File path cannot be empty!', type: 'error' });
            return;
        }
        const cleanedPath = newFilePath.trim();
        setSelectedFile(cleanedPath);
        setFileContent('');
        setCommitMsgInput(`Create new file ${cleanedPath}`);
        setShowNewFileInput(false);
        setNewFilePath('');
        setMobileSubTab('editor');
        setToast({ msg: `New file staged: ${cleanedPath}. Paste content and click Save!`, type: 'success' });
    };

    const handleRefreshFiles = () => {
        fetchFilesList();
        setToast({ msg: 'Refreshing repository tree...', type: 'success' });
    };

    const handleReloadPreview = () => {
        setPreviewKey(prev => prev + 1);
        setToast({ msg: 'Reloading live preview...', type: 'success' });
    };

    const handleOpenExternalPreview = () => {
        const url = session.liveUrl || 'https://raagneet.vercel.app';
        if (previewMode === 'desktop') {
            window.open(url, '_blank');
        } else {
            const newWin = window.open('', '_blank');
            if (newWin) {
                newWin.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Mobile Preview Canvas</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { margin: 0; background: #020617; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: auto; font-family: system-ui, sans-serif; padding: 20px; box-sizing: border-box; }
                            .phone { width: 375px; height: 812px; border-radius: 44px; border: 12px solid #0f172a; background: #000; overflow: hidden; position: relative; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 0 2px rgba(255,255,255,0.05); flex-shrink: 0; }
                            .speaker-grill { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 100px; height: 20px; background: #0f172a; border-radius: 12px; z-index: 40; display: flex; align-items: center; justify-content: center; }
                            .camera { width: 8px; height: 8px; border-radius: 50%; background: #020617; border: 1px solid #1e293b; position: absolute; left: 10px; }
                            .mic { width: 40px; height: 2px; background: #1e293b; border-radius: 4px; }
                            .viewport { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 32px; overflow: hidden; background: #fff; }
                            iframe { width: 100%; height: 100%; border: none; background: #fff; }
                            .watermark { position: fixed; bottom: 20px; right: 20px; color: rgba(255,255,255,0.2); font-weight: bold; letter-spacing: 2px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="phone">
                            <div class="speaker-grill">
                                <div class="camera"></div>
                                <div class="mic"></div>
                            </div>
                            <div class="viewport">
                                <iframe src="${url}"></iframe>
                            </div>
                        </div>
                        <div class="watermark">QUANTUM AI MOBILE SIMULATOR</div>
                    </body>
                    </html>
                `);
                newWin.document.close();
            } else {
                // Fallback if popup blocker is active
                window.open(url, '_blank');
            }
        }
    };

    const handleShutdownConfirm = async () => {
        setShowPowerModal(false);
        setIsOffline(true);
        setOfflineLog(['[SYSTEM SHUTDOWN SEQUENCE INITIATED]']);
        
        const steps = [
            'HALTING ACTIVE TELEGRAM BOT WEBHOOK... [OK]',
            'TERMINATING ALL RUNNING COMPILER THREADS... [OK]',
            'KILLING PERSISTENT PTY SHELL SUB-PROCESSES... [OK]',
            'DEACTIVATING IDLE KEEPALIVE CRON SCHEDULERS... [OK]',
            'RELEASING BINDED HTTP SERVER NETWORK PORTS... [OK]',
            'CLEANING VOLATILE TELEMETRY SESSION CACHING... [OK]',
            'SYSTEM GOING OFFLINE. UPLINK TERMINATED.'
        ];
        
        steps.forEach((step, idx) => {
            setTimeout(() => {
                setOfflineLog(prev => [...prev, step]);
            }, (idx + 1) * 350);
        });

        try {
            await fetch(`${BACKEND_URL}/api/shutdown`, { method: 'POST' });
        } catch (_) {}
    };

    const chatEndRef = useRef(null);

    const fetchSession = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/session`);
            if (res.ok) setSession(await res.json());
        } catch (_) {}
    };

    const handleCardPasswordSubmit = (card) => {
        if (cardPasswordInput === 'kali') {
            if (card === 'github') {
                if (passwordTargetAction === 'reveal') {
                    setRevealGithubConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingGithubToken(true);
                    setGithubToken(session.rawGithubToken || '');
                }
            } else if (card === 'custom') {
                if (passwordTargetAction === 'reveal') {
                    setRevealCustomConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingCustomKey(true);
                    setCustomKey(session.rawCustomApiKey || '');
                    setCustomBase(session.customApiBase || '');
                }
            } else if (card === 'alibaba') {
                if (passwordTargetAction === 'reveal') {
                    setRevealAlibabaConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingAlibabaKey(true);
                    setAlibabaKey(session.rawAlibabaApiKey || '');
                    setAlibabaBase(session.alibabaApiBase || '');
                }
            } else if (card === 'google') {
                if (passwordTargetAction === 'reveal') {
                    setRevealGoogleConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingGoogleKey(true);
                    setGoogleKey(session.rawGoogleApiKey || '');
                }
            } else if (card === 'bluesminds') {
                if (passwordTargetAction === 'reveal') {
                    setRevealBluesmindsConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingBluesmindsKey(true);
                    setBluesmindsKey(session.rawBluesmindsApiKey || '');
                    setBluesmindsBase(session.bluesmindsApiBase || '');
                }
            } else if (card === 'openrouter') {
                if (passwordTargetAction === 'reveal') {
                    setRevealOpenrouterConfigured(true);
                } else if (passwordTargetAction === 'edit') {
                    setIsEditingOpenrouterKey(true);
                    setOpenrouterKey(session.rawOpenrouterApiKey || '');
                    setOpenrouterBase(session.openrouterApiBase || '');
                }
            }
            setActivePasswordCard(null);
            setCardPasswordInput('');
            setCardPasswordError('');
        } else {
            setCardPasswordError('Wrong password!');
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/logs`);
            if (res.ok) { const d = await res.json(); setLogs(d.logs || []); }
        } catch (_) {}
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
                setActiveProjectIndex(data.activeIndex || 0);
            }
        } catch (_) {}
    };

    const handleSwitchProject = async (index) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/projects/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index })
            });
            if (res.ok) {
                setActiveProjectIndex(index);
                setToast({ msg: 'Switched Project Context Successfully!', type: 'success' });
            }
        } catch (_) {
            setToast({ msg: 'Network error switching project', type: 'error' });
        }
    };

    const fetchModels = async (provider = null) => {
        try {
            if (provider === 'alibaba' || !provider) {
                const res = await fetch(`${BACKEND_URL}/api/models?provider=alibaba`);
                if (res.ok) { const data = await res.json(); setAlibabaModelsList(data.models || []); }
            }
            if (provider === 'google' || !provider) {
                const res = await fetch(`${BACKEND_URL}/api/models?provider=google`);
                if (res.ok) { const data = await res.json(); setGoogleModelsList(data.models || []); }
            }
            if (provider === 'bluesminds' || !provider) {
                const res = await fetch(`${BACKEND_URL}/api/models?provider=bluesminds`);
                if (res.ok) { const data = await res.json(); setBluesmindsModelsList(data.models || []); }
            }
            if (provider === 'openrouter' || !provider) {
                const res = await fetch(`${BACKEND_URL}/api/models?provider=openrouter`);
                if (res.ok) { const data = await res.json(); setOpenrouterModelsList(data.models || []); }
            }
            if (provider === 'custom' || !provider) {
                const res = await fetch(`${BACKEND_URL}/api/models?provider=custom`);
                if (res.ok) { const data = await res.json(); setCustomModelsList(data.models || []); }
            }
        } catch (_) {}
    };

    const handleRefresh = async () => {
        await Promise.all([fetchSession(), fetchLogs(), fetchModels(), fetchProjects()]);
    };

    const handleActivateKeyType = async (type) => {
        setIsActivatingKey(true);
        try {
            const body = { activeKeyType: type };
            
                        if (type === 'custom' && isEditingCustomKey && customKey.trim()) { body.customApiKey = customKey.trim(); body.customApiBase = customBase.trim(); }
            if (type === 'alibaba' && isEditingAlibabaKey && alibabaKey.trim()) { body.alibabaApiKey = alibabaKey.trim(); body.alibabaApiBase = alibabaBase.trim(); }
            if (type === 'google' && isEditingGoogleKey && googleKey.trim()) body.googleApiKey = googleKey.trim();
            if (type === 'bluesminds' && isEditingBluesmindsKey && bluesmindsKey.trim()) { body.bluesmindsApiKey = bluesmindsKey.trim(); body.bluesmindsApiBase = bluesmindsBase.trim(); }
            if (type === 'openrouter' && isEditingOpenrouterKey && openrouterKey.trim()) { body.openrouterApiKey = openrouterKey.trim(); body.openrouterApiBase = openrouterBase.trim(); }

            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const keyNames = { alibaba: 'Alibaba', custom: 'Custom', google: 'Google', bluesminds: 'Bluesminds', openrouter: 'OpenRouter' };
                setToast({ msg: `${keyNames[type] || 'API'} Engine Activated & Config Saved!`, type: 'success' });
                
                                if (type === 'custom') setIsEditingCustomKey(false);
                if (type === 'alibaba') setIsEditingAlibabaKey(false);
                if (type === 'google') setIsEditingGoogleKey(false);
                if (type === 'bluesminds') setIsEditingBluesmindsKey(false);
                if (type === 'openrouter') setIsEditingOpenrouterKey(false);

                fetchSession();
                fetchModels();
            } else {
                setToast({ msg: (await res.json()).error || 'Failed to activate API Key', type: 'error' });
            }
        } catch (_) {
            setToast({ msg: 'Network error', type: 'error' });
        } finally {
            setIsActivatingKey(false);
        }
    };

    const handleSaveKey = async () => {
        const trimmedKey = boaKey.trim();
        if (!trimmedKey && !session.hasApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingKey(true);
        try {
            const body = { activeKeyType: 'openrouter' };
            if (trimmedKey) body.apiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'API Key Saved & Activated!', type: 'success' }); 
                setIsEditingKey(false); 
                fetchSession(); 
                fetchModels('boa'); 
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingKey(false); }
    };

    const handleSaveCustomKey = async () => {
        const trimmedKey = customKey.trim();
        if (!trimmedKey && !session.hasCustomApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingCustomKey(true);
        try {
            const body = { customApiBase: customBase.trim(), activeKeyType: 'custom' };
            if (trimmedKey) body.customApiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'Custom Key Saved & Activated!', type: 'success' }); 
                setIsEditingCustomKey(false); 
                fetchSession(); 
                fetchModels('custom');
            }
            else setToast({ msg: (await res.json()).error || 'Failed to update custom key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingCustomKey(false); }
    };

    const handleSaveAlibabaKey = async () => {
        const trimmedKey = alibabaKey.trim();
        if (!trimmedKey && !session.hasAlibabaApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingAlibabaKey(true);
        try {
            const body = { alibabaApiBase: alibabaBase.trim(), activeKeyType: 'alibaba' };
            if (trimmedKey) body.alibabaApiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'Alibaba Key Saved & Activated!', type: 'success' }); 
                setIsEditingAlibabaKey(false); 
                fetchSession(); 
                fetchModels('alibaba');
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update alibaba key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingAlibabaKey(false); }
    };

    const handleSaveGoogleKey = async () => {
        const trimmedKey = googleKey.trim();
        if (!trimmedKey && !session.hasGoogleApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingGoogleKey(true);
        try {
            const body = { activeKeyType: 'google' };
            if (trimmedKey) body.googleApiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'Google Key Saved & Activated!', type: 'success' }); 
                setIsEditingGoogleKey(false); 
                fetchSession(); 
                fetchModels('google');
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update google key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingGoogleKey(false); }
    };

    const handleSaveBluesmindsKey = async () => {
        const trimmedKey = bluesmindsKey.trim();
        if (!trimmedKey && !session.hasBluesmindsApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingBluesmindsKey(true);
        try {
            const body = { bluesmindsApiBase: bluesmindsBase.trim(), activeKeyType: 'bluesminds' };
            if (trimmedKey) body.bluesmindsApiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'Bluesminds Key Saved & Activated!', type: 'success' }); 
                setIsEditingBluesmindsKey(false); 
                fetchSession(); 
                fetchModels('bluesminds');
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update bluesminds key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingBluesmindsKey(false); }
    };

    const handleSaveOpenrouterKey = async () => {
        const trimmedKey = openrouterKey.trim();
        if (!trimmedKey && !session.hasOpenrouterApiKey) {
            setToast({ msg: 'API key cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingOpenrouterKey(true);
        try {
            const body = { openrouterApiBase: openrouterBase.trim(), activeKeyType: 'openrouter' };
            if (trimmedKey) body.openrouterApiKey = trimmedKey;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'OpenRouter Key Saved & Activated!', type: 'success' }); 
                setIsEditingOpenrouterKey(false); 
                fetchSession(); 
                fetchModels('openrouter');
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update openrouter key', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingOpenrouterKey(false); }
    };

    const handleSaveGithubToken = async () => {
        const trimmedToken = githubToken.trim();
        if (!trimmedToken && !session.hasGithubToken) {
            setToast({ msg: 'Token cannot be empty!', type: 'error' });
            return;
        }
        setIsSavingGithubToken(true);
        try {
            const body = {};
            if (trimmedToken) body.githubToken = trimmedToken;
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            if (res.ok) { 
                setToast({ msg: 'GitHub Token updated!', type: 'success' }); 
                setIsEditingGithubToken(false); 
                fetchSession(); 
            } 
            else setToast({ msg: (await res.json()).error || 'Failed to update token', type: 'error' });
        } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingGithubToken(false); }
    };

    const handleModelSelect = async (modelId) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/credentials`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelName: modelId })
            });
            if (res.ok) { setToast({ msg: 'Model updated!', type: 'success' }); fetchSession(); }
        } catch (_) {}
    };

    const handleSendChat = async () => {
        if (!chatDraft.trim()) return;
        setIsSendingChat(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: chatDraft })
            });
            if (res.ok) { setChatDraft(''); fetchSession(); }
        } catch (_) { setToast({ msg: 'Failed to send message', type: 'error' }); } finally { setIsSendingChat(false); }
    };

    const chatContainerRef = useRef(null);
    const terminalRef = useRef(null);
    
    // Function to strip ANSI escape codes from raw terminal logs
    const stripAnsi = (str) => {
        if (!str) return '';
        return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    };

    useEffect(() => { 
        handleRefresh(); 
        fetchFilesList();
        const iv = setInterval(() => { fetchSession(); fetchLogs(); }, 2500); 
        return () => clearInterval(iv); 
    }, []);
    
    useEffect(() => {
        if (activeTab === 'files') {
            fetchFilesList();
        }
    }, [activeTab]);
    
    // Use scrollTo on the exact container instead of scrollIntoView to prevent the entire page/hero section from shifting up
    useEffect(() => { 
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [session.chats?.length, session.isThinking]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs.length]);

    const usage = session.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const fmt = (iso) => { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

    // Lightweight markdown renderer: converts **bold**, `code`, bullet lists, and line breaks into JSX
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, lineIdx) => {
            // Skip empty lines (render as small spacer)
            if (line.trim() === '') return <div key={lineIdx} className="h-1" />;

            // Detect bullet lines starting with * or -
            const isBullet = /^[\*\-]\s+/.test(line.trim());
            const cleanLine = isBullet ? line.replace(/^[\*\-]\s+/, '') : line;

            // Inline token renderer: **bold**, `code`, plain text
            const renderInline = (str) => {
                const parts = [];
                const tokenRegex = /(!\[[^\]]*\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
                let last = 0, m;
                while ((m = tokenRegex.exec(str)) !== null) {
                    if (m.index > last) parts.push(<span key={last}>{str.slice(last, m.index)}</span>);
                    const token = m[0];
                    if (token.startsWith('![')) {
                        const urlMatch = token.match(/\(([^)]+)\)/);
                        if (urlMatch) {
                            parts.push(<img key={m.index} src={urlMatch[1]} className="max-w-[200px] sm:max-w-xs md:max-w-sm rounded-xl my-2 border border-white/10 shadow-lg object-contain" alt="Generated" loading="lazy" />);
                        }
                    } else if (token.startsWith('`') && token.endsWith('`')) {
                        parts.push(<code key={m.index} className="bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono break-all">{token.slice(1, -1)}</code>);
                    } else if (token.startsWith('**')) {
                        parts.push(<strong key={m.index} className="text-white font-semibold">{token.slice(2, -2)}</strong>);
                    } else if (token.startsWith('*')) {
                        parts.push(<em key={m.index} className="text-cyan-200 not-italic">{token.slice(1, -1)}</em>);
                    }
                    last = m.index + token.length;
                }
                if (last < str.length) parts.push(<span key={last}>{str.slice(last)}</span>);
                return parts.length > 0 ? parts : [str];
            };

            if (isBullet) {
                return (
                    <div key={lineIdx} className="flex gap-2 items-start mt-0.5">
                        <span className="text-cyan-400 mt-1 shrink-0">•</span>
                        <span>{renderInline(cleanLine)}</span>
                    </div>
                );
            }
            return <div key={lineIdx} className="mt-0.5">{renderInline(line)}</div>;
        });
    };

    if (isOffline) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-50 font-mono text-xs sm:text-sm text-green-400 select-none overflow-hidden">
                {/* Vintage CRT scanlines & flicker effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-950/10 pointer-events-none z-10 mix-blend-overlay" />
                
                <div className="w-full max-w-xl p-8 border border-green-500/30 rounded-lg bg-black/80 shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col gap-4 animate-pulse duration-1000">
                    <div className="flex items-center justify-between border-b border-green-500/30 pb-3">
                        <span className="text-green-500 font-bold tracking-widest uppercase">Uplink Lost / Engine Stopped</span>
                        <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                    </div>
                    
                    <div className="flex flex-col gap-2 min-h-[220px]">
                        {offlineLog.map((log, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-left-1 duration-150">
                                <span className="text-green-500/60 mr-2">&gt;</span>
                                <span className={log.includes('OK') ? 'text-green-300' : log.includes('TERMINATED') ? 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-green-400'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-green-500/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[10px] text-green-500/50 uppercase">Power status: disconnected (0V)</span>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 border border-green-500/50 rounded hover:bg-green-500/10 active:bg-green-500/20 text-xs text-green-300 font-bold tracking-widest transition uppercase"
                        >
                            Trigger Reboot
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    
    const ctx = {
        session, activeCredentialsTab, setActiveCredentialsTab,
        selectedKeyType, setSelectedKeyType, handleActivateKeyType, isActivatingKey,
        cardPasswordInput, setCardPasswordInput, cardPasswordError, setCardPasswordError,
        activePasswordCard, setActivePasswordCard, setPasswordTargetAction, handleCardPasswordSubmit,
        isEditingKey, setIsEditingKey, isSavingKey, handleSaveKey, isEditingGithubToken, setIsEditingGithubToken, isSavingGithubToken, handleSaveGithubToken, githubToken, setGithubToken,
        showGithubTokenInput, setShowGithubTokenInput, revealGithubConfigured, setRevealGithubConfigured,
        isEditingCustomKey, setIsEditingCustomKey, isSavingCustomKey, handleSaveCustomKey, customKey, setCustomKey, customBase, setCustomBase,
        showCustomKeyInput, setShowCustomKeyInput, revealCustomConfigured, setRevealCustomConfigured,
        isEditingAlibabaKey, setIsEditingAlibabaKey, isSavingAlibabaKey, handleSaveAlibabaKey, alibabaKey, setAlibabaKey, alibabaBase, setAlibabaBase,
        showAlibabaKeyInput, setShowAlibabaKeyInput, revealAlibabaConfigured, setRevealAlibabaConfigured,
        isEditingGoogleKey, setIsEditingGoogleKey, isSavingGoogleKey, handleSaveGoogleKey, googleKey, setGoogleKey,
        showGoogleKeyInput, setShowGoogleKeyInput, revealGoogleConfigured, setRevealGoogleConfigured,
        isEditingBluesmindsKey, setIsEditingBluesmindsKey, isSavingBluesmindsKey, handleSaveBluesmindsKey, bluesmindsKey, setBluesmindsKey, bluesmindsBase, setBluesmindsBase,
        showBluesmindsKeyInput, setShowBluesmindsKeyInput, revealBluesmindsConfigured, setRevealBluesmindsConfigured,
        isEditingOpenrouterKey, setIsEditingOpenrouterKey, isSavingOpenrouterKey, handleSaveOpenrouterKey, openrouterKey, setOpenrouterKey, openrouterBase, setOpenrouterBase,
        showOpenrouterKeyInput, setShowOpenrouterKeyInput, revealOpenrouterConfigured, setRevealOpenrouterConfigured,
    };

    return (
        <div className="h-[100dvh] w-full bg-[#020308] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30 flex flex-col">

            {/* 1. DEEP SPACE BACKGROUND */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen blur-[3px] hidden lg:block animate-slow-pan"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2500&auto=format&fit=crop')" }}
            />
            {/* Static Mobile Background */}
            <div className="absolute inset-0 z-0 bg-[#040812] lg:hidden" />

            {/* Moving Cyberspace Grid Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-[0.06] hidden lg:block animate-grid-drift pointer-events-none"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)', 
                    backgroundSize: '50px 50px' 
                }}
            />

            {/* Subtle Ambient Glows (Faster & higher-offset floating motion) */}
            <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-cyan-500/06 rounded-full blur-[120px] pointer-events-none hidden lg:block animate-float-1" />
            <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-blue-600/06 rounded-full blur-[150px] pointer-events-none hidden lg:block animate-float-2" />
            <div className="absolute top-[40%] right-[40%] w-[400px] h-[400px] bg-orange-500/04 rounded-full blur-[100px] pointer-events-none hidden lg:block animate-float-3" />

            {/* 2. FOREGROUND UI */}
            <div className="relative z-10 flex flex-col h-[100dvh] p-4 pb-24 lg:pb-6 max-w-full lg:px-8 mx-auto w-full overflow-hidden">

                {/* === HEADER === */}
                <header className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-0 mb-8 shrink-0">

                    {/* Left: Main Brand Pill */}
                    <div className="flex items-center px-4 py-2 sm:px-8 sm:py-3.5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_8px_32px_rgba(0,0,0,0.5)]">
                        <h1 className="text-base sm:text-2xl font-bold tracking-[0.15em] text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            NEET BOT STUDIO
                        </h1>
                    </div>

                    {/* Center: System Status Badge (Fixed double title) */}
                    <div className="relative flex flex-col items-center px-6 py-1.5 sm:px-12 sm:py-3 bg-white/[0.05] backdrop-blur-3xl border-t border-b border-white/10 rounded-2xl sm:rounded-[30px] shadow-[inset_0_1px_3px_rgba(255,255,255,0.1),_0_10px_40px_rgba(0,0,0,0.4)]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <h2 className="text-xs sm:text-lg font-bold tracking-widest text-white/90 uppercase">QUANTUM AI INTERFACE</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-1 sm:mt-0.5">
                            <p className="text-[8px] sm:text-[10px] font-medium tracking-[0.2em] sm:tracking-[0.3em] text-cyan-200/70 uppercase">
                                System Active // V3.0
                            </p>
                            {projects && projects.length > 0 && (
                                <select
                                    value={activeProjectIndex}
                                    onChange={(e) => handleSwitchProject(Number(e.target.value))}
                                    className="bg-cyan-950/40 hover:bg-cyan-900/60 transition-colors border border-cyan-500/40 text-cyan-300 text-[9px] sm:text-[10px] rounded px-2 py-0.5 outline-none cursor-pointer tracking-widest uppercase font-bold text-center appearance-none"
                                >
                                    {projects.map((p, i) => (
                                        <option key={i} value={i} className="bg-[#05080f] text-cyan-300">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-4">
                        <button className="p-3.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:bg-white/10 transition">
                            <Menu className="w-5 h-5 text-white/80" />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                            <Clock className="w-4 h-4 text-white/60" />
                            <span className="text-sm font-mono text-white/70">v3.0</span>
                        </div>
                        {session.hasApiKey ? (
                            <button className="px-6 py-3 bg-emerald-900/30 backdrop-blur-xl border border-emerald-500/40 rounded-full shadow-[inset_0_1px_2px_rgba(16,185,129,0.3),_0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-900/50 transition">
                                <span className="text-sm font-bold tracking-widest text-emerald-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">SYSTEM ONLINE</span>
                            </button>
                        ) : (
                            <button className="px-6 py-3 bg-red-900/30 backdrop-blur-xl border border-red-500/40 rounded-full shadow-[inset_0_1px_2px_rgba(255,100,100,0.3),_0_0_20px_rgba(220,38,38,0.2)] hover:bg-red-900/50 transition">
                                <span className="text-sm font-bold tracking-widest text-red-100 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">NO API KEY</span>
                            </button>
                        )}
                        <button 
                            onClick={() => setShowPowerModal(true)}
                            className="p-3.5 bg-red-950/20 hover:bg-red-950/40 backdrop-blur-xl border border-red-500/20 hover:border-red-500/50 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_0_15px_rgba(239,68,68,0.05)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition group"
                        >
                            <Power className="w-5 h-5 text-red-400 group-hover:text-red-300 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] transition" />
                        </button>
                    </div>
                </header>

                {/* === MAIN DASHBOARD GRID === */}
                <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden pb-4 lg:pb-0">

                    {/* --- LEFT COLUMN: CONFIG ENGINE --- */}
                    {/* Desktop Sleek Slim Panel Dock */}
                    <div 
                        className={`hidden lg:flex flex-col items-center py-6 bg-gradient-to-b from-[#0f1424]/95 via-[#070b15]/98 to-[#03050a]/99 border border-cyan-500/25 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.07),_0_0_30px_rgba(34,211,238,0.12),_0_20px_50px_rgba(0,0,0,0.6)] gap-6 shrink-0 transition-all duration-300 origin-left relative z-[45] ${
                            showConfigPanel 
                            ? 'w-[80px] min-w-[80px] max-w-[80px] opacity-100 scale-100 pointer-events-auto px-2' 
                            : 'w-0 min-w-0 max-w-0 opacity-0 scale-90 pointer-events-none overflow-hidden border-none px-0 py-0 gap-0'
                        }`}
                    >
                        
                        {/* Decorative glowing vertical indicator line */}
                        {showConfigPanel && (
                            <div className="absolute right-0 top-[15%] bottom-[15%] w-[2px] bg-gradient-to-b from-cyan-500/0 via-cyan-400/50 to-cyan-500/0 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none" />
                        )}

                        {/* Rotating Logo Header */}
                        <div className="flex flex-col items-center cursor-pointer group relative">
                            <div className="w-12 h-12 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.25)] relative group-hover:scale-105 transition-all duration-300">
                                <Settings className="w-6 h-6 text-cyan-300 animate-[spin_8s_linear_infinite]" />
                            </div>
                            <span className="text-[8px] font-bold tracking-widest text-cyan-400/80 uppercase mt-2 scale-90">Dock</span>
                            {/* Zero-latency Micro-Tooltip */}
                            <div className="absolute left-[74px] top-3 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#090e1d] border border-cyan-500/30 text-cyan-200 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                                Config Dock
                            </div>
                        </div>

                        <div className="w-10 h-[1px] bg-white/10 shrink-0" />

                        {/* Sleek Tool Items Stack */}
                        <div className="flex flex-col gap-3.5 flex-grow">
                            {/* Terminal Dock Item */}
                            <div className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/10 rounded-2xl transition-all duration-300 cursor-pointer relative group">
                                <Terminal className="w-5 h-5 text-cyan-100 group-hover:text-cyan-300 transition-colors" />
                                <div className="absolute bottom-1 w-4 h-0.5 bg-cyan-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Zero-latency Micro-Tooltip */}
                                <div className="absolute left-[74px] scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#090e1d] border border-cyan-500/30 text-cyan-200 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                                    Terminal Uplink
                                </div>
                            </div>

                            {/* Purple Key Dock Item */}
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCredentialsPopover(!showCredentialsPopover);
                                    setShowModelPopover(false);
                                    setShowMetricsPopover(false);
                                }}
                                className={`w-12 h-12 flex items-center justify-center border rounded-2xl transition-all duration-300 cursor-pointer relative group ${showCredentialsPopover ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-200' : 'bg-white/[0.02] border-white/10 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-white/70 hover:text-white'}`}
                            >
                                <Key className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
                                <div className="absolute bottom-1 w-4 h-0.5 bg-emerald-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Zero-latency Micro-Tooltip - Only render when popover is closed */}
                                {!showCredentialsPopover && (
                                    <div className="absolute left-[74px] scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#0c0a1e] border border-emerald-500/30 text-emerald-200 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                                        Credentials Manager
                                    </div>
                                )}
                            </div>

                            {/* Green Package Dock Item */}
                            <div className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:border-green-400/50 hover:bg-green-500/10 rounded-2xl transition-all duration-300 cursor-pointer relative group">
                                <Package className="w-5 h-5 text-green-300 group-hover:text-green-200 transition-colors" />
                                <div className="absolute bottom-1 w-4 h-0.5 bg-green-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Zero-latency Micro-Tooltip */}
                                <div className="absolute left-[74px] scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#0a100d] border border-green-500/30 text-green-200 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                                    Build Packages
                                </div>
                            </div>
                        </div>

                        <div className="w-10 h-[1px] bg-white/10 shrink-0" />

                        {/* Bottom Controls Stack */}
                        <div className="flex flex-col gap-4 items-center shrink-0 w-full relative">

                            {/* Metrics Trigger */}
                            <div className="relative group">
                                <button 
                                    onClick={() => {
                                        setShowMetricsPopover(!showMetricsPopover);
                                        setShowModelPopover(false);
                                        setShowCredentialsPopover(false);
                                    }}
                                    className={`w-12 h-12 flex flex-col items-center justify-center border rounded-2xl transition-all duration-300 cursor-pointer relative ${showMetricsPopover ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] text-cyan-200' : 'bg-white/[0.02] border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/5 text-white/70 hover:text-white'}`}
                                >
                                    <Terminal className="w-4 h-4" />
                                    <span className="text-[8px] font-black text-cyan-300 mt-1">
                                        {usage?.total_tokens ? (usage.total_tokens > 9999 ? `${Math.round(usage.total_tokens / 1000)}k` : usage.total_tokens) : '0'}
                                    </span>
                                </button>
                                {/* Zero-latency Micro-Tooltip - Only render when popover is closed */}
                                {!showMetricsPopover && (
                                    <div className="absolute left-[74px] top-3 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#090e1d] border border-cyan-500/30 text-cyan-200 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                                        Token Usage
                                    </div>
                                )}

                                {/* Metrics Popover — rendered at root level below */}
                            </div>

                        </div>
                    </div>

                    {/* Mobile Full-width Configuration Panel (only visible on lg:hidden when activeTab === 'config') */}
                    <div className={`flex lg:hidden flex-col gap-6 min-h-0 shrink-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 w-full h-full ${activeTab === 'config' ? 'flex' : 'hidden'}`}>
                        <div className="flex justify-between items-center ml-2 shrink-0">
                            <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Config Engine</h3>
                        </div>

                        {/* Exactly replicated staggered Grid */}
                        <div className="grid grid-cols-3 gap-3 shrink-0">
                            {/* Large Gear */}
                            <div className="col-span-1 row-span-2 flex items-center justify-center bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_0_25px_rgba(34,211,238,0.15)] relative h-full">
                                <Settings className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                <div className="absolute bottom-4 w-12 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]" />
                            </div>

                            {/* Terminal */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl h-24">
                                <Terminal className="w-6 h-6 text-cyan-100" />
                            </div>

                            {/* Key */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl h-24 relative">
                                <Key className="w-6 h-6 text-emerald-300" />
                            </div>

                            {/* Small Gear */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl h-24 relative">
                                <Settings className="w-6 h-6 text-emerald-300" />
                            </div>

                            {/* Package */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-green-500/5 backdrop-blur-xl border border-green-500/20 rounded-2xl h-24 relative">
                                <Package className="w-6 h-6 text-green-300" />
                            </div>
                        </div>

                        <CredentialManagerUI ctx={ctx} isMobile={true} />
                        {/* Model Selection (Mobile) */}
                        <div className="flex flex-col gap-3 shrink-0">
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase ml-1">Model Selection</h4>
                            <div className="flex flex-col gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Active Model</span>
                                    <span className="text-[10px] font-mono text-cyan-300 truncate max-w-[180px]">{session.modelName || 'None selected'}</span>
                                </div>
                                <ModelSelectorDropdown
                                    activeModel={session.modelName || ''}
                                    onModelSelect={handleModelSelect}
                                    activeKeyType={session.activeKeyType}
                                                                        customModelsList={customModelsList}
                                    alibabaModelsList={alibabaModelsList}
                                    googleModelsList={googleModelsList}
                                    bluesmindsModelsList={bluesmindsModelsList}
                                    openrouterModelsList={openrouterModelsList}
                                />
                                {session.activeKeyType !== 'openrouter' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customModelInput}
                                            onChange={(e) => setCustomModelInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && customModelInput.trim()) { handleModelSelect(customModelInput.trim()); setCustomModelInput(''); }}}
                                            className="flex-grow bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-mono text-emerald-200 outline-none focus:border-emerald-400 placeholder-white/20"
                                            placeholder="Or type model name..."
                                        />
                                        <button
                                            onClick={() => { if (customModelInput.trim()) { handleModelSelect(customModelInput.trim()); setCustomModelInput(''); }}}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition"
                                        >Set</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Model & Metrics (Mobile) */}
                        <div className="flex flex-col sm:flex-row gap-4 min-h-[280px] shrink-0">
                            {/* Spacer - model section moved above */}

                            {/* Token Metrics */}
                            <div className="flex-1 flex flex-col bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 relative overflow-hidden">
                                <h4 className="text-sm font-medium text-white/90 relative z-10 mb-2">Token Metrics</h4>
                                <div className="flex flex-col gap-2 mt-1 relative z-10 text-[11px] font-mono text-white/70">
                                    <div className="flex justify-between items-center bg-black/25 px-3 py-1.5 rounded-lg border border-white/5">
                                        <span>Prompt:</span>
                                        <span className="text-cyan-300 font-bold">{(usage?.prompt_tokens || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/25 px-3 py-1.5 rounded-lg border border-white/5">
                                        <span>Completion:</span>
                                        <span className="text-violet-300 font-bold">{(usage?.completion_tokens || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-lg border border-cyan-500/20">
                                        <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">Total:</span>
                                        <span className="text-cyan-300 font-black text-sm">{(usage?.total_tokens || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CENTER COLUMN: COMMAND UPLINK --- */}
                    <div className={`flex flex-col min-h-0 min-w-0 ${expandedPanel === 'center' ? 'w-full lg:w-full flex-grow' : expandedPanel ? 'hidden lg:hidden' : 'flex-grow'} ${activeTab === 'chat' || activeTab === 'files' ? 'flex h-full' : 'hidden lg:flex'}`}>

                        {/* Compact Inline Header: Title & Segmented Toggle & Maximize */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 shrink-0 transition-all">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowConfigPanel(!showConfigPanel)} className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer shrink-0" title={showConfigPanel ? "Hide Config Engine" : "Show Config Engine"}>
                                    <Settings className={`w-4 h-4 ${showConfigPanel ? 'text-cyan-400' : 'text-white/40'}`} />
                                </button>
                                <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase pl-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] shrink-0 hidden md:block">
                                    {activeTab === 'files' ? 'Repository File Manager' : 'Command Uplink'}
                                </h3>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="hidden md:flex gap-1 p-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full shrink-0 relative z-30">
                                    <button 
                                        onClick={() => setActiveTab('chat')}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === 'chat' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-white/60 hover:text-white/90'}`}
                                    >
                                        Command Uplink
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('files')}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === 'files' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-white/60 hover:text-white/90'}`}
                                    >
                                        File Manager
                                    </button>
                                </div>
                                <button onClick={() => setShowLogsPanel(!showLogsPanel)} className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition cursor-pointer shrink-0" title={showLogsPanel ? "Hide Activity Feed" : "Show Activity Feed"}>
                                    <Terminal className={`w-4 h-4 ${showLogsPanel ? 'text-cyan-400' : ''}`} />
                                </button>
                                <button onClick={() => setExpandedPanel(expandedPanel === 'center' ? null : 'center')} className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition cursor-pointer shrink-0" title={expandedPanel === 'center' ? "Restore Down" : "Maximize"}>
                                    {expandedPanel === 'center' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Top Floating Badges */}
                        {activeTab === 'chat' && (
                            <div className="hidden lg:flex w-full flex-col items-center gap-3 mb-6 relative z-20 shrink-0">

                                {/* Operator */}
                                <div className="px-5 py-2 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center gap-2">
                                    <span className="text-xs font-medium text-white/80">Operator:</span>
                                    <span className="text-xs font-bold text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Identity Verified</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'files' ? (
                            /* Beautiful Glassmorphic File Manager & Preview */
                            <div className="w-full flex-grow flex flex-col lg:flex-row gap-6 min-h-[500px] xl:min-h-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                
                                {/* Left Side: File Manager (Browser and Editor) */}
                                <div className="flex-grow flex-1 flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-3 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
                                    
                                    {/* Mobile Sub-tabs: only visible on md:hidden */}
                                    <div className="flex md:hidden w-full p-1 bg-black/40 border border-white/10 rounded-2xl gap-1 mb-4 shrink-0">
                                        <button
                                            onClick={() => setMobileSubTab('explorer')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                                mobileSubTab === 'explorer' 
                                                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                                    : 'text-white/60 hover:text-white/90'
                                            }`}
                                        >
                                            📁 Explorer
                                        </button>
                                        <button
                                            onClick={() => setMobileSubTab('editor')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                                mobileSubTab === 'editor' 
                                                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                                    : 'text-white/60 hover:text-white/90'
                                            }`}
                                        >
                                            📝 Editor {selectedFile ? `(${selectedFile.split('/').pop()})` : ''}
                                        </button>
                                    </div>

                                    {/* Top Toolbar */}
                                    <div className="flex justify-between items-center mb-4 shrink-0 gap-3 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-cyan-400" />
                                            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Repository Files</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleRefreshFiles} 
                                                className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] uppercase font-bold tracking-wider text-cyan-300 transition shrink-0 cursor-pointer"
                                            >
                                                Sync Files
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowNewFileInput(!showNewFileInput);
                                                    if (window.innerWidth < 768) {
                                                        setMobileSubTab('explorer');
                                                    }
                                                }} 
                                                className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-lg text-[10px] uppercase font-bold tracking-wider text-cyan-300 transition shrink-0 cursor-pointer"
                                            >
                                                + Create File
                                            </button>
                                            <button 
                                                onClick={() => setShowLivePreview(!showLivePreview)} 
                                                className={`px-3 py-1 border rounded-lg text-[10px] uppercase font-bold tracking-wider transition shrink-0 cursor-pointer flex items-center gap-1.5 ${showLivePreview ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                            >
                                                {showLivePreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                Preview
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline Create File Input */}
                                    {showNewFileInput && (
                                        <div className="mb-4 p-4 bg-[#0a0f1d] border border-cyan-500/40 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-top-3 duration-200 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📁 Stage New File</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2.5">
                                                <input 
                                                    type="text" 
                                                    placeholder="Path: src/components/MyNewComp.jsx" 
                                                    value={newFilePath}
                                                    onChange={e => setNewFilePath(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleCreateFile()}
                                                    className="flex-grow bg-black/45 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={handleCreateFile} 
                                                        className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-[0_4px_12px_rgba(34,211,238,0.25)] flex items-center justify-center gap-1"
                                                    >
                                                        Create & Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => { setShowNewFileInput(false); setNewFilePath(''); }} 
                                                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/70 transition cursor-pointer flex items-center justify-center"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Main File Manager Workspace */}
                                    <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-[300px] h-full sm:min-h-0 overflow-hidden">
                                        
                                        {/* File Tree Sidebar — scrollable on mobile */}
                                        <div className={`w-full md:w-64 bg-black/30 border border-white/5 rounded-2xl p-3 overflow-y-auto custom-scrollbar shrink-0 gap-2 h-full sm:min-h-0 ${mobileSubTab === 'explorer' ? 'flex flex-col flex-grow' : 'hidden md:flex md:flex-col'}`}>
                                            {isLoadingFiles ? (
                                                <div className="text-[10px] text-white/40 font-mono p-4 text-center">Loading repo files...</div>
                                            ) : filesList.length === 0 ? (
                                                <div className="text-[10px] text-white/40 font-mono p-4 text-center">No files found. Configure GitHub Token first!</div>
                                            ) : (
                                                filesList.map((file, idx) => {
                                                    const fp = typeof file === 'string' ? file : file.path;
                                                    const ago = typeof file === 'object' ? timeAgo(file.lastModified) : null;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleSelectFile(file)}
                                                            className={`flex items-start gap-3 w-full text-left text-xs font-mono px-3.5 py-2.5 rounded-xl transition-all duration-200 border cursor-pointer ${
                                                                selectedFile === fp
                                                                    ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)] font-bold' 
                                                                    : 'bg-white/[0.01] hover:bg-white/[0.05] border-white/5 text-white/85 hover:text-white'
                                                            }`}
                                                            title={fp}
                                                        >
                                                            <span className={`text-base shrink-0 mt-0.5 ${selectedFile === fp ? 'text-cyan-400' : 'text-white/40'}`}>📄</span>
                                                            <div className="flex-grow min-w-0 flex flex-col">
                                                                <span className="font-semibold truncate tracking-wide text-white drop-shadow-sm">{fp.split('/').pop()}</span>
                                                                {fp.includes('/') && (
                                                                    <span className="text-[9px] text-white/40 truncate mt-0.5">{fp.substring(0, fp.lastIndexOf('/'))}</span>
                                                                )}
                                                                {ago && (
                                                                    <span className="text-[9px] text-cyan-400/60 mt-0.5 flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" />{ago}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Editor Pane */}
                                        <div className={`flex-grow flex flex-col min-w-0 h-full sm:min-h-0 bg-black/45 border border-white/5 rounded-2xl overflow-hidden relative ${mobileSubTab === 'editor' ? 'flex flex-grow' : 'hidden md:flex'}`}>
                                            {selectedFile ? (
                                                <>
                                                    {/* Editor Status */}
                                                    <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex flex-wrap justify-between items-center text-xs font-mono text-white/70 gap-2">
                                                        <span className="truncate text-cyan-300 font-bold flex items-center gap-1.5">
                                                            📝 {selectedFile.split('/').pop()}
                                                            <span className="text-[10px] text-white/45 font-medium block max-w-[150px] truncate" title={selectedFile}>({selectedFile})</span>
                                                        </span>
                                                        
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {/* Zoom Controls */}
                                                            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 select-none">
                                                                <button 
                                                                    onClick={() => setEditorFontSize(prev => Math.max(10, prev - 1))}
                                                                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition cursor-pointer flex items-center justify-center"
                                                                    title="Zoom Out"
                                                                >
                                                                    <ZoomOut className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="px-2 text-[10px] font-bold text-cyan-300 min-w-[36px] text-center">
                                                                    {editorFontSize}px
                                                                </span>
                                                                <button 
                                                                    onClick={() => setEditorFontSize(prev => Math.min(24, prev + 1))}
                                                                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition cursor-pointer flex items-center justify-center"
                                                                    title="Zoom In"
                                                                >
                                                                    <ZoomIn className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditorFontSize(14)}
                                                                    className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[9px] text-white/40 hover:text-white transition font-sans font-bold cursor-pointer border-l border-white/10"
                                                                    title="Reset Font Size"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            
                                                            <span className="text-[10px] text-white/40">{fileContent ? `${fileContent.length.toLocaleString()} chars` : 'empty'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Textarea Code Editor */}
                                                    <div className="flex-grow relative min-h-0">
                                                        {isLoadingContent ? (
                                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-cyan-300 font-mono text-xs z-20">
                                                                Loading file content from GitHub...
                                                            </div>
                                                        ) : null}
                                                        <textarea
                                                            value={fileContent}
                                                            onChange={e => setFileContent(e.target.value)}
                                                            placeholder="Paste or write your component code here... 🚀"
                                                            className="absolute inset-0 w-full h-full p-6 bg-transparent font-mono text-emerald-300 placeholder-white/20 outline-none resize-none overflow-y-auto custom-scrollbar leading-loose tracking-wide"
                                                            style={{ fontSize: `${editorFontSize}px` }}
                                                            spellCheck={false}
                                                        />
                                                    </div>

                                                    {/* Commit Pane */}
                                                    <div className="p-3 bg-white/[0.02] border-t border-white/5 flex flex-col gap-2 shrink-0">
                                                        <input
                                                            type="text"
                                                            placeholder="Optional: Commit message describing your edits..."
                                                            value={commitMsgInput}
                                                            onChange={e => setCommitMsgInput(e.target.value)}
                                                            className="w-full bg-[#05080f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                                                        />
                                                        <button
                                                            onClick={handleSaveFile}
                                                            disabled={isSavingFile}
                                                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:text-white/40 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_15px_rgba(14,116,144,0.4)] transition cursor-pointer flex items-center justify-center gap-2"
                                                        >
                                                            {isSavingFile ? (
                                                                <>
                                                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    Committing to GitHub...
                                                                </>
                                                            ) : (
                                                                'Save & Commit to GitHub'
                                                            )}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-white/40">
                                                    <Package className="w-12 h-12 mb-3 text-white/20 animate-pulse" />
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-1">No File Selected</h4>
                                                    <p className="text-[11px] max-w-xs leading-normal">Select an existing file from the sidebar, or click **Create File** to stage a brand-new file stage in your GitHub repository!</p>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                </div>

                                {/* Right Side: High-Fidelity Mobile Preview Pane */}
                                {showLivePreview && (
                                    <div className={`
                                        /* Mobile: fixed full-screen overlay so preview is always visible */
                                        fixed inset-0 z-50 lg:static lg:z-auto lg:inset-auto
                                        ${previewMode === 'desktop' ? 'lg:w-[600px] xl:w-[800px]' : 'lg:w-[480px] xl:w-[500px]'}
                                        flex flex-col bg-[#080d1a]/95 lg:bg-white/[0.02] backdrop-blur-3xl border-0 lg:border border-white/10 lg:rounded-3xl p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden shrink-0 animate-in slide-in-from-right-8 duration-500 transition-all
                                    `}>
                                        
                                        {/* Toolbar */}
                                        <div className="flex justify-between items-center mb-3 shrink-0 gap-3">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-cyan-400" />
                                                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Live Preview</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 p-0.5 bg-black/40 border border-white/5 rounded-lg">
                                                    <button 
                                                        onClick={() => setPreviewMode('mobile')}
                                                        className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition cursor-pointer ${previewMode === 'mobile' ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-white/60'}`}
                                                    >
                                                        Mobile
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setPreviewMode('desktop');
                                                            setShowConfigPanel(false);
                                                            setShowLogsPanel(false);
                                                        }}
                                                        className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition cursor-pointer ${previewMode === 'desktop' ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-white/60'}`}
                                                    >
                                                        Desktop
                                                    </button>
                                                </div>
                                                {/* Close button — visible on all screens */}
                                                <button
                                                    onClick={() => setShowLivePreview(false)}
                                                    className="p-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-lg text-white/50 hover:text-red-300 transition cursor-pointer"
                                                    title="Close Preview"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Frame URL Controller */}
                                        <div className="flex gap-2 items-center mb-3 bg-[#05080f] border border-white/10 rounded-xl px-3 py-2 shrink-0">
                                            <input 
                                                type="text" 
                                                value={session.liveUrl || 'https://raagneet.vercel.app'} 
                                                readOnly
                                                className="flex-grow bg-transparent text-[10px] text-white/70 font-mono focus:outline-none" 
                                            />
                                            <button 
                                                onClick={handleReloadPreview}
                                                className="p-1 hover:bg-white/10 rounded text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                                                title="Reload Preview"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={handleOpenExternalPreview}
                                                className="p-1 hover:bg-white/10 rounded text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                                                title={previewMode === 'mobile' ? "Open Mobile Canvas in new tab" : "Open in new tab"}
                                            >
                                                <Send className="w-3 h-3 -rotate-45" />
                                            </button>
                                        </div>

                                        {/* The Live Interactive Frame Container */}
                                        <div ref={mobileContainerRef} className="flex-grow flex justify-center overflow-y-auto overflow-x-hidden min-h-0 relative bg-black/40 rounded-2xl border border-white/5 p-4 custom-scrollbar">
                                            
                                            {previewMode === 'mobile' ? (
                                                // EXACT MOBILE PORTRAIT ASPECT RATIO (375x812 iPhone simulation)
                                                <div 
                                                    className="w-[280px] h-[550px] rounded-[36px] border-[12px] border-slate-900 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_0_0_0_2px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col shrink-0 my-auto"
                                                    style={{ transform: `scale(${mobileContainerScale})`, transformOrigin: 'top center' }}
                                                >
                                                    {/* Speaker Grill / Dynamic Island Notch */}
                                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-slate-900 rounded-2xl z-40 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-slate-950 border border-slate-800 rounded-full absolute left-2.5" />
                                                        <div className="w-8 h-0.5 bg-slate-850 rounded-full" />
                                                    </div>
                                                    
                                                    {/* Scaled Inner Viewport */}
                                                    <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-[24px]">
                                                        <iframe
                                                            key={previewKey}
                                                            src={session.liveUrl || 'https://raagneet.vercel.app'}
                                                            title="Interactive Mobile Live Preview"
                                                            className="absolute top-0 left-0 border-none bg-slate-900 z-10"
                                                            style={{
                                                                width: '375px',
                                                                height: '812px',
                                                                transformOrigin: '0 0',
                                                                transform: 'scale(0.6826)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                // EXACT DESKTOP LANDSCAPE VIEWPORT (1280x720 simulation)
                                                <div 
                                                    className="w-full relative rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all shrink-0" 
                                                    ref={desktopContainerRef}
                                                    style={{ height: `${desktopDimensions.height}px` }}
                                                >
                                                    {/* macOS style browser top bar */}
                                                    <div className="h-6 w-full bg-slate-800 border-b border-slate-700 flex items-center px-3 gap-1.5 shrink-0 z-20">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                                    </div>
                                                    
                                                    {/* Scaled Inner Viewport */}
                                                    <div className="w-full relative flex-grow overflow-hidden bg-black">
                                                        <iframe
                                                            key={previewKey}
                                                            src={session.liveUrl || 'https://raagneet.vercel.app'}
                                                            title="Interactive Desktop Live Preview"
                                                            className="absolute top-0 left-0 border-none bg-slate-900 z-10"
                                                            style={{
                                                                width: '1280px',
                                                                height: '720px',
                                                                transformOrigin: '0 0',
                                                                transform: `scale(${desktopDimensions.scale})`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                )}

                            </div>
                        ) : (
                            <>
                                {/* The Large Curved Screen */}
                                <div className="w-full flex-grow relative bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-3xl border-t border-l border-r border-white/20 rounded-3xl xl:rounded-t-[40px] xl:rounded-b-[20px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),_0_25px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden pb-12 min-h-[450px] xl:min-h-0">

                                    {/* Fake Code Matrix overlay for depth */}
                                    <div className="absolute inset-y-0 left-4 w-32 flex flex-col justify-center opacity-10 pointer-events-none z-0">
                                        {/* Simulated lines of code */}
                                        {[...Array(12)].map((_, i) => (
                                            <div key={i} className="h-1 bg-white rounded-full mb-2" style={{ width: `${(i * 7 + 37) % 60 + 20}%` }} />
                                        ))}
                                    </div>
                                    <div className="absolute inset-y-0 right-4 w-32 flex flex-col justify-center items-end opacity-10 pointer-events-none z-0">
                                        {[...Array(12)].map((_, i) => (
                                            <div key={i} className="h-1 bg-white rounded-full mb-2" style={{ width: `${(i * 11 + 23) % 60 + 20}%` }} />
                                        ))}
                                    </div>
                                    
                                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 absolute bottom-12 pointer-events-none z-0">Projected</p>

                                    <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar p-3 sm:p-6 pt-6 pb-12 z-10" ref={chatContainerRef}>
                                       { (session.chats && session.chats.length > 0) || session.isThinking ? (
                                            <div className="flex flex-col gap-2">
                                                {session.chats && session.chats.map((c, i) => (
                                                    <div key={i} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${c.sender === 'user' ? 'bg-cyan-950/70 text-cyan-50 border border-cyan-500/50 rounded-br-sm backdrop-blur-xl' : 'bg-[#0a0f1c]/90 text-white border border-white/20 rounded-bl-sm backdrop-blur-xl'}`}>
                                                            <div className="text-xs sm:text-sm font-sans leading-relaxed text-white drop-shadow-sm">{renderMarkdown(c.text)}</div>
                                                            <div className="text-[8px] sm:text-[9px] opacity-60 mt-1 font-mono text-right">{fmt(c.timestamp)}</div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {session.isThinking && (
                                                    <div className="flex justify-start animate-pulse duration-1000">
                                                        <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-[#0a0f1c]/90 text-white border border-white/20 rounded-bl-sm backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                                                            <div className="text-xs sm:text-sm font-sans leading-relaxed flex items-center gap-1.5 font-medium text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">
                                                                <span>Thinking</span>
                                                                <span className="flex gap-0.5 mt-1">
                                                                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full m-auto text-center opacity-70">
                                                <h2 className="text-3xl font-normal tracking-wide text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] mb-2">
                                                    Awaiting uplink...
                                                </h2>
                                                <p className="text-sm text-white/60 mb-8">Send a message via Telegram</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Overlapping Input Bar */}
                                <div className="w-[98%] mx-auto -mt-7 relative z-30 shrink-0">
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={chatDraft}
                                            onChange={e => setChatDraft(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                            placeholder="Transmit command..."
                                            className="w-full py-4 pl-6 pr-16 bg-[#080d1a]/90 backdrop-blur-3xl border border-white/20 rounded-full text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6),_0_10px_20px_rgba(0,0,0,0.4)] transition"
                                        />
                                        <button 
                                            onClick={handleSendChat}
                                            disabled={isSendingChat || !chatDraft.trim()}
                                            className="absolute right-2 p-2.5 rounded-full hover:bg-white/10 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>

                    {/* --- RIGHT COLUMN: LIVE ACTIVITY FEED --- */}
                    <div className={`flex flex-col min-h-0 shrink transition-all duration-500 ${expandedPanel === 'logs' ? 'w-full lg:w-full flex-grow' : expandedPanel ? 'hidden lg:hidden' : 'w-full lg:w-[400px] xl:w-[450px]'} ${activeTab === 'logs' ? 'flex h-full' : showLogsPanel ? 'hidden lg:flex' : 'hidden'}`}>
                        <div className="flex justify-between items-center mb-4 shrink-0 px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <h3 className="text-[11px] font-bold tracking-[0.25em] text-white/80 uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Live Activity Feed</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-cyan-500/60 mr-2 hidden xl:block">SYSTEM_LOG_STREAM_V3.0</span>
                                <button onClick={() => setExpandedPanel(expandedPanel === 'logs' ? null : 'logs')} className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-cyan-400 transition-all cursor-pointer group" title={expandedPanel === 'logs' ? "Restore Down" : "Maximize"}>
                                    {expandedPanel === 'logs' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 group-hover:scale-110" />}
                                </button>
                            </div>
                        </div>

                        {/* Tall Glass Panel: Redesigned as a High-Tech Terminal */}
                        <div className="w-full flex-grow relative bg-[#05080f]/60 backdrop-blur-3xl border border-white/10 rounded-[24px] xl:rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col overflow-hidden group/terminal">
                            
                            {/* Terminal Header Scanline Effect */}
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan-500/[0.03] to-transparent pointer-events-none z-0" />
                            
                            <div className="relative z-10 flex flex-col h-full w-full overflow-y-auto no-scrollbar p-1" ref={terminalRef}>
                                {logs.length > 0 ? (
                                    <div className="flex flex-col">
                                        {[...logs].reverse().map((rawLog, i) => {
                                            const log = stripAnsi(rawLog);
                                            const isErr = log.includes('⚠️') || log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
                                            const isOk = log.includes('✅') || log.toLowerCase().includes('success') || log.toLowerCase().includes('deployed');
                                            const isSystem = log.includes('[System]');
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="group py-3 px-4 flex items-start gap-4 border-b border-white/[0.03] last:border-b-0 animate-in fade-in slide-in-from-right-4 duration-300 hover:bg-white/[0.02] transition-all relative overflow-hidden"
                                                >
                                                    {/* Row Hover Glow */}
                                                    <div className="absolute left-0 inset-y-0 w-[2px] bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    {/* Status Indicator */}
                                                    <div className="mt-1.5 shrink-0 relative">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            isErr ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                                                            isOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 
                                                            'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                                        }`} />
                                                    </div>

                                                    <div className="flex flex-col gap-1 min-w-0 flex-grow">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-mono font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded border ${
                                                                isErr ? 'text-red-400 border-red-500/20 bg-red-500/5' : 
                                                                isOk ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 
                                                                'text-cyan-400/70 border-cyan-500/20 bg-cyan-500/5'
                                                            }`}>
                                                                {isErr ? 'CRITICAL' : isOk ? 'STABLE' : isSystem ? 'SYSTEM' : 'LOG'}
                                                            </span>
                                                            <span className="text-[10px] text-white/20 font-mono">
                                                                {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </span>
                                                        </div>

                                                        {/* Highly legible, monospace terminal text */}
                                                        <p className={`text-[12px] font-mono leading-relaxed break-words whitespace-pre-wrap ${
                                                            isErr ? 'text-red-200/90' : 
                                                            isOk ? 'text-emerald-200/90' : 
                                                            'text-white/80'
                                                        }`}>
                                                            {log.startsWith('[') && log.includes(']') ? log.substring(log.indexOf(']') + 1).trim() : log}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center m-auto px-6 opacity-30">
                                        <div className="w-12 h-12 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-4 animate-[spin_10s_linear_infinite]">
                                            <Terminal className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                                            Awaiting Telemetry Data
                                        </h4>
                                    </div>
                                )}
                            </div>

                            {/* Decorative Bottom Scanline Bar */}
                            <div className="h-6 w-full bg-black/40 border-t border-white/5 flex items-center px-4 justify-between shrink-0 relative z-20">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                    </div>
                                    <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">Buffer: {logs.length}/250</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-mono text-emerald-500/60 font-bold uppercase">Socket Live</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Scrollbar styling override for webkit browsers & Animation Keyframes */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* 3D Cosmic Movement & Flow Animations */
        @keyframes slow-pan {
          0% { transform: scale(1.02) translate(0px, 0px) rotate(0deg); }
          50% { transform: scale(1.15) translate(-40px, 20px) rotate(1deg); }
          100% { transform: scale(1.02) translate(0px, 0px) rotate(0deg); }
        }

        @keyframes float-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(80px, -90px) scale(1.2); }
          66% { transform: translate(-60px, 50px) scale(0.85); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes float-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-90px, 80px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes float-3 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, 60px) scale(0.9); }
          66% { transform: translate(-70px, -70px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes grid-drift {
          from { background-position: 0 0; }
          to { background-position: 50px 50px; }
        }

        @keyframes radar-spin {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        .animate-slow-pan {
          animation: slow-pan 22s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: float-1 16s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 13s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-3 18s ease-in-out infinite;
        }
        .animate-grid-drift {
          animation: grid-drift 12s linear infinite;
        }
        .animate-radar-spin {
          animation: radar-spin 3s linear infinite;
          transform-origin: bottom right;
        }
      `}} />

            {/* 3. MOBILE BOTTOM TAB BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#070b19]/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2.5 flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe-bottom">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'config' 
                        ? 'text-cyan-400 scale-105 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Settings className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'config' ? 'rotate-45' : ''}`} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Config</span>
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'chat' 
                        ? 'text-cyan-400 scale-105 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Brain className={`w-5 h-5 transition-transform duration-500 ${activeTab === 'chat' ? 'scale-110' : ''}`} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Uplink</span>
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'files' 
                        ? 'text-cyan-400 scale-105 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Package className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'files' ? 'scale-110 text-cyan-400' : ''}`} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Files</span>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeTab === 'logs' 
                        ? 'text-cyan-400 scale-105 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                        : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Terminal className={`w-5 h-5 transition-all duration-300 ${activeTab === 'logs' ? 'scale-110 text-cyan-400' : ''}`} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Logs</span>
                </button>
            </div>

            {/* --- CREDENTIALS POPOVER (floating popup, no background blur) --- */}
            {showCredentialsPopover && (
                <>
                    {/* Transparent Backdrop (auto-closes on outside click, no blur or dimming) */}
                    <div 
                        className="fixed inset-0 z-[59]"
                        onClick={() => setShowCredentialsPopover(false)}
                    />
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="fixed inset-x-2 bottom-2 top-16 lg:inset-auto lg:left-[90px] lg:top-1/2 lg:-translate-y-1/2 lg:w-[360px] max-h-[calc(100vh-80px)] lg:max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 bg-[#070b19]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl lg:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[60] flex flex-col gap-4 animate-in slide-in-from-bottom-8 lg:slide-in-from-left-3 duration-300 cursor-default"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-1.5">
                                <Key className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Credentials Manager</span>
                            </div>
                            <button 
                                className="p-1 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white"
                                onClick={() => setShowCredentialsPopover(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <CredentialManagerUI ctx={ctx} isMobile={false} />
                        
                        {/* Model Selection */}
                        <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-white/10 shrink-0">
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase ml-1">Model Selection</h4>
                            <div className="flex flex-col gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Active Model</span>
                                    <span className="text-[10px] font-mono text-cyan-300 truncate max-w-[180px]">{session.modelName || 'None selected'}</span>
                                </div>
                                 <ModelSelectorDropdown
                                    activeModel={session.modelName || ''}
                                    onModelSelect={handleModelSelect}
                                    activeKeyType={session.activeKeyType}
                                                                        customModelsList={customModelsList}
                                    alibabaModelsList={alibabaModelsList}
                                    googleModelsList={googleModelsList}
                                    bluesmindsModelsList={bluesmindsModelsList}
                                    openrouterModelsList={openrouterModelsList}
                                />
                                {session.activeKeyType !== 'openrouter' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customModelInput}
                                            onChange={(e) => setCustomModelInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && customModelInput.trim()) { handleModelSelect(customModelInput.trim()); setCustomModelInput(''); }}}
                                            className="flex-grow bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-mono text-emerald-200 outline-none focus:border-emerald-400 placeholder-white/20"
                                            placeholder="Or type model name..."
                                        />
                                        <button
                                            onClick={() => { if (customModelInput.trim()) { handleModelSelect(customModelInput.trim()); setCustomModelInput(''); }}}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                                        >
                                            Set
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* --- METRICS POPOVER (transparent backdrop to avoid background blur/dim) --- */}
            {showMetricsPopover && (
                <>
                    {/* Transparent Backdrop */}
                    <div 
                        className="fixed inset-0 z-[59]"
                        onClick={() => setShowMetricsPopover(false)}
                    />
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="fixed bottom-[80px] inset-x-4 lg:bottom-auto lg:inset-x-auto lg:left-[90px] lg:bottom-[80px] lg:w-56 p-4 bg-[#070b19] border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[60] flex flex-col gap-2.5 animate-in slide-in-from-bottom-4 lg:slide-in-from-left-3 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Token Metrics</span>
                            </div>
                            <button 
                                className="p-1 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white"
                                onClick={() => setShowMetricsPopover(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 text-[10px] font-mono text-white/70">
                            <div className="flex justify-between items-center bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span>Prompt:</span>
                                <span className="text-cyan-300 font-bold">{(usage?.prompt_tokens || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span>Completion:</span>
                                <span className="text-violet-300 font-bold">{(usage?.completion_tokens || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center bg-cyan-950/20 px-2.5 py-2 rounded-lg border border-cyan-500/20">
                                <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[9px]">Total:</span>
                                <span className="text-cyan-300 font-black text-xs drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">{(usage?.total_tokens || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* --- POWER DOWN CONFIRMATION MODAL --- */}
            {showPowerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-[#0a0f1c]/90 border border-red-500/30 rounded-[30px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(239,68,68,0.25),_inset_0_1px_3px_rgba(255,255,255,0.05)] flex flex-col gap-6 relative overflow-hidden backdrop-blur-3xl animate-in zoom-in-95 duration-200">
                        {/* Red accent light bars */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse">
                                <Power className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            </div>
                            <h3 className="text-lg font-bold tracking-widest text-red-100 uppercase mt-2">
                                Terminate System Uplink?
                            </h3>
                            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                                This will abort all running compiler threads, shut down active shells, close the Telegram bot listener, and power off the engine server immediately.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <button 
                                onClick={() => setShowPowerModal(false)}
                                className="flex-1 py-3 px-5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full text-xs font-bold text-white/80 uppercase tracking-widest transition"
                            >
                                Keep Active
                            </button>
                            <button 
                                onClick={handleShutdownConfirm}
                                className="flex-1 py-3 px-5 bg-red-900/40 hover:bg-red-900/60 border border-red-500/50 rounded-full text-xs font-bold text-red-100 tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition"
                            >
                                Shut Down
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
};

export default NeetBotStudioFinal;