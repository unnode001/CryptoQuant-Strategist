# Supabase 注册错误排查指南

## 问题：Database error saving new user

### 常见原因

这个错误通常由以下原因引起：

1. ❌ 数据库表未创建
2. ❌ 触发器未正确设置
3. ❌ RLS 策略配置错误
4. ❌ 权限问题

## 快速排查步骤

### 步骤 1：检查数据库表是否存在

1. 登录 Supabase 控制台：https://app.supabase.com
2. 选择你的项目
3. 点击左侧 "Table Editor"
4. 检查是否存在以下表：
   - ✅ `user_profiles`
   - ✅ `llm_configs`
   - ✅ `exchange_api_configs`
   - ✅ `market_data_entries`
   - ✅ `strategies`
   - ✅ `backtest_history`
   - ✅ `strategy_generation_logs`

**如果表不存在**，说明你还没有运行初始化脚本。

### 步骤 2：运行数据库初始化脚本

1. 在 Supabase 控制台，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `docs/supabase-init.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 "Run" 按钮
6. 等待执行完成（应该显示成功消息）

### 步骤 3：验证触发器是否创建

1. 在 SQL Editor 中运行以下查询：

```sql
-- 检查触发器是否存在
SELECT
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

应该看到以下触发器：
- `on_auth_user_created` (在 `auth.users` 表上)
- `update_user_profiles_updated_at`
- `update_llm_configs_updated_at`
- 等等...

### 步骤 4：检查 RLS 策略

运行以下查询检查 RLS 是否启用：

```sql
-- 检查 RLS 是否启用
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

所有表的 `rowsecurity` 都应该是 `true`。

### 步骤 5：检查函数是否存在

```sql
-- 检查关键函数
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('handle_new_user', 'update_updated_at_column')
ORDER BY proname;
```

应该看到这两个函数。

## 完整修复方案

如果上述检查发现问题，请按以下步骤操作：

### 方案 1：完全重置数据库（推荐用于测试环境）

⚠️ **警告**：这将删除所有现有数据！

```sql
-- 1. 删除所有现有表（如果存在）
DROP TABLE IF EXISTS strategy_generation_logs CASCADE;
DROP TABLE IF EXISTS backtest_history CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS market_data_entries CASCADE;
DROP TABLE IF EXISTS exchange_api_configs CASCADE;
DROP TABLE IF EXISTS llm_configs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. 删除触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 删除函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. 然后重新运行 docs/supabase-init.sql 的全部内容
```

### 方案 2：仅修复触发器（保留现有数据）

```sql
-- 1. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 删除旧函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 3. 重新创建函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 方案 3：检查权限问题

确保 `user_profiles` 表有正确的 RLS 策略：

```sql
-- 检查现有策略
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- 如果策略不存在，重新创建
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 测试注册功能

修复后，在 SQL Editor 中测试：

```sql
-- 1. 查看 user_profiles 表
SELECT * FROM user_profiles;

-- 2. 查看 auth.users 表（检查用户是否创建）
SELECT id, email, created_at FROM auth.users;

-- 3. 检查触发器日志（如果有错误）
-- 在 Supabase 控制台的 Logs 中查看
```

## 浏览器调试

如果数据库看起来正常，检查浏览器控制台：

1. 打开浏览器开发者工具（F12）
2. 切换到 "Console" 标签
3. 尝试注册
4. 查看详细错误信息

常见错误信息：
- `new row violates row-level security policy` - RLS 策略问题
- `relation "user_profiles" does not exist` - 表不存在
- `function handle_new_user() does not exist` - 触发器函数不存在

## 环境变量检查

确保 `.env` 文件配置正确：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...（很长的字符串）
```

⚠️ **注意**：
- URL 必须是完整的，包括 `https://`
- API Key 必须是 `anon` (public) key，不是 `service_role` key
- 修改 `.env` 后需要重启开发服务器

## 获取 API Key 的正确方法

1. 进入 Supabase 项目
2. 点击左侧 "Settings" → "API"
3. 在 "Project API keys" 部分
4. 复制 **"anon" "public"** key（不是 service_role key）
5. 复制 **"Project URL"**

## 手动测试数据库连接

创建一个测试文件来验证连接：

```typescript
// test-db.ts
import { supabase } from './lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');

  // 测试基本连接
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Connection error:', error);
  } else {
    console.log('Connection successful!', data);
  }
}

testConnection();
```

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 浏览器控制台的完整错误信息
2. Supabase Logs 中的错误（Settings → Logs）
3. 运行以下 SQL 的结果：

```sql
-- 诊断信息
SELECT 'Tables' as type, tablename as name FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Triggers', trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'
UNION ALL
SELECT 'Functions', proname FROM pg_proc WHERE proname IN ('handle_new_user', 'update_updated_at_column')
ORDER BY type, name;
```

## 常见解决方案总结

| 问题 | 解决方案 |
|------|----------|
| 表不存在 | 运行 `supabase-init.sql` |
| 触发器错误 | 重新创建 `handle_new_user` 函数和触发器 |
| RLS 错误 | 检查并重新创建 RLS 策略 |
| 环境变量错误 | 检查 `.env` 文件，重启服务器 |
| 权限问题 | 使用 `anon` key，不是 `service_role` key |

---

**下一步**：修复后，尝试重新注册，应该能成功创建账号。
