# SKER 系统依赖关系分析与测试策略

## 一、Monorepo 结构总览

```
sker/
├── packages/           # 共享库和服务
│   ├── models         # 数据模型和类型定义
│   ├── config         # 配置管理
│   ├── store          # 数据存储服务
│   ├── store-client   # Store HTTP 客户端
│   ├── broker         # 消息代理服务
│   ├── engine         # AI 处理引擎
│   ├── gateway        # API 网关
│   ├── ai             # AI 服务集成
│   ├── backend        # 后端核心
│   ├── utils          # 工具库
│   ├── canvas         # 画布组件
│   ├── components     # UI 组件
│   ├── state          # 状态管理
│   ├── protocols      # 协议定义
│   ├── version        # 版本管理
│   ├── plugin-sdk     # 插件 SDK
│   └── api            # API 定义
└── apps/              # 应用程序
    ├── studio         # AI 协作画布主应用
    ├── developer      # 开发者工具
    ├── console        # 管理控制台
    ├── claude         # Claude 集成
    ├── codex          # 代码库
    └── ...            # 其他应用
```

## 二、核心依赖关系图

### 2.1 包依赖层次（从底层到上层）

```
第0层 - 基础层（无依赖）
├── @sker/models (zod)
└── @sker/config (dotenv, joi)

第1层 - 客户端层
└── @sker/store-client (axios)
    依赖: 无workspace依赖

第2层 - 服务基础层
├── @sker/store
│   依赖: @sker/config, @sker/models
│   外部: pg, redis, express, jwt, bcryptjs
│
├── @sker/backend
│   依赖: @sker/config, @sker/models
│   外部: express, pg, redis, winston
│
└── @sker/utils
    依赖: (minimal)

第3层 - 消息与AI层
├── @sker/broker
│   依赖: @sker/models, @sker/store-client
│   外部: amqplib
│
├── @sker/ai
│   依赖: @sker/config, @sker/models
│   外部: openai, amqplib
│
└── @sker/engine
    依赖: @sker/broker, @sker/models, @sker/store-client
    外部: openai, anthropic, tiktoken, express

第4层 - 网关层
└── @sker/gateway
    依赖: @sker/broker, @sker/config, @sker/engine,
          @sker/models, @sker/store-client
    外部: express, socket.io, helmet, cors, jwt

第5层 - 前端组件层
├── @sker/canvas
├── @sker/components
├── @sker/state
└── @sker/protocols

第6层 - 应用层
└── @sker/studio
    依赖: (前端应用，通过 API 与后端通信)
    外部: react, reactflow, zustand, socket.io-client
```

### 2.2 运行时服务依赖图

```mermaid
graph TB
    %% 前端层
    Studio[@sker/studio<br/>React App] --> Gateway

    %% 网关层
    Gateway[@sker/gateway<br/>API Gateway] --> Broker
    Gateway --> StoreClient
    Gateway --> Engine

    %% 服务层
    Engine[@sker/engine<br/>AI Engine] --> Broker
    Engine --> StoreClient

    Broker[@sker/broker<br/>Message Broker] --> StoreClient
    Broker --> RabbitMQ

    %% 数据层
    StoreClient[@sker/store-client<br/>HTTP Client] --> Store
    Store[@sker/store<br/>Data Service] --> PostgreSQL
    Store --> Redis

    %% 基础设施
    RabbitMQ[(RabbitMQ)]
    PostgreSQL[(PostgreSQL)]
    Redis[(Redis)]

    %% 共享模块
    Gateway -.依赖.-> Models
    Engine -.依赖.-> Models
    Broker -.依赖.-> Models
    Store -.依赖.-> Models

    Models[@sker/models<br/>Types & Schemas]
    Config[@sker/config<br/>Configuration]

    Gateway -.依赖.-> Config
    Engine -.依赖.-> Config
    Store -.依赖.-> Config
```

## 三、关键数据流分析

### 3.1 AI 任务处理流程

```
用户操作 (Studio)
    ↓ WebSocket/HTTP
Gateway (API 网关)
    ↓ 发布任务消息
Broker (消息队列)
    ↓ 任务调度
Engine (AI 引擎)
    ↓ 处理结果
Store (数据存储)
    ↓ 状态更新事件
Broker (事件分发)
    ↓ WebSocket 推送
Studio (前端更新)
```

### 3.2 数据流关键节点

#### 节点1: Gateway API 路由
- **位置**: `packages/gateway/src/routes/`
- **职责**: HTTP 请求路由、参数验证、认证授权
- **输入**: HTTP Request
- **输出**: WebSocket Events, HTTP Response

#### 节点2: Broker 消息队列
- **位置**: `packages/broker/src/queue/`
- **职责**: 消息发布订阅、任务调度、负载均衡
- **输入**: AI 任务消息
- **输出**: 调度后的任务、处理结果

#### 节点3: Engine AI 处理
- **位置**: `packages/engine/src/core/`
- **职责**: LLM 调用、内容生成、语义分析
- **输入**: 上下文数据 + 用户提示词
- **输出**: AI 生成内容 + 元信息

#### 节点4: Store 数据持久化
- **位置**: `packages/store/src/repositories/`
- **职责**: 数据库操作、缓存管理、事务处理
- **输入**: 数据模型对象
- **输出**: 持久化结果

#### 节点5: Models 数据验证
- **位置**: `packages/models/src/`
- **职责**: 数据结构定义、类型验证、schema 校验
- **输入**: 原始数据
- **输出**: 验证后的类型安全数据

## 四、类型安全与数据安全

### 4.1 类型安全层次

```
@sker/models (TypeScript + Zod)
    ↓ 导出类型定义
@sker/store (Repository 层类型检查)
    ↓ 数据访问类型
@sker/store-client (HTTP 客户端类型)
    ↓ API 请求/响应类型
@sker/gateway (路由层类型验证)
    ↓ 请求参数类型
@sker/studio (前端状态类型)
```

### 4.2 数据验证点

1. **前端输入验证**: Studio 表单验证
2. **API 层验证**: Gateway express-validator
3. **模型层验证**: Models Zod schemas
4. **数据库层验证**: Store Joi + Repository 类型
5. **消息队列验证**: Broker 消息格式校验

## 五、测试策略与优先级

### 5.1 单元测试优先级

#### P0 - 核心模块（必须100%覆盖）

1. **@sker/models**
   - 数据模型定义
   - Zod schema 验证
   - 类型转换函数
   - 优先级：★★★★★

2. **@sker/store**
   - Repository 数据访问层
   - 数据库查询逻辑
   - 缓存策略
   - 优先级：★★★★★

3. **@sker/broker**
   - 消息发布订阅逻辑
   - 任务调度算法
   - 连接管理
   - 优先级：★★★★★

4. **@sker/engine**
   - AI 提示词构建
   - 响应解析逻辑
   - Token 计算
   - 优先级：★★★★☆

#### P1 - 重要模块（目标80%覆盖）

5. **@sker/gateway**
   - 路由处理
   - 中间件逻辑
   - WebSocket 事件处理
   - 优先级：★★★★☆

6. **@sker/store-client**
   - HTTP 请求封装
   - 错误处理
   - 重试逻辑
   - 优先级：★★★☆☆

7. **@sker/config**
   - 配置加载
   - 环境变量验证
   - 优先级：★★★☆☆

#### P2 - 辅助模块（目标60%覆盖）

8. **@sker/utils**
   - 工具函数
   - 优先级：★★☆☆☆

### 5.2 集成测试优先级

#### P0 - 关键流程

1. **AI 任务端到端流程**
   - 测试范围: Gateway → Broker → Engine → Store
   - 验证点: 任务创建、调度、执行、结果保存
   - 优先级：★★★★★

2. **用户认证与授权流程**
   - 测试范围: Gateway → Store
   - 验证点: 注册、登录、Token 验证
   - 优先级：★★★★★

3. **WebSocket 实时通信**
   - 测试范围: Studio ↔ Gateway ↔ Broker
   - 验证点: 连接建立、消息推送、断线重连
   - 优先级：★★★★☆

#### P1 - 重要流程

4. **数据库迁移和种子数据**
   - 测试范围: Store migrations
   - 验证点: Schema 创建、数据迁移、回滚
   - 优先级：★★★★☆

5. **消息队列可靠性**
   - 测试范围: Broker ↔ RabbitMQ
   - 验证点: 消息确认、重试、死信队列
   - 优先级：★★★☆☆

### 5.3 性能测试关注点

1. **并发 AI 任务处理** (Engine)
2. **大量节点渲染性能** (Studio)
3. **数据库查询优化** (Store)
4. **WebSocket 连接数压力** (Gateway)
5. **消息队列吞吐量** (Broker)

## 六、测试实施计划

### 第一阶段：核心模块单元测试（Week 1-2）

```bash
# 优先级顺序
1. @sker/models       - 类型安全基础
2. @sker/store        - 数据持久化
3. @sker/broker       - 消息调度
4. @sker/engine       - AI 处理
```

### 第二阶段：服务集成测试（Week 3）

```bash
# 关键流程
1. AI 任务端到端流程测试
2. 用户认证流程测试
3. WebSocket 通信测试
```

### 第三阶段：完善与优化（Week 4）

```bash
# 补充测试
1. Gateway 路由测试
2. Store-Client HTTP 客户端测试
3. 错误处理和边界条件测试
4. 性能基准测试
```

## 七、测试覆盖率目标

```yaml
核心包目标:
  @sker/models: 100%
  @sker/store: 95%+
  @sker/broker: 90%+
  @sker/engine: 85%+

服务包目标:
  @sker/gateway: 80%+
  @sker/store-client: 75%+
  @sker/config: 70%+

工具包目标:
  @sker/utils: 60%+
  @sker/backend: 60%+

整体目标: 80%+
```

## 八、质量检查清单

### 类型安全检查
- [ ] 所有包通过 `pnpm typecheck`
- [ ] 无 `any` 类型滥用
- [ ] 接口定义完整
- [ ] 泛型使用恰当

### 数据安全检查
- [ ] 输入数据验证完整
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] 敏感数据加密

### 流程完整性检查
- [ ] 错误处理覆盖所有异常路径
- [ ] 日志记录完整
- [ ] 事务处理正确
- [ ] 资源清理及时
- [ ] 超时处理合理

## 九、持续集成要求

```yaml
CI Pipeline:
  pre-commit:
    - lint: eslint
    - typecheck: tsc --noEmit
    - format: prettier

  pre-push:
    - unit-tests: vitest run
    - build: pnpm build

  PR merge:
    - integration-tests: jest --coverage
    - e2e-tests: playwright
    - coverage-check: >80%
```

## 十、关键测试工具

```yaml
单元测试:
  - vitest (packages)
  - jest (legacy/integration)

集成测试:
  - supertest (HTTP API)
  - socket.io-client (WebSocket)
  - testcontainers (PostgreSQL/Redis/RabbitMQ)

E2E测试:
  - playwright (Studio 前端)

Mock工具:
  - vitest mock
  - nock (HTTP)
  - sinon (复杂场景)

覆盖率:
  - c8 / istanbul
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-02
**负责团队**: SKER 测试组
