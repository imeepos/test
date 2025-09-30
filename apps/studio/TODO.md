# Studio画布后端交互功能修复任务清单

## 📊 总体进度
- **总任务数**: 23个
- **已完成**: 8个 (AI核心服务完全修复 ✅)
- **高优先级剩余**: 4个 (数据持久化)
- **中优先级**: 9个 (版本管理 + 协作功能)
- **必要优先级**: 6个 (安全与性能)
- **完成率**: 35% (8/23)

## 🔥 Phase 1: 核心AI服务集成 (高优先级)

### ✅ 已分析的问题
- [x] WebSocket到Gateway的AI请求路由分析完成
- [x] 前端AI服务调用链路分析完成
- [x] 微服务架构通信机制分析完成

### 🚨 已修复的AI服务问题

#### 1.1 WebSocket消息匹配机制修复
- [x] **问题**: `websocketService.handleMessage()` 响应消息匹配机制错误
- [x] **位置**: `apps/studio/src/services/websocketService.ts:210-249`
- [x] **修复**: 修复响应消息根据requestId正确匹配请求的机制
- [x] **更新内容**:
  - 修复了响应消息处理中的requestId匹配逻辑
  - 确保sendMessage方法正确设置和传递requestId
  - 优化消息队列处理机制
- [x] **验收标准**: WebSocket请求和响应能正确匹配，不会出现混乱

#### 1.2 NodeService AI调用统一化修复
- [x] **问题**: `nodeService.createNode()` 中的标题生成直接调用aiService HTTP API
- [x] **位置**: `apps/studio/src/services/nodeService.ts:81-86`
- [x] **修复**: 将标题生成改为通过WebSocket而非直接HTTP API调用
- [x] **更新内容**:
  - 统一所有AI请求都通过WebSocket发送
  - 确保前端不会绕过WebSocket直接调用AI HTTP API
- [x] **验收标准**: 所有AI调用都通过统一的WebSocket通道

### ✅ 已修复的AI服务问题

#### 1.2 Gateway到Broker消息队列分发
- [x] **问题**: Gateway接收WebSocket消息后未正确发布到RabbitMQ
- [x] **位置**: Gateway的AI请求处理逻辑
- [x] **修复**: 实现Gateway到`llm.process.queue`的消息分发
- [x] **涉及文件**:
  - `packages/gateway/src/messaging/QueueManager.ts` - 统一队列常量配置
  - `packages/gateway/src/server/GatewayServer.ts` - 队列配置修复
- [x] **验收标准**: AI请求能正确进入消息队列并被Engine处理
- [x] **更新内容**:
  - 使用@sker/models中的QUEUE_NAMES和EXCHANGE_NAMES常量
  - 修复publishAITask方法使用正确的路由键和交换机
  - 统一消息优先级使用MESSAGE_PROPERTIES常量

#### 1.3 Engine AI任务处理完善
- [x] **问题**: Engine可能未正确处理所有AI任务类型
- [x] **位置**: `packages/engine` - AI处理逻辑
- [x] **修复**: 确保支持 generate/optimize/fusion/expand 等任务类型
- [x] **涉及文件**:
  - `packages/engine/src/messaging/AITaskQueueConsumer.ts` - 新增队列消费者
  - `packages/engine/src/server/index.ts` - 多模式启动支持
  - `packages/engine/package.json` - 添加@sker/store依赖
- [x] **验收标准**: 各种AI任务类型都能正确生成内容并返回
- [x] **更新内容**:
  - 创建AITaskQueueConsumer支持队列消费
  - 支持HTTP API、队列消费者、双模式三种运行方式
  - 集成StoreClient进行结果保存
  - 完整支持generate/optimize/fusion/analyze/expand任务类型

#### 1.4 AI结果实时反馈机制
- [x] **问题**: AI生成结果无法实时推送给前端
- [x] **位置**: Broker到Gateway的结果通知链路
- [x] **修复**: 实现`result.notify.queue`到WebSocket的结果推送
- [x] **验收标准**: AI生成过程中前端能实时看到状态更新
- [x] **更新内容**:
  - Engine处理完成后发布结果到result.notify.queue
  - Gateway正确监听AI_RESULTS队列
  - 支持processing、completed、failed状态的实时推送
  - 通过WebSocket转发结果给前端用户

## 🗄️ Phase 2: 数据持久化 (高优先级)

### 2.1 节点CRUD API后端集成
- [ ] **问题**: 前端节点操作未与@sker/store服务集成
- [ ] **位置**: `apps/studio/src/stores/nodeStore.ts` - 节点状态管理
- [ ] **修复**: 实现节点CRUD操作的后端API调用
- [ ] **涉及文件**:
  - `packages/store` - 数据持久化服务
  - `packages/gateway/src/factory/createGateway.ts` - API路由
- [ ] **验收标准**: 节点创建/更新/删除后能正确保存到PostgreSQL

#### 2.2 项目管理后端服务
- [ ] **问题**: 画布项目无法保存和加载
- [ ] **位置**: `apps/studio/src/stores/canvasStore.ts` - 画布状态管理
- [ ] **修复**: 实现项目的创建、保存、加载API
- [ ] **验收标准**: 用户能保存画布项目并在下次访问时加载

#### 2.3 画布状态自动保存
- [ ] **问题**: 画布状态变更未自动保存
- [ ] **位置**: 画布状态变更监听
- [ ] **修复**: 实现画布状态变更的自动保存机制
- [ ] **验收标准**: 画布状态变更后能自动保存到后端

#### 2.4 数据同步策略优化
- [ ] **问题**: 前后端数据同步可能有延迟或冲突
- [ ] **位置**: 数据同步逻辑
- [ ] **修复**: 设计高效的数据同步和冲突解决机制
- [ ] **验收标准**: 数据同步快速且无冲突

## 📚 Phase 3: 版本管理系统 (中优先级)

### 3.1 节点版本历史后端存储
- [ ] **问题**: 节点版本历史只在前端显示，无后端存储
- [ ] **位置**: `apps/studio/src/components/canvas/ContextMenu.tsx:349` - 版本历史查看
- [ ] **修复**: 实现版本历史的数据库存储和查询
- [ ] **验收标准**: 版本历史能持久化保存并查询

### 3.2 版本Diff和回滚机制
- [ ] **问题**: 版本对比和回滚功能未实现
- [ ] **位置**: 版本管理UI
- [ ] **修复**: 实现版本内容对比和安全回滚功能
- [ ] **验收标准**: 用户能查看版本差异并回滚到历史版本

### 3.3 版本管理用户界面
- [ ] **问题**: 版本管理UI功能不完整
- [ ] **位置**: `apps/studio/src/components/version/` - 版本组件
- [ ] **修复**: 完善版本历史界面和交互
- [ ] **验收标准**: 版本管理界面功能完整易用

## 🤝 Phase 4: 协作功能 (中优先级)

### 4.1 多用户实时同步
- [ ] **问题**: 缺乏多用户协作的实时同步机制
- [ ] **位置**: WebSocket实时通信
- [ ] **修复**: 实现多用户画布状态实时同步
- [ ] **验收标准**: 多用户同时编辑时能实时看到彼此的变更

### 4.2 用户权限和协作控制
- [ ] **问题**: 缺乏用户权限控制机制
- [ ] **位置**: 用户权限管理
- [ ] **修复**: 实现基于角色的权限控制
- [ ] **验收标准**: 不同权限用户有不同的操作权限

### 4.3 协作冲突解决
- [ ] **问题**: 多用户编辑时的冲突解决机制缺失
- [ ] **位置**: 并发编辑处理
- [ ] **修复**: 设计和实现协作冲突解决策略
- [ ] **验收标准**: 协作冲突能自动或手动解决

### 4.4 大规模协作性能优化
- [ ] **问题**: 大量用户协作时的性能问题
- [ ] **位置**: 协作性能优化
- [ ] **修复**: 优化大规模协作的性能表现
- [ ] **验收标准**: 支持10+用户同时协作且性能良好

## 🔒 Phase 5: 安全与性能 (必要优先级)

### 5.1 用户认证系统
- [ ] **问题**: WebSocket认证使用临时guest用户
- [ ] **位置**: `apps/studio/src/services/websocketService.ts:255` - 认证方法
- [ ] **修复**: 实现完整的JWT用户认证系统
- [ ] **验收标准**: 用户能正确登录并获得授权访问

### 5.2 数据访问权限控制
- [ ] **问题**: 缺乏数据访问权限控制
- [ ] **位置**: API权限中间件
- [ ] **修复**: 实现基于用户的数据访问控制
- [ ] **验收标准**: 用户只能访问有权限的数据

### 5.3 大量节点性能优化
- [ ] **问题**: 大量节点时的性能表现需要优化
- [ ] **位置**: `apps/studio/src/components/canvas/Canvas.tsx` - 节点渲染
- [ ] **修复**: 优化大量节点的渲染和交互性能
- [ ] **验收标准**: 支持500+节点时仍保持流畅操作

### 5.4 数据备份和恢复
- [ ] **问题**: 缺乏数据备份和恢复机制
- [ ] **位置**: 数据安全保障
- [ ] **修复**: 实现自动数据备份和恢复功能
- [ ] **验收标准**: 数据能定期备份且可恢复

## 🎯 具体技术实施要点

### API端点设计
```typescript
// 需要实现的主要API端点
/api/ai/generate          // AI内容生成
/api/nodes/*             // 节点CRUD操作
/api/projects/*          // 项目管理
/api/versions/*          // 版本管理
/api/collaboration/*     // 协作功能
/api/auth/*             // 用户认证
```

### WebSocket事件设计
```typescript
// 需要实现的WebSocket事件
AI_GENERATE_REQUEST      // AI生成请求
AI_GENERATE_RESPONSE     // AI生成结果
NODE_UPDATE             // 节点更新广播
PROJECT_SYNC            // 项目状态同步
USER_JOINED             // 用户加入协作
USER_LEFT               // 用户离开协作
```

### 数据模型对齐
```typescript
// 前端AINode与后端Node模型的映射
interface NodeDataMapping {
  frontend: AINode        // apps/studio/src/types/node.ts
  backend: BackendNode    // packages/store数据模型
  converter: NodeDataConverter // 数据转换层
}
```

## 🧪 测试和验证标准

### 功能测试
- [x] AI生成功能的端到端测试 (核心数据流已修复)
- [ ] 节点CRUD操作的完整性测试
- [ ] 项目保存和加载的可靠性测试
- [ ] 版本管理功能的正确性测试
- [ ] 多用户协作的同步测试

### 性能测试
- [ ] 大量节点(500+)的性能测试
- [ ] 并发用户(10+)的协作测试
- [ ] AI请求的响应时间测试
- [ ] 数据同步的延迟测试

### 安全测试
- [ ] 用户认证和授权的安全测试
- [ ] 数据访问权限的验证测试
- [ ] WebSocket通信的安全测试

---

**注意**: 这个TODO列表需要根据实际修复进展动态更新。每完成一个任务就标记为已完成，遇到新问题时及时添加到列表中。

**优先级说明**:
- 🔥 **高优先级**: 影响核心功能，必须优先修复
- ⚡ **中优先级**: 增强用户体验，重要但不紧急
- 🔧 **必要优先级**: 生产环境必需，影响安全和稳定性

## 🚀 AI服务修复后的启动指南

### Engine服务启动选项

**队列消费者模式 (推荐)**
```bash
cd packages/engine
ENGINE_RUN_MODE=queue pnpm run server:dev
```

**HTTP API独立模式**
```bash
cd packages/engine
ENGINE_RUN_MODE=http pnpm run server:dev
```

**双模式 (开发环境)**
```bash
cd packages/engine
ENGINE_RUN_MODE=both pnpm run server:dev
```

### 环境变量配置

**Engine必需环境变量**
```env
# AI服务配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1

# 队列配置
RABBITMQ_URL=amqp://localhost:5672
ENGINE_RUN_MODE=queue

# Store服务配置
STORE_API_URL=http://localhost:3001
STORE_AUTH_TOKEN=your-auth-token

# 队列处理配置
QUEUE_CONCURRENCY=5
QUEUE_RETRY_ATTEMPTS=3
QUEUE_PREFETCH_COUNT=10
```

**Gateway环境变量**
```env
# 消息队列配置
RABBITMQ_URL=amqp://localhost:5672

# 前端CORS配置
FRONTEND_URL=http://localhost:3000

# JWT配置
JWT_SECRET=your-jwt-secret-key
```

### ✅ 已修复的数据流
```
Frontend WebSocket → Gateway → Broker(llm.process.queue) → Engine Consumer → AI Processing → StoreClient(HTTP) → Engine → Broker(result.notify.queue) → Gateway → Frontend WebSocket
```

### 🎯 下一步优先任务
1. **节点CRUD API后端集成** - 实现前端节点操作与Store服务的集成
2. **项目管理后端服务** - 实现画布项目的保存和加载功能
3. **画布状态自动保存** - 实现状态变更的自动保存机制
4. **数据同步策略优化** - 设计高效的数据同步和冲突解决