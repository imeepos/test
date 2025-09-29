# @sker/store

SKER 数据存储服务 - 提供 PostgreSQL 数据管理和 Redis 缓存的统一接口。

## 系统架构位置

`@sker/store` 是SKER系统的**数据存储层**，位于整个架构的底层，为上层服务提供数据持久化支持：

```
Frontend (@sker/studio)
        ↓
API网关 (@sker/gateway) ──┐
        ↓                 │
消息代理 (@sker/broker)    │ 依赖调用
        ↓                 │
AI引擎 (@sker/engine) ────┘
        ↓
📍 数据存储 (@sker/store) ← 当前模块
```

### 服务间集成关系

- **被调用者**: 作为基础数据服务，被以下模块调用：
  - `@sker/gateway`: 用户认证、项目数据访问
  - `@sker/engine`: AI任务结果存储、节点数据读写
- **无依赖**: 作为底层服务，不依赖其他业务模块
- **外部依赖**: PostgreSQL数据库、Redis缓存服务

## 功能特性

- 🗄️ **PostgreSQL 数据管理** - 完整的关系型数据库操作
- 🚀 **Redis 缓存支持** - 高性能缓存层
- 🔧 **类型安全** - 完整的 TypeScript 类型定义
- 📊 **数据仓库模式** - 标准的仓库模式实现
- 🔄 **数据库迁移** - 自动化数据库迁移和版本管理
- 🌱 **种子数据** - 开发和测试数据生成
- 🔐 **用户认证** - JWT 和密码哈希
- 📈 **统计分析** - 内置数据分析功能
- 🔍 **全文搜索** - 内容搜索支持
- 🤝 **事务支持** - 数据一致性保证

## 安装

```bash
npm install @sker/store
```

## 环境变量配置

```bash
# PostgreSQL 配置
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=sker_db
PG_USER=sker_user
PG_PASSWORD=sker_pass
PG_SSL=false

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_KEYS=10000

# JWT 密钥
JWT_SECRET=your-jwt-secret-key
```

## 快速开始

### 初始化服务

```typescript
import { storeService } from '@sker/store'

async function main() {
  // 初始化数据存储服务
  await storeService.initialize()

  // 检查服务健康状态
  const health = await storeService.healthCheck()
  console.log('数据库状态:', health)
}
```

### 数据库迁移

```bash
# 执行迁移
npm run migrate

# 查看迁移状态
npm run migrate:status

# 创建种子数据
npm run seed

# 完整数据库设置
npm run db:setup

# 重置数据库
npm run db:reset
```

### 用户管理

```typescript
import { storeService } from '@sker/store'

// 创建用户
const user = await storeService.users.createUser({
  email: 'user@example.com',
  username: 'testuser',
  password: 'SecurePass123!',
  settings: {
    theme: 'dark',
    language: 'zh-CN'
  }
})

// 用户登录
const authResult = await storeService.users.authenticate('user@example.com', 'SecurePass123!')
if (authResult) {
  console.log('登录成功:', authResult.user.username)
  console.log('Token:', authResult.token)
}

// 验证 Token
const payload = storeService.users.verifyToken(authResult.token)
console.log('用户信息:', payload)
```

### 项目管理

```typescript
// 创建项目
const project = await storeService.projects.create({
  user_id: user.id,
  name: '我的项目',
  description: '项目描述',
  status: 'active',
  canvas_data: {
    viewport: { x: 0, y: 0, zoom: 1 },
    config: { gridSize: 20, snapToGrid: true }
  }
})

// 查找用户的项目
const userProjects = await storeService.projects.findByUser(user.id)

// 搜索项目
const searchResults = await storeService.projects.search('关键词', user.id)

// 更新最后访问时间
await storeService.projects.updateLastAccessed(project.id)
```

### 节点管理

```typescript
// 创建节点
const node = await storeService.nodes.create({
  project_id: project.id,
  user_id: user.id,
  content: '这是一个重要的想法',
  title: '核心概念',
  importance: 5,
  confidence: 0.8,
  status: 'idle',
  tags: ['概念', '重要'],
  position: { x: 100, y: 100 },
  metadata: {
    semantic_types: ['idea'],
    edit_count: 0,
    processing_history: [],
    statistics: {
      view_count: 0,
      edit_duration_total: 0,
      ai_interactions: 0
    }
  }
})

// 搜索节点内容
const searchNodes = await storeService.nodes.searchContent('重要', project.id)

// 根据标签查找节点
const taggedNodes = await storeService.nodes.findByTags(['概念'], {
  filters: { project_id: project.id }
})

// 获取节点统计
const nodeStats = await storeService.nodes.getStatistics(project.id)
```

### 连接管理

```typescript
// 创建另一个节点
const node2 = await storeService.nodes.create({
  project_id: project.id,
  user_id: user.id,
  content: '实现方案',
  title: '技术实现',
  importance: 4,
  confidence: 0.7,
  status: 'idle',
  tags: ['实现'],
  position: { x: 300, y: 100 }
})

// 创建连接
const connection = await storeService.connections.createConnection({
  project_id: project.id,
  source_node_id: node.id,
  target_node_id: node2.id,
  type: 'dependency',
  label: '依赖关系',
  weight: 0.8,
  metadata: {
    ai_suggested: false,
    confidence: 0.9,
    reasoning: '概念指导实现',
    validation_status: 'accepted'
  }
})

// 查找节点的邻居
const neighbors = await storeService.connections.findNeighbors(node.id)

// 查找最短路径
const path = await storeService.connections.findShortestPath(node.id, node2.id)
```

### AI 任务管理

```typescript
// 创建 AI 任务
const aiTask = await storeService.aiTasks.createTask({
  project_id: project.id,
  user_id: user.id,
  type: 'content_generation',
  input_data: {
    prompt: '为项目生成更多创意',
    context: node.content,
    requirements: ['创新性', '可行性']
  },
  estimated_cost: 0.05,
  metadata: {
    model_used: 'gpt-4',
    priority: 3,
    retry_count: 0
  }
})

// 开始处理任务
await storeService.aiTasks.startTask(aiTask.id)

// 完成任务
await storeService.aiTasks.completeTask(aiTask.id, {
  generated_content: '生成的内容...',
  suggestions: ['建议1', '建议2']
}, 0.04)

// 获取任务统计
const taskStats = await storeService.aiTasks.getStatistics(project.id)
```

### 缓存操作

```typescript
// 设置缓存
await storeService.cache('user:profile:' + user.id, user, 3600)

// 获取缓存
const cachedUser = await storeService.cache('user:profile:' + user.id)

// 删除缓存
await storeService.deleteCache('user:profile:' + user.id)

// 批量删除缓存
await storeService.deleteCache('user:profile:*', true)
```

### 事务操作

```typescript
// 使用事务执行多个操作
const results = await storeService.batch([
  () => storeService.nodes.create({...nodeData1}),
  () => storeService.nodes.create({...nodeData2}),
  () => storeService.connections.createConnection({...connectionData})
])

// 或者使用数据库事务
await storeService.database.transaction(async (client) => {
  // 在事务中执行操作
  const node1 = await storeService.nodes.create(nodeData1)
  const node2 = await storeService.nodes.create(nodeData2)
  const connection = await storeService.connections.createConnection({
    source_node_id: node1.id,
    target_node_id: node2.id,
    // ...其他数据
  })
  return { node1, node2, connection }
})
```

## 数据模型

### 用户 (User)
- 用户认证和授权
- 个人设置和偏好
- 使用统计信息

### 项目 (Project)
- 项目元数据和配置
- 画布设置
- 协作权限

### 节点 (Node)
- 内容和元数据
- 重要性和置信度
- 语义类型标记
- 位置和布局信息

### 连接 (Connection)
- 节点间关系
- 连接类型和权重
- AI 建议状态

### AI 任务 (AITask)
- 任务类型和状态
- 输入输出数据
- 成本和性能统计

## API 参考

### 查询选项 (QueryOptions)

```typescript
interface QueryOptions {
  limit?: number          // 限制结果数量
  offset?: number         // 偏移量
  orderBy?: string        // 排序字段
  orderDirection?: 'ASC' | 'DESC'  // 排序方向
  filters?: Record<string, any>    // 过滤条件
  include?: string[]      // 关联查询
}
```

### 分页结果 (PaginatedResult)

```typescript
interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

## 错误处理

```typescript
import { DatabaseError, ValidationError, NotFoundError } from '@sker/store'

try {
  const user = await storeService.users.findById('invalid-id')
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('数据库错误:', error.message, error.code)
  } else if (error instanceof ValidationError) {
    console.error('验证错误:', error.field, error.value)
  } else if (error instanceof NotFoundError) {
    console.error('资源未找到:', error.message)
  }
}
```

## 性能优化

### 索引使用
- 自动为常用查询字段创建索引
- 支持复合索引和部分索引

### 缓存策略
- Redis 缓存热点数据
- 自动缓存失效和更新
- 分层缓存支持

### 查询优化
- 分页查询减少内存使用
- 延迟加载关联数据
- 批量操作支持

## 监控和维护

### 健康检查
```typescript
const health = await storeService.healthCheck()
console.log('数据库延迟:', health.database.postgres.latency)
```

### 系统统计
```typescript
const stats = await storeService.getSystemStats()
console.log('系统概览:', stats)
```

### 数据清理
```typescript
const cleanupResult = await storeService.cleanup({
  oldTasks: 90,     // 清理90天前的任务
  oldLogs: 180,     // 清理180天前的日志
  oldArchived: 365  // 清理365天前的归档项目
})
```

### 数据完整性
```typescript
// 验证数据完整性
const integrity = await storeService.validateDataIntegrity()
if (integrity.issues.length > 0) {
  console.log('发现问题:', integrity.issues)

  // 修复问题
  const repairResult = await storeService.repairDataIntegrity()
  console.log('修复结果:', repairResult)
}
```

## 开发和测试

```bash
# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint
```

## 许可证

MIT License