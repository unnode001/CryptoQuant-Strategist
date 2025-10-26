import { supabase } from '../lib/supabase'
import type {
  Strategy,
  BacktestHistoryEntry,
  MarketDataEntry,
  LlmConfig,
  ExchangeApiConfig
} from '../types'

// ==================== 用户配置服务 ====================

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: {
  username?: string
  display_name?: string
  language?: string
  sidebar_collapsed?: boolean
}) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== LLM 配置服务 ====================

export async function getLlmConfigs(userId: string) {
  const { data, error } = await supabase
    .from('llm_configs')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  // 转换为前端期望的格式
  const configs: Record<string, LlmConfig> = {}
  data.forEach(config => {
    configs[config.provider] = {
      apiKey: config.api_key,
      model: config.model || ''
    }
  })

  return configs
}

export async function saveLlmConfig(userId: string, provider: string, config: LlmConfig) {
  const { data, error } = await supabase
    .from('llm_configs')
    .upsert({
      user_id: userId,
      provider,
      api_key: config.apiKey,
      model: config.model
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLlmConfig(userId: string, provider: string) {
  const { error } = await supabase
    .from('llm_configs')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) throw error
}

// ==================== 交易所 API 配置服务 ====================

export async function getExchangeApiConfigs(userId: string) {
  const { data, error } = await supabase
    .from('exchange_api_configs')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  // 转换为前端期望的格式
  const configs: Record<string, ExchangeApiConfig> = {}
  data.forEach(config => {
    configs[config.provider] = {
      apiKey: config.api_key,
      apiSecret: config.api_secret
    }
  })

  return configs
}

export async function saveExchangeApiConfig(
  userId: string,
  provider: string,
  config: ExchangeApiConfig
) {
  const { data, error } = await supabase
    .from('exchange_api_configs')
    .upsert({
      user_id: userId,
      provider,
      api_key: config.apiKey,
      api_secret: config.apiSecret
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExchangeApiConfig(userId: string, provider: string) {
  const { error } = await supabase
    .from('exchange_api_configs')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) throw error
}

// ==================== 市场数据服务 ====================

export async function getMarketDataEntries(userId: string) {
  const { data, error } = await supabase
    .from('market_data_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // 转换为前端期望的格式
  return data.map(entry => ({
    id: entry.id,
    exchange: entry.exchange,
    symbol: entry.symbol,
    startDate: entry.start_date,
    endDate: entry.end_date,
    source: entry.source,
    fileName: entry.file_name,
    label: entry.label
  })) as MarketDataEntry[]
}

export async function saveMarketDataEntry(userId: string, entry: MarketDataEntry) {
  const { data, error } = await supabase
    .from('market_data_entries')
    .insert({
      id: entry.id,
      user_id: userId,
      exchange: entry.exchange,
      symbol: entry.symbol,
      start_date: entry.startDate,
      end_date: entry.endDate,
      source: entry.source,
      file_name: entry.fileName,
      label: entry.label
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMarketDataEntry(
  userId: string,
  entryId: string,
  updates: Partial<MarketDataEntry>
) {
  const dbUpdates: any = {}
  if (updates.exchange) dbUpdates.exchange = updates.exchange
  if (updates.symbol) dbUpdates.symbol = updates.symbol
  if (updates.startDate) dbUpdates.start_date = updates.startDate
  if (updates.endDate) dbUpdates.end_date = updates.endDate
  if (updates.source) dbUpdates.source = updates.source
  if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName
  if (updates.label !== undefined) dbUpdates.label = updates.label

  const { data, error } = await supabase
    .from('market_data_entries')
    .update(dbUpdates)
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMarketDataEntry(userId: string, entryId: string) {
  const { error } = await supabase
    .from('market_data_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)

  if (error) throw error
}

// ==================== 策略服务 ====================

export async function getStrategies(userId: string) {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(strategy => ({
    strategyName: strategy.strategy_name,
    description: strategy.description || '',
    asset: strategy.asset,
    timeframe: strategy.timeframe,
    entryConditions: strategy.entry_conditions as string[] || [],
    exitConditions: strategy.exit_conditions as string[] || [],
    pineScript: strategy.pine_script,
    backtestSummary: {
      pnl: '0%',
      winRate: '0%',
      sharpeRatio: '0',
      maxDrawdown: '0%'
    }
  })) as Strategy[]
}

export async function saveStrategy(userId: string, strategy: Strategy) {
  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: userId,
      strategy_name: strategy.strategyName,
      description: strategy.description,
      asset: strategy.asset,
      timeframe: strategy.timeframe,
      entry_conditions: strategy.entryConditions,
      exit_conditions: strategy.exitConditions,
      pine_script: strategy.pineScript
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStrategy(
  userId: string,
  strategyId: string,
  updates: Partial<Strategy>
) {
  const dbUpdates: any = {}
  if (updates.strategyName) dbUpdates.strategy_name = updates.strategyName
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.asset) dbUpdates.asset = updates.asset
  if (updates.timeframe) dbUpdates.timeframe = updates.timeframe
  if (updates.entryConditions) dbUpdates.entry_conditions = updates.entryConditions
  if (updates.exitConditions) dbUpdates.exit_conditions = updates.exitConditions
  if (updates.pineScript) dbUpdates.pine_script = updates.pineScript

  const { data, error } = await supabase
    .from('strategies')
    .update(dbUpdates)
    .eq('id', strategyId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStrategy(userId: string, strategyId: string) {
  const { error } = await supabase
    .from('strategies')
    .delete()
    .eq('id', strategyId)
    .eq('user_id', userId)

  if (error) throw error
}

// ==================== 回测历史服务 ====================

export async function getBacktestHistory(userId: string) {
  const { data, error } = await supabase
    .from('backtest_history')
    .select(`
      *,
      market_data_entries (
        id,
        exchange,
        symbol,
        start_date,
        end_date,
        source,
        file_name,
        label
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(entry => ({
    id: entry.id,
    name: entry.name,
    date: entry.created_at,
    script: entry.script,
    dataSource: entry.market_data_entries ? {
      id: entry.market_data_entries.id,
      exchange: entry.market_data_entries.exchange,
      symbol: entry.market_data_entries.symbol,
      startDate: entry.market_data_entries.start_date,
      endDate: entry.market_data_entries.end_date,
      source: entry.market_data_entries.source,
      fileName: entry.market_data_entries.file_name,
      label: entry.market_data_entries.label
    } : undefined,
    results: {
      pnl: entry.pnl ? `${entry.pnl}%` : '0%',
      winRate: entry.win_rate ? `${entry.win_rate}%` : '0%',
      sharpeRatio: entry.sharpe_ratio?.toString() || '0',
      maxDrawdown: entry.max_drawdown ? `${entry.max_drawdown}%` : '0%'
    }
  })) as BacktestHistoryEntry[]
}

export async function saveBacktestHistory(
  userId: string,
  entry: BacktestHistoryEntry
) {
  const { data, error } = await supabase
    .from('backtest_history')
    .insert({
      id: entry.id,
      user_id: userId,
      market_data_id: entry.dataSource?.id,
      name: entry.name,
      script: entry.script,
      pnl: parseFloat(entry.results.pnl),
      win_rate: parseFloat(entry.results.winRate),
      sharpe_ratio: parseFloat(entry.results.sharpeRatio),
      max_drawdown: parseFloat(entry.results.maxDrawdown)
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBacktestHistory(userId: string, entryId: string) {
  const { error } = await supabase
    .from('backtest_history')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)

  if (error) throw error
}

// ==================== 策略生成日志服务 ====================

export async function saveStrategyGenerationLog(
  userId: string,
  log: {
    provider: string
    prompt: string
    response?: string
    tokensUsed?: number
    success: boolean
    errorMessage?: string
  }
) {
  const { data, error } = await supabase
    .from('strategy_generation_logs')
    .insert({
      user_id: userId,
      provider: log.provider,
      prompt: log.prompt,
      response: log.response,
      tokens_used: log.tokensUsed,
      success: log.success,
      error_message: log.errorMessage
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getStrategyGenerationLogs(
  userId: string,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from('strategy_generation_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
