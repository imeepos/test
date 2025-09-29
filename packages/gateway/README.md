# @sker/gateway

API网关服务包 - 为@sker/studio提供统一的HTTP API入口和WebSocket管理。

## 🎯 核心功能

### API网关
- **统一路由**: 所有API请求的统一入口和分发
- **认证授权**: JWT Token验证和权限控制
- **限流控制**: 防止API滥用和DDoS攻击
- **请求验证**: 输入参数验证和格式化
- **响应处理**: 统一的响应格式和错误处理

### WebSocket管理
- **连接管理**: 客户端连接的建立、维护和清理
- **消息路由**: WebSocket消息的分发和处理
- **实时通信**: 支持AI处理结果的实时推送
- **连接认证**: WebSocket连接的身份验证

## 📦 主要模块

### Gateway Server
```typescript
import { GatewayServer } from '@sker/gateway'

const server = new GatewayServer({
  port: 8000,
  cors: { origin: '*' },
  rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }
})

await server.start()
```

### API Router
```typescript
import { ApiRouter } from '@sker/gateway'

const router = new ApiRouter()
router.addRoute('/api/nodes', nodeController)
router.addRoute('/api/ai', aiController)
```

### WebSocket Manager
```typescript
import { WebSocketManager } from '@sker/gateway'

const wsManager = new WebSocketManager()
wsManager.on('connection', (socket) => {
  // 处理连接
})
```

## 🔌 API端点

### 节点管理
- `POST /api/nodes` - 创建节点
- `GET /api/nodes/:id` - 获取节点
- `PUT /api/nodes/:id` - 更新节点
- `DELETE /api/nodes/:id` - 删除节点
- `GET /api/nodes/search` - 搜索节点

### AI服务
- `POST /api/ai/generate` - 生成内容
- `POST /api/ai/optimize` - 优化内容
- `POST /api/ai/fusion` - 融合内容
- `GET /api/ai/health` - 健康检查

### WebSocket事件
- `AI_GENERATE_REQUEST` - AI生成请求
- `AI_GENERATE_RESPONSE` - AI生成响应
- `NODE_UPDATED` - 节点更新
- `CONNECTION_CREATED` - 连接创建

## 🚀 使用方式

```typescript
import { createGateway } from '@sker/gateway'

const gateway = createGateway({
  port: process.env.PORT || 8000,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  auth: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP最多100个请求
  }
})

await gateway.start()
console.log('Gateway server started on port 8000')
```

## 🔧 配置说明

```typescript
interface GatewayConfig {
  port: number
  cors: CorsOptions
  auth: AuthConfig
  rateLimit: RateLimitConfig
  websocket: WebSocketConfig
}
```

## 📝 环境变量

```env
# 服务端口
PORT=8000

# 前端地址
FRONTEND_URL=http://localhost:3000

# JWT密钥
JWT_SECRET=your-secret-key

# API限流配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# WebSocket配置
WS_HEARTBEAT_INTERVAL=30000
WS_TIMEOUT=60000
```

## 🛡️ 安全特性

- **CORS配置**: 跨域请求控制
- **Helmet中间件**: 设置安全HTTP头
- **请求验证**: 输入参数的严格验证
- **JWT认证**: 安全的身份验证机制
- **限流保护**: 防止API滥用

## 📊 监控指标

- API请求数量和响应时间
- WebSocket连接数和消息量
- 错误率和失败请求
- 内存和CPU使用情况

为@sker/studio前端应用提供稳定、安全、高性能的API网关服务。