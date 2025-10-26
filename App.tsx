import React, { useState, useCallback, useEffect } from 'react';
import { StrategyForm } from './components/StrategyForm';
import { StrategyDisplay } from './components/StrategyDisplay';
import { Sidebar } from './components/Sidebar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateStrategyWithGemini, generatePineScript, generateRandomStrategyIdea, refineStrategyIdea } from './services/aiService';
import type { Strategy, StrategyRequest, DataConfig, MarketDataEntry, BacktestHistoryEntry, BacktestSummary, ActiveView, LlmConfig, LlmProvider, ExchangeApiConfigs } from './types';
import { BacktesterPage } from './components/BacktesterPage';
import { DataConfigPage } from './components/DataConfigPage';
import { SearchPage } from './components/SearchPage';
import { useTranslations } from './hooks/useTranslations';
import { ScriptGeneratorPage } from './components/ScriptGeneratorPage';
import { SettingsPage } from './components/SettingsPage';
import { ApiConfigModal } from './components/ApiConfigModal';
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { useDataSync } from './hooks/useDataSync';

const initialMarketData: MarketDataEntry[] = [
    { id: '1', exchange: 'Binance', symbol: 'BTC/USDT', startDate: '2023-01-01', endDate: '2024-01-01', source: 'fetch', label: '2023 Full Year' },
    { id: '2', exchange: 'Coinbase', symbol: 'ETH/USD', startDate: '2023-06-01', endDate: '2024-01-01', source: 'fetch' },
    { id: '3', exchange: 'Kraken', symbol: 'SOL/USDT', startDate: '2024-01-01', endDate: '2024-03-01', source: 'import', fileName: 'sol_q1_2024.csv', label: 'Q1 2024 Solana Data' },
];

const samplePineScript = `//@version=5
strategy("My Backtest Script", overlay=true)

// Define indicators
rsi = ta.rsi(close, 14)

// Define strategy conditions
longCondition = ta.crossover(rsi, 30)
if (longCondition)
    strategy.entry("My Long Entry Id", strategy.long)

shortCondition = ta.crossunder(rsi, 70)
if (shortCondition)
    strategy.entry("My Short Entry Id", strategy.short)
`;

const initialBacktestHistory: BacktestHistoryEntry[] = [
    {
        id: 'hist-1',
        name: 'RSI Overbought/Oversold on BTC',
        date: new Date('2024-05-20T10:00:00Z').toISOString(),
        script: samplePineScript,
        dataSource: initialMarketData[0],
        results: { pnl: '+45.2%', winRate: '58.1%', sharpeRatio: '1.23', maxDrawdown: '-12.5%' }
    },
    {
        id: 'hist-2',
        name: 'MACD Trend Follow on ETH',
        date: new Date('2024-05-18T15:30:00Z').toISOString(),
        script: `//@version=5\nstrategy("MACD Trend Follow", overlay=true)\n\nfast = 12\nslow = 26\nsignal = 9\n[macdLine, signalLine, _] = ta.macd(close, fast, slow, signal)\n\nlongCondition = ta.crossover(macdLine, signalLine)\nif (longCondition)\n    strategy.entry("MacdLE", strategy.long)\n\nshortCondition = ta.crossunder(macdLine, signalLine)\nif (shortCondition)\n    strategy.close("MacdLE")`,
        dataSource: initialMarketData[1],
        results: { pnl: '+88.9%', winRate: '65.3%', sharpeRatio: '2.11', maxDrawdown: '-9.8%' }
    }
];


const App: React.FC = () => {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('script_generator');
  const { t } = useTranslations();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [backtestHistory, setBacktestHistory] = useState<BacktestHistoryEntry[]>(initialBacktestHistory);
  const [loadedHistoryEntry, setLoadedHistoryEntry] = useState<BacktestHistoryEntry | null>(null);

  // State for Market Data Management
  const [marketDataEntries, setMarketDataEntries] = useState<MarketDataEntry[]>(initialMarketData);

  // State for Script Generator Page (State Caching)
  const [scriptGeneratorPrompt, setScriptGeneratorPrompt] = useState<string>('');
  const [scriptGeneratorScript, setScriptGeneratorScript] = useState<string | null>(null);
  const [isScriptGenerating, setIsScriptGenerating] = useState<boolean>(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
  const [suggestionLoadingAction, setSuggestionLoadingAction] = useState<'refine' | 'suggest' | null>(null);
  const [scriptGeneratorError, setScriptGeneratorError] = useState<string | null>(null);

  // State for Backtester Page (State Caching)
  const [backtesterScript, setBacktesterScript] = useState<string>(samplePineScript);
  const [selectedMarketDataId, setSelectedMarketDataId] = useState<string | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestSummary | null>(null);

  // State for third-party LLM configs
  const [llmConfigs, setLlmConfigs] = useState<LlmConfig>({});
  const [activeProvider, setActiveProvider] = useState<LlmProvider | 'Gemini'>('Gemini');

  // State for Exchange API configs
  const [exchangeApiConfigs, setExchangeApiConfigs] = useState<ExchangeApiConfigs>({});
  const [isApiConfigModalOpen, setIsApiConfigModalOpen] = useState(false);

  // Authentication and Database Sync
  const { user, loading: authLoading, signIn, signUp, signOut, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const dataSync = useDataSync({ user, isAuthenticated });

  // 加载数据：优先从数据库加载，否则从 localStorage
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && user) {
        // 从数据库加载
        try {
          const data = await dataSync.loadFromDatabase();
          if (data) {
            setLlmConfigs(data.llmConfigs);
            setExchangeApiConfigs(data.exchangeConfigs);
            if (data.marketData.length > 0) {
              setMarketDataEntries(data.marketData);
            }
            if (data.backtestHistory.length > 0) {
              setBacktestHistory(data.backtestHistory);
            }
          }
        } catch (error) {
          console.error("Failed to load data from database", error);
        }
      } else {
        // 从 localStorage 加载（离线模式）
        try {
          const savedLlmConfigs = localStorage.getItem('llmApiConfigs');
          if (savedLlmConfigs) {
            setLlmConfigs(JSON.parse(savedLlmConfigs));
          }
          const savedExchangeConfigs = localStorage.getItem('exchangeApiConfigs');
          if (savedExchangeConfigs) {
            setExchangeApiConfigs(JSON.parse(savedExchangeConfigs));
          }
        } catch (error) {
          console.error("Failed to load configs from localStorage", error);
        }
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [isAuthenticated, user, authLoading, dataSync]);


  const handleSetActiveView = useCallback((view: ActiveView) => {
      // When navigating away from the backtester, if we were viewing a history item,
      // clear it so we don't land on it again by default.
      if (activeView === 'backtester' && view !== 'backtester') {
          setLoadedHistoryEntry(null);
      }
      setActiveView(view);
  }, [activeView]);

  const handleAddMarketDataEntry = useCallback(async (newConfig: DataConfig, source: 'fetch' | 'import', fileName?: string) => {
    return new Promise<void>(async (resolve) => {
        setTimeout(async () => {
            const newEntry: MarketDataEntry = {
                id: `data-${Date.now()}`,
                ...newConfig,
                source,
                fileName,
            };
            setMarketDataEntries(prev => [newEntry, ...prev]);

            // 同步到数据库
            if (isAuthenticated) {
              try {
                await dataSync.syncMarketDataEntry(newEntry);
              } catch (error) {
                console.error('Failed to sync market data to database', error);
              }
            }

            resolve();
        }, 1000);
    });
  }, [isAuthenticated, dataSync]);

  const handleUpdateMarketDataLabel = useCallback(async (id: string, newLabel: string) => {
    setMarketDataEntries(prev =>
        prev.map(entry =>
            entry.id === id
                ? { ...entry, label: newLabel.trim() }
                : entry
        )
    );

    // 同步到数据库
    if (isAuthenticated) {
      try {
        await dataSync.syncUpdateMarketDataLabel(id, newLabel.trim());
      } catch (error) {
        console.error('Failed to sync market data label to database', error);
      }
    }
  }, [isAuthenticated, dataSync]);


  const handleDeleteMarketDataEntry = useCallback(async (id: string) => {
    setMarketDataEntries(prev => prev.filter(entry => entry.id !== id));
    if (selectedMarketDataId === id) {
        setSelectedMarketDataId(null);
    }

    // 同步到数据库
    if (isAuthenticated) {
      try {
        await dataSync.syncDeleteMarketData(id);
      } catch (error) {
        console.error('Failed to delete market data from database', error);
      }
    }
  }, [selectedMarketDataId, isAuthenticated, dataSync]);

  const handleGenerateStrategy = useCallback(async (request: StrategyRequest) => {
    setIsLoading(true);
    setError(null);
    setStrategy(null);

    try {
      const result = await generateStrategyWithGemini(request);
      setStrategy(result);
    } catch (e) {
      console.error(e);
      setError(t('errorGenerateStrategy'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleNewStrategy = () => {
    setStrategy(null);
    setError(null);
    setLoadedHistoryEntry(null);
    setActiveView('generator');
  }

  const handleSaveBacktest = useCallback(async (data: { script: string; dataSource: MarketDataEntry; results: BacktestSummary; }) => {
    const newEntry: BacktestHistoryEntry = {
        id: `hist-${Date.now()}`,
        name: `Backtest - ${new Date().toLocaleString()}`,
        date: new Date().toISOString(),
        ...data,
    };
    setBacktestHistory(prev => [newEntry, ...prev]);
    // Immediately load the new entry to show it's saved and active
    setLoadedHistoryEntry(newEntry);

    // 同步到数据库
    if (isAuthenticated) {
      try {
        await dataSync.syncBacktestHistory(newEntry);
      } catch (error) {
        console.error('Failed to sync backtest history to database', error);
      }
    }
  }, [isAuthenticated, dataSync]);

  const handleDeleteBacktest = useCallback(async (id: string) => {
      setBacktestHistory(prev => prev.filter(entry => entry.id !== id));
      if (loadedHistoryEntry?.id === id) {
        setLoadedHistoryEntry(null);
        setBacktesterScript(samplePineScript); // Reset to default
        setBacktestResults(null);
      }

      // 同步到数据库
      if (isAuthenticated) {
        try {
          await dataSync.syncDeleteBacktestHistory(id);
        } catch (error) {
          console.error('Failed to delete backtest history from database', error);
        }
      }
  }, [loadedHistoryEntry, isAuthenticated, dataSync]);

  const handleUpdateBacktestName = useCallback((id: string, newName: string) => {
    setBacktestHistory(prev =>
        prev.map(entry =>
            entry.id === id ? { ...entry, name: newName.trim() } : entry
        )
    );
     setLoadedHistoryEntry(prev => prev && prev.id === id ? { ...prev, name: newName.trim() } : prev);
  }, []);

  const handleSelectHistory = useCallback((entry: BacktestHistoryEntry) => {
      setLoadedHistoryEntry(entry);
      setBacktesterScript(entry.script);
      setBacktestResults(entry.results);
      setSelectedMarketDataId(entry.dataSource.id);
      setActiveView('backtester');
  }, []);

  const handleLoadScriptInBacktester = useCallback(() => {
    if (scriptGeneratorScript) {
        setBacktesterScript(scriptGeneratorScript);
        setLoadedHistoryEntry(null); // Ensure we're not in "history view" mode
        setBacktestResults(null); // Clear previous results
        setActiveView('backtester');
    }
  }, [scriptGeneratorScript]);

  const handleLoadStrategyInBacktester = useCallback((pineScript: string) => {
    setBacktesterScript(pineScript);
    setLoadedHistoryEntry(null); // Ensure we're not in "history view" mode
    setBacktestResults(null); // Clear previous results
    setActiveView('backtester');
  }, []);

  // --- Handlers for ScriptGeneratorPage ---
  const handleGenerateScript = useCallback(async () => {
    if (!scriptGeneratorPrompt.trim()) return;
    setIsScriptGenerating(true);
    setScriptGeneratorError(null);
    setScriptGeneratorScript(null);
    try {
        const options = {
            provider: activeProvider,
            config: activeProvider !== 'Gemini' ? llmConfigs[activeProvider] : undefined,
        };
        const script = await generatePineScript(scriptGeneratorPrompt, options);
        setScriptGeneratorScript(script);
    } catch (e: any) {
        console.error(e);
        setScriptGeneratorError(e.message || t('errorGenerateStrategy'));
    } finally {
        setIsScriptGenerating(false);
    }
  }, [scriptGeneratorPrompt, activeProvider, llmConfigs, t]);

  const handleSuggestRandomStrategy = useCallback(async () => {
    setIsSuggestionLoading(true);
    setSuggestionLoadingAction('suggest');
    setScriptGeneratorError(null);
    try {
        const options = {
            provider: activeProvider,
            config: activeProvider !== 'Gemini' ? llmConfigs[activeProvider] : undefined,
        };
        const idea = await generateRandomStrategyIdea(options);
        setScriptGeneratorPrompt(idea);
    } catch (e: any) {
        console.error(e);
        setScriptGeneratorError(e.message || t('errorSuggestStrategy'));
    } finally {
        setIsSuggestionLoading(false);
        setSuggestionLoadingAction(null);
    }
  }, [activeProvider, llmConfigs, t]);

  const handleRefineStrategy = useCallback(async (userIdea: string) => {
    setIsSuggestionLoading(true);
    setSuggestionLoadingAction('refine');
    setScriptGeneratorError(null);
    try {
        const options = {
            provider: activeProvider,
            config: activeProvider !== 'Gemini' ? llmConfigs[activeProvider] : undefined,
        };
        const idea = await refineStrategyIdea(userIdea, options);
        setScriptGeneratorPrompt(idea);
    } catch (e: any) {
        console.error(e);
        setScriptGeneratorError(e.message || t('errorSuggestStrategy'));
    } finally {
        setIsSuggestionLoading(false);
        setSuggestionLoadingAction(null);
    }
  }, [activeProvider, llmConfigs, t]);

  // --- Handler for BacktesterPage ---
  const handleRunBacktest = useCallback(() => {
    const selectedData = marketDataEntries.find(entry => entry.id === selectedMarketDataId);
    if (!selectedData) return;

    setIsBacktesting(true);
    setBacktestResults(null);

    setTimeout(() => {
        const newResults: BacktestSummary = {
            pnl: `+${(Math.random() * 200).toFixed(1)}%`,
            winRate: `${(40 + Math.random() * 40).toFixed(1)}%`,
            sharpeRatio: `${(0.5 + Math.random() * 2).toFixed(2)}`,
            maxDrawdown: `-${(5 + Math.random() * 20).toFixed(1)}%`,
        };
        setBacktestResults(newResults);
        setIsBacktesting(false);
        // Automatically save the backtest results to history
        handleSaveBacktest({ script: backtesterScript, dataSource: selectedData, results: newResults });
    }, 2500);
  }, [selectedMarketDataId, marketDataEntries, backtesterScript, handleSaveBacktest]);

  // --- Handler for LLM Configs ---
  const handleSaveLlmConfigs = useCallback(async (newConfigs: LlmConfig) => {
      setLlmConfigs(newConfigs);

      // 保存到 localStorage（离线支持）
      try {
          localStorage.setItem('llmApiConfigs', JSON.stringify(newConfigs));
      } catch (error) {
          console.error("Failed to save LLM configs to localStorage", error);
      }

      // 同步到数据库
      if (isAuthenticated) {
        try {
          for (const [provider, config] of Object.entries(newConfigs)) {
            await dataSync.syncLlmConfig(provider, config);
          }
        } catch (error) {
          console.error('Failed to sync LLM configs to database', error);
        }
      }
  }, [isAuthenticated, dataSync]);

  // --- Handler for Exchange API Configs ---
  const handleSaveExchangeApiConfigs = useCallback(async (newConfigs: ExchangeApiConfigs) => {
      setExchangeApiConfigs(newConfigs);

      // 保存到 localStorage（离线支持）
      try {
          localStorage.setItem('exchangeApiConfigs', JSON.stringify(newConfigs));
      } catch (error) {
          console.error("Failed to save exchange API configs to localStorage", error);
      }

      // 同步到数据库
      if (isAuthenticated) {
        try {
          for (const [provider, config] of Object.entries(newConfigs)) {
            await dataSync.syncExchangeConfig(provider, config);
          }
        } catch (error) {
          console.error('Failed to sync exchange configs to database', error);
        }
      }
  }, [isAuthenticated, dataSync]);


  const renderActiveView = () => {
    switch (activeView) {
      case 'generator':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <StrategyForm onGenerate={handleGenerateStrategy} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-3">
              {isLoading && <LoadingSpinner />}
              {error && <div className="p-4 border border-red-300 bg-red-50 rounded-lg text-red-700 font-roboto-mono">{error}</div>}
              {strategy && !isLoading && <StrategyDisplay strategy={strategy} onLoadInBacktester={handleLoadStrategyInBacktester} />}
              {!strategy && !isLoading && !error && <InitialStateDisplay />}
            </div>
          </div>
        );
      case 'backtester':
        return <BacktesterPage
                    marketDataEntries={marketDataEntries}
                    selectedMarketDataId={selectedMarketDataId}
                    onSelectMarketData={setSelectedMarketDataId}
                    loadedEntry={loadedHistoryEntry}
                    onDelete={handleDeleteBacktest}
                    onUpdateName={handleUpdateBacktestName}
                    // Backtester state props
                    script={backtesterScript}
                    onScriptChange={setBacktesterScript}
                    results={backtestResults}
                    isLoading={isBacktesting}
                    onRunBacktest={handleRunBacktest}
               />;
      case 'dataconfig':
        return <DataConfigPage
                  marketDataEntries={marketDataEntries}
                  onAddEntry={handleAddMarketDataEntry}
                  onDeleteEntry={handleDeleteMarketDataEntry}
                  onUpdateLabel={handleUpdateMarketDataLabel}
               />;
      case 'search':
        return <SearchPage history={backtestHistory} onSelectHistory={handleSelectHistory} />;
      case 'script_generator':
        return <ScriptGeneratorPage
                    prompt={scriptGeneratorPrompt}
                    onPromptChange={setScriptGeneratorPrompt}
                    generatedScript={scriptGeneratorScript}
                    isLoading={isScriptGenerating}
                    isSuggesting={isSuggestionLoading}
                    suggestionLoadingAction={suggestionLoadingAction}
                    error={scriptGeneratorError}
                    onGenerate={handleGenerateScript}
                    onSuggestRandom={handleSuggestRandomStrategy}
                    onRefine={handleRefineStrategy}
                    onLoadInBacktester={handleLoadScriptInBacktester}
                    llmConfigs={llmConfigs}
                    activeProvider={activeProvider}
                    onProviderChange={setActiveProvider}
                />;
      case 'settings':
        return <SettingsPage llmConfigs={llmConfigs} onSaveLlmConfigs={handleSaveLlmConfigs} />;
      default:
        return null;
    }
  }

  // 显示加载状态
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F7]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F9F7] text-gray-800">
      <Sidebar
        activeView={activeView}
        setActiveView={handleSetActiveView}
        onNewStrategy={handleNewStrategy}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        history={backtestHistory}
        onSelectHistory={handleSelectHistory}
        onOpenApiConfig={() => setIsApiConfigModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* 用户信息栏 */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    已登录: <span className="font-medium text-gray-800">{user?.email}</span>
                  </span>
                  {dataSync.isSyncing && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      同步中...
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">离线模式（数据仅保存在本地）</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                >
                  退出登录
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>

          {/* 提示信息 */}
          {!isAuthenticated && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 <strong>提示：</strong>登录后，你的数据将自动同步到云端，可在不同设备访问。
              </p>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto">
            {renderActiveView()}
        </div>
      </main>

      <ApiConfigModal
        isOpen={isApiConfigModalOpen}
        onClose={() => setIsApiConfigModalOpen(false)}
        onSave={handleSaveExchangeApiConfigs}
        initialConfigs={exchangeApiConfigs}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </div>
  );
};

const InitialStateDisplay: React.FC = () => {
  const { t } = useTranslations();
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-white">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a6 6 0 100 12 6 6 0 000-12z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4l2 2" />
      </svg>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2 font-source-serif">{t('initialStateTitle')}</h2>
      <p className="text-gray-500 max-w-md">
        {t('initialStateDescription')}
      </p>
    </div>
  );
}


export default App;
