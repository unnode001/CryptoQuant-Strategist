# CryptoQuant-Strategist Supabase 数据库设置指南

## 概述
本指南将帮助你设置 Supabase 数据库，以便在 CryptoQuant-Strategist 应用中使用。

## 前置要求
- 一个 Supabase 账号（免费）：https://supabase.com
- Node.js 和 npm 已安装

## 步骤 1：创建 Supabase 项目

1. 访问 https://app.supabase.com
2. 点击 "New Project"
3. 填写项目信息：
   - 项目名称：CryptoQuant-Strategist
   - 数据库密码：设置一个强密码（请保存好）
   - 区域：选择离你最近的区域
4. 点击 "Create new project" 并等待项目创建完成（约 2 分钟）

## 步骤 2：获取 API 密钥

1. 在 Supabase 项目仪表板，点击左侧菜单的 "Settings"（设置）
2. 点击 "API"
3. 找到以下信息：
   - **Project URL**：形如 `https://xxxxx.supabase.co`
   - **anon public** key：以 `eyJ` 开头的长字符串

## 步骤 3：配置环境变量

1. 在项目根目录创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 Supabase 信息：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 步骤 4：初始化数据库表

1. 在 Supabase 项目仪表板，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制 `docs/supabase-init.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器中
5. 点击 "Run" 执行 SQL

这将创建所有必需的表和安全策略。

## 步骤 5：启用邮箱认证

1. 在 Supabase 项目仪表板，点击 "Authentication" > "Providers"
2. 确保 "Email" 提供商已启用
3. （可选）配置邮箱模板：
   - 点击 "Authentication" > "Email Templates"
   - 自定义注册确认邮件和密码重置邮件

## 步骤 6：启动应用

1. 安装依赖（如果还没有）：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 在浏览器中打开应用（通常是 `http://localhost:3000`）

## 步骤 7：创建第一个用户

1. 在应用中点击 "登录 / 注册" 按钮
2. 选择 "注册" 标签
3. 输入邮箱和密码（密码至少 6 个字符）
4. 点击 "注册"
5. 检查你的邮箱，点击确认链接（如果启用了邮箱确认）

## 数据迁移

如果你之前使用 localStorage 存储数据，首次登录后，应用会提示你迁移数据到 Supabase。

## 验证设置

登录后，你应该能看到：
- 顶部显示 "已登录: your@email.com"
- 绿色的在线状态指示器
- 所有数据将自动同步到 Supabase

## 故障排除

### 1. "Missing Supabase environment variables" 错误
- 确保 `.env` 文件存在且包含正确的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- 重启开发服务器

### 2. 无法连接到数据库
- 检查 Supabase 项目是否处于活动状态
- 验证 URL 和 API key 是否正确
- 检查网络连接

### 3. 认证失败
- 确保已在 Supabase 中启用邮箱认证
- 检查密码是否符合要求（至少 6 个字符）
- 查看浏览器控制台的错误信息

### 4. 表不存在错误
- 确保已运行 `supabase-init.sql` 脚本
- 在 Supabase 仪表板的 "Table Editor" 中验证表是否存在

### 5. RLS（Row Level Security）错误
- 确保 SQL 初始化脚本完整执行
- 检查 Supabase 日志：Settings > Logs

## 离线模式

即使没有配置 Supabase，应用仍然可以在离线模式下工作，数据将存储在浏览器的 localStorage 中。

## 安全建议

1. **不要提交** `.env` 文件到版本控制
2. **定期更换** API 密钥（在生产环境中）
3. **启用 2FA**（两步验证）保护 Supabase 账号
4. **使用环境变量** 管理敏感信息
5. **考虑加密** API 密钥和敏感配置（使用 Supabase Vault）

## 生产部署

部署到生产环境时：

1. 使用 Supabase 的生产项目
2. 在部署平台（如 Vercel、Netlify）配置环境变量
3. 启用 Supabase 的邮箱确认和 RLS 策略
4. 考虑设置数据库备份

## 数据库架构

完整的数据库架构文档请参考：`docs/database-schema.md`

## 获取帮助

- Supabase 文档：https://supabase.com/docs
- Supabase 社区：https://github.com/supabase/supabase/discussions
- 项目 Issues：https://github.com/your-repo/issues
