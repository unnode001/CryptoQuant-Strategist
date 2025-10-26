import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { BacktestHistoryEntry, ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onNewStrategy: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  history: BacktestHistoryEntry[];
  onSelectHistory: (entry: BacktestHistoryEntry) => void;
  onOpenApiConfig: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isCollapsed: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed }) => {
    return (
         <div className="relative group">
            <button
                onClick={onClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-orange-100 text-orange-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : 'w-full'}`}
            >
                {icon}
                <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
            </button>
             {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {label}
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onNewStrategy, isCollapsed, onToggle, history, onSelectHistory, onOpenApiConfig }) => {
    const { t, setLanguage, language } = useTranslations();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    // FIX: Corrected typo from HTMLDivElenent to HTMLDivElement.
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // FIX: Corrected typo from userMenu_menuRef to userMenuRef.
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <aside className={`relative bg-[#F0ECE7] p-4 flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Wrapper for top and middle sections to enforce footer position */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* --- Top Section --- */}
                <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-100' : 'opacity-100'}`}>
                    <button
                        onClick={onToggle}
                        aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
                        className={`w-full flex items-center gap-2 mb-6 p-2 rounded-lg transition-colors hover:bg-gray-200/60 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                    >
                        <div className="w-8 h-8 bg-[#D97757] rounded-md flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-5 h-5 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className={`text-lg font-bold text-gray-800 font-source-serif whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            {t('appTitle')}
                        </h1>
                    </button>

                    <button
                        onClick={onNewStrategy}
                        className={`flex items-center justify-center gap-2 mb-4 bg-[#D97757] text-white hover:bg-[#C96747] transition-all duration-200 text-sm font-semibold ${isCollapsed ? 'w-12 h-12 rounded-lg' : 'w-full px-4 py-2 rounded-md'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{t('newStrategy')}</span>
                    </button>

                    <nav className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
                        <NavItem
                            label={t('scriptGenerator')}
                            isActive={activeView === 'script_generator'}
                            onClick={() => setActiveView('script_generator')}
                            isCollapsed={isCollapsed}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                        />
                        <NavItem
                            label={t('backtester')}
                            isActive={activeView === 'backtester'}
                            onClick={() => setActiveView('backtester')}
                            isCollapsed={isCollapsed}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>}
                        />
                        <NavItem
                            label={t('dataConfiguration')}
                            isActive={activeView === 'dataconfig'}
                            onClick={() => setActiveView('dataconfig')}
                            isCollapsed={isCollapsed}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
                        />
                        <NavItem
                            label={t('searchStrategies')}
                            isActive={activeView === 'search'}
                            onClick={() => setActiveView('search')}
                            isCollapsed={isCollapsed}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        />
                    </nav>
                </div>

                {/* --- Middle Scrollable Section --- */}
                <div className={`flex flex-col min-h-0 mt-6 pt-6 border-t border-gray-200/80 transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'flex-1 max-h-screen opacity-100'}`}>
                    <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t('backtestHistory')}
                    </h2>
                    <div className="overflow-y-auto -mr-2 pr-1">
                        <nav className="flex flex-col gap-1">
                            {history.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => onSelectHistory(entry)}
                                    className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-200/60 transition-colors truncate"
                                    title={entry.name}
                                >
                                    {entry.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>


            {/* --- Bottom User Menu Section --- */}
            <div className="pt-4 mt-4 border-t border-gray-200/80 relative" ref={userMenuRef}>
                 {isUserMenuOpen && (
                    <div className={`absolute z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-sm text-gray-700 font-medium ${isCollapsed ? 'w-48 left-full top-1/2 -translate-y-1/2 ml-2' : 'w-full bottom-full mb-2'}`}>
                        <button 
                            onClick={() => {
                                onOpenApiConfig();
                                setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors">
                                {t('apiConfiguration')}
                        </button>
                        <button 
                            onClick={() => {
                                setActiveView('settings');
                                setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors">
                                {t('settings')}
                        </button>
                        <div className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex justify-between items-center">
                            <label htmlFor="language-select" className="cursor-pointer">{t('language')}</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
                                onClick={(e) => e.stopPropagation()} // Prevent menu close on select click
                                className="text-xs font-medium text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer"
                                aria-label="Change language"
                            >
                                <option value="en">EN</option>
                                <option value="zh">ZH</option>
                            </select>
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setIsUserMenuOpen(prev => !prev)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                     <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                        AI
                     </div>
                     <div className={`flex-1 text-left transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                         <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{t('aiStrategist')}</p>
                         <p className="text-xs text-gray-500 whitespace-nowrap">{t('proPlan')}</p>
                     </div>
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-all duration-200 ${isUserMenuOpen ? 'rotate-180' : ''} ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        </aside>
    );
};