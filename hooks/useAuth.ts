import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getCurrentUser,
  onAuthStateChange,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut
} from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前用户
    getCurrentUser().then(user => {
      setUser(user)
      setLoading(false)
    })

    // 监听认证状态变化
    const subscription = onAuthStateChange(user => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { user } = await authSignIn(email, password)
    return user
  }

  const signUp = async (email: string, password: string) => {
    const { user } = await authSignUp(email, password)
    return user
  }

  const signOut = async () => {
    await authSignOut()
    setUser(null)
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  }
}
