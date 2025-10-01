# @sker/api 快速参考

## 安装

```bash
pnpm add @sker/api
```

## 快速开始

```typescript
import { createRestClient, createWebSocketClient } from '@sker/api'

// REST客户端
const api = createRestClient({
  baseURL: 'https://api.example.com',
  auth: { type: 'bearer', token: 'your-token' }
})

// WebSocket客户端
const ws = createWebSocketClient({
  url: 'wss://api.example.com/ws'
})
```

---

## REST客户端

### 基础请求

```typescript
// GET
const users = await api.get('/users')
const user = await api.get('/users/123')

// POST
const newUser = await api.post('/users', { name: 'John' })

// PUT
const updated = await api.put('/users/123', { name: 'Jane' })

// DELETE
await api.delete('/users/123')

// PATCH
const patched = await api.patch('/users/123', { email: 'new@email.com' })
```

### 资源API

```typescript
const userAPI = api.resource<User>('/users')

await userAPI.list({ page: 1, pageSize: 20 })
await userAPI.get('user-id')
await userAPI.create({ name: 'John' })
await userAPI.update('user-id', { name: 'Jane' })
await userAPI.delete('user-id')
```

### 批量操作

```typescript
await api.batch([
  { method: 'POST', url: '/users', data: { name: 'User 1' } },
  { method: 'PUT', url: '/users/123', data: { name: 'Updated' } },
  { method: 'DELETE', url: '/users/456' }
])
```

### Token管理

```typescript
api.setAuthToken('new-token')
api.clearAuthToken()
await api.healthCheck() // 返回 boolean
```

---

## WebSocket客户端

### 连接管理

```typescript
await ws.connect()
ws.connected // boolean
await ws.close()
```

### 事件监听

```typescript
ws.on('connected', () => {})
ws.on('disconnected', (event) => {})
ws.on('custom:event', (data) => {})
ws.once('ready', () => {}) // 一次性监听
ws.off('event', handler)    // 移除监听
```

### 消息发送

```typescript
await ws.send('event', { data: 'value' })
```

### 房间管理

```typescript
await ws.joinRoom('room-id', { userId: 'user-123' })
await ws.broadcast('room-id', 'event', { data: 'value' })
await ws.leaveRoom('room-id')
ws.getRooms() // 返回 string[]
```

---

## 认证管理

```typescript
import { createAuthManager } from '@sker/api'

const auth = createAuthManager({
  tokenStorage: 'localStorage',
  autoRefresh: true
})

// 设置凭据
await auth.setCredentials({
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresAt: new Date(...)
})

// 获取Token
auth.getAccessToken()      // string | null
auth.getRefreshToken()     // string | null
auth.isTokenValid()        // boolean

// 登出
await auth.logout()
```

---

## 缓存管理

```typescript
import { createCacheManager } from '@sker/api'

const cache = createCacheManager({
  strategy: 'lru',
  maxSize: 100
})

// 设置缓存
await cache.set('key', data, {
  ttl: 300000,
  tags: ['users']
})

// 获取缓存
const item = await cache.get('key')
if (item && !cache.isExpired(item)) {
  console.log(item.data)
}

// 删除缓存
await cache.delete('key')
await cache.deleteByTags(['users'])
await cache.clear()

// 统计信息
cache.getStats()
```

---

## 错误处理

```typescript
import { NetworkError, AuthError } from '@sker/api'

try {
  await api.get('/users')
} catch (error) {
  if (error instanceof NetworkError) {
    console.log(error.category)      // 错误分类
    console.log(error.statusCode)    // HTTP状态码
    console.log(error.retryable)     // 是否可重试
    console.log(error.getUserMessage()) // 用户友好消息
  }
}
```

### 错误分类

- `auth` - 认证错误 (401)
- `permission` - 权限错误 (403)
- `network` - 网络错误
- `server` - 服务器错误 (5xx)
- `client` - 客户端错误 (4xx)
- `validation` - 验证错误
- `timeout` - 超时错误
- `unknown` - 未知错误

---

## 配置选项

### RestClientConfig

```typescript
{
  baseURL: string           // API基础地址
  timeout?: number          // 超时时间(ms), 默认30000
  retries?: number          // 重试次数, 默认3
  retryDelay?: number       // 重试延迟(ms), 默认1000
  auth?: {
    type: 'bearer' | 'basic' | 'custom'
    token?: string
    username?: string
    password?: string
    onTokenExpired?: () => void
  }
  cache?: {
    enabled: boolean
    ttl?: number
    policy?: 'cache-first' | 'network-first'
  }
  headers?: Record<string, string>
}
```

### WebSocketConfig

```typescript
{
  url: string               // WebSocket地址
  auth?: {
    token?: string
  }
  reconnect?: {
    enabled: boolean        // 启用自动重连
    maxAttempts?: number    // 最大重连次数, 默认5
    backoff?: 'linear' | 'exponential' // 退避策略
  }
  heartbeat?: {
    enabled: boolean        // 启用心跳
    interval?: number       // 心跳间隔(ms), 默认30000
  }
  debug?: boolean           // 调试模式
}
```

---

## 类型定义

```typescript
// 导入类型
import type {
  APIResponse,
  APIError,
  QueryParams,
  ResourceAPI,
  WSEvent,
  NetworkErrorInfo,
  RequestStats,
  CacheStats
} from '@sker/api'
```

---

## 实用工具

### 默认客户端实例

```typescript
import {
  initDefaultRestClient,
  getDefaultRestClient,
  initDefaultWSClient,
  getDefaultWSClient
} from '@sker/api'

// 初始化
initDefaultRestClient({ baseURL: 'https://api.example.com' })
initDefaultWSClient({ url: 'wss://api.example.com/ws' })

// 在其他模块使用
const api = getDefaultRestClient()
const ws = getDefaultWSClient()
```

### 请求配置

```typescript
// 单个请求自定义配置
await api.get('/users', {
  timeout: 5000,
  cache: false,
  retry: false,
  skipAuth: true,
  headers: { 'X-Custom': 'value' }
})
```

---

## 常用模式

### Service层封装

```typescript
class UserService {
  private api = client.resource<User>('/users')

  getUsers() { return this.api.list() }
  getUser(id: string) { return this.api.get(id) }
  createUser(data: Partial<User>) { return this.api.create(data) }
}

export const userService = new UserService()
```

### 带缓存的请求

```typescript
async function getUserWithCache(id: string) {
  const key = `user:${id}`
  const cached = await cache.get(key)

  if (cached && !cache.isExpired(cached)) {
    return cached.data
  }

  const user = await api.get(`/users/${id}`)
  await cache.set(key, user, { ttl: 300000 })

  return user
}
```

### 实时协作

```typescript
// 加入房间
await ws.joinRoom('project-123')

// 监听事件
ws.on('node:updated', (data) => {
  updateLocalState(data.node)
})

// 发送更新
await ws.broadcast('project-123', 'node:update', {
  nodeId: 'node-456',
  changes: { title: 'New Title' }
})
```

---

## 性能优化

1. **请求去重**: 避免重复请求
2. **缓存策略**: 使用LRU/FIFO/TTL策略
3. **批量操作**: 合并多个请求
4. **资源API**: 使用标准化的资源接口
5. **自动重试**: 网络错误自动重试

---

## 调试技巧

```typescript
// 启用WebSocket调试
const ws = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  debug: true
})

// 查看请求统计
const stats = api.getStats()
console.log(stats)

// 查看缓存统计
const cacheStats = cache.getStats()
console.log(cacheStats)

// 获取axios实例(高级用法)
const axiosInstance = api.getAxiosInstance()
```

---

## 更多资源

- [完整文档](./USAGE.md)
- [README](../README.md)
- [使用示例](../examples/basic-usage.ts)

---

**版本**: v1.0.0
**更新日期**: 2025-10-01
