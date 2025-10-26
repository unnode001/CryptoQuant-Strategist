import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { DisplaySection } from './StrategyDisplay';
import { CodeBlock } from './CodeBlock';
import type { LlmConfig, LlmProvider } from '../types';
import { StrategyIdeationModal } from './StrategyIdeationModal';

interface ScriptGeneratorPageProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    generatedScript: string | null;
    isLoading: boolean;
    isSuggesting: boolean;
    suggestionLoadingAction: 'refine' | 'suggest' | null;
    error: string | null;
    onGenerate: () => void;
    onSuggestRandom: () => Promise<void>;
    onRefine: (idea: string) => Promise<void>;
    onLoadInBacktester: () => void;
    llmConfigs: LlmConfig;
    activeProvider: LlmProvider | 'Gemini';
    onProviderChange: (provider: LlmProvider | 'Gemini') => void;
}

const PROVIDERS: (LlmProvider | 'Gemini')[] = ['Gemini', 'OpenAI', 'Anthropic'];

const ProviderSelector: React.FC<{
    activeProvider: LlmProvider | 'Gemini';
    onProviderChange: (provider: LlmProvider | 'Gemini') => void;
    llmConfigs: LlmConfig;
}> = ({ activeProvider, onProviderChange, llmConfigs }) => {
    const { t } = useTranslations();

    const isDisabled = (provider: LlmProvider) => {
        return !llmConfigs[provider]?.apiKey || !llmConfigs[provider]?.model;
    }

    return (
        <div>
            <h3 className="text-center text-sm font-semibold text-gray-600 mb-2">{t('selectAiProvider')}</h3>
            <div className="flex justify-center">
                <div className="inline-flex rounded-lg shadow-sm bg-gray-100 p-1 space-x-1">
                    {PROVIDERS.map(provider => {
                        const disabled = provider !== 'Gemini' && isDisabled(provider);
                        const isActive = activeProvider === provider;
                        return (
                             <div key={provider} className="relative group">
                                <button
                                    onClick={() => onProviderChange(provider)}
                                    disabled={disabled}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400
                                        ${isActive ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600 hover:bg-white/60'}
                                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {t(provider as 'Gemini' | 'OpenAI' | 'Anthropic')}
                                </button>
                                {disabled && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {t('providerNotConfigured', { provider })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};


export const ScriptGeneratorPage: React.FC<ScriptGeneratorPageProps> = ({
    prompt,
    onPromptChange,
    generatedScript,
    isLoading,
    isSuggesting,
    suggestionLoadingAction,
    error,
    onGenerate,
    onSuggestRandom,
    onRefine,
    onLoadInBacktester,
    llmConfigs,
    activeProvider,
    onProviderChange
}) => {
    const { t } = useTranslations();
    const [isIdeationModalOpen, setIsIdeationModalOpen] = useState(false);

    const handleRefine = async (idea: string) => {
        await onRefine(idea);
        setIsIdeationModalOpen(false);
    };

    const handleSuggest = async () => {
        await onSuggestRandom();
        setIsIdeationModalOpen(false);
    }


    return (
        <div className="p-6 bg-white border border-gray-200 rounded-xl space-y-8">
            <div>
                <h2 className="text-3xl text-center font-bold text-gray-900 font-source-serif">{t('aiAssistedScriptGenerator')}</h2>
                <p className="text-center text-gray-500 mt-2 max-w-2xl mx-auto">{t('scriptGeneratorDescription')}</p>
            </div>

            <ProviderSelector 
                activeProvider={activeProvider}
                onProviderChange={onProviderChange}
                llmConfigs={llmConfigs}
            />

            <DisplaySection title={t('strategyPrompt')}>
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className="w-full h-40 bg-white border border-gray-300 rounded-lg p-4 text-gray-800 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition resize-y"
                    placeholder={t('strategyPromptPlaceholder')}
                />
                 <div className="flex flex-wrap items-center gap-4 mt-4">
                    <button
                        onClick={onGenerate}
                        disabled={isLoading || isSuggesting || !prompt.trim()}
                        className="w-full sm:w-auto bg-[#D97757] text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-[#C96747] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? t('generatingScript') : t('generateScript')}
                    </button>
                     <button
                        onClick={() => setIsIdeationModalOpen(true)}
                        disabled={isLoading || isSuggesting}
                        className="w-full sm:w-auto text-center px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                     >
                        {t('getStrategyIdea')}
                     </button>
                 </div>
            </DisplaySection>

            <DisplaySection title={t('scriptPreview')}>
                {isLoading && <div className="flex justify-center items-center h-48"><div className="relative h-12 w-12"><div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div><div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div></div></div>}
                {error && <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-red-700 font-roboto-mono">{error}</div>}
                {generatedScript && !isLoading && (
                    <div>
                        <CodeBlock code={generatedScript} />
                        <button
                            onClick={onLoadInBacktester}
                            className="mt-4 bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21.5v-2.5M12 19l2-1m-2 1l-2-1m-2-5l-2-1m2 1l-2 1m2-1v2.5m10-2.5l2-1m-2 1l2 1m-2-1V14" />
                            </svg>
                            {t('loadInBacktester')}
                        </button>
                    </div>
                )}
                {!isLoading && !error && !generatedScript && (
                    <div className="text-center text-gray-500 h-48 flex items-center justify-center font-roboto-mono p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        {t('initialScriptPreview')}
                    </div>
                )}
            </DisplaySection>

            <StrategyIdeationModal
                isOpen={isIdeationModalOpen}
                onClose={() => setIsIdeationModalOpen(false)}
                onRefine={handleRefine}
                onSuggestRandom={handleSuggest}
                isLoading={isSuggesting}
                loadingAction={suggestionLoadingAction}
            />
        </div>
    );
};