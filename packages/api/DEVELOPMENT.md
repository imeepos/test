# @sker/api 开发文档

## 项目概述

`@sker/api` 是 SKER 系统的统一网络通信层,提供 REST API 客户端、WebSocket 实时通信、认证管理、缓存管理等完整的网络通信解决方案。

## 技术栈

- **TypeScript 5.0+**: 类型安全
- **Axios 1.6+**: HTTP客户端
- **Socket.IO Client 4.7+**: WebSocket通信
- **tsup 8.5+**: 构建工具
- **Vitest**: 测试框架

## 项目结构

```
packages/api/
├── src/                        # 源代码
│   ├── clients/                # 客户端实现
│   │   ├── RestClient.ts       # REST API客户端
│   │   └── WebSocketClient.ts  # WebSocket客户端
│   ├── managers/               # 管理器
│   │   ├── AuthManager.ts      # 认证管理器
│   │   └── CacheManager.ts     # 缓存管理器
│   ├── types/                  # 类型定义
│   │   └── index.ts
│   ├── errors/                 # 错误类型
│   │   └── index.ts
│   └── index.ts                # 主入口文件
├── docs/                       # 文档
│   ├── USAGE.md                # 详细使用文档
│   └── QUICK_REFERENCE.md      # 快速参考
├── examples/                   # 示例代码
│   └── basic-usage.ts
├── tests/                      # 测试文件(待添加)
├── dist/                       # 构建产物
│   ├── index.js                # ESM格式
│   ├── index.cjs               # CJS格式
│   ├── index.d.ts              # 类型声明
│   └── *.map                   # Source maps
├── package.json                # 包配置
├── tsup.config.ts              # 构建配置
├── tsconfig.json               # TypeScript配置
└── README.md                   # 项目说明
```

## 核心功能

### 1. REST客户端 (RestClient)

**文件**: `src/clients/RestClient.ts`

**特性**:
- ✅ 基于 Axios 的 HTTP 客户端
- ✅ 自动重试机制(指数退避)
- ✅ 请求/响应拦截器
- ✅ Token 自动注入
- ✅ 错误分类和处理
- ✅ 资源 API 模式
- ✅ 批量操作支持
- ✅ 请求统计

**关键方法**:
- `get/post/put/delete/patch`: 基础 HTTP 方法
- `resource<T>()`: 创建资源 API 代理
- `batch()`: 批量请求
- `setAuthToken/clearAuthToken`: Token 管理
- `healthCheck()`: 健康检查
- `getStats()`: 获取统计信息

### 2. WebSocket客户端 (WebSocketClient)

**文件**: `src/clients/WebSocketClient.ts`

**特性**:
- ✅ 基于 Socket.IO 的实时通信
- ✅ 自动重连(线性/指数退避)
- ✅ 心跳检测
- ✅ 房间管理
- ✅ 事件监听器管理
- ✅ 连接状态管理

**关键方法**:
- `connect/close`: 连接管理
- `on/off/once`: 事件监听
- `send()`: 发送消息
- `joinRoom/leaveRoom`: 房间管理
- `broadcast()`: 广播消息
- `getRooms()`: 获取房间列表

### 3. 认证管理器 (AuthManager)

**文件**: `src/managers/AuthManager.ts`

**特性**:
- ✅ Token 存储管理(localStorage/sessionStorage/memory)
- ✅ Token 自动刷新
- ✅ Token 过期检测
- ✅ 认证状态事件

**关键方法**:
- `setCredentials()`: 设置认证凭据
- `getAccessToken/getRefreshToken()`: 获取 Token
- `isTokenValid()`: 检查有效性
- `logout()`: 登出
- `on/off`: 事件监听

### 4. 缓存管理器 (CacheManager)

**文件**: `src/managers/CacheManager.ts`

**特性**:
- ✅ 多种缓存策略(LRU/FIFO/TTL)
- ✅ TTL 过期管理
- ✅ 标签管理
- ✅ 缓存统计

**关键方法**:
- `set/get/delete`: 基础缓存操作
- `deleteByTags()`: 按标签删除
- `clear()`: 清空缓存
- `isExpired()`: 检查过期
- `getStats()`: 缓存统计

### 5. 错误处理体系

**文件**: `src/errors/index.ts`

**错误类型**:
- `NetworkError`: 网络请求错误
- `AuthError`: 认证错误
- `ValidationError`: 验证错误
- `WebSocketError`: WebSocket错误
- `SyncError`: 同步错误
- `CacheHit`: 缓存命中标记

**错误分类**:
- `auth`: 认证错误 (401)
- `permission`: 权限错误 (403)
- `network`: 网络错误
- `server`: 服务器错误 (5xx)
- `client`: 客户端错误 (4xx)
- `validation`: 验证错误
- `timeout`: 超时错误
- `unknown`: 未知错误

## 开发指南

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 监听模式构建
pnpm dev

# 在另一个终端运行类型检查
pnpm typecheck
```

### 构建

```bash
# 清理构建产物
pnpm clean

# 执行构建
pnpm build

# 检查构建产物
ls -lh dist/
```

### 测试

```bash
# 运行测试(待实现)
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率
pnpm test:coverage
```

### 代码检查

```bash
# ESLint检查
pnpm lint

# 类型检查
pnpm typecheck
```

## 构建配置

### tsup.config.ts

```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],        // 双格式输出
  dts: true,                     // 生成类型声明
  clean: true,                   // 清理dist
  sourcemap: true,               // 生成sourcemap
  treeshake: true,               // Tree-shaking优化
  external: [                    // 外部依赖
    'axios',
    'socket.io-client',
    '@sker/models',
    '@sker/config'
  ]
})
```

### package.json 关键字段

```json
{
  "type": "module",
  "main": "dist/index.cjs",      // CJS入口
  "module": "dist/index.js",     // ESM入口
  "types": "dist/index.d.ts",    // 类型声明
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## API设计原则

### 1. 类型安全

所有公共 API 都提供完整的 TypeScript 类型定义:

```typescript
// ✅ 好的做法
async get<T = any>(url: string, config?: RequestConfig): Promise<T>

// ❌ 不好的做法
async get(url: string, config?: any): Promise<any>
```

### 2. 错误处理

统一的错误分类和处理:

```typescript
try {
  await api.get('/users')
} catch (error) {
  if (error instanceof NetworkError) {
    // 结构化错误信息
    console.log(error.category)
    console.log(error.getUserMessage())
  }
}
```

### 3. 可配置性

提供合理的默认值,支持灵活配置:

```typescript
const client = new RestClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,     // 默认值
  retries: 3,         // 默认值
  // 可选配置...
})
```

### 4. 事件驱动

使用事件系统解耦组件:

```typescript
ws.on('connected', () => {})
auth.on('authStateChanged', (state) => {})
```

### 5. 资源导向

提供资源 API 模式简化 CRUD 操作:

```typescript
const userAPI = client.resource<User>('/users')
await userAPI.list()
await userAPI.get(id)
await userAPI.create(data)
```

## 性能优化

### 1. 请求去重

避免重复的并发请求:

```typescript
private pendingRequests = new Map<string, Promise<any>>()

async request(key: string, fn: () => Promise<any>) {
  if (this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key)
  }

  const promise = fn().finally(() => {
    this.pendingRequests.delete(key)
  })

  this.pendingRequests.set(key, promise)
  return promise
}
```

### 2. 缓存策略

使用多级缓存减少网络请求:

```typescript
// L1: 内存缓存 (最快)
// L2: localStorage (持久化)
// L3: API请求 (最慢)
```

### 3. 批量操作

合并多个请求减少往返:

```typescript
await api.batch([
  { method: 'POST', url: '/users', data: user1 },
  { method: 'POST', url: '/users', data: user2 }
])
```

### 4. 自动重试

网络错误自动重试(指数退避):

```typescript
private calculateRetryDelay(retryCount: number): number {
  const baseDelay = this.config.retryDelay || 1000
  return Math.min(baseDelay * Math.pow(2, retryCount - 1), 10000)
}
```

## 测试策略

### 单元测试

测试独立的类和方法:

```typescript
describe('RestClient', () => {
  it('should make GET request', async () => {
    const client = new RestClient({ baseURL: 'https://api.test.com' })
    // 测试逻辑...
  })
})
```

### 集成测试

测试组件间的协作:

```typescript
describe('API Integration', () => {
  it('should handle auth flow', async () => {
    const auth = new AuthManager()
    const client = new RestClient({ /* ... */ })
    // 测试完整流程...
  })
})
```

### Mock测试

使用 Mock 避免真实网络请求:

```typescript
vi.mock('axios')
```

## 发布流程

1. **版本更新**:
   ```bash
   # 更新版本号
   npm version patch/minor/major
   ```

2. **构建**:
   ```bash
   pnpm build
   ```

3. **测试**:
   ```bash
   pnpm test
   pnpm typecheck
   ```

4. **发布**:
   ```bash
   pnpm publish
   ```

## 贡献指南

### 代码规范

1. 使用 TypeScript
2. 遵循 ESLint 规则
3. 添加 JSDoc 注释
4. 编写单元测试
5. 更新文档

### 提交规范

使用约定式提交:

```
feat: 添加新功能
fix: 修复Bug
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### Pull Request

1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 通过测试
5. 创建 PR

## 常见问题

### Q: 如何调试网络请求?

A: 使用浏览器开发者工具的 Network 标签,或启用 debug 模式:

```typescript
const ws = new WebSocketClient({ debug: true })
```

### Q: 如何处理大文件上传?

A: 使用 `multipart/form-data` 和进度回调:

```typescript
const formData = new FormData()
formData.append('file', file)

await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (event) => {
    const percent = (event.loaded / event.total) * 100
    console.log(`上传进度: ${percent}%`)
  }
})
```

### Q: 如何实现请求取消?

A: 使用 Axios 的 CancelToken:

```typescript
const controller = new AbortController()

api.get('/users', {
  signal: controller.signal
})

// 取消请求
controller.abort()
```

## 更新日志

### v1.0.0 (2025-10-01)

- ✅ 实现 REST 客户端
- ✅ 实现 WebSocket 客户端
- ✅ 实现认证管理器
- ✅ 实现缓存管理器
- ✅ 完善错误处理体系
- ✅ 编写完整文档

## 参考资源

- [Axios 文档](https://axios-http.com/)
- [Socket.IO 文档](https://socket.io/docs/)
- [tsup 文档](https://tsup.egoist.dev/)
- [构建规范](../../../docs/development/BUILD_STANDARDS.md)
- [前端架构规范](../../../docs/development/FRONTEND_ARCHITECTURE.md)

---

**维护者**: SKER Team
**最后更新**: 2025-10-01
**版本**: v1.0.0
