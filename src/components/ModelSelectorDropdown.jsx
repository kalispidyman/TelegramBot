import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Sparkles } from 'lucide-react';

const ModelSelectorDropdown = ({
    activeModel,
    onModelSelect,
    activeKeyType,
    boaModelsList = [],
    customModelsList = [],
    alibabaModelsList = [],
    googleModelsList = [],
    bluesmindsModelsList = [],
    openrouterModelsList = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Get current models list based on active key type
    const models = useMemo(() => {
        let list = [];
        if (activeKeyType === 'boa') list = boaModelsList;
        else if (activeKeyType === 'custom') list = customModelsList;
        else if (activeKeyType === 'alibaba') list = alibabaModelsList;
        else if (activeKeyType === 'google') list = googleModelsList;
        else if (activeKeyType === 'bluesminds') list = bluesmindsModelsList;
        else if (activeKeyType === 'openrouter') list = openrouterModelsList;
        
        // Ensure everything is normalized to strings or objects with id/name
        return (list || []).map(m => {
            if (typeof m === 'string') return { id: m, name: m };
            return { id: m.id || m.name || '', name: m.name || m.id || '' };
        });
    }, [activeKeyType, boaModelsList, customModelsList, alibabaModelsList, googleModelsList, bluesmindsModelsList, openrouterModelsList]);

    // Filter models based on search term
    const filteredModels = useMemo(() => {
        if (!searchTerm.trim()) return models;
        const term = searchTerm.toLowerCase();
        return models.filter(m => m.id.toLowerCase().includes(term) || m.name.toLowerCase().includes(term));
    }, [models, searchTerm]);

    // Click outside listener to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear search term when dropdown closes/opens
    useEffect(() => {
        if (!isOpen) setSearchTerm('');
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center bg-[#070b19] hover:bg-[#0c142c] border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-200 outline-none transition-all cursor-pointer shadow-lg"
            >
                <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                    <span className="truncate">{activeModel || 'Select a Model'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-emerald-400/70 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-[#0a0f24]/95 backdrop-blur-xl border border-emerald-500/35 rounded-xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-50 p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input */}
                    <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search models..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-emerald-100 outline-none focus:border-emerald-500/50 placeholder-white/20 transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    {/* Models List */}
                    <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5 model-dropdown-scrollbar">
                        {filteredModels.length > 0 ? (
                            filteredModels.map(m => {
                                const isSelected = m.id === activeModel;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            onModelSelect(m.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-mono rounded-lg transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <span className="truncate">📡 {m.id}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-[10px] text-white/30 font-mono text-center py-4">
                                No models found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelSelectorDropdown;
