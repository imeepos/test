# SKER 微服务架构

本文档描述了SKER系统从单体架构向真正微服务架构的转换。

## 🏗️ 架构概述

SKER现在采用真正的微服务架构，各服务通过HTTP API和消息队列进行通信：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Gateway     │    │      Store      │    │     Broker      │
│   (API网关)      │    │   (数据存储)     │    │   (消息处理)     │
│                 │    │                 │    │                 │
│ • REST API      │    │ • REST API      │    │ • 任务调度       │
│ • WebSocket     │◄───┤ • PostgreSQL    │◄───┤ • 消息队列       │
│ • 认证/授权      │    │ • Redis         │    │ • AI引擎集成     │
│ • 限流/安全      │    │ • 数据管理       │    │ • 事件处理       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └──────────────┬─────────────────┬─────────────────┘
                        │                 │
                        ▼                 ▼
                ┌──────────────┐  ┌──────────────┐
                │  PostgreSQL  │  │   RabbitMQ   │
                │   (数据库)    │  │  (消息队列)   │
                └──────────────┘  └──────────────┘
```

## 🚀 快速开始

### 前提条件

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (开发环境)
- pnpm (开发环境)

### 启动微服务

1. **克隆项目并进入目录**
   ```bash
   git clone <repository-url>
   cd sker
   ```

2. **启动完整的微服务架构**
   ```bash
   ./scripts/start-microservices.sh
   ```

3. **可选：启动监控服务**
   ```bash
   ./scripts/start-microservices.sh --with-monitoring
   ```

### 访问服务

- **API网关**: http://localhost (Nginx反向代理)
- **Gateway直接访问**: http://localhost:3000
- **Store API**: http://localhost:3001
- **RabbitMQ管理界面**: http://localhost:15672 (admin/admin)
- **Grafana监控** (如果启用): http://localhost:3001 (admin/admin)

## 📁 项目结构

```
sker/
├── packages/
│   ├── store/           # Store微服务
│   │   ├── src/
│   │   │   ├── api/     # REST API控制器和路由
│   │   │   ├── client/  # HTTP客户端
│   │   │   └── server.ts
│   │   └── Dockerfile
│   ├── gateway/         # Gateway微服务
│   │   ├── src/
│   │   │   ├── config/  # Store客户端配置
│   │   │   ├── factory/ # 工厂函数
│   │   │   └── router/
│   │   └── Dockerfile
│   └── broker/          # Broker微服务
│       ├── src/
│       │   ├── adapters/    # Store适配器
│       │   ├── config/      # Store配置
│       │   └── scheduler/
│       └── Dockerfile
├── scripts/
│   ├── start-microservices.sh
│   └── stop-microservices.sh
├── docker-compose.microservices.yml
├── nginx.conf
└── .env.microservices
```

## 🔧 服务详情

### Store微服务 (端口 3001)

**职责**: 数据存储和管理
- REST API提供完整的CRUD操作
- JWT认证和授权
- 限流和安全中间件
- PostgreSQL数据持久化
- Redis缓存加速

**API端点**:
- `GET /health` - 健康检查
- `GET /api/v1/users` - 用户管理
- `GET /api/v1/projects` - 项目管理
- `GET /api/v1/nodes` - 节点管理
- `GET /api/v1/connections` - 连接管理
- `GET /api/v1/ai-tasks` - AI任务管理
- `GET /api/system/*` - 系统管理

### Gateway微服务 (端口 3000)

**职责**: API网关和WebSocket管理
- 统一API入口
- 请求路由和负载均衡
- WebSocket实时通信
- 认证和授权
- 通过HTTP客户端调用Store服务

**特性**:
- 使用`StoreClient`而非直接依赖
- 支持多种认证方式
- WebSocket事件处理
- 请求限流和安全防护

### Broker微服务 (无暴露端口)

**职责**: 消息处理和任务调度
- AI任务调度和管理
- 消息队列处理
- 事件发布和订阅
- 通过Store适配器访问数据

**特性**:
- 使用`StoreAdapter`适配HTTP客户端
- RabbitMQ消息队列集成
- 可水平扩展(Docker Compose中配置了2个实例)

## 🔧 配置

### 环境变量

主要环境变量配置在`.env.microservices`中：

```env
# 全局
NODE_ENV=production

# Store服务
STORE_PORT=3001
PG_HOST=postgres
REDIS_HOST=redis
JWT_SECRET=your-secret-key

# Gateway服务
GATEWAY_PORT=3000
STORE_SERVICE_URL=http://store:3001
RABBITMQ_URL=amqp://rabbitmq:5672

# Broker服务
AI_TASK_TIMEOUT=600000
```

### 网络架构

所有服务运行在`microservices-network`网络中：

- **内部通信**: 服务间通过服务名称通信 (如 `http://store:3001`)
- **外部访问**: 通过Nginx反向代理统一入口
- **负载均衡**: Nginx upstream配置支持多实例

## 🚀 部署

### 开发环境

```bash
# 启动开发环境
NODE_ENV=development ./scripts/start-microservices.sh

# 或者直接运行各个服务
cd packages/store && npm run dev
cd packages/gateway && npm run dev
cd packages/broker && npm run dev
```

### 生产环境

```bash
# 使用生产配置启动
NODE_ENV=production ./scripts/start-microservices.sh --with-monitoring

# 或使用Docker Compose
docker-compose -f config/docker/docker-compose.microservices.yml up -d
```

### 扩展部署

```bash
# 扩展Gateway实例
docker-compose -f config/docker/docker-compose.microservices.yml up -d --scale gateway=3

# 扩展Broker实例
docker-compose -f config/docker/docker-compose.microservices.yml up -d --scale broker=5
```

## 🔍 监控和日志

### 健康检查

所有服务都提供健康检查端点：
- Store: `GET http://localhost:3001/health`
- Gateway: `GET http://localhost:3000/health`

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f config/docker/docker-compose.microservices.yml logs -f

# 查看特定服务日志
docker-compose -f config/docker/docker-compose.microservices.yml logs -f store
docker-compose -f config/docker/docker-compose.microservices.yml logs -f gateway
docker-compose -f config/docker/docker-compose.microservices.yml logs -f broker
```

### 监控面板

启用监控服务后可访问：
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🛠️ 开发指南

### 添加新的API端点

1. **在Store服务中添加控制器方法**
2. **在Gateway中更新StoreClient调用**
3. **更新API文档**

### 服务间通信

服务间通信统一使用HTTP API：

```javascript
// Gateway中使用StoreClient
const storeClient = createStoreClientForGateway({
  baseURL: 'http://store:3001'
})

const user = await storeClient.users.findById(userId)
```

```javascript
// Broker中使用StoreAdapter
const storeAdapter = await createStoreAdapterForBroker({
  baseURL: 'http://store:3001'
})

const task = await storeAdapter.aiTasks.create(taskData)
```

## 🔧 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3001

   # 检查Docker状态
   docker-compose -f config/docker/docker-compose.microservices.yml ps
   ```

2. **数据库连接失败**
   ```bash
   # 检查PostgreSQL状态
   docker-compose -f config/docker/docker-compose.microservices.yml exec postgres pg_isready

   # 重启数据库
   docker-compose -f config/docker/docker-compose.microservices.yml restart postgres
   ```

3. **Store服务无法访问**
   ```bash
   # 检查Store健康状态
   curl http://localhost:3001/health

   # 查看Store日志
   docker-compose -f config/docker/docker-compose.microservices.yml logs store
   ```

### 调试模式

```bash
# 启动单个服务进行调试
docker-compose -f config/docker/docker-compose.microservices.yml up store

# 进入容器调试
docker-compose -f config/docker/docker-compose.microservices.yml exec store sh
```

## 🔄 从单体架构迁移

原有的单体架构代码仍然兼容，可以通过工厂函数选择使用方式：

```javascript
// 旧方式：直接使用StoreService
import { StoreService } from '@sker/store'
const store = new StoreService()

// 新方式：使用HTTP客户端
import { createStoreClientFromEnv } from '@sker/store'
const store = createStoreClientFromEnv()
```

## 📚 API文档

详细的API文档请参考各服务的OpenAPI规范：
- Store API: http://localhost:3001/api/docs (开发模式)
- Gateway API: http://localhost:3000/api/docs (开发模式)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

[MIT License](LICENSE)