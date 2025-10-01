/**
 * @sker/api 基础使用示例
 */

import {
  createRestClient,
  createWebSocketClient,
  createAuthManager,
  createCacheManager,
  NetworkError,
  type User,
  type Project
} from '@sker/api'

// ==================== 1. REST客户端基础用法 ====================

async function restClientExample() {
  console.log('========== REST客户端示例 ==========')

  // 创建客户端
  const api = createRestClient({
    baseURL: 'https://api.example.com',
    timeout: 10000,
    retries: 3,
    auth: {
      type: 'bearer',
      token: 'your-jwt-token'
    }
  })

  try {
    // GET请求
    const users = await api.get<User[]>('/users')
    console.log('用户列表:', users.length, '个用户')

    // POST请求
    const newUser = await api.post<User>('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('创建用户成功:', newUser)

    // PUT请求
    const updatedUser = await api.put<User>('/users/123', {
      name: 'Jane Doe'
    })
    console.log('更新用户成功:', updatedUser)

    // 资源API
    const projectAPI = api.resource<Project>('/projects')
    const projects = await projectAPI.list({
      page: 1,
      pageSize: 10
    })
    console.log('项目列表:', projects)

    // 批量操作
    const batchResult = await api.batch([
      { method: 'POST', url: '/users', data: { name: 'User 1' } },
      { method: 'POST', url: '/users', data: { name: 'User 2' } },
      { method: 'DELETE', url: '/users/456' }
    ])
    console.log('批量操作结果:', batchResult)

    // 获取统计
    const stats = api.getStats()
    console.log('请求统计:', stats)
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('网络错误:', error.getUserMessage())
      console.error('错误分类:', error.category)
      console.error('是否可重试:', error.retryable)
    }
  }
}

// ==================== 2. WebSocket客户端用法 ====================

async function websocketExample() {
  console.log('========== WebSocket客户端示例 ==========')

  // 创建WebSocket客户端
  const ws = createWebSocketClient({
    url: 'wss://api.example.com/ws',
    auth: {
      token: 'your-jwt-token'
    },
    reconnect: {
      enabled: true,
      maxAttempts: 5
    },
    heartbeat: {
      enabled: true,
      interval: 30000
    },
    debug: true
  })

  // 连接事件
  ws.on('connected', () => {
    console.log('✅ WebSocket已连接')
  })

  ws.on('disconnected', (event) => {
    console.log('❌ WebSocket断开:', event.message)
  })

  // 自定义事件
  ws.on('message:received', (data) => {
    console.log('收到消息:', data)
  })

  ws.on('user:joined', (data) => {
    console.log('用户加入:', data)
  })

  try {
    // 连接
    await ws.connect()

    // 加入房间
    await ws.joinRoom('project-123', {
      userId: 'user-456'
    })

    // 发送消息
    await ws.send('chat:message', {
      content: 'Hello!',
      userId: 'user-456'
    })

    // 广播消息
    await ws.broadcast('project-123', 'cursor:move', {
      userId: 'user-456',
      position: { x: 100, y: 200 }
    })

    // 获取房间列表
    const rooms = ws.getRooms()
    console.log('当前房间:', rooms)

    // 延迟后断开
    setTimeout(async () => {
      await ws.close()
      console.log('WebSocket已关闭')
    }, 60000)
  } catch (error) {
    console.error('WebSocket错误:', error)
  }
}

// ==================== 3. 认证管理示例 ====================

async function authExample() {
  console.log('========== 认证管理示例 ==========')

  // 创建认证管理器
  const auth = createAuthManager({
    tokenStorage: 'localStorage',
    refreshThreshold: 300, // 5分钟前刷新
    autoRefresh: true,
    onTokenExpired: () => {
      console.log('Token过期,需要重新登录')
    }
  })

  // 监听认证状态
  auth.on('authStateChanged', (isAuthenticated) => {
    console.log('认证状态变化:', isAuthenticated)
  })

  // 设置认证凭据
  await auth.setCredentials({
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3600000)
  })

  // 获取Token
  const token = auth.getAccessToken()
  console.log('当前Token:', token?.substring(0, 20) + '...')

  // 检查有效性
  if (auth.isTokenValid()) {
    console.log('Token有效')
  }

  // 登出
  // await auth.logout()
}

// ==================== 4. 缓存管理示例 ====================

async function cacheExample() {
  console.log('========== 缓存管理示例 ==========')

  // 创建缓存管理器
  const cache = createCacheManager({
    strategy: 'lru',
    maxSize: 100,
    defaultTTL: 300000 // 5分钟
  })

  // 设置缓存
  await cache.set('user:123', {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com'
  }, {
    ttl: 600000, // 10分钟
    tags: ['users', 'profile']
  })

  // 获取缓存
  const cached = await cache.get('user:123')
  if (cached && !cache.isExpired(cached)) {
    console.log('缓存数据:', cached.data)
  }

  // 缓存统计
  const stats = cache.getStats()
  console.log('缓存统计:')
  console.log('  命中率:', (stats.hitRate * 100).toFixed(2) + '%')
  console.log('  条目数:', stats.entries)
  console.log('  缓存大小:', stats.size, 'bytes')

  // 根据标签删除
  const deletedCount = await cache.deleteByTags(['users'])
  console.log('删除缓存:', deletedCount, '条')
}

// ==================== 5. 完整应用示例 ====================

async function fullExample() {
  console.log('========== 完整应用示例 ==========')

  // 初始化所有组件
  const auth = createAuthManager()
  const cache = createCacheManager()

  const api = createRestClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'bearer',
      token: auth.getAccessToken() || undefined
    }
  })

  const ws = createWebSocketClient({
    url: 'wss://api.example.com/ws'
  })

  // 登录
  async function login(email: string, password: string) {
    try {
      const result = await api.post('/auth/login', { email, password })

      await auth.setCredentials({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: new Date(result.expiresAt)
      })

      api.setAuthToken(result.accessToken)
      await ws.connect()

      console.log('✅ 登录成功')
      return result.user
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error('❌ 登录失败:', error.getUserMessage())
      }
      throw error
    }
  }

  // 获取用户(带缓存)
  async function getUser(userId: string) {
    const cacheKey = `user:${userId}`

    // 检查缓存
    const cached = await cache.get(cacheKey)
    if (cached && !cache.isExpired(cached)) {
      console.log('使用缓存数据')
      return cached.data
    }

    // 从API获取
    console.log('从API获取数据')
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
    await ws.joinRoom(projectId)

    ws.on('node:created', (data) => {
      console.log('新节点创建:', data.node)
      // 使缓存失效
      cache.deleteByTags(['project', projectId])
    })

    ws.on('node:updated', (data) => {
      console.log('节点更新:', data.node)
    })

    console.log('✅ 已加入项目:', projectId)
  }

  // 使用示例
  try {
    // await login('user@example.com', 'password123')
    // const user = await getUser('user-123')
    // await joinProject('project-456')
    console.log('应用初始化完成')
  } catch (error) {
    console.error('错误:', error)
  }
}

// ==================== 运行示例 ====================

async function runExamples() {
  console.log('🚀 @sker/api 使用示例\n')

  // 注意: 这些示例需要实际的API服务器才能运行
  // 在实际使用时,请替换为真实的API地址和凭据

  try {
    // await restClientExample()
    // await websocketExample()
    // await authExample()
    // await cacheExample()
    await fullExample()
  } catch (error) {
    console.error('示例运行错误:', error)
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples()
}

export {
  restClientExample,
  websocketExample,
  authExample,
  cacheExample,
  fullExample
}
