import React, { useState } from 'react';
import type { StrategyRequest, IndicatorParams } from '../types';
import { useTranslations, type TranslationKey } from '../hooks/useTranslations';

interface StrategyFormProps {
  onGenerate: (request: StrategyRequest) => void;
  isLoading: boolean;
}

const AVAILABLE_INDICATORS = {
  RSI: { period: 14, overbought: 70, oversold: 30 },
  MACD: { fast: 12, slow: 26, signal: 9 },
  'Bollinger Bands': { period: 20, stdDev: 2 },
};

type IndicatorName = keyof typeof AVAILABLE_INDICATORS;

export const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-base font-semibold text-gray-600 border-b border-gray-200 pb-2 mb-4 font-source-serif">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export const LabeledInput: React.FC<{ label: string; id: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, id, type = 'text', value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition"
    />
  </div>
);

// FIX: Added optional disabled prop to LabeledSelect to support disabling the select element.
export const LabeledSelect: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; disabled?: boolean; }> = ({ label, id, value, onChange, children, disabled }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <select id={id} name={id} value={value} onChange={onChange} disabled={disabled} className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed">
            {children}
        </select>
    </div>
);


export const StrategyForm: React.FC<StrategyFormProps> = ({ onGenerate, isLoading }) => {
  const { t } = useTranslations();
  const [asset, setAsset] = useState('BTC/USDT');
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorName[]>(['RSI']);
  const [indicatorParams, setIndicatorParams] = useState<{ [key in IndicatorName]?: IndicatorParams }>({
    RSI: AVAILABLE_INDICATORS.RSI,
  });
  const [risk, setRisk] = useState({ stopLoss: 2, takeProfit: 5 });

  const handleIndicatorToggle = (name: IndicatorName) => {
    setSelectedIndicators(prev => {
      const newSelection = prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name];
      
      setIndicatorParams(currentParams => {
        const newParams = { ...currentParams };
        if (newSelection.includes(name) && !newParams[name]) {
          newParams[name] = AVAILABLE_INDICATORS[name];
        }
        return newParams;
      });

      return newSelection;
    });
  };

  const handleParamChange = (indicator: IndicatorName, param: string, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
        setIndicatorParams(prev => ({
            ...prev,
            [indicator]: {
                ...prev[indicator],
                [param]: numValue,
            },
        }));
    }
  };

  const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    if (!isNaN(numValue)) {
        setRisk(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const indicatorsPayload: { [key: string]: IndicatorParams } = {};
    selectedIndicators.forEach(ind => {
        if(indicatorParams[ind]){
            indicatorsPayload[ind] = indicatorParams[ind] as IndicatorParams;
        }
    });
    
    onGenerate({ asset, indicators: indicatorsPayload, risk });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl">
      <form onSubmit={handleSubmit}>
        <FormSection title={t('assetAndRisk')}>
          <LabeledInput label={t('assetPair')} id="asset" value={asset} onChange={(e) => setAsset(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
             <LabeledInput label={t('stopLoss')} id="stopLoss" type="number" value={risk.stopLoss} onChange={handleRiskChange} />
             <LabeledInput label={t('takeProfit')} id="takeProfit" type="number" value={risk.takeProfit} onChange={handleRiskChange} />
          </div>
        </FormSection>
        
        <FormSection title={t('technicalIndicators')}>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AVAILABLE_INDICATORS) as IndicatorName[]).map(name => (
              <button
                type="button"
                key={name}
                onClick={() => handleIndicatorToggle(name)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border
                  ${selectedIndicators.includes(name) 
                    ? 'bg-orange-100 text-orange-800 border-orange-200' 
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {selectedIndicators.map(name => (
              <div key={name} className="p-3 bg-gray-50 rounded-lg border border-gray-200/80">
                <h4 className="font-semibold text-gray-700 mb-2">{name} {t('parameters')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(AVAILABLE_INDICATORS[name]).map(([param, defaultValue]) => (
                    <LabeledInput
                      key={param}
                      label={t(param as TranslationKey) || (param.charAt(0).toUpperCase() + param.slice(1))}
                      id={`${name}-${param}`}
                      type="number"
                      value={indicatorParams[name]?.[param] ?? defaultValue}
                      onChange={(e) => handleParamChange(name, param, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-[#D97757] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#C96747] transition-all duration-200
                     disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isLoading ? t('generating') : t('generateStrategy')}
        </button>
      </form>
    </div>
  );
};