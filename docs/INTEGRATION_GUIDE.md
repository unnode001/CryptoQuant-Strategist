# 数据库集成指南

## 概述

本指南说明如何将 Supabase 数据库功能集成到现有的 App.tsx 中。

## 已完成的工作

### 1. 依赖安装
- ✅ 已安装 `@supabase/supabase-js`

### 2. 创建的新文件

#### 配置文件
- `lib/supabase.ts` - Supabase 客户端初始化
- `.env.example` - 环境变量示例
- `.gitignore` - 已更新以忽略 .env 文件

#### 类型定义
- `types/database.ts` - Supabase 数据库类型定义

#### 服务层
- `services/databaseService.ts` - 数据库 CRUD 操作
- `services/authService.ts` - 用户认证服务

#### Hooks
- `hooks/useAuth.ts` - 认证状态管理
- `hooks/useDataSync.ts` - 数据同步管理

#### UI 组件
- `components/AuthModal.tsx` - 登录/注册模态框

#### 文档
- `docs/database-schema.md` - 数据库架构设计文档
- `docs/supabase-init.sql` - 数据库初始化 SQL 脚本
- `docs/SETUP_GUIDE.md` - Supabase 设置指南
- `docs/INTEGRATION_GUIDE.md` - 本文件

## App.tsx 集成步骤

### 步骤 1：导入新的依赖

在 `App.tsx` 顶部添加以下导入：

```typescript
import AuthModal from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { useDataSync } from './hooks/useDataSync';
```

### 步骤 2：添加认证和数据同步状态

在 App 组件的 state 声明部分添加：

```typescript
// Authentication and Database Sync
const { user, loading: authLoading, signIn, signUp, signOut, isAuthenticated } = useAuth();
const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
const dataSync = useDataSync({ user, isAuthenticated });
```

### 步骤 3：修改数据加载逻辑

将现有的 `useEffect` (第95-108行) 替换为:

```typescript
// 加载数据：优先从数据库加载，否则从 localStorage
useEffect(() => {
  const loadData = async () => {
    if (isAuthenticated && user) {
      // 从数据库加载
      try {
        const data = await dataSync.loadFromDatabase();
        if (data) {
          setLlmConfigs(data.llmConfigs);
          setExchangeApiConfigs(data.exchangeConfigs);
          setMarketDataEntries(data.marketData);
          setBacktestHistory(data.backtestHistory);
        }
      } catch (error) {
        console.error("Failed to load data from database", error);
      }
    } else {
      // 从 localStorage 加载（离线模式）
      try {
        const savedLlmConfigs = localStorage.getItem('llmApiConfigs');
        if (savedLlmConfigs) {
          setLlmConfigs(JSON.parse(savedLlmConfigs));
        }
        const savedExchangeConfigs = localStorage.getItem('exchangeApiConfigs');
        if (savedExchangeConfigs) {
          setExchangeApiConfigs(JSON.parse(savedExchangeConfigs));
        }
      } catch (error) {
        console.error("Failed to load configs from localStorage", error);
      }
    }
  };

  if (!authLoading) {
    loadData();
  }
}, [isAuthenticated, user, authLoading, dataSync]);
```

### 步骤 4：更新数据操作处理函数

为每个数据操作添加数据库同步。以下是示例：

#### handleAddMarketDataEntry
```typescript
const handleAddMarketDataEntry = useCallback(async (newConfig: DataConfig, source: 'fetch' | 'import', fileName?: string) => {
  return new Promise<void>(async (resolve) => {
      setTimeout(async () => {
          const newEntry: MarketDataEntry = {
              id: `data-${Date.now()}`,
              ...newConfig,
              source,
              fileName,
          };
          setMarketDataEntries(prev => [newEntry, ...prev]);

          // 同步到数据库
          if (isAuthenticated) {
            try {
              await dataSync.syncMarketDataEntry(newEntry);
            } catch (error) {
              console.error('Failed to sync market data to database', error);
            }
          }

          resolve();
      }, 1000);
  });
}, [isAuthenticated, dataSync]);
```

类似地更新其他处理函数：
- `handleDeleteMarketDataEntry` - 添加 `dataSync.syncDeleteMarketData(id)`
- `handleUpdateMarketDataLabel` - 添加 `dataSync.syncUpdateMarketDataLabel(id, newLabel)`
- `handleSaveBacktest` - 添加 `dataSync.syncBacktestHistory(newEntry)`
- `handleDeleteBacktest` - 添加 `dataSync.syncDeleteBacktestHistory(id)`
- `handleSaveLlmConfigs` - 添加数据库同步循环
- `handleSaveExchangeApiConfigs` - 添加数据库同步循环

### 步骤 5：添加认证 UI

在 `return` 语句之前，添加加载状态检查：

```typescript
// 显示加载状态
if (authLoading) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F9F9F7]">
      <LoadingSpinner />
    </div>
  );
}
```

在 `<main>` 标签内，在 `{renderActiveView()}` 之前添加用户信息栏：

```tsx
<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
  {/* 用户信息栏 */}
  <div className="max-w-7xl mx-auto mb-4">
    <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              已登录: <span className="font-medium">{user?.email}</span>
            </span>
            {dataSync.isSyncing && (
              <span className="text-xs text-blue-600">同步中...</span>
            )}
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">离线模式</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        {isAuthenticated ? (
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            退出登录
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            登录 / 注册
          </button>
        )}
      </div>
    </div>
  </div>

  <div className="max-w-7xl mx-auto">
      {renderActiveView()}
  </div>
</main>
```

在 `<ApiConfigModal>` 之后添加认证模态框：

```tsx
<AuthModal
  isOpen={isAuthModalOpen}
  onClose={() => setIsAuthModalOpen(false)}
  onSignIn={signIn}
  onSignUp={signUp}
/>
```

## 快速集成脚本

如果你想自动应用这些更改，可以运行以下命令（需要先手动创建 App.tsx 的备份）：

```bash
# 备份原文件
cp App.tsx App.tsx.backup

# 然后手动应用上述更改，或等待自动集成脚本
```

## 测试集成

1. 确保已按照 `docs/SETUP_GUIDE.md` 设置 Supabase
2. 启动应用：`npm run dev`
3. 点击 "登录 / 注册" 按钮
4. 创建一个新账户
5. 验证数据是否同步到 Supabase

## 功能特性

集成完成后，你的应用将具有：

- ✅ 用户认证（注册/登录/登出）
- ✅ 实时数据同步到 Supabase
- ✅ 离线模式支持（localStorage 作为备份）
- ✅ 多用户数据隔离
- ✅ 安全的 Row Level Security (RLS)
- ✅ 自动数据备份和恢复

## 注意事项

1. **不要删除** localStorage 相关代码 - 它提供离线支持
2. **所有数据操作** 现在都是异步的，确保使用 `async/await`
3. **错误处理** 已内置，但建议添加用户友好的错误提示
4. **数据迁移** 功能可以在未来添加，将现有 localStorage 数据迁移到 Supabase

## 疑难解答

查看 `docs/SETUP_GUIDE.md` 的故障排除部分。

## 下一步

集成完成后，你可以：

1. 添加更多的数据验证
2. 实现数据导出功能
3. 添加策略分享功能
4. 实现协作功能
5. 添加数据可视化和报表
