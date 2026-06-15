const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { 
  Settings, MessageSquare, TerminalSquare, RefreshCw, PanelLeftClose, PanelLeftOpen,
  Key, Github, Cpu, ChevronDown, Send, Maximize2, Minimize2, CheckCircle2, XCircle, Terminal
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface TokenUsage { prompt_tokens: number; completion_tokens: number; total_tokens: number; }
interface ChatMessage { sender: 'user' | 'bot'; text: string; timestamp: string; }
interface SessionData {
  loggedIn: boolean; email: string | null; name: string | null; picture: string | null;
  hasApiKey: boolean; maskedApiKey: string | null;
  hasGithubToken: boolean; maskedGithubToken: string | null;
  modelName?: string;
  usage?: TokenUsage; chats?: ChatMessage[];
}

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={\`toast \${type}\`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />} {msg}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<SessionData>({
    loggedIn: false, email: null, name: null, picture: null,
    hasApiKey: false, maskedApiKey: null,
    hasGithubToken: false, maskedGithubToken: null,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, chats: []
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [boaKey, setBoaKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isSavingGithubKey, setIsSavingGithubKey] = useState(false);
  const [isEditingGithubKey, setIsEditingGithubKey] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'settings' | 'terminal'>('chat');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/models\`);
      if (res.ok) {
        const d = await res.json();
        if (d.models && Array.isArray(d.models)) setAvailableModels(d.models.map((m: any) => m.id || m));
      }
    } catch (_) {}
    setIsFetchingModels(false);
  };

  const fetchSession = async () => {
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/session\`);
      if (res.ok) setSession(await res.json());
    } catch (_) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/logs\`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs || []); }
    } catch (_) {}
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSession(), fetchLogs()]);
    if (session.hasApiKey) await fetchModels();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSelectModel = async (modelName: string) => {
    if (!modelName) return;
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/credentials\`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelName })
      });
      if (res.ok) { setToast({ msg: 'Model updated successfully!', type: 'success' }); fetchSession(); }
    } catch (_) {}
  };

  useEffect(() => { if (session.hasApiKey && availableModels.length === 0) fetchModels(); }, [session.hasApiKey]);

  const handleSaveKey = async () => {
    if (!boaKey.trim()) { setToast({ msg: 'API key cannot be empty!', type: 'error' }); return; }
    setIsSavingKey(true);
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/credentials\`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: boaKey.trim() })
      });
      if (res.ok) { setBoaKey(''); setToast({ msg: 'API Key updated!', type: 'success' }); setIsEditingKey(false); fetchSession(); } 
      else setToast({ msg: (await res.json()).error || 'Failed to update key', type: 'error' });
    } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingKey(false); }
  };

  const handleSaveGithubKey = async () => {
    if (!githubToken.trim()) { setToast({ msg: 'Token cannot be empty!', type: 'error' }); return; }
    setIsSavingGithubKey(true);
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/credentials\`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ githubToken: githubToken.trim() })
      });
      if (res.ok) { setGithubToken(''); setToast({ msg: 'GitHub Token updated!', type: 'success' }); setIsEditingGithubKey(false); fetchSession(); } 
      else setToast({ msg: (await res.json()).error || 'Failed to update token', type: 'error' });
    } catch (_) { setToast({ msg: 'Network error', type: 'error' }); } finally { setIsSavingGithubKey(false); }
  };

  const handleSendChat = async () => {
    if (!chatDraft.trim()) return;
    setIsSendingChat(true);
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/chat\`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: chatDraft })
      });
      if (res.ok) { setChatDraft(''); fetchSession(); }
    } catch (_) { setToast({ msg: 'Failed to send message', type: 'error' }); } finally { setIsSendingChat(false); }
  };

  useEffect(() => { handleRefresh(); const iv = setInterval(() => { fetchSession(); fetchLogs(); }, 2500); return () => clearInterval(iv); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [session.chats]);

  const usage = session.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const total = usage.total_tokens || 1;
  const promptPct = Math.round((usage.prompt_tokens / total) * 100) || 0;
  const completionPct = Math.round((usage.completion_tokens / total) * 100) || 0;
  const fmt = (iso: string) => { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

  const toggleExpand = (id: string) => setExpandedCard(expandedCard === id ? null : id);

  const ExpandWrapper = ({ id, children, className = '' }: { id: string, children: React.ReactNode, className?: string }) => {
    const isExpanded = expandedCard === id;
    if (isExpanded) {
      return (
        <div className="expanded-overlay" onClick={() => setExpandedCard(null)}>
          <div className={\`expanded-card \${className}\`} onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>
      );
    }
    return <div className={className}>{children}</div>;
  };

  const renderExpandBtn = (id: string) => (
    <button className={\`action-btn \${expandedCard === id ? 'active' : ''}\`} onClick={() => toggleExpand(id)} title={expandedCard === id ? "Reduce" : "Expand Fullscreen"}>
      {expandedCard === id ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob blob-purple"></div>
        <div className="blob blob-emerald"></div>
        <div className="blob blob-blue"></div>
      </div>

      <nav className="nav-header" style={{ position: 'relative', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="logo-orb"><TerminalSquare size={20} color="white" /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(90deg, #00F0FF, #D900FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NEET STUDIO X
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }} className="hide-on-mobile">
              Quantum Interface
            </div>
          </div>
          <button className="action-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title="Toggle Configuration Panel" style={{ marginLeft: '16px' }}>
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={\`stat-badge \${session.hasApiKey ? 'active' : 'inactive'}\`}>
            <span className="dot" />{session.hasApiKey ? 'SYSTEM SECURE' : 'SYSTEM OFFLINE'}
          </div>
          <button onClick={handleRefresh} className="action-btn" title="Sync Core">
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </nav>

      <main className={\`dashboard-grid \${expandedCard ? 'has-expanded-card' : ''} \${isSidebarCollapsed ? 'sidebar-collapsed' : ''}\`}>
        {/* PANE 1: SETTINGS */}
        <aside className={\`dashboard-pane glass pane-settings \${mobileTab === 'settings' ? 'active-mobile' : ''}\`}>
          <div className="pane-header"><Settings size={18} color="var(--cyan)" /> Configuration Engine</div>
          <div className="pane-content settings-content">
            
            <ExpandWrapper id="profile" className="config-card">
              <div className="config-header" style={{ marginBottom: '10px' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>OPERATOR PROFILE</div>
                {renderExpandBtn('profile')}
              </div>
              <div className="profile-card">
                <img src={session.picture || \`https://api.dicebear.com/7.x/bottts/svg?seed=admin\`} alt="avatar" />
                <div className="profile-info">
                  <div className="profile-name">{session.name || 'Administrator'}</div>
                  <div className="profile-status">Identity Verified</div>
                </div>
                <div className="status-badge online">ONLINE</div>
              </div>
            </ExpandWrapper>

            <ExpandWrapper id="apikey" className="config-card">
              <div className="config-header">
                <div className="config-title">
                  <div className="icon-box"><Key size={18} color="var(--purple)" /></div>
                  <div>
                    <div className="title-text">Bay of Assets Key</div>
                    <div className="subtitle-text">Current: <span>{session.maskedApiKey || 'Not configured'}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isEditingKey && <button className="edit-btn" onClick={() => { setBoaKey(''); setIsEditingKey(true); }}>Edit</button>}
                  {renderExpandBtn('apikey')}
                </div>
              </div>
              {isEditingKey && (
                <div className="config-edit">
                  <div className="input-group">
                    <input type="password" placeholder="boa-xxxx" value={boaKey} onChange={e => setBoaKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveKey()} autoFocus />
                    <button className="save-btn" onClick={handleSaveKey} disabled={isSavingKey || !boaKey.trim()}>{isSavingKey ? '...' : 'Save'}</button>
                    <button className="cancel-btn" onClick={() => setIsEditingKey(false)}>✕</button>
                  </div>
                </div>
              )}
            </ExpandWrapper>

            <ExpandWrapper id="github" className="config-card">
              <div className="config-header">
                <div className="config-title">
                  <div className="icon-box"><Github size={18} color="var(--green)" /></div>
                  <div>
                    <div className="title-text">GitHub Token</div>
                    <div className="subtitle-text">Current: <span style={{ color: 'var(--green)' }}>{session.maskedGithubToken || 'Not configured'}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isEditingGithubKey && <button className="edit-btn green" onClick={() => { setGithubToken(''); setIsEditingGithubKey(true); }}>Edit</button>}
                  {renderExpandBtn('github')}
                </div>
              </div>
              {isEditingGithubKey && (
                <div className="config-edit">
                  <div className="input-group">
                    <input type="password" placeholder="ghp_xxxx" value={githubToken} onChange={e => setGithubToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveGithubKey()} autoFocus />
                    <button className="save-btn green" onClick={handleSaveGithubKey} disabled={isSavingGithubKey || !githubToken.trim()}>{isSavingGithubKey ? '...' : 'Save'}</button>
                    <button className="cancel-btn" onClick={() => setIsEditingGithubKey(false)}>✕</button>
                  </div>
                </div>
              )}
            </ExpandWrapper>

            <ExpandWrapper id="model" className="config-card">
              <div className="config-header">
                <div className="config-title">
                  <div className="icon-box"><Cpu size={18} color="var(--cyan)" /></div>
                  <div className="title-text">Neural Model</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="refresh-btn" onClick={fetchModels} disabled={isFetchingModels || !session.hasApiKey}><RefreshCw size={14} /></button>
                  {renderExpandBtn('model')}
                </div>
              </div>
              <div className="custom-dropdown-container" style={{ marginTop: '12px' }}>
                <button className={\`custom-dropdown-button \${isModelDropdownOpen ? 'active' : ''}\`} onClick={() => session.hasApiKey && setIsModelDropdownOpen(!isModelDropdownOpen)} disabled={!session.hasApiKey}>
                  {session.modelName || 'claude-sonnet-4-6-thinking'}
                  <ChevronDown size={16} style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
                <div className={\`custom-dropdown-list \${isModelDropdownOpen ? 'open' : ''}\`}>
                  {(availableModels.length > 0 ? availableModels : [session.modelName || 'claude-sonnet-4-6-thinking']).map(m => (
                    <div key={m} className={\`custom-dropdown-item \${session.modelName === m ? 'selected' : ''}\`} onClick={() => { handleSelectModel(m); setIsModelDropdownOpen(false); }}>
                      {session.modelName === m ? <Check size={14} /> : <div style={{ width: '14px' }} />} {m}
                    </div>
                  ))}
                </div>
              </div>
            </ExpandWrapper>
            
            <ExpandWrapper id="metrics" className="config-card">
              <div className="config-header" style={{ marginBottom: '12px' }}>
                <div className="metrics-header" style={{ margin: 0 }}>TOKEN TELEMETRY</div>
                {renderExpandBtn('metrics')}
              </div>
              <div className="total-tokens" style={{ marginBottom: '8px' }}>{usage.total_tokens.toLocaleString()}</div>
              <div className="token-bar">
                <div className="token-bar-fill prompt" style={{ width: \`\${promptPct}%\` }} />
                <div className="token-bar-fill completion" style={{ width: \`\${completionPct}%\` }} />
              </div>
              <div className="metrics-legend">
                <span className="prompt-text">In: {usage.prompt_tokens.toLocaleString()} ({promptPct}%)</span>
                <span className="completion-text">Out: {usage.completion_tokens.toLocaleString()} ({completionPct}%)</span>
              </div>
            </ExpandWrapper>

          </div>
        </aside>

        {/* PANE 2: CHAT */}
        <ExpandWrapper id="chat" className={\`dashboard-pane glass pane-chat \${mobileTab === 'chat' ? 'active-mobile' : ''}\`}>
          <div className="pane-header">
            <MessageSquare size={18} color="var(--blue)" /> Command Uplink
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {session.chats && session.chats.length > 0 && <span className="stat-badge active" style={{ padding: '2px 8px' }}>{session.chats.length}</span>}
              {renderExpandBtn('chat')}
            </div>
          </div>
          <div className="pane-content chat-list">
            {session.chats && session.chats.length > 0 ? session.chats.map((c, i) => (
              <div key={i} className={\`chat-bubble-container \${c.sender === 'user' ? 'right' : 'left'}\`}>
                <div className={\`chat-bubble \${c.sender === 'user' ? 'user' : 'bot'}\`}>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text}</div>
                  <div className="chat-timestamp">{fmt(c.timestamp)}</div>
                </div>
              </div>
            )) : <div className="empty-state"><MessageSquare size={32} opacity={0.5} /><div>Awaiting uplink...</div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-area">
            <input type="text" placeholder="Transmit command..." value={chatDraft} onChange={e => setChatDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} disabled={isSendingChat} />
            <button onClick={handleSendChat} disabled={isSendingChat || !chatDraft.trim()}>
              {isSendingChat ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
        </ExpandWrapper>

        {/* PANE 3: TERMINAL */}
        <ExpandWrapper id="terminal" className={\`dashboard-pane glass terminal-scanline pane-terminal \${mobileTab === 'terminal' ? 'active-mobile' : ''}\`}>
          <div className="pane-header terminal-header">
            <Terminal size={18} color="var(--purple)" /> Core Activity Log
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="stat-badge active" style={{ padding: '2px 8px', color: 'var(--purple)', borderColor: 'rgba(217,0,255,0.3)' }}>{logs.length}</span>
              {renderExpandBtn('terminal')}
            </div>
          </div>
          <div className="pane-content terminal-logs">
            {logs.length > 0 ? [...logs].reverse().map((log, i) => {
              const isErr = log.includes('⚠️') || log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
              const isOk  = log.includes('✅') || log.toLowerCase().includes('success') || log.toLowerCase().includes('deployed');
              return <div key={i} className={\`log-entry \${i === 0 ? 'latest' : ''} \${isErr ? 'error' : isOk ? 'success' : ''}\`}>{log}</div>;
            }) : <div className="empty-state">Initializing Core...</div>}
          </div>
        </ExpandWrapper>

      </main>

      <div className="mobile-bottom-nav">
        <button className={mobileTab === 'settings' ? 'active' : ''} onClick={() => setMobileTab('settings')}><Settings size={22} /> System</button>
        <button className={mobileTab === 'chat' ? 'active' : ''} onClick={() => setMobileTab('chat')}><MessageSquare size={22} /> Uplink</button>
        <button className={mobileTab === 'terminal' ? 'active' : ''} onClick={() => setMobileTab('terminal')}><Terminal size={22} /> Logs</button>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
`

fs.writeFileSync('src/App.tsx', code);
