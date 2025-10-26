import React, { useState, useEffect, useRef } from 'react';
import { DisplaySection, StatCard } from './StrategyDisplay';
import { LabeledSelect } from './StrategyForm';
import { useTranslations } from '../hooks/useTranslations';
import type { MarketDataEntry, BacktestSummary, BacktestHistoryEntry } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface BacktesterPageProps {
    marketDataEntries: MarketDataEntry[];
    selectedMarketDataId: string | null;
    onSelectMarketData: (id: string | null) => void;
    loadedEntry: BacktestHistoryEntry | null;
    onDelete: (id: string) => void;
    onUpdateName: (id: string, newName: string) => void;
    // New props for controlled component
    script: string;
    onScriptChange: (script: string) => void;
    results: BacktestSummary | null;
    isLoading: boolean;
    onRunBacktest: () => void;
}

export const BacktesterPage: React.FC<BacktesterPageProps> = ({ 
    marketDataEntries, 
    selectedMarketDataId, 
    onSelectMarketData, 
    loadedEntry, 
    onDelete, 
    onUpdateName,
    script,
    onScriptChange,
    results,
    isLoading,
    onRunBacktest,
}) => {
    const { t } = useTranslations();
    
    // State for editing loaded entry name
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (loadedEntry) {
            setEditedName(loadedEntry.name);
            setIsEditingName(false);
        } else {
            setEditedName('');
        }
    }, [loadedEntry]);
    
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);
    
    const handleSaveName = () => {
        if (loadedEntry && editedName.trim() && editedName.trim() !== loadedEntry.name) {
            onUpdateName(loadedEntry.id, editedName.trim());
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') {
            setEditedName(loadedEntry?.name || '');
            setIsEditingName(false);
        }
    };
    
    const selectedData = marketDataEntries.find(entry => entry.id === selectedMarketDataId);

    const renderTitle = () => {
        if (loadedEntry) {
            return (
                <div className="flex items-center justify-center gap-4 group mb-2">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={handleNameKeyDown}
                            className="text-3xl text-center font-bold text-gray-900 font-source-serif bg-white border border-orange-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                    ) : (
                        <h2 className="text-3xl text-center font-bold text-gray-900 font-source-serif truncate" title={editedName}>
                            {editedName}
                        </h2>
                    )}
                    {!isEditingName && (
                        <div className="flex items-center">
                             <button
                                onClick={() => setIsEditingName(true)}
                                className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label={t('editName')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                            </button>
                             <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="p-2 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label={t('delete')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        return (
            <h2 className="text-3xl text-center font-bold text-gray-900 mb-2 font-source-serif">
                {t('strategyBacktester')}
            </h2>
        );
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
            {renderTitle()}
             <div className="text-center text-gray-500 mb-6 text-sm font-roboto-mono">
                {selectedData 
                    ? t('dataLoadedInfo', { symbol: selectedData.symbol, exchange: selectedData.exchange }) 
                    : t('noDataSourceSelected')}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <DisplaySection title={t('backtestingScript')}>
                        <textarea
                            value={script}
                            onChange={(e) => onScriptChange(e.target.value)}
                            className="w-full h-96 min-h-[500px] bg-gray-50 border border-gray-200 rounded-lg p-4 font-roboto-mono text-sm text-gray-700 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition resize-y"
                            placeholder={t('pastePineScript')}
                            readOnly={!!loadedEntry}
                        />
                    </DisplaySection>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <DisplaySection title={t('configuration')}>
                         <LabeledSelect
                            label={t('dataSource')}
                            id="dataSource"
                            value={selectedMarketDataId ?? ''}
                            onChange={(e) => onSelectMarketData(e.target.value || null)}
                            disabled={!!loadedEntry}
                         >
                            <option value="">{t('pleaseSelectData')}</option>
                            {marketDataEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.label ? `${entry.label} (${entry.symbol})` : `${entry.symbol} (${entry.exchange})`}
                                </option>
                            ))}
                         </LabeledSelect>
                    </DisplaySection>

                    <DisplaySection title={t('actions')}>
                         <div className="space-y-3">
                           <button 
                                onClick={onRunBacktest}
                                disabled={isLoading || !selectedData || !!loadedEntry}
                                className="w-full bg-[#D97757] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#C96747] transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                               {isLoading ? t('running') : t('runBacktest')}
                           </button>
                           <button className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center gap-2">
                                {t('exportResults')}
                           </button>
                         </div>
                    </DisplaySection>

                    <DisplaySection title={t('results')}>
                       {isLoading && <div className="flex justify-center items-center h-36"><div className="relative h-12 w-12"><div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div><div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div></div></div>}
                       {!isLoading && !results && <div className="text-center text-gray-500 h-36 flex items-center justify-center font-roboto-mono p-4 border-2 border-dashed border-gray-300 rounded-lg">{t('runBacktestToSeeResults')}</div>}
                       {results && (
                           <div className="grid grid-cols-2 gap-4">
                               <StatCard label={t('pnl')} value={results.pnl} />
                               <StatCard label={t('winRate')} value={results.winRate} />
                               <StatCard label={t('sharpeRatio')} value={results.sharpeRatio} />
                               <StatCard label={t('maxDrawdown')} value={results.maxDrawdown} />
                           </div>
                       )}
                    </DisplaySection>
                </div>
            </div>
            
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (loadedEntry) onDelete(loadedEntry.id);
                    setIsDeleteModalOpen(false);
                }}
                title={t('confirmDeleteBacktestTitle')}
                description={t('confirmDeleteBacktestDescription')}
            />
        </div>
    );
};