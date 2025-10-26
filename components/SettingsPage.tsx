import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { LlmConfig, LlmProvider } from '../types';
import { FormSection, LabeledInput } from './StrategyForm';

interface SettingsPageProps {
    llmConfigs: LlmConfig;
    onSaveLlmConfigs: (configs: LlmConfig) => void;
}

const SUPPORTED_PROVIDERS: LlmProvider[] = ['OpenAI', 'Anthropic'];

export const SettingsPage: React.FC<SettingsPageProps> = ({ llmConfigs, onSaveLlmConfigs }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<LlmProvider>('OpenAI');
    const [localConfigs, setLocalConfigs] = useState<LlmConfig>({});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalConfigs(llmConfigs);
    }, [llmConfigs]);

    const handleInputChange = (provider: LlmProvider, field: 'apiKey' | 'model', value: string) => {
        setLocalConfigs(prev => ({
            ...prev,
            [provider]: {
                apiKey: field === 'apiKey' ? value : (prev[provider]?.apiKey || ''),
                model: field === 'model' ? value : (prev[provider]?.model || ''),
            }
        }));
    };

    const handleSave = () => {
        onSaveLlmConfigs(localConfigs);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-xl max-w-4xl mx-auto">
            <h2 className="text-3xl text-center font-bold text-gray-900 mb-6 font-source-serif">
                {t('settings')}
            </h2>

            <FormSection title={t('llmApiConfiguration')}>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {SUPPORTED_PROVIDERS.map(provider => (
                            <button
                                key={provider}
                                onClick={() => setActiveTab(provider)}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === provider
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t(provider as 'OpenAI' | 'Anthropic')}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    <LabeledInput 
                        label={`${t(activeTab as 'OpenAI' | 'Anthropic')} ${t('apiKey')}`}
                        id={`${activeTab}-apiKey`}
                        type="password"
                        value={localConfigs[activeTab]?.apiKey || ''}
                        onChange={(e) => handleInputChange(activeTab, 'apiKey', e.target.value)}
                    />
                    <LabeledInput 
                        label={`${t(activeTab as 'OpenAI' | 'Anthropic')} ${t('model')}`}
                        id={`${activeTab}-model`}
                        value={localConfigs[activeTab]?.model || ''}
                        onChange={(e) => handleInputChange(activeTab, 'model', e.target.value)}
                    />
                </div>
            </FormSection>

            <div className="mt-8 flex justify-end items-center gap-4">
                 {saved && <span className="text-sm text-green-600 font-medium transition-opacity">{t('settingsSaved')}</span>}
                <button 
                    onClick={handleSave}
                    className="bg-[#D97757] text-white font-semibold py-2 px-6 rounded-lg hover:bg-[#C96747] transition-all duration-200"
                >
                    {t('saveSettings')}
                </button>
            </div>
        </div>
    );
};
