# 协议重新设计方案

## 🎯 核心原则

基于 MVP 设计文档和架构反馈，协议层应该：

1. **平等对待所有任务** - 不区分任务类型（generate/optimize/fusion等），统一为 `context + prompt`
2. **平台无关** - 协议层是前端/后端/微服务公用的规范
3. **职责单一** - 仅负责类型定义和验证，不包含业务逻辑
4. **类型安全** - 使用 Branded Types 确保编译时+运行时安全

## ❌ 当前问题

### 1. 错误的任务类型设计

```typescript
// ❌ 错误：区分任务类型，内置了业务逻辑
export const AITaskType = z.enum([
  'generate',  // 内容生成
  'optimize',  // 内容优化
  'fusion',    // 多输入融合
  'analyze',   // 语义分析
  'expand'     // 内容扩展
])
```

**问题**：
- 任务类型是业务逻辑，不应该在协议层定义
- 所有任务本质都是 `context + prompt → content`
- 增加新功能需要修改协议（违反开闭原则）

### 2. 缺少类型安全的事件系统

```typescript
// ❌ 错误：事件类型只是字符串常量
export const DomainEventTypes = {
  AI_TASK_QUEUED: 'ai.task.queued',
  AI_TASK_COMPLETED: 'ai.task.completed',
  // ...
} as const
```

**问题**：
- 事件监听时没有类型检查
- `eventBus.on('ai.task.completed', (data) => {})` - data 是 any 类型
- 拼写错误在运行时才发现

## ✅ 重新设计方案

### 1. 统一的 AI 处理请求

```typescript
/**
 * AI 处理请求 - 统一的任务格式
 * 不区分任务类型，所有任务都是 context + prompt
 */
export const AIProcessRequestSchema = z.object({
  // 任务标识
  taskId: z.string().uuid(),

  // 关联实体
  nodeId: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // ========================================
  // 核心：context + prompt
  // ========================================

  /**
   * 上下文信息 - 可以是单个或多个节点的内容
   * 由前端/Broker负责组装
   */
  context: z.string(),

  /**
   * 用户提示词 - 用户的意图表达
   */
  prompt: z.string(),

  // 可选的处理参数
  parameters: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    timeout: z.number().positive().optional()
  }).optional(),

  // 调度信息
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  timestamp: z.date(),

  // 元数据（用于追踪和调试）
  metadata: z.object({
    sourceNodeIds: z.array(z.string().uuid()).optional(), // 来源节点
    retryCount: z.number().int().min(0).optional(),
    sessionId: z.string().optional()
  }).optional()
}).strict()

export type AIProcessRequest = z.infer<typeof AIProcessRequestSchema>
```

### 2. 类型安全的事件系统

```typescript
/**
 * Branded Event Key - 编译时类型安全
 */
export type EventKey<T> = string & { readonly __eventType?: T }

/**
 * 创建类型安全的事件键
 */
export function createEventKey<T>(key: string): EventKey<T> {
  return key as EventKey<T>
}

// ========================================
// 定义所有事件类型
// ========================================

/** AI 任务已排队 */
export interface AITaskQueuedEvent {
  taskId: string
  nodeId: string
  projectId: string
  timestamp: Date
}

/** AI 任务处理中 */
export interface AITaskProcessingEvent {
  taskId: string
  nodeId: string
  progress: number
  message?: string
  timestamp: Date
}

/** AI 任务已完成 */
export interface AITaskCompletedEvent {
  taskId: string
  nodeId: string
  result: {
    content: string
    title: string
    semanticType?: string
    importanceLevel?: number
    confidence: number
  }
  processingTime: number
  timestamp: Date
}

/** AI 任务失败 */
export interface AITaskFailedEvent {
  taskId: string
  nodeId: string
  error: {
    code: string
    message: string
    retryable: boolean
  }
  timestamp: Date
}

/** 节点已创建 */
export interface NodeCreatedEvent {
  nodeId: string
  projectId: string
  userId: string
  position: { x: number; y: number }
  timestamp: Date
}

/** 节点已更新 */
export interface NodeUpdatedEvent {
  nodeId: string
  changes: Record<string, unknown>
  previousVersion: number
  newVersion: number
  reason?: string
  timestamp: Date
}

/** 连接已创建 */
export interface ConnectionCreatedEvent {
  connectionId: string
  sourceNodeId: string
  targetNodeId: string
  projectId: string
  timestamp: Date
}

// ========================================
// 类型安全的事件键常量
// ========================================

export const EventKeys = {
  // AI 任务事件
  AI_TASK_QUEUED: createEventKey<AITaskQueuedEvent>('ai.task.queued'),
  AI_TASK_PROCESSING: createEventKey<AITaskProcessingEvent>('ai.task.processing'),
  AI_TASK_COMPLETED: createEventKey<AITaskCompletedEvent>('ai.task.completed'),
  AI_TASK_FAILED: createEventKey<AITaskFailedEvent>('ai.task.failed'),

  // 节点事件
  NODE_CREATED: createEventKey<NodeCreatedEvent>('node.created'),
  NODE_UPDATED: createEventKey<NodeUpdatedEvent>('node.updated'),
  NODE_DELETED: createEventKey<{ nodeId: string; timestamp: Date }>('node.deleted'),

  // 连接事件
  CONNECTION_CREATED: createEventKey<ConnectionCreatedEvent>('connection.created'),
  CONNECTION_DELETED: createEventKey<{ connectionId: string; timestamp: Date }>('connection.deleted')
} as const

// ========================================
// 类型安全的事件总线接口
// ========================================

export interface TypeSafeEventBus {
  /**
   * 订阅事件 - 类型安全
   *
   * @example
   * eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
   *   // event 的类型自动推断为 AITaskCompletedEvent
   *   console.log(event.result.content)
   * })
   */
  on<T>(key: EventKey<T>, handler: (event: T) => void | Promise<void>): void

  /**
   * 发布事件 - 类型安全
   *
   * @example
   * eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
   *   taskId: '...',
   *   nodeId: '...',
   *   result: { ... },
   *   // TypeScript 会检查所有必需字段
   * })
   */
  emit<T>(key: EventKey<T>, event: T): void | Promise<void>

  /**
   * 取消订阅
   */
  off<T>(key: EventKey<T>, handler: (event: T) => void | Promise<void>): void
}
```

### 3. 简化的节点协议

```typescript
/**
 * 节点实体 - 匹配 MVP 设计
 */
export const NodeSchema = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 内容
  content: z.string(),
  title: z.string(),

  // 位置和尺寸
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  size: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),

  // 重要性和置信度
  importance: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  confidence: z.number().min(0).max(1),

  // 状态
  status: z.enum(['idle', 'processing', 'completed', 'error', 'deleted']),

  // 标签和语义类型
  tags: z.array(z.string()),
  semanticTypes: z.array(z.enum([
    'requirement',
    'solution',
    'plan',
    'analysis',
    'idea',
    'question',
    'answer',
    'decision'
  ])),

  // 层次结构
  parentId: z.string().uuid().optional(),

  // 版本控制
  version: z.number().int().positive(),

  // AI 生成标识
  aiGenerated: z.boolean(),

  // 完整的元数据
  metadata: z.object({
    // 评分
    userRating: z.number().int().min(1).max(5).optional(),
    aiRating: z.number().int().min(1).max(5).optional(),

    // 编辑历史
    editCount: z.number().int().nonnegative(),
    lastEditReason: z.string().optional(),

    // 统计数据
    statistics: z.object({
      viewCount: z.number().int().nonnegative(),
      editDurationTotal: z.number().nonnegative(),
      aiInteractions: z.number().int().nonnegative()
    }),

    // 处理历史
    processingHistory: z.array(z.object({
      timestamp: z.date(),
      operation: z.string(),
      modelUsed: z.string().optional(),
      tokenCount: z.number().int().optional(),
      processingTime: z.number().nonnegative(),
      confidenceBefore: z.number().min(0).max(1).optional(),
      confidenceAfter: z.number().min(0).max(1).optional()
    }))
  }),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Node = z.infer<typeof NodeSchema>
```

### 4. 连接协议

```typescript
/**
 * 连接实体 - 节点之间的关系
 */
export const ConnectionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  // 源节点和目标节点
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),

  // 连接顺序（用于多输入融合）
  orderIndex: z.number().int().nonnegative().optional(),

  // 连接类型
  type: z.enum(['flow', 'reference', 'dependency']).optional(),

  // 元数据
  metadata: z.object({
    label: z.string().optional(),
    strength: z.number().min(0).max(1).optional() // 连接强度
  }).optional(),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Connection = z.infer<typeof ConnectionSchema>
```

## 📦 新的包结构

```
packages/protocols/
├── src/
│   ├── contracts/
│   │   ├── ai-process.contract.ts      # AI处理协议（统一的 context+prompt）
│   │   ├── node.contract.ts            # 节点协议（完整匹配数据库）
│   │   ├── connection.contract.ts      # 连接协议
│   │   ├── project.contract.ts         # 项目协议
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── event-keys.ts               # 类型安全的事件键
│   │   ├── event-types.ts              # 所有事件类型定义
│   │   ├── event-bus.interface.ts      # 事件总线接口
│   │   └── index.ts
│   │
│   ├── validators/
│   │   ├── result.ts                   # Result 类型系统
│   │   ├── errors.ts                   # 错误类型
│   │   ├── message.validator.ts        # 核心验证器
│   │   ├── ai-process.validator.ts     # AI处理验证器
│   │   ├── node.validator.ts           # 节点验证器
│   │   └── index.ts
│   │
│   └── index.ts
```

## 🎯 使用示例

### 统一的 AI 处理

```typescript
import { AIProcessRequest, EventKeys } from '@sker/protocols'

// 前端：创建任务（不管是生成、优化还是融合）
async function createAITask(
  nodeId: string,
  context: string,  // 可以是单个节点或多个节点的内容
  prompt: string    // 用户输入的提示词
) {
  const request: AIProcessRequest = {
    taskId: uuid(),
    nodeId,
    projectId: currentProjectId,
    userId: currentUserId,
    context,      // 上下文
    prompt,       // 提示词
    priority: 'normal',
    timestamp: new Date()
  }

  await api.post('/ai/process', request)
}

// 示例1: 双击画布创建（一生万物）
createAITask(
  newNodeId,
  '',  // 无上下文
  '我想做一个电商网站'  // 用户提示词
)

// 示例2: 拖拽连线扩展（一生二）
createAITask(
  newNodeId,
  parentNode.content,  // 父节点内容作为上下文
  '分析这个需求的技术架构'  // 用户提示词
)

// 示例3: 多输入融合（二生三）
createAITask(
  fusionNodeId,
  `${node1.title}\n${node1.content}\n\n---\n\n${node2.title}\n${node2.content}`,  // 多个节点内容
  '综合以上分析，制定产品MVP方案'  // 用户提示词
)

// 示例4: 内容优化（万物重生）
createAITask(
  existingNodeId,
  `${existingNode.title}\n${existingNode.content}`,  // 当前内容作为上下文
  '增加更详细的技术实现细节'  // 优化提示词
)
```

### 类型安全的事件系统

```typescript
import { EventKeys, TypeSafeEventBus } from '@sker/protocols'

// 后端：发布事件
eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
  taskId: '...',
  nodeId: '...',
  result: {
    content: '生成的内容',
    title: '自动生成的标题',
    confidence: 0.85,
    importanceLevel: 4
  },
  processingTime: 1500,
  timestamp: new Date()
  // TypeScript 会确保所有字段都存在且类型正确
})

// 前端：订阅事件
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  // event 的类型自动推断为 AITaskCompletedEvent
  // 编辑器有完整的智能提示
  console.log(event.result.content)
  console.log(event.result.title)
  console.log(event.result.confidence)
})

// ✅ 类型安全：拼写错误在编译时发现
eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
  taskId: '...',
  nodeId: '...',
  // result: { ... }  // ❌ TypeScript 报错：缺少必需字段
})
```

## 🚀 迁移步骤

1. **Phase 1**: 创建新的事件系统
   - [ ] 实现 `EventKey<T>` 类型
   - [ ] 定义所有事件类型
   - [ ] 创建类型安全的事件键常量

2. **Phase 2**: 重构 AI 处理协议
   - [ ] 移除 `AITaskType` 枚举
   - [ ] 创建统一的 `AIProcessRequest`
   - [ ] 更新验证器

3. **Phase 3**: 完善节点协议
   - [ ] 匹配数据库模型
   - [ ] 添加缺失字段
   - [ ] 修正可选性

4. **Phase 4**: 更新服务
   - [ ] 更新 Engine 使用新协议
   - [ ] 更新 Broker 使用新协议
   - [ ] 更新 Gateway 使用新协议

5. **Phase 5**: 测试和文档
   - [ ] 编写集成测试
   - [ ] 更新文档
   - [ ] 部署验证
