# @sker/backend-core - 后端核心

> 扩展式AI协作画布系统的后端基础设施和服务核心

## 📋 概述

@sker/backend-core 提供后端服务的通用基础设施，包括Express中间件、数据库连接、服务基类和错误处理等核心功能。它依赖 @sker/data-models 获取数据结构定义，依赖 @sker/utils 获取工具函数，为后端微服务架构提供统一的基础支撑。

## 🎯 设计原理

### 为什么需要独立的后端核心包？

1. **基础设施统一**: 为所有后端服务提供统一的基础设施组件
2. **代码复用**: 避免在不同微服务中重复实现相同的基础功能
3. **标准化**: 建立统一的错误处理、日志记录和数据库操作标准
4. **可扩展性**: 支持微服务架构的横向扩展需求
5. **监控集成**: 统一的性能监控和健康检查机制
6. **安全保障**: 集中的认证、授权和安全防护机制

### 架构设计思路

```mermaid
graph TD
    A[@sker/data-models] --> B[Backend Core]
    C[@sker/utils] --> B
    
    B --> D[数据库连接器]
    B --> E[Express中间件]
    B --> F[服务基类]
    B --> G[错误处理器]
    B --> H[日志系统]
    B --> I[认证授权]
    B --> J[缓存管理]
    B --> K[消息队列]
    B --> L[健康检查]
    
    D --> M[PostgreSQL]
    D --> N[Redis]
    D --> O[MongoDB]
    
    E --> P[CORS]
    E --> Q[Rate Limiting]
    E --> R[Request Validation]
    E --> S[Response Compression]
    
    F --> T[Component Service]
    F --> U[Project Service]
    F --> V[User Service]
    F --> W[AI Service]
    
    G --> X[错误分类]
    G --> Y[错误日志]
    G --> Z[用户友好消息]
    
    H --> AA[结构化日志]
    H --> BB[性能追踪]
    H --> CC[审计日志]
```

## 🚀 核心功能

### 1. 数据库连接管理
- PostgreSQL连接池
- Redis缓存连接
- MongoDB文档存储
- 事务管理
- 连接健康检查

### 2. Express中间件集合
- 请求验证中间件
- 认证授权中间件
- 错误处理中间件
- 日志记录中间件
- 性能监控中间件

### 3. 服务基类
- RESTful API基类
- GraphQL服务基类
- WebSocket服务基类
- 定时任务服务基类
- 消息队列服务基类

### 4. 错误处理系统
- 统一错误分类
- 错误日志记录
- 用户友好错误消息
- 错误恢复机制
- 监控告警集成

### 5. 日志系统
- 结构化日志
- 分级日志记录
- 性能追踪
- 审计日志
- 日志聚合

### 6. 认证授权
- JWT Token管理
- 多种认证策略
- 基于角色的访问控制
- API密钥管理
- 权限验证

### 7. 缓存管理
- Redis缓存抽象
- 多级缓存策略
- 缓存失效机制
- 分布式缓存
- 缓存预热

### 8. 消息队列
- RabbitMQ集成
- 消息发布订阅
- 任务队列管理
- 死信队列处理
- 消息持久化

## 📦 安装使用

```bash
npm install @sker/backend-core @sker/data-models @sker/utils
```

## 📖 API文档

### DatabaseConnector - 数据库连接器

```typescript
import { DatabaseConnector } from '@sker/backend-core';
import { ComponentData } from '@sker/data-models';

// 初始化数据库连接器
const db = new DatabaseConnector({
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'canvas_app',
    username: 'postgres',
    password: 'password',
    ssl: false,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'redis_password',
    db: 0,
    maxRetriesPerRequest: 3
  },
  mongodb: {
    url: 'mongodb://localhost:27017/canvas_app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
});

// 连接数据库
await db.connect();

// PostgreSQL操作
const components = await db.postgres.query(
  'SELECT * FROM components WHERE project_id = $1',
  ['proj_123']
);

// 使用查询构建器
const component = await db.postgres
  .table('components')
  .where('id', 'comp_123')
  .first();

// 事务操作
await db.postgres.transaction(async (trx) => {
  await trx('components').insert(newComponent);
  await trx('component_versions').insert(newVersion);
  await trx('audit_logs').insert(auditLog);
});

// Redis操作
await db.redis.set('component:comp_123', JSON.stringify(component), 'EX', 3600);
const cached = await db.redis.get('component:comp_123');

// Redis Hash操作
await db.redis.hmset('user:user_123', {
  name: 'John Doe',
  email: 'john@example.com',
  last_login: new Date().toISOString()
});

// MongoDB操作
const mongoCollection = db.mongodb.collection('analytics');
await mongoCollection.insertOne({
  user_id: 'user_123',
  action: 'component_created',
  timestamp: new Date(),
  metadata: { component_id: 'comp_123' }
});

// 健康检查
const health = await db.getHealthStatus();
console.log('数据库健康状态:', health);
/*
{
  postgres: { status: 'healthy', responseTime: 5 },
  redis: { status: 'healthy', responseTime: 2 },
  mongodb: { status: 'healthy', responseTime: 8 }
}
*/

// 关闭连接
await db.close();
```

### ServiceBase - 服务基类

```typescript
import { ServiceBase, DatabaseConnector } from '@sker/backend-core';
import { ComponentData, componentSchema } from '@sker/data-models';
import { ValidationUtils } from '@sker/utils';

// 继承服务基类创建具体服务
export class ComponentService extends ServiceBase {
  constructor(db: DatabaseConnector) {
    super(db, {
      tableName: 'components',
      primaryKey: 'id',
      schema: componentSchema,
      enableAudit: true,
      enableCache: true,
      cacheTTL: 3600
    });
  }
  
  // 创建组件
  async create(data: Partial<ComponentData>, userId: string): Promise<ComponentData> {
    // 数据验证
    const validationResult = await this.validate(data);
    if (!validationResult.isValid) {
      throw new ValidationError('Invalid component data', validationResult.errors);
    }
    
    // 添加默认值
    const componentData = {
      ...data,
      id: this.generateId('comp'),
      version: 1,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: userId,
      updated_by: userId
    };
    
    // 数据库事务操作
    return await this.db.transaction(async (trx) => {
      // 插入组件
      const component = await this.insert(componentData, trx);
      
      // 创建初始版本记录
      await this.createVersion({
        component_id: component.id,
        version_number: '1.0.0',
        change_type: 'created',
        data_snapshot: component,
        created_by: userId
      }, trx);
      
      // 记录审计日志
      await this.audit('component:created', {
        component_id: component.id,
        user_id: userId,
        data: component
      }, trx);
      
      return component;
    });
  }
  
  // 获取组件列表
  async list(options: ListOptions): Promise<PaginatedResult<ComponentData>> {
    const cacheKey = `components:list:${JSON.stringify(options)}`;
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    // 构建查询
    let query = this.db.postgres
      .table(this.tableName)
      .select('*');
    
    // 应用过滤器
    if (options.filter) {
      query = this.applyFilters(query, options.filter);
    }
    
    // 应用排序
    if (options.sort) {
      query = query.orderBy(options.sort.field, options.sort.order);
    }
    
    // 应用分页
    const total = await query.clone().count('* as count').first();
    const data = await query
      .limit(options.pageSize || 20)
      .offset(((options.page || 1) - 1) * (options.pageSize || 20));
    
    const result = {
      data: data.map(item => this.transformFromDB(item)),
      total: parseInt(total.count as string),
      page: options.page || 1,
      pageSize: options.pageSize || 20
    };
    
    // 缓存结果
    await this.setCache(cacheKey, result, 300); // 5分钟缓存
    
    return result;
  }
  
  // 更新组件
  async update(id: string, data: Partial<ComponentData>, userId: string): Promise<ComponentData> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Component ${id} not found`);
    }
    
    // 权限检查
    await this.checkPermission(userId, 'component:update', existing);
    
    const updateData = {
      ...data,
      updated_at: new Date(),
      updated_by: userId,
      version: existing.version + 1
    };
    
    return await this.db.transaction(async (trx) => {
      // 更新组件
      const updated = await this.updateById(id, updateData, trx);
      
      // 创建新版本记录
      await this.createVersion({
        component_id: id,
        version_number: `${updated.version}.0.0`,
        change_type: 'updated',
        data_snapshot: updated,
        data_diff: this.calculateDiff(existing, updated),
        created_by: userId
      }, trx);
      
      // 清除相关缓存
      await this.clearCacheByTags(['components', `component:${id}`]);
      
      return updated;
    });
  }
  
  // AI优化组件
  async optimizeWithAI(id: string, prompt: string, userId: string): Promise<ComponentData> {
    const component = await this.findById(id);
    if (!component) {
      throw new NotFoundError(`Component ${id} not found`);
    }
    
    // 调用AI服务进行优化
    const optimizedContent = await this.callAIService('optimize', {
      content: component.content,
      prompt: prompt,
      context: {
        semantic_type: component.semantic_type,
        importance_level: component.importance_level
      }
    });
    
    // 更新组件内容
    return await this.update(id, {
      content: optimizedContent,
      confidence_score: 95, // AI优化通常有较高的置信度
      metadata: {
        ...component.metadata,
        ai_optimization_count: (component.metadata.ai_optimization_count || 0) + 1,
        last_optimization: new Date()
      }
    }, userId);
  }
  
  // 获取组件历史版本
  async getVersionHistory(id: string): Promise<VersionData[]> {
    return await this.db.postgres
      .table('component_versions')
      .where('component_id', id)
      .orderBy('created_at', 'desc');
  }
}
```

### Middleware - Express中间件

```typescript
import { Middleware } from '@sker/backend-core';
import { Request, Response, NextFunction } from 'express';

// 请求验证中间件
export const validateRequest = (schema: any) => {
  return Middleware.validate({
    schema,
    onError: (errors) => {
      throw new ValidationError('Request validation failed', errors);
    }
  });
};

// 认证中间件
export const authenticate = Middleware.auth({
  strategies: ['jwt', 'apikey'],
  required: true,
  onError: (error) => {
    throw new AuthError('Authentication failed', error);
  }
});

// 授权中间件
export const authorize = (permissions: string[]) => {
  return Middleware.authorize({
    permissions,
    onError: () => {
      throw new ForbiddenError('Insufficient permissions');
    }
  });
};

// 速率限制中间件
export const rateLimit = Middleware.rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// 请求日志中间件
export const requestLogger = Middleware.logger({
  format: 'combined',
  skip: (req) => req.url.startsWith('/health'),
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

// 错误处理中间件
export const errorHandler = Middleware.errorHandler({
  showStack: process.env.NODE_ENV === 'development',
  logger: (error, req) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
});

// CORS中间件
export const cors = Middleware.cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// 使用示例
import express from 'express';

const app = express();

// 应用中间件
app.use(cors);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit);

// API路由
app.use('/api/components', 
  authenticate,
  authorize(['component:read']),
  componentRoutes
);

app.use(errorHandler);
```

### Logger - 日志系统

```typescript
import { Logger } from '@sker/backend-core';

// 创建日志实例
const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: [
    {
      type: 'console',
      colorize: true
    },
    {
      type: 'file',
      filename: 'app.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    },
    {
      type: 'http',
      host: 'logs.example.com',
      port: 443,
      ssl: true
    }
  ],
  meta: {
    service: 'canvas-api',
    version: process.env.APP_VERSION || '1.0.0'
  }
});

// 基础日志记录
logger.info('Application started', {
  port: 3000,
  environment: process.env.NODE_ENV
});

logger.error('Database connection failed', {
  error: 'Connection timeout',
  host: 'localhost',
  port: 5432
});

// 性能追踪
const timer = logger.startTimer();
// ... 执行一些操作
timer.done('Database query completed');

// 审计日志
logger.audit('user:login', {
  user_id: 'user_123',
  ip: '192.168.1.100',
  user_agent: 'Mozilla/5.0...',
  success: true
});

logger.audit('component:created', {
  user_id: 'user_123',
  component_id: 'comp_456',
  project_id: 'proj_789',
  data: { title: 'New Component' }
});

// 结构化日志
logger.info('Request processed', {
  request_id: 'req_123',
  method: 'POST',
  url: '/api/components',
  status_code: 201,
  response_time: 150,
  user_id: 'user_123'
});

// 错误日志
try {
  // 一些可能出错的操作
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { component_id: 'comp_123' }
  });
}

// 日志聚合查询
const logs = await logger.query({
  level: 'error',
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时前
  endTime: new Date(),
  filters: {
    service: 'canvas-api',
    user_id: 'user_123'
  },
  limit: 100
});
```

### CacheManager - 缓存管理

```typescript
import { CacheManager } from '@sker/backend-core';

// 创建缓存管理器
const cache = new CacheManager({
  redis: {
    host: 'localhost',
    port: 6379
  },
  defaultTTL: 3600, // 1小时
  keyPrefix: 'canvas:',
  compression: true,
  serialization: 'json'
});

// 基础缓存操作
await cache.set('component:comp_123', componentData, 3600);
const cached = await cache.get('component:comp_123');

// 哈希缓存
await cache.hset('user:user_123', {
  name: 'John Doe',
  email: 'john@example.com',
  last_active: new Date().toISOString()
});

const userName = await cache.hget('user:user_123', 'name');

// 列表缓存
await cache.lpush('notifications:user_123', notification);
const notifications = await cache.lrange('notifications:user_123', 0, 9); // 最新10条

// 集合缓存
await cache.sadd('project:proj_123:members', 'user_123', 'user_456');
const members = await cache.smembers('project:proj_123:members');

// 有序集合缓存
await cache.zadd('leaderboard', 100, 'user_123', 95, 'user_456');
const topUsers = await cache.zrevrange('leaderboard', 0, 9); // Top 10

// 缓存模式
// 1. Cache-Aside模式
async function getComponent(id: string): Promise<ComponentData> {
  const cacheKey = `component:${id}`;
  
  // 先查缓存
  let component = await cache.get(cacheKey);
  if (component) {
    return component;
  }
  
  // 缓存未命中，查数据库
  component = await db.findById(id);
  if (component) {
    // 写入缓存
    await cache.set(cacheKey, component, 3600);
  }
  
  return component;
}

// 2. Write-Through模式
async function updateComponent(id: string, data: any): Promise<ComponentData> {
  // 同时更新数据库和缓存
  const updated = await db.updateById(id, data);
  await cache.set(`component:${id}`, updated, 3600);
  return updated;
}

// 3. Write-Behind模式
async function updateComponentAsync(id: string, data: any): Promise<void> {
  // 立即更新缓存
  await cache.set(`component:${id}`, data, 3600);
  
  // 异步更新数据库
  setImmediate(async () => {
    await db.updateById(id, data);
  });
}

// 批量操作
const pipeline = cache.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.expire('key1', 3600);
await pipeline.exec();

// 分布式锁
const lock = await cache.acquireLock('component:comp_123:edit', {
  ttl: 30000, // 30秒
  retries: 3,
  delay: 100
});

if (lock) {
  try {
    // 执行需要锁定的操作
    await updateComponent('comp_123', data);
  } finally {
    await cache.releaseLock(lock);
  }
}
```

### MessageQueue - 消息队列

```typescript
import { MessageQueue } from '@sker/backend-core';

// 创建消息队列管理器
const mq = new MessageQueue({
  rabbitmq: {
    url: 'amqp://localhost:5672',
    exchangeName: 'canvas_exchange',
    exchangeType: 'topic'
  },
  defaultOptions: {
    persistent: true,
    maxRetries: 3,
    retryDelay: 1000
  }
});

// 连接消息队列
await mq.connect();

// 发布消息
await mq.publish('component.created', {
  component_id: 'comp_123',
  project_id: 'proj_456',
  user_id: 'user_789',
  timestamp: new Date(),
  data: componentData
});

await mq.publish('ai.optimization.request', {
  component_id: 'comp_123',
  prompt: '优化这个组件的内容结构',
  priority: 'high'
});

// 订阅消息
await mq.subscribe('component.created', async (message) => {
  console.log('收到组件创建消息:', message);
  
  // 发送通知给项目成员
  await notificationService.notifyProjectMembers(
    message.project_id,
    `新组件 ${message.data.title} 已创建`
  );
});

await mq.subscribe('ai.optimization.request', async (message) => {
  console.log('收到AI优化请求:', message);
  
  try {
    // 调用AI服务进行优化
    const optimizedContent = await aiService.optimize(
      message.component_id,
      message.prompt
    );
    
    // 发布优化完成消息
    await mq.publish('ai.optimization.completed', {
      component_id: message.component_id,
      optimized_content: optimizedContent,
      original_request: message
    });
  } catch (error) {
    // 发布优化失败消息
    await mq.publish('ai.optimization.failed', {
      component_id: message.component_id,
      error: error.message,
      original_request: message
    });
  }
});

// 延迟消息
await mq.publishDelayed('component.backup', {
  component_id: 'comp_123'
}, 24 * 60 * 60 * 1000); // 24小时后执行备份

// 批量消息
await mq.publishBatch([
  { routingKey: 'user.created', message: userData1 },
  { routingKey: 'user.created', message: userData2 },
  { routingKey: 'user.created', message: userData3 }
]);

// 死信队列处理
await mq.subscribe('dlx.component.created', async (message) => {
  logger.error('消息处理失败，进入死信队列:', message);
  // 进行错误恢复或人工处理
});

// 关闭连接
process.on('SIGINT', async () => {
  await mq.close();
  process.exit(0);
});
```

### HealthChecker - 健康检查

```typescript
import { HealthChecker } from '@sker/backend-core';

// 创建健康检查器
const health = new HealthChecker({
  checks: [
    {
      name: 'database',
      check: async () => {
        const result = await db.postgres.raw('SELECT 1');
        return { status: 'healthy', details: { connected: true } };
      },
      timeout: 5000,
      interval: 30000
    },
    {
      name: 'redis',
      check: async () => {
        await db.redis.ping();
        return { status: 'healthy', details: { connected: true } };
      },
      timeout: 3000,
      interval: 30000
    },
    {
      name: 'external_api',
      check: async () => {
        const response = await fetch('https://api.external.com/health');
        return {
          status: response.ok ? 'healthy' : 'unhealthy',
          details: { status_code: response.status }
        };
      },
      timeout: 10000,
      interval: 60000
    }
  ]
});

// 启动健康检查
await health.start();

// 获取健康状态
app.get('/health', async (req, res) => {
  const status = await health.getStatus();
  const isHealthy = status.overall === 'healthy';
  
  res.status(isHealthy ? 200 : 503).json(status);
});

// 详细健康信息
app.get('/health/detailed', async (req, res) => {
  const detailed = await health.getDetailedStatus();
  res.json(detailed);
});

// 就绪检查（Ready Probe）
app.get('/ready', async (req, res) => {
  const isReady = await health.isReady();
  res.status(isReady ? 200 : 503).json({ ready: isReady });
});

// 存活检查（Liveness Probe）
app.get('/live', async (req, res) => {
  const isAlive = await health.isAlive();
  res.status(isAlive ? 200 : 503).json({ alive: isAlive });
});
```

## 🛠️ 开发指南

### 项目结构

```
backend-core/
├── src/
│   ├── database/          # 数据库相关
│   │   ├── DatabaseConnector.ts
│   │   ├── PostgresAdapter.ts
│   │   ├── RedisAdapter.ts
│   │   ├── MongoAdapter.ts
│   │   └── TransactionManager.ts
│   ├── services/          # 服务基类
│   │   ├── ServiceBase.ts
│   │   ├── RestServiceBase.ts
│   │   ├── GraphQLServiceBase.ts
│   │   └── WebSocketServiceBase.ts
│   ├── middleware/        # Express中间件
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   ├── logging.ts
│   │   └── errorHandler.ts
│   ├── cache/             # 缓存管理
│   │   ├── CacheManager.ts
│   │   ├── RedisCache.ts
│   │   ├── MemoryCache.ts
│   │   └── CacheStrategies.ts
│   ├── queue/             # 消息队列
│   │   ├── MessageQueue.ts
│   │   ├── RabbitMQAdapter.ts
│   │   ├── JobProcessor.ts
│   │   └── QueueManager.ts
│   ├── logging/           # 日志系统
│   │   ├── Logger.ts
│   │   ├── Transports.ts
│   │   ├── Formatters.ts
│   │   └── AuditLogger.ts
│   ├── security/          # 安全相关
│   │   ├── AuthManager.ts
│   │   ├── JWTHandler.ts
│   │   ├── PermissionChecker.ts
│   │   └── SecurityUtils.ts
│   ├── monitoring/        # 监控相关
│   │   ├── HealthChecker.ts
│   │   ├── MetricsCollector.ts
│   │   ├── PerformanceTracker.ts
│   │   └── AlertManager.ts
│   ├── errors/            # 错误处理
│   │   ├── ErrorHandler.ts
│   │   ├── CustomErrors.ts
│   │   ├── ErrorClassifier.ts
│   │   └── ErrorReporter.ts
│   ├── types/             # 类型定义
│   │   ├── database.ts
│   │   ├── service.ts
│   │   ├── middleware.ts
│   │   ├── cache.ts
│   │   └── queue.ts
│   └── index.ts           # 统一导出
├── tests/                 # 测试文件
│   ├── database.test.ts
│   ├── services.test.ts
│   ├── middleware.test.ts
│   ├── cache.test.ts
│   ├── queue.test.ts
│   └── integration.test.ts
├── config/                # 配置文件
│   ├── database.json
│   ├── redis.json
│   ├── rabbitmq.json
│   └── logging.json
└── docs/                  # 详细文档
    ├── database.md
    ├── services.md
    ├── middleware.md
    └── deployment.md
```

### 依赖包集成

```typescript
// 使用 @sker/data-models 的数据结构
import { ComponentData, ProjectData, componentSchema } from '@sker/data-models';
import { ValidationUtils, DateUtils } from '@sker/utils';

export class ComponentService extends ServiceBase {
  constructor(db: DatabaseConnector) {
    super(db, {
      tableName: 'components',
      schema: componentSchema, // 使用数据模型的验证Schema
      enableCache: true
    });
  }
  
  // 使用工具函数进行数据处理
  protected transformToAPI(data: ComponentData): any {
    return {
      ...data,
      created_at: DateUtils.formatISO(data.created_at),
      updated_at: DateUtils.formatISO(data.updated_at),
      formatted_size: ValidationUtils.isValidEmail(data.content) 
        ? 'Email Content' 
        : `${data.content.length} characters`
    };
  }
  
  // 数据验证
  protected async validateData(data: any): Promise<ValidationResult> {
    const schemaValidation = componentSchema.safeParse(data);
    if (!schemaValidation.success) {
      return {
        isValid: false,
        errors: schemaValidation.error.issues.map(issue => issue.message)
      };
    }
    
    // 使用工具函数进行额外验证
    const contentValid = ValidationUtils.isValidString(data.content, { minLength: 10 });
    if (!contentValid) {
      return {
        isValid: false,
        errors: ['Content must be at least 10 characters long']
      };
    }
    
    return { isValid: true, errors: [] };
  }
}
```

### 微服务架构示例

```typescript
// services/ComponentService.ts
import express from 'express';
import { 
  DatabaseConnector, 
  ServiceBase, 
  Middleware,
  Logger,
  MessageQueue 
} from '@sker/backend-core';

export class ComponentService extends ServiceBase {
  private app: express.Application;
  private logger: Logger;
  private mq: MessageQueue;
  
  constructor() {
    super();
    this.app = express();
    this.logger = new Logger({ service: 'component-service' });
    this.mq = new MessageQueue();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupMessageHandlers();
  }
  
  private setupMiddleware(): void {
    this.app.use(Middleware.cors());
    this.app.use(Middleware.logger());
    this.app.use(express.json());
    this.app.use(Middleware.auth());
  }
  
  private setupRoutes(): void {
    // 组件CRUD路由
    this.app.get('/components', this.listComponents.bind(this));
    this.app.post('/components', this.createComponent.bind(this));
    this.app.get('/components/:id', this.getComponent.bind(this));
    this.app.put('/components/:id', this.updateComponent.bind(this));
    this.app.delete('/components/:id', this.deleteComponent.bind(this));
    
    // AI优化路由
    this.app.post('/components/:id/optimize', this.optimizeComponent.bind(this));
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'component-service' });
    });
    
    // 错误处理
    this.app.use(Middleware.errorHandler());
  }
  
  private setupMessageHandlers(): void {
    // 监听AI优化完成消息
    this.mq.subscribe('ai.optimization.completed', async (message) => {
      await this.handleOptimizationCompleted(message);
    });
    
    // 监听项目删除消息
    this.mq.subscribe('project.deleted', async (message) => {
      await this.handleProjectDeleted(message);
    });
  }
  
  private async listComponents(req: Request, res: Response): Promise<void> {
    try {
      const options = this.parseListOptions(req.query);
      const result = await this.componentRepository.list(options);
      res.json(result);
    } catch (error) {
      this.logger.error('Failed to list components', { error: error.message });
      throw error;
    }
  }
  
  private async createComponent(req: Request, res: Response): Promise<void> {
    try {
      const component = await this.componentRepository.create(req.body, req.user.id);
      
      // 发送组件创建消息
      await this.mq.publish('component.created', {
        component_id: component.id,
        project_id: component.project_id,
        user_id: req.user.id,
        data: component
      });
      
      res.status(201).json(component);
    } catch (error) {
      this.logger.error('Failed to create component', { error: error.message });
      throw error;
    }
  }
  
  public async start(port: number = 3001): Promise<void> {
    await this.db.connect();
    await this.mq.connect();
    
    this.app.listen(port, () => {
      this.logger.info(`Component service started on port ${port}`);
    });
  }
}

// 启动服务
if (require.main === module) {
  const service = new ComponentService();
  service.start(process.env.PORT ? parseInt(process.env.PORT) : 3001);
}
```

## 🧪 测试策略

### 单元测试

```typescript
// tests/services.test.ts
describe('ComponentService', () => {
  let service: ComponentService;
  let mockDB: jest.Mocked<DatabaseConnector>;
  
  beforeEach(() => {
    mockDB = createMockDatabase();
    service = new ComponentService(mockDB);
  });
  
  it('应该成功创建组件', async () => {
    const componentData = {
      title: 'Test Component',
      content: 'Test content',
      semantic_type: 'text',
      importance_level: 3
    };
    
    mockDB.postgres.table.mockReturnValue({
      insert: jest.fn().mockResolvedValue([{ id: 'comp_123', ...componentData }])
    } as any);
    
    const result = await service.create(componentData, 'user_123');
    
    expect(result.id).toBe('comp_123');
    expect(result.title).toBe('Test Component');
  });
  
  it('应该处理数据验证错误', async () => {
    const invalidData = {
      title: '', // 无效的空标题
      content: 'Test'
    };
    
    await expect(service.create(invalidData, 'user_123')).rejects.toThrow(ValidationError);
  });
});
```

### 集成测试

```typescript
// tests/integration.test.ts
describe('Backend Core Integration', () => {
  let app: express.Application;
  let db: DatabaseConnector;
  
  beforeAll(async () => {
    // 设置测试数据库
    db = new DatabaseConnector({
      postgres: { /* 测试数据库配置 */ }
    });
    await db.connect();
    
    // 设置测试应用
    app = express();
    app.use(Middleware.cors());
    app.use(express.json());
    app.use('/api/components', componentRoutes);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('应该能够完整的组件CRUD流程', async () => {
    // 创建组件
    const createResponse = await request(app)
      .post('/api/components')
      .send({
        title: 'Integration Test Component',
        content: 'Test content for integration',
        semantic_type: 'text'
      })
      .expect(201);
    
    const componentId = createResponse.body.id;
    
    // 获取组件
    const getResponse = await request(app)
      .get(`/api/components/${componentId}`)
      .expect(200);
    
    expect(getResponse.body.title).toBe('Integration Test Component');
    
    // 更新组件
    await request(app)
      .put(`/api/components/${componentId}`)
      .send({ title: 'Updated Component' })
      .expect(200);
    
    // 删除组件
    await request(app)
      .delete(`/api/components/${componentId}`)
      .expect(204);
  });
});
```

### 性能测试

```typescript
// tests/performance.test.ts
describe('Performance Tests', () => {
  it('应该能够处理高并发请求', async () => {
    const concurrentRequests = 100;
    const promises = Array.from({ length: concurrentRequests }, () =>
      request(app)
        .get('/api/components')
        .expect(200)
    );
    
    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();
    
    const avgResponseTime = (endTime - startTime) / concurrentRequests;
    expect(avgResponseTime).toBeLessThan(100); // 平均响应时间小于100ms
  });
  
  it('数据库连接池应该正确管理连接', async () => {
    const db = new DatabaseConnector({
      postgres: {
        pool: { min: 2, max: 10 }
      }
    });
    
    // 创建大量并发数据库操作
    const operations = Array.from({ length: 50 }, () =>
      db.postgres.raw('SELECT 1')
    );
    
    await expect(Promise.all(operations)).resolves.not.toThrow();
  });
});
```

## 📊 监控和性能

### 性能监控

```typescript
// monitoring/PerformanceTracker.ts
export class PerformanceTracker {
  private metrics = new Map<string, PerformanceMetric>();
  
  // 开始性能追踪
  startTimer(operation: string): Timer {
    return {
      operation,
      startTime: process.hrtime.bigint(),
      end: () => this.endTimer(operation, startTime)
    };
  }
  
  // 记录性能指标
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric = this.metrics.get(name) || {
      name,
      values: [],
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity
    };
    
    metric.values.push(value);
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    
    this.metrics.set(name, metric);
  }
  
  // 获取性能统计
  getStats(name: string): PerformanceStats {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    return {
      count: metric.count,
      avg: metric.sum / metric.count,
      min: metric.min,
      max: metric.max,
      p95: this.calculatePercentile(metric.values, 0.95),
      p99: this.calculatePercentile(metric.values, 0.99)
    };
  }
}

// 使用示例
const perf = new PerformanceTracker();

// 在服务中使用
export class ComponentService extends ServiceBase {
  async create(data: ComponentData): Promise<ComponentData> {
    const timer = perf.startTimer('component:create');
    
    try {
      const result = await super.create(data);
      perf.recordMetric('component:create:success', 1);
      return result;
    } catch (error) {
      perf.recordMetric('component:create:error', 1);
      throw error;
    } finally {
      timer.end();
    }
  }
}
```

### 告警系统

```typescript
// monitoring/AlertManager.ts
export class AlertManager {
  private rules: AlertRule[] = [];
  private channels: AlertChannel[] = [];
  
  // 添加告警规则
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  // 检查告警条件
  async checkAlerts(): Promise<void> {
    for (const rule of this.rules) {
      const shouldAlert = await rule.condition();
      
      if (shouldAlert && !rule.isActive) {
        await this.triggerAlert(rule);
        rule.isActive = true;
      } else if (!shouldAlert && rule.isActive) {
        await this.resolveAlert(rule);
        rule.isActive = false;
      }
    }
  }
  
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: Alert = {
      id: generateId(),
      rule: rule.name,
      message: rule.message,
      severity: rule.severity,
      triggeredAt: new Date(),
      metadata: await rule.getMetadata?.()
    };
    
    // 发送到所有通知渠道
    for (const channel of this.channels) {
      await channel.send(alert);
    }
  }
}

// 告警规则示例
const alertManager = new AlertManager();

// 数据库连接告警
alertManager.addRule({
  name: 'database_connection_failure',
  message: 'Database connection failed',
  severity: 'critical',
  condition: async () => {
    try {
      await db.postgres.raw('SELECT 1');
      return false;
    } catch {
      return true;
    }
  },
  getMetadata: async () => ({
    database_host: process.env.DB_HOST,
    last_check: new Date().toISOString()
  })
});

// 高错误率告警
alertManager.addRule({
  name: 'high_error_rate',
  message: 'Error rate exceeds threshold',
  severity: 'warning',
  condition: async () => {
    const stats = perf.getStats('api:requests');
    const errorStats = perf.getStats('api:errors');
    
    if (!stats || !errorStats) return false;
    
    const errorRate = errorStats.count / stats.count;
    return errorRate > 0.05; // 5% 错误率阈值
  }
});
```

## 🔒 安全最佳实践

### 输入验证和清理

```typescript
// security/InputSanitizer.ts
export class InputSanitizer {
  // SQL注入防护
  static sanitizeSQL(input: string): string {
    return input.replace(/['";\\]/g, '\\$&');
  }
  
  // XSS防护
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // 路径遍历防护
  static sanitizePath(input: string): string {
    return input.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  }
}

// 在中间件中使用
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  // 清理请求体
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // 清理查询参数
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};
```

### 权限控制

```typescript
// security/PermissionChecker.ts
export class PermissionChecker {
  private permissions: Map<string, Permission> = new Map();
  
  // 检查用户权限
  async checkPermission(
    userId: string, 
    action: string, 
    resource?: any
  ): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    
    for (const role of user.roles) {
      const permission = this.permissions.get(`${role}:${action}`);
      if (permission) {
        // 检查资源级权限
        if (resource && permission.resourceChecker) {
          return await permission.resourceChecker(user, resource);
        }
        return true;
      }
    }
    
    return false;
  }
  
  // 定义权限规则
  definePermission(
    role: string, 
    action: string, 
    resourceChecker?: (user: User, resource: any) => Promise<boolean>
  ): void {
    this.permissions.set(`${role}:${action}`, {
      role,
      action,
      resourceChecker
    });
  }
}

// 权限定义示例
const permissionChecker = new PermissionChecker();

// 管理员可以访问所有组件
permissionChecker.definePermission('admin', 'component:read');
permissionChecker.definePermission('admin', 'component:write');

// 开发者只能访问自己项目的组件
permissionChecker.definePermission('developer', 'component:read', 
  async (user, component) => {
    const project = await getProject(component.project_id);
    return project.collaborators.includes(user.id);
  }
);
```

## 🎨 最佳实践

1. **数据库连接**: 使用连接池管理数据库连接
2. **错误处理**: 实现统一的错误处理和日志记录
3. **缓存策略**: 根据数据特性选择合适的缓存策略
4. **消息队列**: 使用消息队列解耦服务间通信
5. **监控告警**: 实现全面的监控和告警机制
6. **安全防护**: 输入验证、权限控制和安全审计

## 🚨 注意事项

1. **内存泄漏**: 注意清理定时器和事件监听器
2. **数据库事务**: 正确处理数据库事务的提交和回滚
3. **并发控制**: 使用分布式锁避免数据竞争
4. **敏感信息**: 不要在日志中记录敏感信息

## 📈 版本历史

- **v1.0.0**: 初始版本，基础数据库和服务支持
- **v1.1.0**: 添加消息队列和缓存支持
- **v1.2.0**: 增强认证授权和安全功能
- **v1.3.0**: 实现监控告警和性能追踪
- **v1.4.0**: 支持微服务架构和服务发现
- **v2.0.0**: 重构架构，支持云原生部署

## 🤝 贡献指南

1. 新增服务基类需要完整的测试覆盖
2. 确保数据库操作的事务安全性
3. 提供详细的API文档和使用示例
4. 遵循安全编码规范

## 📄 许可证

MIT License