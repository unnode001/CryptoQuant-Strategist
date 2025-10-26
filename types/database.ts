export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          language: string
          sidebar_collapsed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          language?: string
          sidebar_collapsed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          language?: string
          sidebar_collapsed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      llm_configs: {
        Row: {
          id: string
          user_id: string
          provider: string
          api_key: string
          model: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          api_key: string
          model?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          api_key?: string
          model?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exchange_api_configs: {
        Row: {
          id: string
          user_id: string
          provider: string
          api_key: string
          api_secret: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          api_key: string
          api_secret: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          api_key?: string
          api_secret?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      market_data_entries: {
        Row: {
          id: string
          user_id: string
          exchange: string
          symbol: string
          start_date: string
          end_date: string
          source: 'fetch' | 'import'
          file_name: string | null
          label: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange: string
          symbol: string
          start_date: string
          end_date: string
          source: 'fetch' | 'import'
          file_name?: string | null
          label?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exchange?: string
          symbol?: string
          start_date?: string
          end_date?: string
          source?: 'fetch' | 'import'
          file_name?: string | null
          label?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          strategy_name: string
          description: string | null
          asset: string
          timeframe: string
          entry_conditions: Json | null
          exit_conditions: Json | null
          pine_script: string
          is_favorited: boolean
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_name: string
          description?: string | null
          asset: string
          timeframe: string
          entry_conditions?: Json | null
          exit_conditions?: Json | null
          pine_script: string
          is_favorited?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strategy_name?: string
          description?: string | null
          asset?: string
          timeframe?: string
          entry_conditions?: Json | null
          exit_conditions?: Json | null
          pine_script?: string
          is_favorited?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      backtest_history: {
        Row: {
          id: string
          user_id: string
          strategy_id: string | null
          market_data_id: string | null
          name: string
          script: string
          pnl: number | null
          win_rate: number | null
          sharpe_ratio: number | null
          max_drawdown: number | null
          total_trades: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id?: string | null
          market_data_id?: string | null
          name: string
          script: string
          pnl?: number | null
          win_rate?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          total_trades?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strategy_id?: string | null
          market_data_id?: string | null
          name?: string
          script?: string
          pnl?: number | null
          win_rate?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          total_trades?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
      strategy_generation_logs: {
        Row: {
          id: string
          user_id: string
          provider: string
          prompt: string
          response: string | null
          tokens_used: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          prompt: string
          response?: string | null
          tokens_used?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          prompt?: string
          response?: string | null
          tokens_used?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}
