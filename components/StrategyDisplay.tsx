import React from 'react';
import type { Strategy } from '../types';
import { CodeBlock } from './CodeBlock';
import { useTranslations } from '../hooks/useTranslations';

interface StrategyDisplayProps {
  strategy: Strategy;
  onLoadInBacktester: (pineScript: string) => void;
}

export const DisplaySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 font-source-serif">{title}</h3>
    {children}
  </div>
);

const ConditionList: React.FC<{ conditions: string[]; type: 'entry' | 'exit' }> = ({ conditions, type }) => {
  const iconColor = type === 'entry' ? 'text-green-600' : 'text-red-600';
  const iconPath = type === 'entry' 
    ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
    : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6";

  return (
    <ul className="space-y-2 font-roboto-mono text-gray-600 text-sm">
      {conditions.map((condition, index) => (
        <li key={index} className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
          <span>{condition}</span>
        </li>
      ))}
    </ul>
  );
};

export const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <p className="text-sm text-gray-500 font-sans">{label}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
    </div>
);


export const StrategyDisplay: React.FC<StrategyDisplayProps> = ({ strategy, onLoadInBacktester }) => {
  const { t } = useTranslations();
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 font-source-serif">{strategy.strategyName}</h2>
        <p className="text-gray-500 font-roboto-mono mt-1">{strategy.asset} | {strategy.timeframe} {t('timeframe')}</p>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">{strategy.description}</p>
      </div>

      <DisplaySection title={t('simulatedBacktestPerformance')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('pnl')} value={strategy.backtestSummary.pnl} />
          <StatCard label={t('winRate')} value={strategy.backtestSummary.winRate} />
          <StatCard label={t('sharpeRatio')} value={strategy.backtestSummary.sharpeRatio} />
          <StatCard label={t('maxDrawdown')} value={strategy.backtestSummary.maxDrawdown} />
        </div>
      </DisplaySection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DisplaySection title={t('entryConditions')}>
            <ConditionList conditions={strategy.entryConditions} type="entry" />
        </DisplaySection>
        <DisplaySection title={t('exitConditions')}>
            <ConditionList conditions={strategy.exitConditions} type="exit" />
        </DisplaySection>
      </div>

      <DisplaySection title={t('pineScript')}>
        <CodeBlock code={strategy.pineScript} />
        <button
            onClick={() => onLoadInBacktester(strategy.pineScript)}
            className="mt-4 bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21.5v-2.5M12 19l2-1m-2 1l-2-1m-2-5l-2-1m2 1l-2 1m2-1v2.5m10-2.5l2-1m-2 1l2 1m-2-1V14" />
            </svg>
            {t('loadInBacktester')}
        </button>
      </DisplaySection>
    </div>
  );
};