export interface IndicatorParams {
  [key: string]: number | string;
}

export interface StrategyRequest {
  asset: string;
  indicators: {
    [key: string]: IndicatorParams;
  };
  risk: {
    stopLoss: number;
    takeProfit: number;
  };
}

export interface BacktestSummary {
  pnl: string;
  winRate: string;
  sharpeRatio: string;
  maxDrawdown: string;
}

export interface Strategy {
  strategyName: string;
  description: string;
  asset: string;
  timeframe: string;
  entryConditions: string[];
  exitConditions: string[];
  backtestSummary: BacktestSummary;
  pineScript: string;
}

export interface DataConfig {
  exchange: string;
  symbol: string;
  startDate: string;
  endDate:string;
  label?: string;
}

export interface MarketDataEntry extends DataConfig {
  id: string;
  source: 'fetch' | 'import';
  fileName?: string;
}

export interface BacktestHistoryEntry {
  id: string;
  name: string;
  date: string;
  script: string;
  dataSource: MarketDataEntry;
  results: BacktestSummary;
}

export type LlmProvider = 'OpenAI' | 'Anthropic';
    
export interface LlmConfig {
    [provider: string]: {
        apiKey: string;
        model: string;
    }
}

export interface ExchangeApiConfigs {
    [provider: string]: {
        apiKey: string;
        apiSecret: string;
    }
}

export type ActiveView = 'generator' | 'backtester' | 'dataconfig' | 'search' | 'script_generator' | 'settings';