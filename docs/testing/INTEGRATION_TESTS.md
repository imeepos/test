# SKER 系统集成测试方案

## 一、集成测试概述

集成测试确保各个模块间的协作正常,数据流正确,以及端到端功能完整。

### 测试范围

```yaml
关键集成流程:
  1. AI 任务端到端流程
  2. 用户认证与授权流程
  3. WebSocket 实时通信
  4. 数据库迁移和数据完整性
  5. 消息队列可靠性
```

## 二、AI 任务端到端集成测试

### 2.1 测试场景：单节点内容生成

**测试路径**: Studio → Gateway → Broker → Engine → Store

```typescript
// tests/integration/ai-task-flow.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

describe('AI Task End-to-End Flow', () => {
  let socket: Socket
  let authToken: string
  let userId: string
  let projectId: string

  beforeAll(async () => {
    // 1. 用户注册和登录
    const registerResponse = await axios.post('http://gateway:8000/api/auth/register', {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!@#',
    })

    const loginResponse = await axios.post('http://gateway:8000/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!@#',
    })

    authToken = loginResponse.data.token
    userId = loginResponse.data.user.id

    // 2. 创建项目
    const projectResponse = await axios.post(
      'http://gateway:8000/api/projects',
      {
        name: 'Integration Test Project',
        description: 'Project for integration testing',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    )

    projectId = projectResponse.data.id

    // 3. 建立 WebSocket 连接
    socket = io('http://gateway:8000', {
      auth: { token: authToken },
      transports: ['websocket'],
    })

    await new Promise<void>((resolve) => {
      socket.on('connect', () => resolve())
    })
  })

  afterAll(async () => {
    socket?.disconnect()

    // 清理测试数据
    if (projectId && authToken) {
      await axios.delete(`http://gateway:8000/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    }
  })

  it('应该完成单节点内容生成的完整流程', async () => {
    const nodeId = uuidv4()

    // 监听 AI 任务状态更新
    const statusUpdates: any[] = []
    socket.on('ai:task:status', (data) => {
      statusUpdates.push(data)
    })

    // 监听节点创建事件
    const nodeCreated = new Promise<any>((resolve) => {
      socket.on('node:created', resolve)
    })

    // 1. 发起 AI 内容生成请求
    const generateResponse = await axios.post(
      'http://gateway:8000/api/ai/generate',
      {
        projectId,
        nodeId,
        inputs: ['创建一个电商平台'],
        instruction: '生成产品需求分析',
        position: { x: 100, y: 100 },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    )

    expect(generateResponse.status).toBe(200)
    expect(generateResponse.data.taskId).toBeDefined()

    const taskId = generateResponse.data.taskId

    // 2. 等待任务完成 (最多30秒)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('AI task timeout'))
      }, 30000)

      socket.on('ai:task:completed', (data) => {
        if (data.taskId === taskId) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    // 3. 验证节点已创建
    const node = await nodeCreated
    expect(node.id).toBe(nodeId)
    expect(node.content).toBeDefined()
    expect(node.content.length).toBeGreaterThan(50)
    expect(node.ai_generated).toBe(true)

    // 4. 验证任务状态流转
    expect(statusUpdates).toContainEqual(
      expect.objectContaining({ taskId, status: 'queued' })
    )
    expect(statusUpdates).toContainEqual(
      expect.objectContaining({ taskId, status: 'processing' })
    )
    expect(statusUpdates).toContainEqual(
      expect.objectContaining({ taskId, status: 'completed' })
    )

    // 5. 从 Store 验证数据持久化
    const nodeResponse = await axios.get(
      `http://gateway:8000/api/nodes/${nodeId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    )

    expect(nodeResponse.data.id).toBe(nodeId)
    expect(nodeResponse.data.project_id).toBe(projectId)
    expect(nodeResponse.data.status).toBe('completed')
    expect(nodeResponse.data.confidence).toBeGreaterThan(0)
  })

  it('应该完成多输入融合的完整流程', async () => {
    // 1. 创建两个源节点
    const node1Id = uuidv4()
    const node2Id = uuidv4()

    const node1 = await axios.post(
      'http://gateway:8000/api/nodes',
      {
        projectId,
        id: node1Id,
        content: '用户需求：实现在线支付功能',
        position: { x: 100, y: 100 },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    const node2 = await axios.post(
      'http://gateway:8000/api/nodes',
      {
        projectId,
        id: node2Id,
        content: '技术方案：使用第三方支付SDK',
        position: { x: 300, y: 100 },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(node1.status).toBe(200)
    expect(node2.status).toBe(200)

    // 2. 创建融合节点
    const fusionNodeId = uuidv4()

    const fusionResponse = await axios.post(
      'http://gateway:8000/api/ai/fusion',
      {
        projectId,
        nodeId: fusionNodeId,
        sourceNodeIds: [node1Id, node2Id],
        instruction: '综合需求和技术方案，生成实施计划',
        position: { x: 200, y: 300 },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(fusionResponse.status).toBe(200)

    // 3. 等待融合完成
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Fusion timeout')), 30000)

      socket.on('ai:task:completed', (data) => {
        if (data.nodeId === fusionNodeId) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    // 4. 验证融合节点
    const fusionNode = await axios.get(
      `http://gateway:8000/api/nodes/${fusionNodeId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(fusionNode.data.content).toBeDefined()
    expect(fusionNode.data.metadata.semantic_types).toContain('fusion')

    // 5. 验证连接关系
    const connections = await axios.get(
      `http://gateway:8000/api/connections?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    const fusionConnections = connections.data.filter(
      (c: any) => c.target_node_id === fusionNodeId
    )

    expect(fusionConnections).toHaveLength(2)
    expect(fusionConnections.map((c: any) => c.source_node_id)).toContain(node1Id)
    expect(fusionConnections.map((c: any) => c.source_node_id)).toContain(node2Id)
  })

  it('应该正确处理 AI 任务失败情况', async () => {
    const nodeId = uuidv4()

    // 发送无效请求（空输入）
    const response = await axios.post(
      'http://gateway:8000/api/ai/generate',
      {
        projectId,
        nodeId,
        inputs: [], // 空输入应该失败
        position: { x: 0, y: 0 },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true, // 接受所有状态码
      }
    )

    expect(response.status).toBeGreaterThanOrEqual(400)

    // 或者如果服务器接受请求但任务失败
    if (response.status === 200) {
      const taskId = response.data.taskId

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 10000)

        socket.on('ai:task:failed', (data) => {
          if (data.taskId === taskId) {
            clearTimeout(timeout)
            expect(data.error).toBeDefined()
            resolve()
          }
        })
      })
    }
  })
})
```

### 2.2 测试场景：内容优化流程

```typescript
describe('AI Optimization Flow', () => {
  it('应该完成节点内容优化的完整流程', async () => {
    // 1. 创建初始节点
    const nodeId = uuidv4()
    const createResponse = await axios.post(
      'http://gateway:8000/api/nodes',
      {
        projectId,
        id: nodeId,
        content: '初始内容：简单的产品描述',
        position: { x: 100, y: 100 },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(createResponse.status).toBe(200)

    // 2. 发起优化请求
    const optimizeResponse = await axios.post(
      `http://gateway:8000/api/ai/optimize/${nodeId}`,
      {
        optimizationPrompt: '增加更多技术细节和实现方案',
        changeReason: '需要更详细的技术说明',
        changeType: 'confirmed',
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(optimizeResponse.status).toBe(200)
    const taskId = optimizeResponse.data.taskId

    // 3. 等待优化完成
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 30000)

      socket.on('node:updated', (data) => {
        if (data.id === nodeId && data.version > 1) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    // 4. 验证节点已更新
    const updatedNode = await axios.get(
      `http://gateway:8000/api/nodes/${nodeId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(updatedNode.data.version).toBe(2)
    expect(updatedNode.data.content).not.toBe('初始内容：简单的产品描述')
    expect(updatedNode.data.content.length).toBeGreaterThan(100)

    // 5. 验证版本历史
    const versions = await axios.get(
      `http://gateway:8000/api/nodes/${nodeId}/versions`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    expect(versions.data).toHaveLength(2)
    expect(versions.data[1].change_reason).toBe('需要更详细的技术说明')
    expect(versions.data[1].change_type).toBe('confirmed')
  })
})
```

## 三、用户认证与授权集成测试

```typescript
// tests/integration/auth-flow.test.ts

describe('Authentication and Authorization Flow', () => {
  it('应该完成用户注册、登录、token验证流程', async () => {
    // 1. 注册
    const registerData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'SecurePass123!',
    }

    const registerResponse = await axios.post(
      'http://gateway:8000/api/auth/register',
      registerData
    )

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.data.user.email).toBe(registerData.email)
    expect(registerResponse.data.user.password_hash).toBeUndefined() // 不应返回密码

    // 2. 登录
    const loginResponse = await axios.post('http://gateway:8000/api/auth/login', {
      email: registerData.email,
      password: registerData.password,
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.data.token).toBeDefined()
    expect(loginResponse.data.user.id).toBeDefined()

    const token = loginResponse.data.token
    const userId = loginResponse.data.user.id

    // 3. 使用 token 访问受保护资源
    const profileResponse = await axios.get('http://gateway:8000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(profileResponse.status).toBe(200)
    expect(profileResponse.data.id).toBe(userId)

    // 4. 验证无效 token 被拒绝
    const invalidResponse = await axios.get('http://gateway:8000/api/users/me', {
      headers: { Authorization: 'Bearer invalid_token' },
      validateStatus: () => true,
    })

    expect(invalidResponse.status).toBe(401)

    // 5. 验证权限控制
    const otherUserProject = await axios.post(
      'http://gateway:8000/api/projects',
      { name: 'Other User Project' },
      {
        headers: { Authorization: `Bearer ${otherUserToken}` },
      }
    )

    const unauthorizedAccess = await axios.get(
      `http://gateway:8000/api/projects/${otherUserProject.data.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      }
    )

    expect(unauthorizedAccess.status).toBe(403)
  })
})
```

## 四、WebSocket 实时通信集成测试

```typescript
// tests/integration/websocket-flow.test.ts

describe('WebSocket Real-time Communication', () => {
  it('应该正确处理 WebSocket 连接、心跳和断线重连', async () => {
    const socket = io('http://gateway:8000', {
      auth: { token: authToken },
      transports: ['websocket'],
    })

    // 1. 连接建立
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        expect(socket.connected).toBe(true)
        resolve()
      })
    })

    // 2. 心跳机制
    let heartbeatReceived = false
    socket.on('heartbeat', () => {
      heartbeatReceived = true
    })

    await new Promise((resolve) => setTimeout(resolve, 35000)) // 等待心跳
    expect(heartbeatReceived).toBe(true)

    // 3. 加入项目房间
    socket.emit('project:join', { projectId })

    await new Promise<void>((resolve) => {
      socket.on('project:joined', (data) => {
        expect(data.projectId).toBe(projectId)
        resolve()
      })
    })

    // 4. 实时事件广播
    const otherSocket = io('http://gateway:8000', {
      auth: { token: otherUserToken },
    })

    await new Promise<void>((resolve) => {
      otherSocket.on('connect', () => resolve())
    })

    otherSocket.emit('project:join', { projectId })

    // 用户1创建节点
    const nodeCreated = new Promise<any>((resolve) => {
      otherSocket.on('node:created', resolve)
    })

    await axios.post(
      'http://gateway:8000/api/nodes',
      {
        projectId,
        content: 'Test node',
        position: { x: 0, y: 0 },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )

    // 用户2应该实时收到事件
    const event = await nodeCreated
    expect(event.content).toBe('Test node')

    socket.disconnect()
    otherSocket.disconnect()
  })
})
```

## 五、数据库迁移和数据完整性测试

```typescript
// tests/integration/database-migration.test.ts

describe('Database Migration and Data Integrity', () => {
  it('应该正确执行数据库迁移', async () => {
    const storeClient = createStoreClient({ baseURL: 'http://store:3001' })

    // 1. 检查迁移状态
    const migrationStatus = await storeClient.migrations.status()
    expect(migrationStatus.pending).toHaveLength(0)
    expect(migrationStatus.completed).toBeDefined()

    // 2. 验证表结构
    const tables = await storeClient.db.getTables()
    expect(tables).toContain('users')
    expect(tables).toContain('projects')
    expect(tables).toContain('nodes')
    expect(tables).toContain('connections')
    expect(tables).toContain('ai_tasks')
    expect(tables).toContain('node_versions')
  })

  it('应该保证数据完整性约束', async () => {
    const storeClient = createStoreClient({ baseURL: 'http://store:3001' })

    // 1. 外键约束测试
    const invalidNode = {
      project_id: 'non-existent-project-id',
      user_id: userId,
      content: 'Test',
      position: { x: 0, y: 0 },
    }

    await expect(storeClient.nodes.create(invalidNode)).rejects.toThrow()

    // 2. 唯一性约束测试
    const user1 = await storeClient.users.create({
      email: 'unique@example.com',
      username: 'uniqueuser',
      password_hash: 'hash',
    })

    await expect(
      storeClient.users.create({
        email: 'unique@example.com', // 重复 email
        username: 'different',
        password_hash: 'hash',
      })
    ).rejects.toThrow()

    // 3. 级联删除测试
    const project = await storeClient.projects.create({
      user_id: userId,
      name: 'Cascade Test Project',
    })

    const node = await storeClient.nodes.create({
      project_id: project.id,
      user_id: userId,
      content: 'Test node',
      position: { x: 0, y: 0 },
    })

    await storeClient.projects.delete(project.id)

    // 节点应该被级联删除
    await expect(storeClient.nodes.findById(node.id)).resolves.toBeNull()
  })
})
```

## 六、消息队列可靠性测试

```typescript
// tests/integration/message-queue-reliability.test.ts

describe('Message Queue Reliability', () => {
  it('应该保证消息确认和重试机制', async () => {
    const broker = await createBroker({ url: process.env.RABBITMQ_URL })
    await broker.connect()

    let processCount = 0
    let failCount = 0

    // 模拟不稳定的消息处理器
    const unreliableHandler = async (message: any) => {
      processCount++
      if (processCount <= 2) {
        failCount++
        throw new Error('Simulated failure')
      }
      // 第3次成功
    }

    await broker.consume('test.retry.queue', unreliableHandler)

    // 发送消息
    broker.sendToQueue('test.retry.queue', { data: 'test' })

    // 等待重试完成
    await new Promise((resolve) => setTimeout(resolve, 5000))

    expect(processCount).toBeGreaterThanOrEqual(3)
    expect(failCount).toBe(2)

    await broker.disconnect()
  })

  it('应该正确处理死信队列', async () => {
    const broker = await createBroker({ url: process.env.RABBITMQ_URL })
    await broker.connect()

    // 设置死信队列
    await broker.assertQueue('test.dlq', { durable: true })
    await broker.assertQueue('test.main.queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': 'test.dlq',
        'x-message-ttl': 5000,
      },
    })

    let dlqMessageReceived = false

    // 监听死信队列
    await broker.consume('test.dlq', async (message) => {
      dlqMessageReceived = true
    })

    // 发送消息但不处理
    broker.sendToQueue('test.main.queue', { data: 'will expire' })

    // 等待消息过期并进入死信队列
    await new Promise((resolve) => setTimeout(resolve, 6000))

    expect(dlqMessageReceived).toBe(true)

    await broker.disconnect()
  })
})
```

## 七、性能和负载测试

```typescript
// tests/integration/performance.test.ts

describe('Performance and Load Tests', () => {
  it('应该处理并发 AI 任务请求', async () => {
    const concurrentTasks = 10
    const tasks: Promise<any>[] = []

    for (let i = 0; i < concurrentTasks; i++) {
      const task = axios.post(
        'http://gateway:8000/api/ai/generate',
        {
          projectId,
          inputs: [`Test input ${i}`],
          position: { x: i * 100, y: 0 },
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      tasks.push(task)
    }

    const results = await Promise.all(tasks)

    results.forEach((result) => {
      expect(result.status).toBe(200)
      expect(result.data.taskId).toBeDefined()
    })
  }, 60000) // 60秒超时

  it('应该在高负载下保持响应性能', async () => {
    const iterations = 100
    const responseTimes: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = Date.now()

      await axios.get(`http://gateway:8000/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const responseTime = Date.now() - start
      responseTimes.push(responseTime)
    }

    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

    expect(avgResponseTime).toBeLessThan(100) // 平均响应时间 < 100ms

    const p95 = responseTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)]
    expect(p95).toBeLessThan(200) // P95 < 200ms
  })
})
```

## 八、测试执行脚本

```bash
#!/bin/bash
# scripts/run-integration-tests.sh

set -e

echo "🚀 启动集成测试环境..."

# 1. 启动基础设施
docker compose up -d postgres redis rabbitmq

# 2. 等待服务就绪
echo "⏳ 等待数据库就绪..."
until docker compose exec -T postgres pg_isready; do
  sleep 1
done

echo "⏳ 等待 Redis 就绪..."
until docker compose exec -T redis redis-cli ping; do
  sleep 1
done

echo "⏳ 等待 RabbitMQ 就绪..."
until docker compose exec -T rabbitmq rabbitmq-diagnostics -q ping; do
  sleep 1
done

# 3. 运行数据库迁移
echo "📦 运行数据库迁移..."
pnpm run --filter=@sker/store migrate

# 4. 启动服务
echo "🔧 启动微服务..."
docker compose up -d store broker engine gateway

# 5. 等待服务健康检查
echo "⏳ 等待服务就绪..."
sleep 10

# 6. 运行集成测试
echo "🧪 运行集成测试..."
pnpm run --filter=@sker/tests test:integration

# 7. 清理
if [ "$KEEP_ENV" != "true" ]; then
  echo "🧹 清理测试环境..."
  docker compose down -v
fi

echo "✅ 集成测试完成!"
```

## 九、CI/CD 集成

```yaml
# .github/workflows/integration-tests.yml

name: Integration Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: sker_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      rabbitmq:
        image: rabbitmq:3-management-alpine
        env:
          RABBITMQ_DEFAULT_USER: guest
          RABBITMQ_DEFAULT_PASS: guest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Run database migrations
        run: pnpm run --filter=@sker/store migrate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/sker_test

      - name: Start services
        run: |
          pnpm run --filter=@sker/store dev &
          pnpm run --filter=@sker/broker dev &
          pnpm run --filter=@sker/engine dev &
          pnpm run --filter=@sker/gateway dev &
          sleep 10

      - name: Run integration tests
        run: pnpm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/sker_test
          REDIS_URL: redis://localhost:6379
          RABBITMQ_URL: amqp://localhost:5672

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: tests/integration/reports/
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-02
**负责团队**: SKER 测试组
