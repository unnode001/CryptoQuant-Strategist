import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const LoadingSpinner: React.FC = () => {
  const { t } = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-orange-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-700 mt-4 text-lg font-semibold tracking-wide">{t('analyzingData')}</p>
      <p className="text-gray-500 text-sm font-roboto-mono">{t('generatingOptimalStrategy')}</p>
    </div>
  );
};