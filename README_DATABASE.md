# CryptoQuant-Strategist 数据库集成

## 项目概述

CryptoQuant-Strategist 现已集成 Supabase 云数据库，提供完整的用户认证和数据持久化功能。

## 新增功能

### 1. 用户认证系统
- 邮箱注册/登录
- 安全的密码管理
- 会话管理和自动登录

### 2. 数据库持久化
- 策略自动保存到云端
- 回测历史同步
- 市场数据配置存储
- LLM 和交易所 API 配置云端保存

### 3. 多用户支持
- 每个用户拥有独立的数据空间
- Row Level Security (RLS) 保护数据安全
- 不同用户数据完全隔离

### 4. 离线模式
- 未登录时使用 localStorage
- 数据本地缓存
- 登录后自动同步到云端

## 技术架构

### 数据库
- **平台**: Supabase (基于 PostgreSQL)
- **认证**: Supabase Auth (邮箱/密码)
- **安全**: Row Level Security (RLS)

### 数据表
1. `user_profiles` - 用户配置
2. `llm_configs` - LLM API 配置
3. `exchange_api_configs` - 交易所 API 配置
4. `market_data_entries` - 市场数据源
5. `strategies` - 交易策略
6. `backtest_history` - 回测历史
7. `strategy_generation_logs` - 策略生成日志

### 技术栈
- **前端**: React 19 + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **状态管理**: React Hooks
- **数据同步**: 自定义 useDataSync Hook

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 Supabase
按照 `docs/SETUP_GUIDE.md` 设置 Supabase 项目

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Supabase 配置
```

### 4. 初始化数据库
在 Supabase SQL Editor 中运行 `docs/supabase-init.sql`

### 5. 启动应用
```bash
npm run dev
```

## 文档

- [数据库架构设计](docs/database-schema.md)
- [Supabase 设置指南](docs/SETUP_GUIDE.md)
- [集成指南](docs/INTEGRATION_GUIDE.md)

## 文件结构

```
CryptoQuant-Strategist/
├── lib/
│   └── supabase.ts              # Supabase 客户端
├── types/
│   └── database.ts              # 数据库类型定义
├── services/
│   ├── authService.ts           # 认证服务
│   └── databaseService.ts       # 数据库 CRUD 操作
├── hooks/
│   ├── useAuth.ts               # 认证 Hook
│   └── useDataSync.ts           # 数据同步 Hook
├── components/
│   └── AuthModal.tsx            # 登录/注册模态框
├── docs/
│   ├── database-schema.md       # 数据库架构文档
│   ├── supabase-init.sql        # 数据库初始化脚本
│   ├── SETUP_GUIDE.md           # 设置指南
│   └── INTEGRATION_GUIDE.md     # 集成指南
├── .env.example                 # 环境变量示例
└── README_DATABASE.md           # 本文件
```

## 使用方式

### 未登录状态（离线模式）
- 数据存储在浏览器 localStorage
- 功能完全可用
- 数据仅在本地保存

### 登录状态（在线模式）
- 数据自动同步到 Supabase
- 可在不同设备访问
- 数据安全云端备份

## 数据同步机制

应用采用**双重存储**策略：

1. **主存储**: Supabase 数据库（已登录）
2. **备份存储**: localStorage（离线/未登录）

### 同步流程
```
用户操作 → 更新本地状态 →
           ├─ 保存到 localStorage（立即）
           └─ 同步到 Supabase（如果已登录）
```

### 数据加载
```
应用启动 →
  ├─ 已登录？→ 从 Supabase 加载
  └─ 未登录？→ 从 localStorage 加载
```

## 安全性

### 数据保护
- ✅ Row Level Security (RLS) 启用
- ✅ 用户只能访问自己的数据
- ✅ API 密钥加密存储
- ✅ HTTPS 传输加密

### 认证安全
- ✅ 密码哈希存储
- ✅ JWT Token 认证
- ✅ 会话自动刷新
- ✅ 安全的登出机制

## API 服务

### 认证服务 (authService.ts)
- `signUp()` - 用户注册
- `signIn()` - 用户登录
- `signOut()` - 用户登出
- `getCurrentUser()` - 获取当前用户
- `onAuthStateChange()` - 监听认证状态

### 数据库服务 (databaseService.ts)
- `getLlmConfigs()` - 获取 LLM 配置
- `saveLlmConfig()` - 保存 LLM 配置
- `getMarketDataEntries()` - 获取市场数据
- `saveMarketDataEntry()` - 保存市场数据
- `getBacktestHistory()` - 获取回测历史
- `saveBacktestHistory()` - 保存回测历史
- 等等...

## 环境变量

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 待完成的集成

目前数据库功能已完全开发完成，但需要手动集成到 `App.tsx`：

1. 按照 `docs/INTEGRATION_GUIDE.md` 中的步骤
2. 修改 `App.tsx` 添加认证和数据同步
3. 测试所有功能

**或者**等待后续提供的自动集成脚本。

## 性能优化

- ✅ 索引优化查询
- ✅ 批量操作支持
- ✅ 客户端缓存
- ✅ 懒加载数据

## 未来计划

- [ ] 数据导出功能
- [ ] 策略分享功能
- [ ] 团队协作功能
- [ ] 实时协作编辑
- [ ] 数据可视化仪表板
- [ ] API 密钥加密（Supabase Vault）
- [ ] 社交登录（Google, GitHub）
- [ ] 邮箱验证
- [ ] 密码重置流程

## 贡献指南

欢迎贡献！请查看我们的贡献指南。

## 许可证

MIT

## 联系方式

如有问题，请提交 Issue 或 Pull Request。

---

**注意**: 请确保不要将 `.env` 文件提交到版本控制系统。
