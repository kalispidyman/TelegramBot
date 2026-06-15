import React from 'react';
import {
    Menu, Clock, Power, Settings, Terminal, Key, Package,
    Brain, Edit2, Send
} from 'lucide-react';

const NeetBotStudioFinal = () => {
    return (
        <div className="min-h-screen bg-[#060913] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">

            {/* 1. DEEP SPACE BACKGROUND */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2500&auto=format&fit=crop')" }}
            />

            {/* Subtle Ambient Glows */}
            <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-[40%] right-[40%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* 2. FOREGROUND UI */}
            <div className="relative z-10 flex flex-col h-screen p-6 max-w-[1500px] mx-auto">

                {/* === HEADER === */}
                <header className="flex items-start justify-between mb-8">

                    {/* Left: Main Brand Pill */}
                    <div className="flex items-center px-8 py-3.5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_8px_32px_rgba(0,0,0,0.5)]">
                        <h1 className="text-2xl font-bold tracking-[0.15em] text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            NEET BOT STUDIO
                        </h1>
                    </div>

                    {/* Center: System Status Badge (Fixed double title) */}
                    <div className="relative flex flex-col items-center px-12 py-3 bg-white/[0.05] backdrop-blur-3xl border-t border-b border-white/10 rounded-[30px] shadow-[inset_0_1px_3px_rgba(255,255,255,0.1),_0_10px_40px_rgba(0,0,0,0.4)]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <h2 className="text-lg font-bold tracking-widest text-white/90 uppercase">QUANTUM AI INTERFACE</h2>
                        <p className="text-[10px] font-medium tracking-[0.3em] text-cyan-200/70 uppercase mt-0.5">
                            System Active // V3.0
                        </p>
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
                        <button className="px-6 py-3 bg-red-900/30 backdrop-blur-xl border border-red-500/40 rounded-full shadow-[inset_0_1px_2px_rgba(255,100,100,0.3),_0_0_20px_rgba(220,38,38,0.2)] hover:bg-red-900/50 transition">
                            <span className="text-sm font-bold tracking-widest text-red-100 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">NO API KEY</span>
                        </button>
                        <button className="p-3.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:bg-white/10 transition">
                            <Power className="w-5 h-5 text-white/80" />
                        </button>
                    </div>
                </header>

                {/* === MAIN DASHBOARD GRID === */}
                <div className="flex gap-8 flex-grow h-[calc(100vh-140px)]">

                    {/* --- LEFT COLUMN: CONFIG ENGINE --- */}
                    <div className="flex-[0.8] flex flex-col gap-6">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase ml-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Config Engine</h3>

                        {/* Exactly replicated staggered Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Large Gear (Spans 2 rows) */}
                            <div className="col-span-1 row-span-2 flex items-center justify-center bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_0_25px_rgba(34,211,238,0.15)] relative group cursor-pointer h-full">
                                <Settings className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                {/* Cyan bottom bar highlight */}
                                <div className="absolute bottom-4 w-12 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]" />
                            </div>

                            {/* Terminal */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white/[0.06] transition cursor-pointer h-24">
                                <Terminal className="w-6 h-6 text-cyan-100" />
                                <div className="absolute bottom-3 w-8 h-0.5 bg-cyan-400/50 rounded-full" />
                            </div>

                            {/* Key (Purple tint) */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-purple-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-purple-500/10 transition cursor-pointer h-24 relative">
                                <Key className="w-6 h-6 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <div className="absolute bottom-3 w-8 h-0.5 bg-purple-400/50 rounded-full" />
                            </div>

                            {/* Small Gear (Purple tint) */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-purple-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-purple-500/10 transition cursor-pointer h-24 relative">
                                <Settings className="w-6 h-6 text-purple-300" />
                                <div className="absolute bottom-3 w-8 h-0.5 bg-purple-400/50 rounded-full" />
                            </div>

                            {/* Package/Box (Green tint) */}
                            <div className="col-span-1 flex items-center justify-center p-4 bg-green-500/5 backdrop-blur-xl border border-green-500/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-green-500/10 transition cursor-pointer h-24 relative">
                                <Package className="w-6 h-6 text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                <div className="absolute bottom-3 w-8 h-0.5 bg-green-400/50 rounded-full" />
                            </div>
                        </div>

                        {/* Bottom 2 Cards (Model & Metrics) */}
                        <div className="flex gap-4 h-[280px]">

                            {/* Neural Model */}
                            <div className="flex-1 flex flex-col bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_10px_30px_rgba(0,0,0,0.3)] p-5 relative overflow-hidden">
                                <h4 className="text-sm font-medium text-white/90">Neural Model</h4>
                                <div className="flex-1 flex items-center justify-center relative mt-2">
                                    <div className="absolute w-28 h-28 border border-white/10 rotate-45 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
                                    <div className="absolute w-28 h-28 border border-cyan-500/30 -rotate-12 rounded-xl bg-cyan-900/10 backdrop-blur-sm" />
                                    <Brain className="w-14 h-14 text-white/70 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] relative z-10" />
                                </div>
                                <p className="text-[11px] font-mono text-cyan-300 mt-auto pt-2 text-center drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">claude-sonnet-4-5</p>
                            </div>

                            {/* Token Metrics */}
                            <div className="flex-1 flex flex-col bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_10px_30px_rgba(0,0,0,0.3)] p-5 relative overflow-hidden">
                                <h4 className="text-sm font-medium text-white/90">Token Metrics</h4>
                                <div className="flex-1 flex items-end justify-center gap-3 mt-4 mb-2 relative">
                                    {/* Purple Bar */}
                                    <div className="w-5 h-10 rounded-sm relative bg-gradient-to-t from-purple-600/50 to-purple-400/90 border border-purple-300/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                                    {/* Blue Bar */}
                                    <div className="w-5 h-16 rounded-sm relative bg-gradient-to-t from-blue-600/50 to-cyan-400/90 border border-cyan-300/30 shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
                                    {/* Green Bar */}
                                    <div className="w-5 h-24 rounded-sm relative bg-gradient-to-t from-emerald-600/50 to-green-400/90 border border-green-300/30 shadow-[0_0_15px_rgba(74,222,128,0.4)]" />
                                </div>
                                <p className="text-[11px] font-mono text-white/50 text-center mt-2 pt-2 border-t border-white/5">Total: 0</p>
                            </div>

                        </div>
                    </div>

                    {/* --- CENTER COLUMN: COMMAND UPLINK --- */}
                    <div className="flex-[1.5] flex flex-col">

                        {/* Top Floating Badges */}
                        <div className="w-full flex flex-col items-center gap-3 mb-6 relative z-20">

                            {/* Operator */}
                            <div className="px-5 py-2 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center gap-2">
                                <span className="text-xs font-medium text-white/80">Operator:</span>
                                <span className="text-xs font-bold text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Identity Verified</span>
                            </div>

                            {/* API Keys */}
                            <div className="flex w-[85%] gap-4">
                                <div className="flex-1 flex justify-between items-center px-5 py-3 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white/[0.06] transition cursor-pointer">
                                    <span className="text-sm font-medium text-white/90">Boa API Key</span>
                                    <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/70">
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                </div>
                                <div className="flex-1 flex justify-between items-center px-5 py-3 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white/[0.06] transition cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white/90">Github Token</span>
                                        <span className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Current: Not configured</span>
                                    </div>
                                    <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/70">
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Screen Title */}
                        <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase mb-3 pl-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Command Uplink</h3>

                        {/* The Large Curved Screen */}
                        <div className="w-full flex-grow relative bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-3xl border-t border-l border-r border-white/20 rounded-t-[40px] rounded-b-[20px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),_0_25px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden">

                            {/* Fake Code Matrix overlay for depth */}
                            <div className="absolute inset-y-0 left-4 w-32 flex flex-col justify-center opacity-10">
                                {/* Simulated lines of code */}
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="h-1 bg-white rounded-full mb-2" style={{ width: `${Math.random() * 80 + 20}%` }} />
                                ))}
                            </div>
                            <div className="absolute inset-y-0 right-4 w-32 flex flex-col justify-center items-end opacity-10">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="h-1 bg-white rounded-full mb-2" style={{ width: `${Math.random() * 80 + 20}%` }} />
                                ))}
                            </div>

                            <h2 className="text-3xl font-normal tracking-wide text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] mb-2">
                                Awaiting uplink...
                            </h2>
                            <p className="text-sm text-white/60 mb-8">Send a message via Telegram</p>
                            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 absolute bottom-12">Projected</p>
                        </div>

                        {/* Overlapping Input Bar */}
                        <div className="w-[85%] mx-auto -mt-7 relative z-30">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Transmit command..."
                                    className="w-full py-4 pl-6 pr-16 bg-[#080d1a]/90 backdrop-blur-3xl border border-white/20 rounded-full text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6),_0_10px_20px_rgba(0,0,0,0.4)] transition"
                                />
                                <button className="absolute right-2 p-2.5 rounded-full hover:bg-white/10 transition group">
                                    <Send className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* --- RIGHT COLUMN: LIVE ACTIVITY FEED --- */}
                    <div className="flex-[0.6] flex flex-col h-full">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase mb-3 pl-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Live Activity Feed</h3>

                        {/* Tall Glass Panel */}
                        <div className="w-full flex-grow relative bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[30px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center overflow-hidden">

                            {/* CSS Sine Wave / Vertical Lines Simulation */}
                            <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none">
                                <div className="w-px h-[80%] bg-gradient-to-b from-transparent via-cyan-300 to-transparent mx-2 blur-[1px]" />
                                <div className="w-[2px] h-[90%] bg-gradient-to-b from-transparent via-white to-transparent mx-3 blur-[2px]" />
                                <div className="w-px h-[70%] bg-gradient-to-b from-transparent via-blue-400 to-transparent mx-2 blur-[1px]" />
                            </div>

                            {/* Stars/Dots overlay */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            <div className="relative z-10 text-center px-6">
                                <h4 className="text-base font-bold tracking-[0.2em] text-white/80 uppercase leading-loose drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    Waiting For<br />Bot Activity...
                                </h4>
                            </div>

                            {/* Glowing bottom edge highlight */}
                            <div className="absolute bottom-0 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NeetBotStudioFinal;