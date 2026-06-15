const fs = require('fs');
let code = fs.readFileSync('src/dashboard.jsx', 'utf8');

const credFunction = `
    const renderCredentialManager = (isMobile) => {
        const providers = [
            { id: 'boa', name: 'Bay of Assets', icon: <Package className="w-4 h-4" />, color: 'emerald' },
            { id: 'bluesminds', name: 'Bluesminds', icon: <Brain className="w-4 h-4" />, color: 'indigo' },
            { id: 'google', name: 'Google AI', icon: <Key className="w-4 h-4" />, color: 'blue' },
            { id: 'alibaba', name: 'Alibaba Cloud', icon: <Package className="w-4 h-4" />, color: 'orange' },
            { id: 'custom', name: 'Custom Endpoint', icon: <Settings className="w-4 h-4" />, color: 'purple' },
            { id: 'github', name: 'GitHub Repo', icon: <Lock className="w-4 h-4" />, color: 'gray' },
        ];

        const activeProvider = providers.find(p => p.id === activeCredentialsTab) || providers[0];

        const renderProviderConfig = (providerId) => {
            // Helper to abstract the standard inputs
            const isEditing = 
                providerId === 'boa' ? isEditingKey : 
                providerId === 'bluesminds' ? isEditingBluesmindsKey :
                providerId === 'google' ? isEditingGoogleKey :
                providerId === 'alibaba' ? isEditingAlibabaKey :
                providerId === 'custom' ? isEditingCustomKey :
                isEditingGithubToken;
                
            const hasKey = 
                providerId === 'boa' ? session.hasApiKey :
                providerId === 'bluesminds' ? session.hasBluesmindsApiKey :
                providerId === 'google' ? session.hasGoogleApiKey :
                providerId === 'alibaba' ? session.hasAlibabaApiKey :
                providerId === 'custom' ? session.hasCustomApiKey :
                session.hasGithubToken;

            // Using the massive blocks of JSX from before, but modernized
            return (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/90">Configuration</span>
                            <span className="text-[10px] text-white/40">Manage your connection</span>
                        </div>
                        {hasKey && !isEditing && (
                            <button 
                                onClick={() => {
                                    setActivePasswordCard(providerId);
                                    setPasswordTargetAction('edit');
                                    setCardPasswordInput('');
                                    setCardPasswordError('');
                                }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Modify
                            </button>
                        )}
                    </div>

                    {activePasswordCard === providerId ? (
                        <div className="flex flex-col gap-3 p-4 bg-black/60 border border-cyan-500/30 rounded-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                            <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Security Verification
                            </span>
                            <div className="flex gap-2 w-full">
                                <input
                                    type="password"
                                    placeholder="Enter unlock password..."
                                    value={cardPasswordInput}
                                    onChange={(e) => setCardPasswordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCardPasswordSubmit(providerId)}
                                    className="flex-grow bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60 font-mono"
                                    autoFocus
                                />
                                <button onClick={() => handleCardPasswordSubmit(providerId)} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase rounded-xl transition shrink-0 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]">Unlock</button>
                                <button onClick={() => { setActivePasswordCard(null); setCardPasswordInput(''); setCardPasswordError(''); }} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs uppercase rounded-xl transition shrink-0 cursor-pointer">Cancel</button>
                            </div>
                            {cardPasswordError && <span className="text-[10px] text-red-400 font-medium pl-1">{cardPasswordError}</span>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {/* Detailed Config Blocks */}
                            {providerId === 'bluesminds' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider pl-1">Base URL</label>
                                                <input 
                                                    type="text" 
                                                    value={bluesmindsBase}
                                                    onChange={e => setBluesmindsBase(e.target.value)} 
                                                    className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 transition-colors font-mono" 
                                                    placeholder="https://api.bluesminds.com"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider pl-1">API Key</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showBluesmindsKeyInput ? "text" : "password"} 
                                                        value={bluesmindsKey}
                                                        onChange={e => setBluesmindsKey(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveBluesmindsKey()}
                                                        className="w-full bg-black/40 border border-indigo-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-indigo-400 transition-colors font-mono" 
                                                        placeholder="sk-..."
                                                    />
                                                    <button type="button" onClick={() => setShowBluesmindsKeyInput(!showBluesmindsKeyInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showBluesmindsKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingBluesmindsKey(false); setBluesmindsKey(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveBluesmindsKey} disabled={isSavingBluesmindsKey} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingBluesmindsKey ? 'Saving...' : 'Save & Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                    <Key className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Key</span>
                                                    <span className="text-sm text-indigo-200 font-mono tracking-widest mt-0.5">
                                                        {revealBluesmindsConfigured ? (session.rawBluesmindsApiKey || session.maskedBluesmindsApiKey) : (session.maskedBluesmindsApiKey || (session.rawBluesmindsApiKey ? `${session.rawBluesmindsApiKey.substring(0, 4)}...${session.rawBluesmindsApiKey.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealBluesmindsConfigured) setRevealBluesmindsConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('bluesminds'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-indigo-300 transition-colors p-2 rounded-xl hover:bg-indigo-500/20 cursor-pointer"
                                            >
                                                {revealBluesmindsConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {providerId === 'boa' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider pl-1">API Key</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showBoaKeyInput ? "text" : "password"} 
                                                        value={boaKey}
                                                        onChange={e => setBoaKey(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                                                        className="w-full bg-black/40 border border-emerald-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-emerald-400 transition-colors font-mono" 
                                                        placeholder="Enter Boa API Key..."
                                                    />
                                                    <button type="button" onClick={() => setShowBoaKeyInput(!showBoaKeyInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showBoaKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingKey(false); setBoaKey(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveKey} disabled={isSavingKey} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingKey ? 'Saving...' : 'Save & Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                    <Key className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Key</span>
                                                    <span className="text-sm text-emerald-200 font-mono tracking-widest mt-0.5">
                                                        {revealBoaConfigured ? (session.rawApiKey || session.maskedApiKey) : (session.maskedApiKey || (session.rawApiKey ? `${session.rawApiKey.substring(0, 4)}...${session.rawApiKey.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealBoaConfigured) setRevealBoaConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('boa'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-emerald-300 transition-colors p-2 rounded-xl hover:bg-emerald-500/20 cursor-pointer"
                                            >
                                                {revealBoaConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {providerId === 'google' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-blue-300 uppercase tracking-wider pl-1">Google API Key</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showGoogleKeyInput ? "text" : "password"} 
                                                        value={googleKey}
                                                        onChange={e => setGoogleKey(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveGoogleKey()}
                                                        className="w-full bg-black/40 border border-blue-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-blue-400 transition-colors font-mono" 
                                                        placeholder="Enter Google API Key..."
                                                    />
                                                    <button type="button" onClick={() => setShowGoogleKeyInput(!showGoogleKeyInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showGoogleKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingGoogleKey(false); setGoogleKey(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveGoogleKey} disabled={isSavingGoogleKey} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(59,130,246,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingGoogleKey ? 'Saving...' : 'Save & Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                    <Key className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Key</span>
                                                    <span className="text-sm text-blue-200 font-mono tracking-widest mt-0.5">
                                                        {revealGoogleConfigured ? (session.rawGoogleApiKey || session.maskedGoogleApiKey) : (session.maskedGoogleApiKey || (session.rawGoogleApiKey ? `${session.rawGoogleApiKey.substring(0, 4)}...${session.rawGoogleApiKey.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealGoogleConfigured) setRevealGoogleConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('google'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-blue-300 transition-colors p-2 rounded-xl hover:bg-blue-500/20 cursor-pointer"
                                            >
                                                {revealGoogleConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {providerId === 'alibaba' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-orange-950/20 border border-orange-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-orange-300 uppercase tracking-wider pl-1">Alibaba Base URL (Optional)</label>
                                                <input 
                                                    type="text" 
                                                    value={alibabaBase}
                                                    onChange={e => setAlibabaBase(e.target.value)} 
                                                    className="w-full bg-black/40 border border-orange-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-400 transition-colors font-mono" 
                                                    placeholder="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-orange-300 uppercase tracking-wider pl-1">API Key</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showAlibabaKeyInput ? "text" : "password"} 
                                                        value={alibabaKey}
                                                        onChange={e => setAlibabaKey(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveAlibabaKey()}
                                                        className="w-full bg-black/40 border border-orange-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-orange-400 transition-colors font-mono" 
                                                        placeholder="sk-..."
                                                    />
                                                    <button type="button" onClick={() => setShowAlibabaKeyInput(!showAlibabaKeyInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showAlibabaKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingAlibabaKey(false); setAlibabaKey(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveAlibabaKey} disabled={isSavingAlibabaKey} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingAlibabaKey ? 'Saving...' : 'Save & Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                                    <Key className="w-5 h-5 text-orange-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Key</span>
                                                    <span className="text-sm text-orange-200 font-mono tracking-widest mt-0.5">
                                                        {revealAlibabaConfigured ? (session.rawAlibabaApiKey || session.maskedAlibabaApiKey) : (session.maskedAlibabaApiKey || (session.rawAlibabaApiKey ? `${session.rawAlibabaApiKey.substring(0, 4)}...${session.rawAlibabaApiKey.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealAlibabaConfigured) setRevealAlibabaConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('alibaba'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-orange-300 transition-colors p-2 rounded-xl hover:bg-orange-500/20 cursor-pointer"
                                            >
                                                {revealAlibabaConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {providerId === 'custom' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider pl-1">Base URL</label>
                                                <input 
                                                    type="text" 
                                                    value={customBase}
                                                    onChange={e => setCustomBase(e.target.value)} 
                                                    className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-400 transition-colors font-mono" 
                                                    placeholder="https://api.openai.com/v1"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider pl-1">API Key</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showCustomKeyInput ? "text" : "password"} 
                                                        value={customKey}
                                                        onChange={e => setCustomKey(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveCustomKey()}
                                                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-purple-400 transition-colors font-mono" 
                                                        placeholder="sk-..."
                                                    />
                                                    <button type="button" onClick={() => setShowCustomKeyInput(!showCustomKeyInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showCustomKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingCustomKey(false); setCustomKey(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveCustomKey} disabled={isSavingCustomKey} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingCustomKey ? 'Saving...' : 'Save & Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                                    <Key className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Key</span>
                                                    <span className="text-sm text-purple-200 font-mono tracking-widest mt-0.5">
                                                        {revealCustomConfigured ? (session.rawCustomApiKey || session.maskedCustomApiKey) : (session.maskedCustomApiKey || (session.rawCustomApiKey ? `${session.rawCustomApiKey.substring(0, 4)}...${session.rawCustomApiKey.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealCustomConfigured) setRevealCustomConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('custom'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-purple-300 transition-colors p-2 rounded-xl hover:bg-purple-500/20 cursor-pointer"
                                            >
                                                {revealCustomConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {providerId === 'github' && (
                                <div className="flex flex-col gap-4">
                                    {(isEditing || !hasKey) ? (
                                        <div className="flex flex-col gap-3 p-4 bg-gray-800/40 border border-gray-500/30 rounded-2xl">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider pl-1">GitHub Token</label>
                                                <div className="relative">
                                                    <input 
                                                        type={showGithubTokenInput ? "text" : "password"} 
                                                        value={githubToken}
                                                        onChange={e => setGithubToken(e.target.value)} 
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveGithubToken()}
                                                        className="w-full bg-black/40 border border-gray-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-gray-400 transition-colors font-mono" 
                                                        placeholder="ghp_..."
                                                    />
                                                    <button type="button" onClick={() => setShowGithubTokenInput(!showGithubTokenInput)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-1 cursor-pointer">
                                                        {showGithubTokenInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                {hasKey && (
                                                    <button onClick={() => { setIsEditingGithubToken(false); setGithubToken(''); }} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
                                                )}
                                                <button onClick={handleSaveGithubToken} disabled={isSavingGithubToken} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(156,163,175,0.4)] cursor-pointer disabled:opacity-50">
                                                    {isSavingGithubToken ? 'Saving...' : 'Save Token'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-600/30 rounded-2xl group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-700/50 rounded-lg">
                                                    <Lock className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white/60 font-medium">Active Token</span>
                                                    <span className="text-sm text-gray-300 font-mono tracking-widest mt-0.5">
                                                        {revealGithubConfigured ? (session.rawGithubToken || session.maskedGithubToken) : (session.maskedGithubToken || (session.rawGithubToken ? `${session.rawGithubToken.substring(0, 4)}...${session.rawGithubToken.slice(-4)}` : '••••••••••••••••'))}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (revealGithubConfigured) setRevealGithubConfigured(false);
                                                    else { setPasswordTargetAction('reveal'); setActivePasswordCard('github'); setCardPasswordInput(''); setCardPasswordError(''); }
                                                }}
                                                className="text-white/40 hover:text-gray-300 transition-colors p-2 rounded-xl hover:bg-gray-700/50 cursor-pointer"
                                            >
                                                {revealGithubConfigured ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Quantum Core Config</h4>
                    {!isMobile && (
                        <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-cyan-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                            {session.activeKeyType}
                        </div>
                    )}
                </div>
                
                {/* Horizontal scrollable provider selector */}
                <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar -mx-2 px-2 snap-x">
                    {providers.map(p => (
                        <button
                            key={p.id}
                            onClick={() => {
                                setActiveCredentialsTab(p.id);
                                if (p.id !== 'github') {
                                    handleActivateKeyType(p.id);
                                }
                            }}
                            className={`snap-center shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer w-[100px] h-[90px] relative ${
                                activeCredentialsTab === p.id 
                                ? `bg-${p.color}-500/20 border-${p.color}-400/50 shadow-[0_0_20px_rgba(var(--tw-colors-${p.color}-500),0.3)]` 
                                : 'bg-black/30 border-white/5 hover:bg-white/5'
                            }`}
                        >
                            {/* Active Engine Glow indicator (only for AI providers) */}
                            {session.activeKeyType === p.id && p.id !== 'github' && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse" />
                            )}
                            
                            <div className={`mb-2 p-2 rounded-xl ${activeCredentialsTab === p.id ? \`bg-\${p.color}-500/20 text-\${p.color}-300\` : 'bg-white/5 text-white/40'}`}>
                                {p.icon}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${activeCredentialsTab === p.id ? 'text-white' : 'text-white/50'}`}>
                                {p.name}
                            </span>
                        </button>
                    ))}
                </div>

                {/* The beautifully rendered configuration panel */}
                <div className="mt-2">
                    {renderProviderConfig(activeCredentialsTab)}
                </div>
            </div>
        );
    };
`

// Find insertion point right before 'return (' in NeetBotStudioFinal
const lines = code.split('\n');
const returnIndex = lines.findIndex(line => line.includes('return (') && !line.includes('Toast') && lines[lines.findIndex(l => l === line) - 1].includes('}'));
// Wait, a better way is to find a specific known line before the return.
