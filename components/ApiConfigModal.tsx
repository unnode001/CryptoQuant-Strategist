import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { LabeledInput } from './StrategyForm';
import type { ExchangeApiConfigs } from '../types';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configs: ExchangeApiConfigs) => void;
  initialConfigs: ExchangeApiConfigs;
}

const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'Bybit'];
type Exchange = typeof EXCHANGES[number];

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSave, initialConfigs }) => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<Exchange>('Binance');
  const [localConfigs, setLocalConfigs] = useState<ExchangeApiConfigs>(initialConfigs);

  useEffect(() => {
      if (isOpen) {
          setLocalConfigs(initialConfigs);
      }
  }, [isOpen, initialConfigs]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     setLocalConfigs(prev => ({
        ...prev,
        [activeTab]: {
            ...prev[activeTab],
            [name]: value
        }
     }));
  }

  const handleSave = () => {
    onSave(localConfigs);
    onClose();
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-config-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h2 id="api-config-title" className="text-xl font-bold text-gray-800 font-source-serif">{t('apiConfiguration')}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {EXCHANGES.map(exchange => (
                        <button
                            key={exchange}
                            onClick={() => setActiveTab(exchange as Exchange)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === exchange
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {exchange}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="space-y-4">
                {/* FIX: Removed unsupported `name` prop. The component uses `id` for the name attribute. */}
                <LabeledInput 
                    label="API Key"
                    id="apiKey"
                    value={localConfigs[activeTab]?.apiKey || ''}
                    onChange={handleInputChange}
                />
                 {/* FIX: Removed unsupported `name` prop. The component uses `id` for the name attribute. */}
                 <LabeledInput 
                    label="API Secret"
                    id="apiSecret"
                    type="password"
                    value={localConfigs[activeTab]?.apiSecret || ''}
                    onChange={handleInputChange}
                />
            </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                {t('cancel')}
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-[#D97757] rounded-lg hover:bg-[#C96747] transition-colors">
                {t('saveSettings')}
            </button>
        </div>
      </div>
    </div>
  );
};