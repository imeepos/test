# @sker/store-client

> 轻量级 Store 服务 HTTP 客户端

## 📦 简介

`@sker/store-client` 是 SKER 项目的轻量级 Store 服务 HTTP 客户端包，提供了与 Store 微服务交互的完整接口。

### 为什么需要这个包？

在微服务架构中，服务之间应该通过 HTTP/REST API 通信，而不是直接访问数据库。`@sker/store-client` 将 HTTP 客户端从 `@sker/store` 包中分离出来，具有以下优势：

- **职责分离**：客户端只负责 HTTP 通信，不包含数据库逻辑
- **依赖简化**：仅依赖 `axios`，无需数据库驱动和配置
- **环境隔离**：使用此包的服务不需要配置数据库环境变量
- **轻量快速**：打包体积小，构建速度快

## 📥 安装

```bash
# 在 workspace 中
pnpm add @sker/store-client --filter=your-package

# 或直接在 package.json 中添加
{
  "dependencies": {
    "@sker/store-client": "workspace:*"
  }
}
```

## 🚀 快速开始

### 基本使用

```typescript
import { StoreClient } from '@sker/store-client'

// 创建客户端实例
const client = new StoreClient({
  baseURL: 'http://localhost:3001',
  timeout: 30000
})

// 初始化（会测试连接）
await client.initialize()

// 使用仓库方法
const users = await client.users.findMany()
const project = await client.projects.findById('project-id')
```

### 使用环境变量

```typescript
import { createStoreClientFromEnv } from '@sker/store-client'

// 从环境变量自动创建客户端
const client = createStoreClientFromEnv()
await client.initialize()
```

支持的环境变量：
- `STORE_SERVICE_URL` 或 `STORE_API_URL`: Store 服务地址（默认：http://localhost:3001）
- `STORE_AUTH_TOKEN`: 认证令牌（可选）
- `STORE_TIMEOUT`: 请求超时时间，毫秒（默认：30000）
- `STORE_RETRIES`: 重试次数（默认：3）
- `STORE_RETRY_DELAY`: 重试延迟，毫秒（默认：1000）

## 📚 API 参考

### 配置选项

```typescript
interface StoreClientConfig {
  baseURL: string          // Store 服务基础 URL
  authToken?: string       // 认证令牌（可选）
  timeout?: number         // 请求超时时间，毫秒
  retries?: number         // 重试次数
  retryDelay?: number      // 重试延迟，毫秒
}
```

### 仓库接口

#### 用户仓库 (users)

```typescript
// 查询
await client.users.findById(id)
await client.users.findByEmail(email)
await client.users.findByUsername(username)
await client.users.findMany(filter, options)
await client.users.count(filter)

// 操作
await client.users.create(userData)
await client.users.update(id, updateData)
await client.users.delete(id)

// 认证
await client.users.authenticate(email, password)
await client.users.verifyPassword(id, password)
await client.users.updatePassword(id, newPassword)
await client.users.updateLastLogin(id)
```

#### 项目仓库 (projects)

```typescript
// 查询
await client.projects.findById(id)
await client.projects.findMany(filter, options)
await client.projects.findByUser(userId, options)
await client.projects.search(query, options)
await client.projects.findWithPagination(options)
await client.projects.count(filter)

// 操作
await client.projects.create(projectData)
await client.projects.update(id, updateData)
await client.projects.delete(id)
await client.projects.updateLastAccessed(id)
await client.projects.archive(id)
```

#### 节点仓库 (nodes)

```typescript
// 查询
await client.nodes.findById(id)
await client.nodes.findMany(filter, options)
await client.nodes.findByProject(projectId, options)
await client.nodes.findByTags(tags, options)
await client.nodes.findWithPagination(options)
await client.nodes.count(filter)

// 操作
await client.nodes.create(nodeData)
await client.nodes.update(id, updateData)
await client.nodes.delete(id)
```

#### 连接仓库 (connections)

```typescript
// 查询
await client.connections.findById(id)
await client.connections.findMany(filter, options)
await client.connections.findByProject(projectId, options)
await client.connections.count(filter)

// 操作
await client.connections.create(connectionData)
await client.connections.update(id, updateData)
await client.connections.delete(id)
```

#### AI任务仓库 (aiTasks)

```typescript
// 查询
await client.aiTasks.findById(id)
await client.aiTasks.findMany(filter, options)
await client.aiTasks.findByProject(projectId, options)
await client.aiTasks.getQueuedTasks(limit)
await client.aiTasks.count(filter)

// 操作
await client.aiTasks.create(taskData)
await client.aiTasks.update(id, updateData)
await client.aiTasks.delete(id)

// 任务状态管理
await client.aiTasks.startTask(id)
await client.aiTasks.completeTask(id, result, processingTime)
await client.aiTasks.failTask(id, error)

// 维护
await client.aiTasks.cleanupOldTasks(daysOld)
```

### 系统操作

```typescript
// 健康检查
const health = await client.healthCheck()

// 统计信息
const stats = await client.getSystemStats()

// 缓存操作
await client.cache(key, value, ttl)  // 设置
const value = await client.cache(key)  // 获取
await client.deleteCache(key)

// 数据完整性
const validation = await client.validateDataIntegrity()
const repair = await client.repairDataIntegrity()

// 清理
await client.cleanup({ oldTasks: 30, oldLogs: 90 })
```

### 认证管理

```typescript
// 设置认证令牌
client.setAuthToken('your-jwt-token')

// 清除认证令牌
client.clearAuthToken()
```

### 批量操作

```typescript
// 批量执行操作
const results = await client.batch([
  () => client.users.findById('user-1'),
  () => client.projects.findByUser('user-1'),
  () => client.nodes.findByProject('project-1')
])
```

## 🔧 高级用法

### 错误处理

```typescript
import { StoreClient, DatabaseError } from '@sker/store-client'

try {
  const user = await client.users.findById('invalid-id')
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error(`错误代码: ${error.code}`)
    console.error(`错误消息: ${error.message}`)
    console.error(`详细信息:`, error.details)
  }
}
```

### 自定义配置

```typescript
const client = new StoreClient({
  baseURL: process.env.STORE_URL || 'http://store:3001',
  timeout: 60000,  // 1分钟超时
  retries: 5,      // 重试5次
  retryDelay: 2000, // 每次重试延迟2秒
  authToken: await getAuthToken()
})
```

### 在微服务中使用

```typescript
// engine/src/server/index.ts
import { StoreClient } from '@sker/store-client'

async function startEngine() {
  const storeClient = new StoreClient({
    baseURL: process.env.STORE_API_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.STORE_TIMEOUT || '30000')
  })

  await storeClient.initialize()

  // 使用 storeClient...
}
```

## 🏗️ 架构说明

### 与 @sker/store 的关系

- **`@sker/store`**: Store 服务端包，包含数据库操作、仓库实现、API 服务器
- **`@sker/store-client`**: Store HTTP 客户端包，仅用于访问 Store API

```
┌─────────────────┐     HTTP      ┌──────────────┐     SQL      ┌────────────┐
│  @sker/engine   │ ─────────────> │ @sker/store  │ ──────────> │ PostgreSQL │
│  @sker/broker   │   (REST API)   │   (Server)   │             │            │
│  @sker/gateway  │                └──────────────┘             └────────────┘
└─────────────────┘
       ↓
  依赖 @sker/store-client
  (HTTP Client Only)
```

### 为什么拆分？

在拆分之前，Engine 依赖 `@sker/store` 会间接依赖：
- PostgreSQL 驱动 (`pg`)
- Redis 客户端 (`redis`)
- 配置包 (`@sker/config`)，需要 PG 环境变量

这导致：
1. Engine 需要配置数据库环境变量，即使它不直接访问数据库
2. 构建时需要包含数据库驱动，增加包体积
3. 违反微服务架构原则（服务间应通过 API 通信）

拆分后：
1. ✅ Engine 只需要 Store 服务 URL
2. ✅ 无需数据库环境变量
3. ✅ 依赖更清晰，包体积更小
4. ✅ 符合微服务最佳实践

## 📖 相关文档

- [Store 服务文档](../store/README.md)
- [Engine 服务文档](../engine/README.md)
- [系统架构文档](../../docs/architecture/ARCHITECTURE.md)

## 🔄 版本历史

### v0.1.0 (2025-10-01)

- 🎉 首次发布
- ✨ 从 `@sker/store` 包中拆分出 HTTP 客户端
- ✨ 支持所有 Store API 端点
- ✨ 完整的 TypeScript 类型定义
- ✨ 环境变量配置支持

## 📄 许可证

MIT License

## 👥 作者

SKER Team
