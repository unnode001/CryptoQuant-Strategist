-- ================================================
-- CryptoQuant-Strategist Supabase 初始化脚本
-- ================================================
-- 此脚本创建所有必需的表、索引、RLS 策略和触发器
-- 在 Supabase SQL Editor 中运行此脚本
-- ================================================

-- 1. 用户配置扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  language TEXT DEFAULT 'zh',
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LLM API 配置表
CREATE TABLE IF NOT EXISTS llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 3. 交易所 API 配置表
CREATE TABLE IF NOT EXISTS exchange_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 4. 市场数据源表
CREATE TABLE IF NOT EXISTS market_data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('fetch', 'import')),
  file_name TEXT,
  label TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 策略表
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  description TEXT,
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  entry_conditions JSONB,
  exit_conditions JSONB,
  pine_script TEXT NOT NULL,
  is_favorited BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 回测历史表
CREATE TABLE IF NOT EXISTS backtest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  market_data_id UUID REFERENCES market_data_entries(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  script TEXT NOT NULL,
  pnl NUMERIC(10, 2),
  win_rate NUMERIC(5, 2),
  sharpe_ratio NUMERIC(6, 3),
  max_drawdown NUMERIC(5, 2),
  total_trades INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 策略生成日志表
CREATE TABLE IF NOT EXISTS strategy_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 创建索引以提高查询性能
-- ================================================

CREATE INDEX IF NOT EXISTS idx_llm_configs_user_id ON llm_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_api_configs_user_id ON exchange_api_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_market_data_entries_user_id ON market_data_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_market_data_entries_symbol ON market_data_entries(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_entries_exchange ON market_data_entries(exchange);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_asset ON strategies(asset);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_history_user_id ON backtest_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_history_strategy_id ON backtest_history(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtest_history_created_at ON backtest_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_generation_logs_user_id ON strategy_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_generation_logs_created_at ON strategy_generation_logs(created_at DESC);

-- ================================================
-- 启用 Row Level Security (RLS)
-- ================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_generation_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS 策略：用户只能访问自己的数据
-- ================================================

-- user_profiles 策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- llm_configs 策略
CREATE POLICY "Users can manage own llm configs" ON llm_configs
  FOR ALL USING (auth.uid() = user_id);

-- exchange_api_configs 策略
CREATE POLICY "Users can manage own exchange configs" ON exchange_api_configs
  FOR ALL USING (auth.uid() = user_id);

-- market_data_entries 策略
CREATE POLICY "Users can manage own market data" ON market_data_entries
  FOR ALL USING (auth.uid() = user_id);

-- strategies 策略
CREATE POLICY "Users can manage own strategies" ON strategies
  FOR ALL USING (auth.uid() = user_id);

-- backtest_history 策略
CREATE POLICY "Users can manage own backtest history" ON backtest_history
  FOR ALL USING (auth.uid() = user_id);

-- strategy_generation_logs 策略
CREATE POLICY "Users can view own logs" ON strategy_generation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON strategy_generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 触发器和函数
-- ================================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建更新触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_configs_updated_at
  BEFORE UPDATE ON llm_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_api_configs_updated_at
  BEFORE UPDATE ON exchange_api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_data_entries_updated_at
  BEFORE UPDATE ON market_data_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动创建用户配置的函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新用户注册时自动创建配置
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- 完成提示
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CryptoQuant-Strategist 数据库初始化完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建以下表：';
  RAISE NOTICE '  - user_profiles';
  RAISE NOTICE '  - llm_configs';
  RAISE NOTICE '  - exchange_api_configs';
  RAISE NOTICE '  - market_data_entries';
  RAISE NOTICE '  - strategies';
  RAISE NOTICE '  - backtest_history';
  RAISE NOTICE '  - strategy_generation_logs';
  RAISE NOTICE '';
  RAISE NOTICE '已启用 RLS 安全策略';
  RAISE NOTICE '已创建索引和触发器';
  RAISE NOTICE '';
  RAISE NOTICE '现在可以开始使用应用了！';
  RAISE NOTICE '========================================';
END $$;
