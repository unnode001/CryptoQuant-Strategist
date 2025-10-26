import { useEffect, useCallback, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getLlmConfigs,
  saveLlmConfig,
  getExchangeApiConfigs,
  saveExchangeApiConfig,
  getMarketDataEntries,
  saveMarketDataEntry,
  deleteMarketDataEntry,
  updateMarketDataEntry,
  getBacktestHistory,
  saveBacktestHistory,
  deleteBacktestHistory,
  getStrategies,
  saveStrategy
} from '../services/databaseService'
import type {
  MarketDataEntry,
  BacktestHistoryEntry,
  LlmConfig,
  ExchangeApiConfigs
} from '../types'

interface UseDataSyncOptions {
  user: User | null
  isAuthenticated: boolean
}

export function useDataSync({ user, isAuthenticated }: UseDataSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // 从数据库加载数据
  const loadFromDatabase = useCallback(async () => {
    if (!user || !isAuthenticated) return null

    setIsSyncing(true)
    setSyncError(null)

    try {
      const [
        llmConfigs,
        exchangeConfigs,
        marketData,
        backtestHistory
      ] = await Promise.all([
        getLlmConfigs(user.id),
        getExchangeApiConfigs(user.id),
        getMarketDataEntries(user.id),
        getBacktestHistory(user.id)
      ])

      return {
        llmConfigs,
        exchangeConfigs,
        marketData,
        backtestHistory
      }
    } catch (error: any) {
      console.error('Error loading data from database:', error)
      setSyncError(error.message || 'Failed to load data from database')
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [user, isAuthenticated])

  // 保存 LLM 配置到数据库
  const syncLlmConfig = useCallback(async (provider: string, config: { apiKey: string; model: string }) => {
    if (!user) return

    try {
      await saveLlmConfig(user.id, provider, config)
    } catch (error) {
      console.error('Error syncing LLM config:', error)
      throw error
    }
  }, [user])

  // 保存交易所配置到数据库
  const syncExchangeConfig = useCallback(async (provider: string, config: { apiKey: string; apiSecret: string }) => {
    if (!user) return

    try {
      await saveExchangeApiConfig(user.id, provider, config)
    } catch (error) {
      console.error('Error syncing exchange config:', error)
      throw error
    }
  }, [user])

  // 保存市场数据到数据库
  const syncMarketDataEntry = useCallback(async (entry: MarketDataEntry) => {
    if (!user) return

    try {
      await saveMarketDataEntry(user.id, entry)
    } catch (error) {
      console.error('Error syncing market data:', error)
      throw error
    }
  }, [user])

  // 删除市场数据
  const syncDeleteMarketData = useCallback(async (entryId: string) => {
    if (!user) return

    try {
      await deleteMarketDataEntry(user.id, entryId)
    } catch (error) {
      console.error('Error deleting market data:', error)
      throw error
    }
  }, [user])

  // 更新市场数据标签
  const syncUpdateMarketDataLabel = useCallback(async (entryId: string, label: string) => {
    if (!user) return

    try {
      await updateMarketDataEntry(user.id, entryId, { label })
    } catch (error) {
      console.error('Error updating market data label:', error)
      throw error
    }
  }, [user])

  // 保存回测历史
  const syncBacktestHistory = useCallback(async (entry: BacktestHistoryEntry) => {
    if (!user) return

    try {
      await saveBacktestHistory(user.id, entry)
    } catch (error) {
      console.error('Error syncing backtest history:', error)
      throw error
    }
  }, [user])

  // 删除回测历史
  const syncDeleteBacktestHistory = useCallback(async (entryId: string) => {
    if (!user) return

    try {
      await deleteBacktestHistory(user.id, entryId)
    } catch (error) {
      console.error('Error deleting backtest history:', error)
      throw error
    }
  }, [user])

  return {
    isSyncing,
    syncError,
    loadFromDatabase,
    syncLlmConfig,
    syncExchangeConfig,
    syncMarketDataEntry,
    syncDeleteMarketData,
    syncUpdateMarketDataLabel,
    syncBacktestHistory,
    syncDeleteBacktestHistory
  }
}
