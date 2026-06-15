import React from 'react';
import { Key, Lock, Edit2, Eye, EyeOff, Brain, Package, Settings, Zap, Cpu } from 'lucide-react';

const CredentialManagerUI = ({ ctx, isMobile = false }) => {
    const {
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
        isEditingOpenrouterKey, setIsEditingOpenrouterKey, isSavingOpenrouterKey, handleSaveOpenrouterKey, openrouterKey, setOpenrouterKey, openrouterBase, setOpenrouterBase,
        showOpenrouterKeyInput, setShowOpenrouterKeyInput, revealOpenrouterConfigured, setRevealOpenrouterConfigured,
    } = ctx;

    const styles = {
        emerald: {
            tabActive: 'bg-emerald-500/10 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            tabGlow: 'from-emerald-500/20',
            iconActive: 'bg-emerald-500/20 text-emerald-300',
            panelBorder: 'border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]',
            headerBg: 'from-emerald-500/10 border-emerald-500/10',
            headerIcon: 'bg-emerald-500/20 text-emerald-300',
            btnConfig: 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
            keyIcon: 'text-emerald-400/70 group-hover:text-emerald-400',
            btnActive: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
            btnHover: 'hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
            label: 'text-emerald-300',
            input: 'border-emerald-500/30 focus:border-emerald-400',
            btnSave: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
        },
        indigo: {
            tabActive: 'bg-indigo-500/10 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]',
            tabGlow: 'from-indigo-500/20',
            iconActive: 'bg-indigo-500/20 text-indigo-300',
            panelBorder: 'border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]',
            headerBg: 'from-indigo-500/10 border-indigo-500/10',
            headerIcon: 'bg-indigo-500/20 text-indigo-300',
            btnConfig: 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
            keyIcon: 'text-indigo-400/70 group-hover:text-indigo-400',
            btnActive: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
            btnHover: 'hover:bg-indigo-500/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]',
            label: 'text-indigo-300',
            input: 'border-indigo-500/30 focus:border-indigo-400',
            btnSave: 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
        },
        blue: {
            tabActive: 'bg-blue-500/10 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
            tabGlow: 'from-blue-500/20',
            iconActive: 'bg-blue-500/20 text-blue-300',
            panelBorder: 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)]',
            headerBg: 'from-blue-500/10 border-blue-500/10',
            headerIcon: 'bg-blue-500/20 text-blue-300',
            btnConfig: 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
            keyIcon: 'text-blue-400/70 group-hover:text-blue-400',
            btnActive: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
            btnHover: 'hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
            label: 'text-blue-300',
            input: 'border-blue-500/30 focus:border-blue-400',
            btnSave: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
        },
        orange: {
            tabActive: 'bg-orange-500/10 border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]',
            tabGlow: 'from-orange-500/20',
            iconActive: 'bg-orange-500/20 text-orange-300',
            panelBorder: 'border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.05)]',
            headerBg: 'from-orange-500/10 border-orange-500/10',
            headerIcon: 'bg-orange-500/20 text-orange-300',
            btnConfig: 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
            keyIcon: 'text-orange-400/70 group-hover:text-orange-400',
            btnActive: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
            btnHover: 'hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]',
            label: 'text-orange-300',
            input: 'border-orange-500/30 focus:border-orange-400',
            btnSave: 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
        },
        purple: {
            tabActive: 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
            tabGlow: 'from-purple-500/20',
            iconActive: 'bg-purple-500/20 text-purple-300',
            panelBorder: 'border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]',
            headerBg: 'from-purple-500/10 border-purple-500/10',
            headerIcon: 'bg-purple-500/20 text-purple-300',
            btnConfig: 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
            keyIcon: 'text-purple-400/70 group-hover:text-purple-400',
            btnActive: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
            btnHover: 'hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
            label: 'text-purple-300',
            input: 'border-purple-500/30 focus:border-purple-400',
            btnSave: 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        },
        gray: {
            tabActive: 'bg-gray-500/10 border-gray-400/50 shadow-[0_0_20px_rgba(156,163,175,0.15)]',
            tabGlow: 'from-gray-500/20',
            iconActive: 'bg-gray-500/20 text-gray-300',
            panelBorder: 'border-gray-500/20 shadow-[0_0_30px_rgba(156,163,175,0.05)]',
            headerBg: 'from-gray-500/10 border-gray-500/10',
            headerIcon: 'bg-gray-500/20 text-gray-300',
            btnConfig: 'bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 border-gray-500/30 shadow-[0_0_15px_rgba(156,163,175,0.2)]',
            keyIcon: 'text-gray-400/70 group-hover:text-gray-400',
            btnActive: 'bg-gray-500/10 border-gray-500/20 text-gray-300',
            btnHover: 'hover:bg-gray-500/20 hover:shadow-[0_0_20px_rgba(156,163,175,0.2)]',
            label: 'text-gray-300',
            input: 'border-gray-500/30 focus:border-gray-400',
            btnSave: 'bg-gray-600 hover:bg-gray-500 shadow-[0_0_20px_rgba(156,163,175,0.4)]'
        },
        pink: {
            tabActive: 'bg-pink-500/10 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.15)]',
            tabGlow: 'from-pink-500/20',
            iconActive: 'bg-pink-500/20 text-pink-300',
            panelBorder: 'border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.05)]',
            headerBg: 'from-pink-500/10 border-pink-500/10',
            headerIcon: 'bg-pink-500/20 text-pink-300',
            btnConfig: 'bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.2)]',
            keyIcon: 'text-pink-400/70 group-hover:text-pink-400',
            btnActive: 'bg-pink-500/10 border-pink-500/20 text-pink-300',
            btnHover: 'hover:bg-pink-500/20 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]',
            label: 'text-pink-300',
            input: 'border-pink-500/30 focus:border-pink-400',
            btnSave: 'bg-pink-600 hover:bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
        }
    };

    const providers = [
        { id: 'bluesminds', name: 'Bluesminds', icon: <Brain className="w-5 h-5" />, color: 'indigo', key: 'hasBluesmindsApiKey' },
        { id: 'google', name: 'Google AI', icon: <Zap className="w-5 h-5" />, color: 'blue', key: 'hasGoogleApiKey' },
        { id: 'alibaba', name: 'Alibaba Cloud', icon: <Package className="w-5 h-5" />, color: 'orange', key: 'hasAlibabaApiKey' },
        { id: 'openrouter', name: 'OpenRouter', icon: <Cpu className="w-5 h-5" />, color: 'pink', key: 'hasOpenrouterApiKey' },
        { id: 'custom', name: 'Custom AI', icon: <Settings className="w-5 h-5" />, color: 'purple', key: 'hasCustomApiKey' },
        { id: 'github', name: 'GitHub Repo', icon: <Lock className="w-5 h-5" />, color: 'gray', key: 'hasGithubToken' },
    ];

    const activeProvider = providers.find(p => p.id === activeCredentialsTab) || providers[0];
    const s = styles[activeProvider.color];

    const getProviderConfig = (id) => {
        switch(id) {
            case 'bluesminds': return {
                isEditing: isEditingBluesmindsKey, setIsEditing: setIsEditingBluesmindsKey, isSaving: isSavingBluesmindsKey, handleSave: handleSaveBluesmindsKey,
                keyVal: bluesmindsKey, setKeyVal: setBluesmindsKey, showKeyInput: showBluesmindsKeyInput, setShowKeyInput: setShowBluesmindsKeyInput,
                revealConfigured: revealBluesmindsConfigured, setRevealConfigured: setRevealBluesmindsConfigured,
                hasKey: session.hasBluesmindsApiKey, rawKey: session.rawBluesmindsApiKey, maskedKey: session.maskedBluesmindsApiKey,
                fields: [{ name: 'Base URL', val: bluesmindsBase, setVal: setBluesmindsBase }, { name: 'API Key', val: bluesmindsKey, setVal: setBluesmindsKey }]
            };
            case 'google': return {
                isEditing: isEditingGoogleKey, setIsEditing: setIsEditingGoogleKey, isSaving: isSavingGoogleKey, handleSave: handleSaveGoogleKey,
                keyVal: googleKey, setKeyVal: setGoogleKey, showKeyInput: showGoogleKeyInput, setShowKeyInput: setShowGoogleKeyInput,
                revealConfigured: revealGoogleConfigured, setRevealConfigured: setRevealGoogleConfigured,
                hasKey: session.hasGoogleApiKey, rawKey: session.rawGoogleApiKey, maskedKey: session.maskedGoogleApiKey,
                fields: [{ name: 'API Key', val: googleKey, setVal: setGoogleKey }]
            };
            case 'alibaba': return {
                isEditing: isEditingAlibabaKey, setIsEditing: setIsEditingAlibabaKey, isSaving: isSavingAlibabaKey, handleSave: handleSaveAlibabaKey,
                keyVal: alibabaKey, setKeyVal: setAlibabaKey, showKeyInput: showAlibabaKeyInput, setShowKeyInput: setShowAlibabaKeyInput,
                revealConfigured: revealAlibabaConfigured, setRevealConfigured: setRevealAlibabaConfigured,
                hasKey: session.hasAlibabaApiKey, rawKey: session.rawAlibabaApiKey, maskedKey: session.maskedAlibabaApiKey,
                fields: [{ name: 'Base URL', val: alibabaBase, setVal: setAlibabaBase }, { name: 'API Key', val: alibabaKey, setVal: setAlibabaKey }]
            };
            case 'openrouter': return {
                isEditing: isEditingOpenrouterKey, setIsEditing: setIsEditingOpenrouterKey, isSaving: isSavingOpenrouterKey, handleSave: handleSaveOpenrouterKey,
                keyVal: openrouterKey, setKeyVal: setOpenrouterKey, showKeyInput: showOpenrouterKeyInput, setShowKeyInput: setShowOpenrouterKeyInput,
                revealConfigured: revealOpenrouterConfigured, setRevealConfigured: setRevealOpenrouterConfigured,
                hasKey: session.hasOpenrouterApiKey, rawKey: session.rawOpenrouterApiKey, maskedKey: session.maskedOpenrouterApiKey,
                fields: [{ name: 'Base URL', val: openrouterBase, setVal: setOpenrouterBase }, { name: 'API Key', val: openrouterKey, setVal: setOpenrouterKey }]
            };
            case 'custom': return {
                isEditing: isEditingCustomKey, setIsEditing: setIsEditingCustomKey, isSaving: isSavingCustomKey, handleSave: handleSaveCustomKey,
                keyVal: customKey, setKeyVal: setCustomKey, showKeyInput: showCustomKeyInput, setShowKeyInput: setShowCustomKeyInput,
                revealConfigured: revealCustomConfigured, setRevealConfigured: setRevealCustomConfigured,
                hasKey: session.hasCustomApiKey, rawKey: session.rawCustomApiKey, maskedKey: session.maskedCustomApiKey,
                fields: [{ name: 'Base URL', val: customBase, setVal: setCustomBase }, { name: 'API Key', val: customKey, setVal: setCustomKey }]
            };
            case 'github': return {
                isEditing: isEditingGithubToken, setIsEditing: setIsEditingGithubToken, isSaving: isSavingGithubToken, handleSave: handleSaveGithubToken,
                keyVal: githubToken, setKeyVal: setGithubToken, showKeyInput: showGithubTokenInput, setShowKeyInput: setShowGithubTokenInput,
                revealConfigured: revealGithubConfigured, setRevealConfigured: setRevealGithubConfigured,
                hasKey: session.hasGithubToken, rawKey: session.rawGithubToken, maskedKey: session.maskedGithubToken,
                fields: [{ name: 'Token', val: githubToken, setVal: setGithubToken }]
            };
        }
    };

    const cfg = getProviderConfig(activeProvider.id);

    return (
        <div className={`flex flex-col gap-4 animate-in fade-in duration-300 w-full ${isMobile ? 'px-2' : ''}`}>
            
            <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-bold tracking-[0.3em] text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                    Quantum Config
                </h4>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-3 custom-scrollbar snap-x w-full">
                {providers.map(p => {
                    const isActive = activeCredentialsTab === p.id;
                    const isEngine = session.activeKeyType === p.id && p.id !== 'github';
                    const hasProviderKey = session[p.key];
                    const pStyles = styles[p.color];
                    
                    return (
                        <button
                            key={p.id}
                            onClick={() => {
                                setActiveCredentialsTab(p.id);
                                if (p.id !== 'github') setSelectedKeyType(p.id);
                            }}
                            className={`snap-center shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 cursor-pointer min-w-[100px] h-[96px] relative group overflow-hidden ${
                                isActive 
                                ? pStyles.tabActive 
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/20'
                            }`}
                        >
                            {isActive && <div className={`absolute inset-0 bg-gradient-to-t ${pStyles.tabGlow} to-transparent opacity-50`} />}
                            
                            {isEngine && (
                                <div className="absolute top-2 right-2 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)] animate-ping absolute" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)] relative z-10" />
                                </div>
                            )}

                            {!isEngine && hasProviderKey && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                            )}
                            
                            <div className={`mb-2 p-2 rounded-xl backdrop-blur-sm z-10 transition-transform group-hover:scale-110 duration-300 ${isActive ? pStyles.iconActive : 'bg-black/40 text-white/40 group-hover:text-white/80'}`}>
                                {p.icon}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center z-10 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                                {p.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className={`flex flex-col bg-black/40 border ${s.panelBorder} rounded-3xl overflow-hidden backdrop-blur-2xl relative animate-in slide-in-from-top-4 duration-300`}>
                
                <div className={`flex items-center justify-between px-5 py-4 bg-gradient-to-r ${s.headerBg} to-transparent border-b`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${s.headerIcon}`}>
                            {activeProvider.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-wide">{activeProvider.name}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">{activeProvider.id === 'github' ? 'Repository Access' : 'AI Engine Provider'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {cfg.hasKey && !cfg.isEditing && (
                            <button 
                                onClick={() => {
                                    setActivePasswordCard(activeProvider.id);
                                    setPasswordTargetAction('edit');
                                    setCardPasswordInput('');
                                    setCardPasswordError('');
                                }}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                            >
                                <Edit2 className="w-3 h-3" /> Edit Config
                            </button>
                        )}
                        {!cfg.hasKey && !cfg.isEditing && (
                            <button 
                                onClick={() => {
                                    setActivePasswordCard(activeProvider.id);
                                    setPasswordTargetAction('edit');
                                    setCardPasswordInput('');
                                    setCardPasswordError('');
                                }}
                                className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${s.btnConfig}`}
                            >
                                Configure Now
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-5 flex flex-col gap-5 relative">
                    
                    {activePasswordCard === activeProvider.id && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#070b19]/95 animate-in fade-in duration-200">
                            <div className="w-full max-w-sm flex flex-col gap-4 bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2 justify-center">
                                    <Lock className="w-4 h-4" /> Security Verification Required
                                </span>
                                <div className="flex gap-2 w-full mt-2">
                                    <input
                                        type="password"
                                        placeholder="Enter master password..."
                                        value={cardPasswordInput}
                                        onChange={(e) => setCardPasswordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCardPasswordSubmit(activeProvider.id)}
                                        className="flex-grow min-w-0 bg-black/60 border border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 shadow-inner font-mono transition-colors"
                                        autoFocus
                                    />
                                    <button onClick={() => handleCardPasswordSubmit(activeProvider.id)} className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)] shrink-0">Unlock</button>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <button onClick={() => { setActivePasswordCard(null); setCardPasswordInput(''); setCardPasswordError(''); }} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold transition cursor-pointer">Cancel</button>
                                    {cardPasswordError && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">{cardPasswordError}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {!cfg.isEditing ? (
                        <div className={`flex flex-col gap-4 ${cfg.hasKey ? '' : 'opacity-40'}`}>
                            {cfg.hasKey ? (
                                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group transition-colors hover:bg-white/[0.04]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Key className={`w-4 h-4 transition-colors shrink-0 ${s.keyIcon}`} />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Secured Credential</span>
                                            <span className="text-sm font-mono text-white/80 tracking-widest mt-1 truncate">
                                                {cfg.revealConfigured ? (cfg.rawKey || cfg.maskedKey) : (cfg.maskedKey || (cfg.rawKey ? `${cfg.rawKey.substring(0, 4)}...${cfg.rawKey.slice(-4)}` : '••••••••••••••••••••••'))}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (cfg.revealConfigured) cfg.setRevealConfigured(false);
                                            else { setPasswordTargetAction('reveal'); setActivePasswordCard(activeProvider.id); setCardPasswordInput(''); setCardPasswordError(''); }
                                        }}
                                        className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer shrink-0 ml-2"
                                        title="Reveal Configuration"
                                    >
                                        {cfg.revealConfigured ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center gap-3 text-white/30 border border-dashed border-white/10 rounded-xl">
                                    <Lock className="w-8 h-8 opacity-20" />
                                    <span className="text-xs uppercase tracking-widest font-bold">No credentials configured</span>
                                </div>
                            )}

                            {activeProvider.id !== 'github' && (
                                <div className="mt-2 flex flex-col gap-3">
                                    <button
                                        onClick={() => handleActivateKeyType(activeProvider.id)}
                                        disabled={isActivatingKey || session.activeKeyType === activeProvider.id}
                                        className={`w-full py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10 ${
                                            session.activeKeyType === activeProvider.id 
                                            ? `${s.btnActive} cursor-default border-transparent`
                                            : `bg-white/5 text-white ${s.btnHover}`
                                        }`}
                                    >
                                        {isActivatingKey && selectedKeyType === activeProvider.id 
                                            ? 'Initializing Engine...' 
                                            : session.activeKeyType === activeProvider.id 
                                                ? 'Engine is Active' 
                                                : `Activate ${activeProvider.name} Engine`}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {cfg.fields.map((field, idx) => (
                                <div key={field.name} className="flex flex-col gap-2">
                                    <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${s.label}`}>
                                        {field.name}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={field.name === 'Base URL' ? 'text' : (cfg.showKeyInput ? "text" : "password")} 
                                            value={field.val}
                                            onChange={e => field.setVal(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && cfg.handleSave()}
                                            className={`w-full bg-black/60 border rounded-xl pl-4 ${field.name === 'Base URL' ? 'pr-4' : 'pr-12'} py-3 text-sm text-white outline-none transition-colors font-mono shadow-inner ${s.input}`} 
                                            placeholder={field.name === 'Base URL' ? 'https://...' : 'Enter your secret token...'}
                                            autoFocus={idx === 0}
                                        />
                                        {field.name !== 'Base URL' && (
                                            <button 
                                                type="button" 
                                                onClick={() => cfg.setShowKeyInput(!cfg.showKeyInput)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition p-1.5 cursor-pointer rounded-lg hover:bg-white/5"
                                            >
                                                {cfg.showKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="flex justify-end gap-3 mt-3">
                                {cfg.hasKey && (
                                    <button 
                                        onClick={() => { cfg.setIsEditing(false); }} 
                                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button 
                                    onClick={cfg.handleSave} 
                                    disabled={cfg.isSaving} 
                                    className={`px-8 py-2.5 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 ${s.btnSave}`}
                                >
                                    {cfg.isSaving ? 'Processing...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CredentialManagerUI;
