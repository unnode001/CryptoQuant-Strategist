# Supabase 数据库架构设计

## 概述
CryptoQuant-Strategist 数据库架构，支持用户认证、策略管理、回测历史和市场数据存储。

## 数据库表设计

### 1. users (用户表)
使用 Supabase Auth 内置的 `auth.users` 表，扩展用户配置信息。

```sql
-- 用户配置扩展表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  language TEXT DEFAULT 'zh',
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. llm_configs (LLM API 配置表)
存储用户的 LLM API 密钥和配置。

```sql
CREATE TABLE llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'gemini'
  api_key TEXT NOT NULL,  -- 加密存储
  model TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 为 user_id 创建索引
CREATE INDEX idx_llm_configs_user_id ON llm_configs(user_id);
```

### 3. exchange_api_configs (交易所 API 配置表)
存储用户的交易所 API 凭证。

```sql
CREATE TABLE exchange_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'binance', 'coinbase', 'kraken' 等
  api_key TEXT NOT NULL,  -- 加密存储
  api_secret TEXT NOT NULL, -- 加密存储
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_exchange_api_configs_user_id ON exchange_api_configs(user_id);
```

### 4. market_data_entries (市场数据源表)
存储市场数据源配置。

```sql
CREATE TABLE market_data_entries (
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

CREATE INDEX idx_market_data_entries_user_id ON market_data_entries(user_id);
CREATE INDEX idx_market_data_entries_symbol ON market_data_entries(symbol);
CREATE INDEX idx_market_data_entries_exchange ON market_data_entries(exchange);
```

### 5. strategies (策略表)
存储生成的交易策略。

```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  description TEXT,
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  entry_conditions JSONB, -- 数组，存储进场条件
  exit_conditions JSONB,  -- 数组，存储出场条件
  pine_script TEXT NOT NULL,
  is_favorited BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_asset ON strategies(asset);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);
```

### 6. backtest_history (回测历史表)
存储回测记录和结果。

```sql
CREATE TABLE backtest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  market_data_id UUID REFERENCES market_data_entries(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  script TEXT NOT NULL, -- Pine Script 代码
  pnl NUMERIC(10, 2),
  win_rate NUMERIC(5, 2),
  sharpe_ratio NUMERIC(6, 3),
  max_drawdown NUMERIC(5, 2),
  total_trades INTEGER,
  metadata JSONB, -- 额外的回测参数和结果
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backtest_history_user_id ON backtest_history(user_id);
CREATE INDEX idx_backtest_history_strategy_id ON backtest_history(strategy_id);
CREATE INDEX idx_backtest_history_created_at ON backtest_history(created_at DESC);
```

### 7. strategy_generation_logs (策略生成日志表)
审计和日志记录。

```sql
CREATE TABLE strategy_generation_logs (
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

CREATE INDEX idx_strategy_generation_logs_user_id ON strategy_generation_logs(user_id);
CREATE INDEX idx_strategy_generation_logs_created_at ON strategy_generation_logs(created_at DESC);
```

## Row Level Security (RLS) 策略

为了确保数据安全，每个表都启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_generation_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own llm configs" ON llm_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exchange configs" ON exchange_api_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own market data" ON market_data_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own strategies" ON strategies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own backtest history" ON backtest_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON strategy_generation_logs
  FOR SELECT USING (auth.uid() = user_id);
```

## 触发器和函数

### 自动更新 updated_at 字段

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
```

### 自动创建用户配置

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 数据迁移计划

从 localStorage 迁移到 Supabase：

1. **用户首次登录**：
   - 检测 localStorage 中的数据
   - 提示用户迁移数据
   - 将现有数据上传到 Supabase

2. **API 配置**：
   - llm_configs: 从 `llmApiConfigs` localStorage 迁移
   - exchange_api_configs: 从 `exchangeApiConfigs` localStorage 迁移

3. **历史数据**：
   - 保留 localStorage 作为离线缓存
   - 在线时同步到 Supabase
   - 支持离线模式

## 性能优化

1. **索引策略**：
   - 所有外键都有索引
   - 常用查询字段（user_id, created_at）有索引

2. **缓存策略**：
   - 使用 React Query 进行客户端缓存
   - 定期同步到 Supabase

3. **批量操作**：
   - 使用 Supabase 的批量插入/更新 API

## 安全注意事项

1. **API 密钥加密**：
   - 考虑使用 Supabase Vault 存储敏感信息
   - 或在客户端加密后存储

2. **RLS 策略**：
   - 确保所有表都启用 RLS
   - 用户只能访问自己的数据

3. **环境变量**：
   - Supabase URL 和 anon key 存储在 .env 文件中
   - 不要提交到版本控制
