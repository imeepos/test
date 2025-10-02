# 协议架构分析

## 📋 协议概览

当前协议包中有 **4 个核心协议文件**：

| 协议文件 | 版本 | 状态 | 用途 |
|---------|------|------|------|
| `ai-process.contract.ts` | V2 | ✅ 当前使用 | AI 处理请求/响应 |
| `ai-task.contract.ts` | V1 | ⚠️ 兼容保留 | AI 任务（旧版） |
| `node.contract.ts` | V1 | ✅ 当前使用 | 画布节点实体 |
| `event.contract.ts` | V1 | ⚠️ 待废弃 | 领域事件（旧版） |

---

## 🔗 协议关系图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户操作                              │
│           （双击画布/拖拽连线/多输入融合/内容编辑）              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Node (节点协议)       │ ◄─── 画布上的实体
         │   node.contract.ts    │      (内容、位置、状态)
         └───────────┬───────────┘
                     │
                     │ 用户触发 AI 处理
                     ▼
         ┌───────────────────────┐
         │ AIProcessRequest (V2) │ ◄─── AI 处理请求
         │ ai-process.contract   │      (context + prompt)
         └───────────┬───────────┘
                     │
                     │ 系统自动选择模型并处理
                     ▼
         ┌───────────────────────┐
         │ AIProcessResponse (V2)│ ◄─── AI 处理响应
         │ ai-process.contract   │      (content + stats)
         └───────────┬───────────┘
                     │
                     │ 发布事件通知各服务
                     ▼
         ┌───────────────────────┐
         │   Event (新版事件)      │ ◄─── 类型安全的事件
         │   events/             │      (EventKey<T>)
         └───────────┬───────────┘
                     │
                     │ 更新节点状态
                     ▼
         ┌───────────────────────┐
         │   Node (更新后)        │ ◄─── 节点状态变更
         │   node.contract.ts    │      (content, status)
         └───────────────────────┘
```

---

## 🎯 业务场景分析

### 场景 1: 一生万物（双击画布创建）

```typescript
// 1. 前端创建节点
const node: Node = {
  id: uuid(),
  projectId: currentProjectId,
  userId: currentUserId,
  content: '',              // 初始为空
  position: { x: 100, y: 100 },
  status: 'idle',           // 初始状态
  // ... 其他字段
}

// 2. 用户输入提示词，触发 AI 处理
const aiRequest: AIProcessRequest = {
  taskId: uuid(),
  nodeId: node.id,
  projectId: currentProjectId,
  userId: currentUserId,
  context: '',              // 无上下文
  prompt: '我想做一个电商网站',
  timestamp: new Date()
}

// 3. Engine 处理并返回结果
const aiResponse: AIProcessResponse = {
  // ...
  success: true,
  result: {
    content: '电商网站需求分析：...',
    title: '电商网站需求',
    confidence: 0.95
  },
  stats: {
    modelUsed: 'gpt-4',    // 系统自动选择
    processingTime: 1500
  }
}

// 4. 发布事件
eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
  taskId: aiRequest.taskId,
  nodeId: node.id,
  result: aiResponse.result,
  processingTime: aiResponse.stats.processingTime,
  timestamp: new Date()
})

// 5. 更新节点
node.content = aiResponse.result.content
node.title = aiResponse.result.title
node.status = 'completed'
```

**涉及的协议**：
- ✅ `Node` (node.contract.ts) - 节点实体
- ✅ `AIProcessRequest/Response` (ai-process.contract.ts) - AI 处理
- ✅ `AITaskCompletedEvent` (events/) - 事件通知

---

### 场景 2: 一生二（拖拽连线扩展）

```typescript
// 1. 用户从父节点拖拽创建子节点
const parentNode: Node = {
  id: 'parent-id',
  content: '电商网站需求分析：...',
  title: '电商网站需求',
  // ...
}

const childNode: Node = {
  id: uuid(),
  parentId: parentNode.id,  // 指向父节点
  // ...
}

// 2. 触发 AI 处理，使用父节点内容作为上下文
const aiRequest: AIProcessRequest = {
  taskId: uuid(),
  nodeId: childNode.id,
  projectId: currentProjectId,
  userId: currentUserId,
  context: parentNode.content,  // 父节点内容
  prompt: '分析技术架构',
  timestamp: new Date()
}

// 3-5. 同场景1
```

**涉及的协议**：
- ✅ `Node` - 父子节点关系
- ✅ `AIProcessRequest/Response` - AI 处理
- ✅ `ConnectionCreatedEvent` (events/) - 连接创建事件

---

### 场景 3: 二生三（多输入融合）

```typescript
// 1. 用户选择多个节点进行融合
const nodes: Node[] = [
  { id: 'node-1', content: '需求分析：...' },
  { id: 'node-2', content: '技术架构：...' }
]

const fusionNode: Node = {
  id: uuid(),
  // ...
}

// 2. 融合上下文
const aiRequest: AIProcessRequest = {
  taskId: uuid(),
  nodeId: fusionNode.id,
  projectId: currentProjectId,
  userId: currentUserId,
  context: nodes.map(n => `${n.title}\n${n.content}`).join('\n\n---\n\n'),
  prompt: '综合以上分析，制定产品MVP方案',
  timestamp: new Date(),
  metadata: {
    sourceNodeIds: nodes.map(n => n.id)  // 记录来源
  }
}

// 3-5. 同场景1
```

**涉及的协议**：
- ✅ `Node` - 多个源节点
- ✅ `AIProcessRequest` - 包含 metadata.sourceNodeIds
- ✅ `AIProcessResponse` - 融合结果

---

## 🏗️ 设计依据

### 1. 分层职责

```
┌─────────────────────────────────────────┐
│         应用层 (Frontend/Backend)        │  使用协议，不定义协议
├─────────────────────────────────────────┤
│           协议层 (Protocols)            │  定义契约，不包含逻辑
├─────────────────────────────────────────┤
│      领域层 (Domain/Business Logic)     │  业务逻辑，遵循协议
└─────────────────────────────────────────┘
```

#### Node 协议 (node.contract.ts)
**职责**：定义画布节点的数据结构

**设计依据**：
- 节点是系统的**核心领域实体**
- 需要跨服务共享（Frontend ↔ Backend ↔ Engine）
- 包含：内容、位置、状态、元数据

**为什么独立**：
- 节点生命周期独立于 AI 处理
- 用户可以手动创建/编辑节点（不触发 AI）
- 节点需要持久化到数据库

---

#### AI Process 协议 (ai-process.contract.ts)
**职责**：定义 AI 处理的请求/响应格式

**设计依据**：
- AI 处理是**临时性操作**，不是持久化实体
- 遵循 `context + prompt → content` 模式
- 系统自动选择模型和参数

**为什么独立**：
- AI 处理流程与节点管理解耦
- 同一个节点可能触发多次 AI 处理
- AI 处理可以失败/重试，不影响节点存在

---

#### Event 协议 (events/)
**职责**：定义系统事件，用于服务间通信

**设计依据**：
- 事件驱动架构 (EDA)
- 服务解耦
- 类型安全的事件订阅/发布

**为什么独立**：
- 事件是**横切关注点**，不属于任何特定实体
- 多个服务需要监听同一事件
- 支持事件溯源和审计

---

### 2. 为什么有两个 AI 协议？

| 协议 | 状态 | 设计理念 |
|------|------|---------|
| `ai-task.contract.ts` (V1) | ⚠️ 遗留 | 任务类型驱动 (generate/optimize/fusion) |
| `ai-process.contract.ts` (V2) | ✅ 推荐 | 内容驱动 (context + prompt) |

**迁移计划**：
1. V2 用于所有新开发
2. V1 保留用于兼容性
3. 逐步迁移现有代码到 V2
4. 最终废弃 V1

---

### 3. 为什么有两个事件系统？

| 事件系统 | 状态 | 特点 |
|---------|------|------|
| `event.contract.ts` (V1) | ⚠️ 待废弃 | 通用领域事件，类型不安全 |
| `events/` (新版) | ✅ 推荐 | 类型安全的 EventKey<T> |

**新版优势**：
```typescript
// ❌ 旧版：没有类型检查
eventBus.on('ai.task.completed', (data: any) => {
  // data 是 any 类型，容易出错
})

// ✅ 新版：完全类型安全
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  // event 类型自动推断为 AITaskCompletedEvent
  console.log(event.result.content)  // 类型安全
})
```

---

## 🔄 数据流向

### 完整流程

```
用户操作
   │
   ▼
┌─────────────┐
│  Frontend   │ 创建 Node 实体
└──────┬──────┘
       │ POST /api/nodes
       ▼
┌─────────────┐
│  Gateway    │ 验证 Node Schema
└──────┬──────┘
       │ 保存到数据库
       ▼
┌─────────────┐
│  Database   │ 持久化 Node
└──────┬──────┘
       │ 返回 Node
       ▼
┌─────────────┐
│  Frontend   │ 显示节点 + 等待用户输入
└──────┬──────┘
       │ 用户输入 prompt
       ▼
┌─────────────┐
│  Frontend   │ 创建 AIProcessRequest
└──────┬──────┘
       │ POST /api/ai/process
       ▼
┌─────────────┐
│  Gateway    │ 验证 AIProcessRequest Schema
└──────┬──────┘
       │ 发送到消息队列
       ▼
┌─────────────┐
│   Broker    │ 路由任务
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Engine    │ 执行 AI 处理
│             │ - 分析 context + prompt
│             │ - 选择模型 (gpt-4/claude-3)
│             │ - 调用 AI API
│             │ - 生成内容
└──────┬──────┘
       │ 返回 AIProcessResponse
       ▼
┌─────────────┐
│   Broker    │ 发布事件
│             │ EventKeys.AI_TASK_COMPLETED
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Gateway    │    │   Monitor   │    │  Analytics  │
│  更新 Node   │    │   记录指标   │    │   统计数据   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 📊 协议使用统计

### 各协议的使用频率

| 协议 | 使用场景 | 频率 |
|------|---------|------|
| `Node` | 创建/更新/查询节点 | 非常高 |
| `AIProcessRequest` | AI 处理请求 | 高 |
| `AIProcessResponse` | AI 处理响应 | 高 |
| `Event (新版)` | 系统事件通知 | 高 |
| `AITask (V1)` | 兼容性 | 逐步降低 |
| `Event (旧版)` | 兼容性 | 逐步降低 |

---

## 🎨 协议简化建议

### 问题诊断

当前存在的问题：
1. ❌ **两套 AI 协议** (V1 + V2) - 混淆
2. ❌ **两套事件系统** (旧版 + 新版) - 冗余
3. ⚠️ **Node 协议未完全匹配数据库** - 不一致

### 建议方案

#### 方案 A：激进清理（推荐）

```
删除：
├── ai-task.contract.ts (V1)        ❌ 完全废弃
├── event.contract.ts (旧版)        ❌ 完全废弃
└── event.validator.ts              ❌ 完全废弃

保留：
├── ai-process.contract.ts (V2)     ✅ 唯一 AI 协议
├── node.contract.ts                ✅ 补全字段
└── events/                         ✅ 唯一事件系统
    ├── event-keys.ts
    ├── event-types.ts
    ├── event-registry.ts
    └── event-bus.interface.ts
```

**优点**：
- 清晰简洁，没有历史包袱
- 新开发者容易理解
- 减少维护成本

**缺点**：
- 需要一次性迁移所有使用方
- 可能影响线上服务（需要灰度发布）

---

#### 方案 B：渐进迁移（保守）

```
标记废弃：
├── ai-task.contract.ts (V1)        ⚠️ @deprecated
├── event.contract.ts (旧版)        ⚠️ @deprecated
└── event.validator.ts              ⚠️ @deprecated

并行维护：
├── ai-process.contract.ts (V2)     ✅ 推荐
├── node.contract.ts                ✅ 改进
└── events/                         ✅ 推荐

迁移计划：
├── Sprint 1: 新功能使用 V2
├── Sprint 2: Engine 迁移到 V2
├── Sprint 3: Broker 迁移到 V2
└── Sprint 4: 删除 V1
```

**优点**：
- 风险可控
- 逐步验证新协议
- 可随时回滚

**缺点**：
- 过渡期维护成本高
- 需要同时维护两套协议

---

## 🎯 最终建议

### 1. 立即行动（高优先级）

✅ **废弃旧版事件系统**
```typescript
// src/contracts/event.contract.ts
/**
 * @deprecated 使用新的类型安全事件系统 (src/events/)
 *
 * 迁移指南：
 * 旧版: eventBus.on('ai.task.completed', handler)
 * 新版: eventBus.on(EventKeys.AI_TASK_COMPLETED, handler)
 */
export const DomainEventSchemaV1 = ...
```

✅ **废弃旧版 AI 协议**
```typescript
// src/contracts/ai-task.contract.ts
/**
 * @deprecated 使用新的 AI 处理协议 (ai-process.contract.ts)
 *
 * 迁移指南：
 * 旧版: { type: 'generate', inputs: [...], priority: 'high' }
 * 新版: { context: '...', prompt: '...' }
 */
export const AITaskType = ...
```

---

### 2. 中期优化（中优先级）

⚠️ **完善 Node 协议**
- 添加缺失字段（size, parentId, semanticTypes）
- 匹配数据库模型
- 参考 ANALYSIS_NODE_CONTRACT.md

---

### 3. 长期规划（低优先级）

📋 **考虑协议生成**
- 使用工具从数据库 Schema 自动生成 Node 协议
- 确保协议与数据库始终一致
- 减少手动维护

---

## 📚 总结

### 核心协议关系

```
Node (实体)
  ├─ 用户创建/编辑
  ├─ 触发 AI 处理 → AIProcessRequest
  └─ 接收 AI 结果 ← AIProcessResponse

AIProcess (操作)
  ├─ 输入: context + prompt
  ├─ 处理: 系统自动选择模型
  └─ 输出: content + stats

Event (通知)
  ├─ AI_TASK_COMPLETED → 更新 Node
  ├─ NODE_CREATED → 通知订阅者
  └─ CONNECTION_CREATED → 记录关系
```

### 设计原则

1. **单一职责** - 每个协议只负责一个领域
2. **平台无关** - 协议不依赖具体实现
3. **类型安全** - 编译时 + 运行时验证
4. **版本管理** - 支持平滑升级

### 下一步

1. ✅ 标记废弃旧协议（添加 @deprecated）
2. ⚠️ 完善 Node 协议（匹配数据库）
3. 📋 创建迁移指南（V1 → V2）
4. 🔧 更新服务集成（使用新协议）
