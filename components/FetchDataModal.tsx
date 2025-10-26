import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { LabeledInput, LabeledSelect } from './StrategyForm';
import type { DataConfig } from '../types';

interface FetchDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DataConfig, source: 'fetch') => Promise<void>;
}

const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'Bybit'];
const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT'];

const defaultConfig: DataConfig = {
    exchange: 'Binance',
    symbol: 'BTC/USDT',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    label: '',
};

export const FetchDataModal: React.FC<FetchDataModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslations();
  const [config, setConfig] = useState<DataConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Reset form when modal is opened
    if(isOpen){
        setConfig(defaultConfig);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(config, 'fetch');
    setIsSaving(false);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fetch-data-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h2 id="fetch-data-title" className="text-xl font-bold text-gray-800 font-source-serif">
                {t('fetchData')}
            </h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="p-6 space-y-4">
            <LabeledSelect label={t('exchange')} id="exchange" value={config.exchange} onChange={handleInputChange}>
                {EXCHANGES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </LabeledSelect>
            <LabeledSelect label={t('tradingPair')} id="symbol" value={config.symbol} onChange={handleInputChange}>
                {SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
            </LabeledSelect>
            <LabeledInput label={t('startDate')} id="startDate" type="date" value={config.startDate} onChange={handleInputChange} />
            <LabeledInput label={t('endDate')} id="endDate" type="date" value={config.endDate} onChange={handleInputChange} />
            <LabeledInput label={t('label')} id="label" type="text" value={config.label || ''} onChange={handleInputChange} />
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
            <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-[#D97757] rounded-lg hover:bg-[#C96747] disabled:bg-gray-400 disabled:cursor-wait">
                {isSaving ? t('fetchingData') : t('saveAndFetch')}
            </button>
        </div>
      </div>
    </div>
  );
};