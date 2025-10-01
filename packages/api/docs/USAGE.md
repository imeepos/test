# @sker/api 使用说明文档

## 目录

- [快速开始](#快速开始)
- [REST客户端](#rest客户端)
- [WebSocket客户端](#websocket客户端)
- [认证管理](#认证管理)
- [缓存管理](#缓存管理)
- [错误处理](#错误处理)
- [高级用法](#高级用法)
- [最佳实践](#最佳实践)

---

## 快速开始

### 安装

```bash
pnpm add @sker/api
```

### 基础示例

```typescript
import { createRestClient, createWebSocketClient } from '@sker/api'

// 创建REST客户端
const api = createRestClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  auth: {
    type: 'bearer',
    token: 'your-jwt-token'
  }
})

// 创建WebSocket客户端
const ws = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  auth: {
    token: 'your-jwt-token'
  }
})
```

---

## REST客户端

### 初始化配置

```typescript
import { RestClient } from '@sker/api'

const client = new RestClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,              // 请求超时时间(ms)
  retries: 3,                  // 重试次数
  retryDelay: 1000,            // 重试延迟(ms)
  auth: {
    type: 'bearer',
    token: 'your-token',
    onTokenExpired: () => {
      // Token过期时的回调
      console.log('Token已过期,请重新登录')
    }
  },
  cache: {
    enabled: true,
    ttl: 300000                // 缓存有效期5分钟
  },
  headers: {
    'X-Custom-Header': 'value'
  }
})
```

### 基础HTTP请求

```typescript
// GET请求
const users = await client.get('/users')
const user = await client.get('/users/123')

// POST请求
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT请求
const updatedUser = await client.put('/users/123', {
  name: 'Jane Doe'
})

// DELETE请求
await client.delete('/users/123')

// PATCH请求
const patchedUser = await client.patch('/users/123', {
  email: 'newemail@example.com'
})
```

### 查询参数

```typescript
// 使用查询参数
const users = await client.get('/users', {
  params: {
    page: 1,
    pageSize: 20,
    sort: 'name',
    order: 'asc'
  }
})
```

### 资源API模式

```typescript
// 创建资源API代理
const userAPI = client.resource<User>('/users')

// 列表查询
const users = await userAPI.list({
  page: 1,
  pageSize: 20,
  filter: { status: 'active' },
  sort: { field: 'created_at', order: 'desc' }
})

// 获取单个资源
const user = await userAPI.get('user-id-123')

// 创建资源
const newUser = await userAPI.create({
  name: 'John Doe',
  email: 'john@example.com'
})

// 更新资源
const updatedUser = await userAPI.update('user-id-123', {
  name: 'Jane Doe'
})

// 删除资源
await userAPI.delete('user-id-123')
```

### 批量操作

```typescript
// 批量请求
const batchResult = await client.batch([
  { method: 'POST', url: '/users', data: { name: 'User 1' } },
  { method: 'POST', url: '/users', data: { name: 'User 2' } },
  { method: 'PUT', url: '/users/123', data: { name: 'Updated' } },
  { method: 'DELETE', url: '/users/456' }
])

console.log('成功:', batchResult.success)
console.log('结果:', batchResult.results)
console.log('错误:', batchResult.errors)
```

### 请求配置

```typescript
// 自定义单个请求的配置
const data = await client.get('/users', {
  timeout: 5000,           // 自定义超时
  cache: false,            // 禁用缓存
  retry: false,            // 禁用重试
  skipAuth: true,          // 跳过认证
  headers: {
    'X-Custom': 'value'
  }
})
```

### 认证Token管理

```typescript
// 设置Token
client.setAuthToken('new-jwt-token')

// 清除Token
client.clearAuthToken()

// 健康检查
const isHealthy = await client.healthCheck()
console.log('服务状态:', isHealthy ? '正常' : '异常')
```

### 请求统计

```typescript
// 获取请求统计信息
const stats = client.getStats()
console.log('总请求数:', stats.total)
console.log('成功数:', stats.success)
console.log('失败数:', stats.failed)
console.log('平均响应时间:', stats.avgResponseTime, 'ms')

// 重置统计
client.resetStats()
```

---

## WebSocket客户端

### 连接管理

```typescript
import { WebSocketClient } from '@sker/api'

const ws = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  auth: {
    token: 'your-jwt-token'
  },
  reconnect: {
    enabled: true,           // 启用自动重连
    maxAttempts: 5,          // 最大重连次数
    backoff: 'exponential'   // 指数退避策略
  },
  heartbeat: {
    enabled: true,           // 启用心跳
    interval: 30000          // 心跳间隔30秒
  },
  debug: true                // 启用调试日志
})

// 连接WebSocket
await ws.connect()

// 检查连接状态
if (ws.connected) {
  console.log('WebSocket已连接')
}

// 关闭连接
await ws.close()
```

### 事件监听

```typescript
// 监听连接事件
ws.on('connected', () => {
  console.log('✅ 已连接')
})

ws.on('disconnected', (event) => {
  console.log('❌ 连接断开:', event.message)
})

ws.on('error', (event) => {
  console.error('WebSocket错误:', event)
})

// 监听自定义事件
ws.on('message:received', (data) => {
  console.log('收到消息:', data)
})

ws.on('user:joined', (data) => {
  console.log('用户加入:', data.username)
})

// 一次性监听
ws.once('ready', () => {
  console.log('首次就绪')
})

// 移除监听
const handler = (data) => console.log(data)
ws.on('event', handler)
ws.off('event', handler)

// 移除所有监听
ws.off('event')
```

### 发送消息

```typescript
// 发送消息
await ws.send('chat:message', {
  content: 'Hello, World!',
  userId: 'user-123',
  timestamp: Date.now()
})

// 带确认的消息发送
try {
  await ws.send('important:event', { data: 'value' })
  console.log('消息发送成功')
} catch (error) {
  console.error('消息发送失败:', error)
}
```

### 房间管理

```typescript
// 加入房间
await ws.joinRoom('project-123', {
  userId: 'user-456',
  permissions: ['read', 'write']
})

// 广播消息到房间
await ws.broadcast('project-123', 'cursor:move', {
  userId: 'user-456',
  position: { x: 100, y: 200 }
})

// 离开房间
await ws.leaveRoom('project-123')

// 获取当前加入的房间
const rooms = ws.getRooms()
console.log('已加入的房间:', rooms)
```

### 完整示例

```typescript
// 初始化WebSocket客户端
const ws = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  auth: { token: 'jwt-token' }
})

// 连接事件
ws.on('connected', async () => {
  console.log('WebSocket连接成功')

  // 加入项目房间
  await ws.joinRoom('project-123')
})

// 监听项目事件
ws.on('node:created', (data) => {
  console.log('新节点创建:', data.node)
  // 更新本地状态
  updateLocalNode(data.node)
})

ws.on('node:updated', (data) => {
  console.log('节点更新:', data.node)
  updateLocalNode(data.node)
})

ws.on('user:cursor:move', (data) => {
  console.log('用户光标移动:', data)
  updateUserCursor(data.userId, data.position)
})

// 连接
await ws.connect()

// 发送操作
await ws.broadcast('project-123', 'node:create', {
  title: '新节点',
  content: '节点内容',
  userId: 'user-456'
})
```

---

## 认证管理

### 基础用法

```typescript
import { AuthManager } from '@sker/api'

const auth = new AuthManager({
  tokenStorage: 'localStorage',  // 存储方式
  refreshThreshold: 300,         // Token过期前5分钟刷新
  autoRefresh: true,             // 自动刷新
  onTokenExpired: () => {
    // Token过期回调
    window.location.href = '/login'
  },
  onTokenRefreshed: (tokens) => {
    // Token刷新回调
    console.log('Token已刷新')
  }
})
```

### 设置认证凭据

```typescript
// 登录后设置凭据
await auth.setCredentials({
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refreshToken: 'refresh-token-here',
  expiresAt: new Date(Date.now() + 3600000), // 1小时后过期
  tokenType: 'Bearer'
})
```

### 获取Token

```typescript
// 获取访问Token
const accessToken = auth.getAccessToken()
if (accessToken) {
  // 使用Token
  console.log('当前Token:', accessToken)
}

// 获取刷新Token
const refreshToken = auth.getRefreshToken()
```

### Token验证

```typescript
// 检查Token是否有效
if (auth.isTokenValid()) {
  console.log('Token有效')
} else {
  console.log('Token无效或已过期')
}
```

### 登出

```typescript
// 清除认证信息
await auth.logout()
```

### 事件监听

```typescript
// 监听认证状态变化
auth.on('authStateChanged', (isAuthenticated) => {
  console.log('认证状态:', isAuthenticated ? '已认证' : '未认证')
})

// 监听Token刷新
auth.on('tokenRefreshed', (tokens) => {
  console.log('Token已刷新:', tokens)
})
```

### 与REST客户端集成

```typescript
import { RestClient, AuthManager } from '@sker/api'

const auth = new AuthManager()
const client = new RestClient({
  baseURL: 'https://api.example.com'
})

// 登录
const loginResult = await client.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
})

// 设置认证凭据
await auth.setCredentials({
  accessToken: loginResult.accessToken,
  refreshToken: loginResult.refreshToken,
  expiresAt: new Date(loginResult.expiresAt)
})

// 设置客户端Token
client.setAuthToken(auth.getAccessToken()!)

// 后续请求自动带Token
const userData = await client.get('/users/me')
```

---

## 缓存管理

### 基础配置

```typescript
import { CacheManager } from '@sker/api'

const cache = new CacheManager({
  strategy: 'lru',           // 缓存策略: lru/fifo/ttl
  maxSize: 100,              // 最大缓存条目数
  defaultTTL: 300000,        // 默认5分钟过期
  storage: 'memory',         // 存储方式: memory/localStorage/indexedDB
  compression: false         // 是否压缩
})
```

### 缓存操作

```typescript
// 设置缓存
await cache.set('user:123', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
}, {
  ttl: 600000,              // 自定义TTL: 10分钟
  tags: ['users', 'profile'],
  metadata: { source: 'api' }
})

// 获取缓存
const cached = await cache.get('user:123')
if (cached && !cache.isExpired(cached)) {
  console.log('使用缓存数据:', cached.data)
  console.log('缓存时间:', new Date(cached.timestamp))
} else {
  console.log('缓存已过期或不存在')
}

// 删除缓存
await cache.delete('user:123')

// 根据标签删除
const deletedCount = await cache.deleteByTags(['users', 'profile'])
console.log('删除了', deletedCount, '个缓存项')

// 清空所有缓存
await cache.clear()
```

### 缓存检查

```typescript
// 检查缓存是否过期
const item = await cache.get('key')
if (item) {
  const isExpired = cache.isExpired(item)
  console.log('是否过期:', isExpired)
}
```

### 缓存统计

```typescript
// 获取缓存统计
const stats = cache.getStats()
console.log('命中次数:', stats.hits)
console.log('未命中次数:', stats.misses)
console.log('命中率:', (stats.hitRate * 100).toFixed(2) + '%')
console.log('缓存条目数:', stats.entries)
console.log('缓存大小:', stats.size, 'bytes')
```

### 缓存策略

```typescript
// LRU策略 - 淘汰最少使用的
const lruCache = new CacheManager({
  strategy: 'lru',
  maxSize: 50
})

// FIFO策略 - 先进先出
const fifoCache = new CacheManager({
  strategy: 'fifo',
  maxSize: 50
})

// TTL策略 - 淘汰最快过期的
const ttlCache = new CacheManager({
  strategy: 'ttl',
  maxSize: 50
})
```

### 与REST客户端集成

```typescript
import { RestClient, CacheManager } from '@sker/api'

const cache = new CacheManager()
const client = new RestClient({
  baseURL: 'https://api.example.com'
})

// 带缓存的请求
async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`

  // 尝试从缓存获取
  const cached = await cache.get(cacheKey)
  if (cached && !cache.isExpired(cached)) {
    console.log('使用缓存数据')
    return cached.data
  }

  // 从API获取
  console.log('从API获取数据')
  const user = await client.get(`/users/${userId}`)

  // 存入缓存
  await cache.set(cacheKey, user, {
    ttl: 300000,
    tags: ['users']
  })

  return user
}
```

---

## 错误处理

### 错误类型

```typescript
import {
  NetworkError,
  AuthError,
  ValidationError,
  WebSocketError,
  SyncError
} from '@sker/api'
```

### NetworkError

```typescript
try {
  await client.get('/users')
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('错误分类:', error.category)
    console.log('状态码:', error.statusCode)
    console.log('是否可重试:', error.retryable)
    console.log('用户消息:', error.getUserMessage())

    // 根据错误分类处理
    switch (error.category) {
      case 'auth':
        // 跳转登录页
        window.location.href = '/login'
        break

      case 'network':
        // 显示网络错误提示
        showNotification('网络连接异常,请检查网络')
        break

      case 'server':
        // 服务器错误
        showNotification('服务器暂时无法响应')
        break

      case 'validation':
        // 数据验证错误
        showNotification('数据格式错误')
        break
    }
  }
}
```

### AuthError

```typescript
try {
  await auth.refreshToken()
} catch (error) {
  if (error instanceof AuthError) {
    console.error('认证错误:', error.message)
    // 重新登录
    window.location.href = '/login'
  }
}
```

### ValidationError

```typescript
try {
  validateUserInput(data)
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('验证失败:', error.message)
    console.error('字段:', error.field)
    console.error('值:', error.value)
  }
}
```

### WebSocketError

```typescript
try {
  await ws.connect()
} catch (error) {
  if (error instanceof WebSocketError) {
    console.error('WebSocket错误:', error.message)
    console.error('错误码:', error.code)
    console.error('原因:', error.reason)
  }
}
```

### 统一错误处理

```typescript
// 创建错误处理器
function handleError(error: any) {
  if (error instanceof NetworkError) {
    return {
      title: '网络错误',
      message: error.getUserMessage(),
      action: error.retryable ? '重试' : '确定'
    }
  }

  if (error instanceof AuthError) {
    return {
      title: '认证错误',
      message: '请重新登录',
      action: '前往登录'
    }
  }

  if (error instanceof WebSocketError) {
    return {
      title: '连接错误',
      message: 'WebSocket连接失败',
      action: '重新连接'
    }
  }

  return {
    title: '未知错误',
    message: error.message || '发生未知错误',
    action: '确定'
  }
}

// 使用示例
try {
  await client.get('/users')
} catch (error) {
  const errorInfo = handleError(error)
  showDialog(errorInfo.title, errorInfo.message, errorInfo.action)
}
```

---

## 高级用法

### 自定义拦截器

```typescript
import { RestClient } from '@sker/api'

const client = new RestClient({
  baseURL: 'https://api.example.com'
})

// 获取axios实例
const axiosInstance = client.getAxiosInstance()

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 添加自定义逻辑
    config.headers['X-Timestamp'] = Date.now()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    // 处理响应
    console.log('响应时间:', Date.now() - response.config.headers['X-Timestamp'])
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### 默认客户端实例

```typescript
import {
  initDefaultRestClient,
  getDefaultRestClient,
  initDefaultWSClient,
  getDefaultWSClient
} from '@sker/api'

// 初始化默认REST客户端
initDefaultRestClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})

// 在其他模块中使用
const client = getDefaultRestClient()
const users = await client.get('/users')

// 初始化默认WebSocket客户端
initDefaultWSClient({
  url: 'wss://api.example.com/ws'
})

const ws = getDefaultWSClient()
await ws.connect()
```

### 类型安全

```typescript
import { RestClient } from '@sker/api'
import type { User, Project } from '@sker/models'

const client = new RestClient({
  baseURL: 'https://api.example.com'
})

// 使用泛型指定返回类型
const users = await client.get<User[]>('/users')
const user = await client.get<User>('/users/123')

// 资源API自动类型推断
const userAPI = client.resource<User>('/users')
const projects = await userAPI.list() // 类型为 User[]
```

---

## 最佳实践

### 1. 集中配置管理

```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  timeout: 30000,
  retries: 3
}

// 创建客户端实例
import { createRestClient, createWebSocketClient } from '@sker/api'
import { API_CONFIG } from './config/api'

export const apiClient = createRestClient({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  retries: API_CONFIG.retries
})

export const wsClient = createWebSocketClient({
  url: API_CONFIG.wsURL
})
```

### 2. Service层封装

```typescript
// services/userService.ts
import { apiClient } from '@/config/api'
import type { User } from '@/types'

export class UserService {
  private api = apiClient.resource<User>('/users')

  async getUsers(page: number = 1, pageSize: number = 20) {
    return this.api.list({ page, pageSize })
  }

  async getUserById(id: string) {
    return this.api.get(id)
  }

  async createUser(data: Partial<User>) {
    return this.api.create(data)
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.api.update(id, data)
  }

  async deleteUser(id: string) {
    return this.api.delete(id)
  }
}

export const userService = new UserService()
```

### 3. 与状态管理集成

```typescript
// stores/userStore.ts
import { create } from 'zustand'
import { userService } from '@/services/userService'
import type { User } from '@/types'

interface UserStore {
  users: User[]
  isLoading: boolean
  error: string | null

  loadUsers: () => Promise<void>
  createUser: (data: Partial<User>) => Promise<User>
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  loadUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const users = await userService.getUsers()
      set({ users, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newUser = await userService.createUser(data)
      set((state) => ({
        users: [...state.users, newUser],
        isLoading: false
      }))
      return newUser
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  }
}))
```

### 4. React Hook封装

```typescript
// hooks/useAPI.ts
import { useState, useEffect } from 'react'
import { NetworkError } from '@sker/api'

export function useAPI<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetcher()
        if (!cancelled) {
          setData(result)
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err instanceof NetworkError) {
            setError(err.getUserMessage())
          } else {
            setError(err.message || '请求失败')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetch()

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error }
}

// 使用示例
function UserList() {
  const { data: users, loading, error } = useAPI(
    () => userService.getUsers(),
    []
  )

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### 5. 错误边界

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import { NetworkError, AuthError } from '@sker/api'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('错误边界捕获:', error)

    if (error instanceof NetworkError) {
      // 处理网络错误
      if (error.category === 'auth') {
        window.location.href = '/login'
      }
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-container">
          <h2>出错了</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 6. 性能优化

```typescript
// 使用缓存减少请求
import { CacheManager } from '@sker/api'

const cache = new CacheManager({
  strategy: 'lru',
  maxSize: 100
})

async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`

  // 检查缓存
  const cached = await cache.get(cacheKey)
  if (cached && !cache.isExpired(cached)) {
    return cached.data
  }

  // 获取数据
  const user = await userService.getUserById(userId)

  // 存入缓存
  await cache.set(cacheKey, user, {
    ttl: 300000, // 5分钟
    tags: ['users']
  })

  return user
}

// 请求去重
const pendingRequests = new Map<string, Promise<any>>()

async function getUserDedupe(userId: string) {
  const key = `user:${userId}`

  // 如果已有相同请求,直接返回
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  // 创建新请求
  const promise = userService.getUserById(userId)
    .finally(() => {
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise
}
```

---

## 完整应用示例

```typescript
// app.ts
import {
  createRestClient,
  createWebSocketClient,
  createAuthManager,
  createCacheManager,
  NetworkError
} from '@sker/api'

// 初始化客户端
const auth = createAuthManager({
  tokenStorage: 'localStorage',
  autoRefresh: true
})

const cache = createCacheManager({
  strategy: 'lru',
  maxSize: 100
})

const api = createRestClient({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  retries: 3,
  auth: {
    type: 'bearer',
    token: auth.getAccessToken() || undefined,
    onTokenExpired: () => {
      window.location.href = '/login'
    }
  }
})

const ws = createWebSocketClient({
  url: import.meta.env.VITE_WS_URL,
  auth: {
    token: auth.getAccessToken() || undefined
  }
})

// 登录流程
async function login(email: string, password: string) {
  try {
    const result = await api.post('/auth/login', { email, password })

    // 设置认证信息
    await auth.setCredentials({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: new Date(result.expiresAt)
    })

    // 更新API客户端Token
    api.setAuthToken(result.accessToken)

    // 连接WebSocket
    await ws.connect()

    return result.user
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new Error(error.getUserMessage())
    }
    throw error
  }
}

// 获取用户数据(带缓存)
async function getUser(userId: string) {
  const cacheKey = `user:${userId}`

  // 检查缓存
  const cached = await cache.get(cacheKey)
  if (cached && !cache.isExpired(cached)) {
    return cached.data
  }

  // 从API获取
  const user = await api.get(`/users/${userId}`)

  // 存入缓存
  await cache.set(cacheKey, user, {
    ttl: 300000,
    tags: ['users']
  })

  return user
}

// 实时协作
async function joinProject(projectId: string) {
  // 加入项目房间
  await ws.joinRoom(projectId)

  // 监听实时事件
  ws.on('node:created', (data) => {
    console.log('新节点:', data.node)
    // 使缓存失效
    cache.deleteByTags(['project', projectId])
  })

  ws.on('node:updated', (data) => {
    console.log('节点更新:', data.node)
    cache.delete(`node:${data.node.id}`)
  })
}

export { auth, cache, api, ws, login, getUser, joinProject }
```

---

## 总结

`@sker/api` 提供了完整的网络通信解决方案:

- ✅ **REST客户端**: 简单易用的HTTP请求,支持重试、缓存、批量操作
- ✅ **WebSocket客户端**: 可靠的实时通信,自动重连、房间管理
- ✅ **认证管理**: Token自动刷新、存储管理
- ✅ **缓存管理**: 多种缓存策略,提升性能
- ✅ **错误处理**: 完善的错误分类和处理机制
- ✅ **类型安全**: 完整的TypeScript类型支持

更多信息请参考 [README.md](../README.md)。
