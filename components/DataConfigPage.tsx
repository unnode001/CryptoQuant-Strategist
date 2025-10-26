import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { DataConfig, MarketDataEntry } from '../types';
import { FetchDataModal } from './FetchDataModal';
import { ImportDataModal } from './ImportDataModal';
import { ConfirmationModal } from './ConfirmationModal';

interface DataConfigPageProps {
    marketDataEntries: MarketDataEntry[];
    onAddEntry: (config: DataConfig, source: 'fetch' | 'import', fileName?: string) => Promise<void>;
    onUpdateLabel: (id: string, label: string) => void;
    onDeleteEntry: (id: string) => void;
}


const DataEntryCard: React.FC<{ entry: MarketDataEntry; onDelete: () => void; onUpdateLabel: (id: string, newLabel: string) => void; }> = ({ entry, onDelete, onUpdateLabel }) => {
    const { t } = useTranslations();
    const [isEditing, setIsEditing] = useState(false);
    const [editedLabel, setEditedLabel] = useState(entry.label || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const isFetch = entry.source === 'fetch';

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleSaveLabel = () => {
        if (editedLabel.trim() !== (entry.label || '')) {
            onUpdateLabel(entry.id, editedLabel.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedLabel(entry.label || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveLabel();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };


    return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg flex items-center justify-between gap-4 hover:border-orange-300 transition-colors group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isFetch ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {isFetch ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{entry.symbol} <span className="text-sm font-normal text-gray-500">({entry.exchange})</span></p>
                    <p className="text-sm text-gray-500 font-roboto-mono">{entry.startDate} &rarr; {entry.endDate}</p>
                     {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editedLabel}
                            onChange={(e) => setEditedLabel(e.target.value)}
                            onBlur={handleSaveLabel}
                            onKeyDown={handleKeyDown}
                            className="w-full text-xs text-gray-600 font-roboto-mono bg-white border border-orange-300 rounded-md px-1 py-0.5 mt-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                     ) : (
                        <div className="group/label flex items-center gap-1 mt-1" onClick={() => setIsEditing(true)}>
                            {entry.label ? (
                                <p className="text-xs text-gray-500 font-roboto-mono truncate cursor-pointer">{entry.label}</p>
                            ) : (
                                <p className="text-xs text-gray-400 font-roboto-mono italic opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">{t('addLabel')}</p>
                            )}
                             <button
                                onClick={() => setIsEditing(true)}
                                className="text-gray-400 hover:text-gray-600 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 group-hover/label:opacity-100"
                                aria-label={t('editLabel')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                            </button>
                        </div>
                     )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={onDelete} 
                    className="p-2 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label={t('delete')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


export const DataConfigPage: React.FC<DataConfigPageProps> = ({ marketDataEntries, onAddEntry, onUpdateLabel, onDeleteEntry }) => {
    const { t } = useTranslations();
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<MarketDataEntry | null>(null);


    const filteredEntries = marketDataEntries.filter(entry =>
        entry.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.exchange.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.label && entry.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.fileName && entry.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleConfirmDelete = () => {
        if (entryToDelete) {
            onDeleteEntry(entryToDelete.id);
            setEntryToDelete(null); 
        }
    };
    
    return (
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
            <h2 className="text-3xl text-center font-bold text-gray-900 mb-6 font-source-serif">
                {t('dataConfiguration')}
            </h2>

            <div className="max-w-4xl mx-auto">
                {/* Header with Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full sm:w-auto sm:flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchDataSources')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-800 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={() => setIsImportModalOpen(true)} className="w-full sm:w-auto flex-1 text-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">{t('importData')}</button>
                        <button onClick={() => setIsFetchModalOpen(true)} className="w-full sm:w-auto flex-1 text-center px-4 py-2 text-sm font-semibold text-white bg-[#D97757] rounded-lg hover:bg-[#C96747] transition-colors">{t('fetchData')}</button>
                    </div>
                </div>

                {/* Data Entries List */}
                <div className="space-y-3">
                    {filteredEntries.length > 0 ? (
                        filteredEntries.map(entry => (
                            <DataEntryCard 
                                key={entry.id} 
                                entry={entry} 
                                onDelete={() => setEntryToDelete(entry)}
                                onUpdateLabel={onUpdateLabel}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-lg">
                             <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                            <h3 className="mt-2 text-lg font-semibold text-gray-800">{t('noDataEntries')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('addYourFirstDataSource')}</p>
                        </div>
                    )}
                </div>
            </div>

            <FetchDataModal 
                isOpen={isFetchModalOpen} 
                onClose={() => setIsFetchModalOpen(false)} 
                onSave={onAddEntry}
            />
            <ImportDataModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSave={onAddEntry}
            />
            <ConfirmationModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('confirmDeleteTitle')}
                description={t('confirmDeleteDescription')}
            />

        </div>
    );
};