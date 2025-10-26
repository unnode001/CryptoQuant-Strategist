import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | undefined
  displayName: string | null
}

// ==================== 认证服务 ====================

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null)
    }
  )

  return subscription
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}

// ==================== 数据迁移帮助函数 ====================

export async function migrateLocalStorageToSupabase(userId: string) {
  try {
    // 迁移 LLM 配置
    const llmConfigsStr = localStorage.getItem('llmApiConfigs')
    if (llmConfigsStr) {
      const llmConfigs = JSON.parse(llmConfigsStr)
      for (const [provider, config] of Object.entries(llmConfigs)) {
        await supabase.from('llm_configs').upsert({
          user_id: userId,
          provider,
          api_key: (config as any).apiKey,
          model: (config as any).model
        })
      }
    }

    // 迁移交易所 API 配置
    const exchangeConfigsStr = localStorage.getItem('exchangeApiConfigs')
    if (exchangeConfigsStr) {
      const exchangeConfigs = JSON.parse(exchangeConfigsStr)
      for (const [provider, config] of Object.entries(exchangeConfigs)) {
        await supabase.from('exchange_api_configs').upsert({
          user_id: userId,
          provider,
          api_key: (config as any).apiKey,
          api_secret: (config as any).apiSecret
        })
      }
    }

    console.log('Local storage data migrated successfully')
  } catch (error) {
    console.error('Error migrating local storage data:', error)
    throw error
  }
}
