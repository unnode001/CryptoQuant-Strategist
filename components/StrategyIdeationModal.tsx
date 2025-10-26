import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface StrategyIdeationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (idea: string) => void;
  onSuggestRandom: () => void;
  isLoading: boolean;
  loadingAction: 'refine' | 'suggest' | null;
}

export const StrategyIdeationModal: React.FC<StrategyIdeationModalProps> = ({
  isOpen,
  onClose,
  onRefine,
  onSuggestRandom,
  isLoading,
  loadingAction,
}) => {
  const { t } = useTranslations();
  const [idea, setIdea] = useState('');

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

  useEffect(() => {
    if (!isOpen) {
        setIdea(''); // Reset on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefineClick = () => {
    if (idea.trim()) {
        onRefine(idea);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ideation-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 id="ideation-modal-title" className="text-xl font-bold text-gray-800 font-source-serif">
            {t('strategyIdeationHelper')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <label htmlFor="idea-textarea" className="block text-sm font-medium text-gray-700">{t('yourStrategyIdea')}</label>
          <textarea
            id="idea-textarea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full h-32 bg-white border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition resize-y"
            placeholder={t('ideaTextareaPlaceholder')}
          />
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-xl">
          <button
            onClick={onSuggestRandom}
            disabled={isLoading}
            className="w-full sm:w-auto text-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading && loadingAction === 'suggest' ? t('suggestingStrategy') : t('suggestRandomIdea')}
          </button>
          <button
            onClick={handleRefineClick}
            disabled={!idea.trim() || isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#D97757] rounded-lg hover:bg-[#C96747] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading && loadingAction === 'refine' ? t('refiningIdea') : t('refineMyIdea')}
          </button>
        </div>
      </div>
    </div>
  );
};