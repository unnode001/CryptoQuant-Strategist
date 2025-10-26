import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { BacktestHistoryEntry } from '../types';

interface SearchPageProps {
    history: BacktestHistoryEntry[];
    onSelectHistory: (entry: BacktestHistoryEntry) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ history, onSelectHistory }) => {
    const { t } = useTranslations();
    const [query, setQuery] = useState('');

    const filteredHistory = history.filter(entry =>
        entry.name.toLowerCase().includes(query.toLowerCase()) ||
        entry.dataSource.symbol.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
            <h2 className="text-3xl text-center font-bold text-gray-900 mb-6 font-source-serif">
                {t('searchStrategies')}
            </h2>

            <div className="max-w-3xl mx-auto">
                {/* Search Input */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-white border border-gray-300 rounded-full py-3 pl-11 pr-4 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>

                {/* Results List */}
                <div className="space-y-2">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((entry) => (
                            <button 
                                key={entry.id} 
                                onClick={() => onSelectHistory(entry)}
                                className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200/80 rounded-lg transition-colors group"
                            >
                                <p className="font-medium text-gray-800 group-hover:text-orange-800">{entry.name}</p>
                                <p className="text-sm text-gray-500 font-roboto-mono mt-1">
                                    {entry.dataSource.symbol} &bull; {new Date(entry.date).toLocaleDateString()}
                                </p>
                            </button>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             <p className="mt-4 font-semibold">{t('noStrategiesFound')}</p>
                             <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};