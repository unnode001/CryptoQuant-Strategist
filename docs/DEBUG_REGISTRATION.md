# 注册问题调试步骤

## 错误：Database error saving new user

### 🔍 问题诊断

这个错误通常意味着在创建新用户时，数据库触发器无法在 `user_profiles` 表中创建记录。

---

## ⚡ 快速修复（3 分钟）

### 步骤 1：运行快速修复脚本

1. 打开 Supabase 控制台：https://app.supabase.com
2. 选择你的项目
3. 点击左侧 **"SQL Editor"**
4. 点击 **"New query"**
5. 复制 `docs/quick-fix.sql` 的全部内容
6. 粘贴并点击 **"Run"**
7. 查看输出，应该显示：
   ```
   ✓ 触发器已创建
   ✓ user_profiles 表存在
   ✓ RLS 已启用
   现在可以尝试注册新用户了！
   ```

### 步骤 2：测试注册

1. 回到应用
2. 刷新页面（Ctrl+R 或 Cmd+R）
3. 点击"登录 / 注册"
4. 选择"注册"标签
5. 输入邮箱和密码
6. 点击"注册"

**应该成功！** 🎉

---

## 🔧 如果快速修复不起作用

### 方法 1：检查完整的初始化

如果快速修复脚本无效，可能需要完整初始化：

1. 在 SQL Editor 中运行：

```sql
-- 检查是否运行过完整初始化
SELECT
  COUNT(*) as table_count,
  string_agg(tablename, ', ') as tables
FROM pg_tables
WHERE schemaname = 'public';
```

2. 如果 `table_count` 小于 7，运行完整的 `docs/supabase-init.sql`

### 方法 2：查看详细错误

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 尝试注册
4. 查找红色错误信息
5. 截图发送给我

### 方法 3：检查 Supabase 日志

1. 在 Supabase 控制台，点击左侧 **"Logs"**
2. 选择 **"Postgres Logs"**
3. 尝试注册
4. 刷新日志
5. 查找错误信息（通常是红色的）

常见错误及解决方案：

| 日志错误 | 原因 | 解决方案 |
|---------|------|---------|
| `relation "user_profiles" does not exist` | 表未创建 | 运行 quick-fix.sql |
| `function handle_new_user() does not exist` | 触发器函数丢失 | 运行 quick-fix.sql |
| `new row violates row-level security policy` | RLS 策略错误 | 运行 quick-fix.sql |
| `permission denied` | 权限问题 | 检查是否使用 anon key |

---

## 🐛 调试清单

逐项检查：

### ✅ 环境变量配置

```bash
# 检查 .env 文件
cat .env
```

应该包含：
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**验证**：
- [ ] URL 以 `https://` 开头
- [ ] URL 以 `.supabase.co` 结尾
- [ ] API Key 以 `eyJ` 开头（这是 JWT token 格式）
- [ ] 修改 .env 后已重启服务器

### ✅ 数据库表检查

在 Supabase SQL Editor 运行：

```sql
-- 应该返回 7 个表
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

应该看到：
- backtest_history
- exchange_api_configs
- llm_configs
- market_data_entries
- strategies
- strategy_generation_logs
- user_profiles

### ✅ 触发器检查

```sql
-- 应该返回 1 行
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### ✅ RLS 策略检查

```sql
-- 应该返回 3 个策略
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
```

应该看到：
- Users can view own profile (SELECT)
- Users can update own profile (UPDATE)
- Users can insert own profile (INSERT)

### ✅ 函数检查

```sql
-- 应该返回函数定义
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

---

## 💡 手动测试

如果自动注册还是失败，尝试手动创建用户配置：

### 步骤 1：在 Supabase 注册用户

1. 进入 Supabase 控制台
2. 点击 **"Authentication"** → **"Users"**
3. 点击 **"Add user"**
4. 选择 **"Create new user"**
5. 输入邮箱和密码
6. 点击 **"Send Magic Link"** 或 **"Create user"**

### 步骤 2：检查是否自动创建 profile

在 SQL Editor 运行：

```sql
-- 检查用户和配置
SELECT
  u.id,
  u.email,
  p.username,
  p.display_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

如果 `username` 和 `display_name` 是 `NULL`，说明触发器没有工作。

### 步骤 3：手动创建 profile

```sql
-- 替换 'user@example.com' 为你的邮箱
INSERT INTO public.user_profiles (id, username, display_name)
SELECT
  id,
  email,
  email
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (id) DO NOTHING;
```

### 步骤 4：测试登录

现在应该能用这个账号登录了。

---

## 🔍 高级调试

### 查看完整的数据库结构

```sql
-- 生成诊断报告
SELECT
  'Tables' as category,
  tablename as name,
  'rowsecurity: ' || rowsecurity::text as info
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Triggers',
  trigger_name,
  'on table: ' || event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
  'Policies',
  policyname,
  'on table: ' || tablename || ' (' || cmd || ')'
FROM pg_policies

UNION ALL

SELECT
  'Functions',
  proname,
  'args: ' || pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace

ORDER BY category, name;
```

将结果截图发给我进行分析。

---

## 🆘 仍然无法解决？

如果以上所有步骤都尝试过，问题仍然存在，请提供：

1. **浏览器控制台的完整错误**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签
   - 截图所有红色错误

2. **Supabase Postgres 日志**
   - Logs → Postgres Logs
   - 尝试注册时的日志
   - 截图错误部分

3. **数据库诊断结果**
   - 运行上面的"高级调试"SQL
   - 截图结果

4. **环境信息**
   ```bash
   # 运行并提供输出
   node --version
   npm --version
   cat .env | grep SUPABASE
   ```

---

## ✅ 成功标志

注册成功后，你应该看到：

1. **浏览器**：
   - 顶部显示 "🟢 已登录: your@email.com"
   - 没有错误提示

2. **Supabase Dashboard** → **Authentication** → **Users**：
   - 新用户出现在列表中

3. **Table Editor** → **user_profiles**：
   - 有新的记录，包含邮箱信息

---

**需要帮助？** 运行 `docs/quick-fix.sql` 后如果还有问题，请提供详细错误信息！
