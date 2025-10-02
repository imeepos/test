# @sker/protocols

SKER 系统的协议定义和验证器包，提供类型安全的契约定义和运行时验证。

## ✨ 特性

- 🎯 **简洁清晰** - 只保留核心协议，删除所有冗余代码
- 🛡️ **类型安全** - 编译时 TypeScript 类型检查 + 运行时 Zod 验证
- 📦 **Result 类型** - 函数式错误处理，避免异常抛出
- 🔄 **版本管理** - 协议版本化，支持平滑升级
- ✅ **详细错误** - 验证失败时提供清晰的错误信息
- 🎨 **事件驱动** - 类型安全的事件系统 EventKey<T>

## 📦 安装

```bash
pnpm install @sker/protocols
```

## 🏗️ 核心协议

### 1. AI 处理协议（V2）

统一的 `context + prompt` 模式，所有 AI 任务平等对待。

```typescript
import { AIProcessRequest, AIProcessResponse } from '@sker/protocols'

// 创建 AI 处理请求
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: uuid(),
  projectId: uuid(),
  userId: uuid(),
  context: '需求分析的内容',  // 上下文
  prompt: '分析技术架构',     // 用户意图
  timestamp: new Date()
}

// 处理响应
const response: AIProcessResponse = {
  taskId: '...',
  nodeId: '...',
  status: 'completed',
  success: true,
  result: {
    content: '生成的内容',
    title: '自动生成的标题',
    confidence: 0.95
  },
  stats: {
    modelUsed: 'gpt-4',  // 系统自动选择的模型
    processingTime: 1500
  },
  timestamp: new Date()
}
```

**核心理念**：
- ❌ 没有任务类型（generate/optimize/fusion）
- ❌ 没有优先级设置（所有任务平等）
- ❌ 没有模型参数（系统自动选择）
- ✅ 只关注 context + prompt → content

### 2. 节点协议

定义画布节点的数据结构。

```typescript
import { Node } from '@sker/protocols'

const node: Node = {
  id: uuid(),
  projectId: uuid(),
  userId: uuid(),
  content: '节点内容',
  title: '节点标题',
  position: { x: 100, y: 100 },
  status: 'idle',
  importance: 3,
  confidence: 0.8,
  tags: ['电商', '需求'],
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 3. 事件系统（类型安全）

使用 EventKey<T> 确保编译时类型安全。

```typescript
import { EventKeys, TypeSafeEventBus } from '@sker/protocols'

// 订阅事件 - 类型自动推断
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  // event 类型自动为 AITaskCompletedEvent
  console.log(event.result.content)      // ✅ 类型安全
  console.log(event.result.confidence)   // ✅ 类型安全
})

// 发布事件 - 编译时检查
eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
  taskId: '...',
  nodeId: '...',
  result: {
    content: '生成的内容',
    title: '标题',
    confidence: 0.9
  },
  processingTime: 1500,
  timestamp: new Date()
  // TypeScript 会检查所有必需字段
})
```

## 🔧 验证器

### AI 处理验证

```typescript
import {
  validateAIProcessRequest,
  validateAIProcessResponse
} from '@sker/protocols'

// 验证请求
const result = validateAIProcessRequest(data)

if (result.success) {
  const request = result.value
  console.log('有效请求:', request.prompt)
} else {
  console.error('验证失败:', result.error.getFormattedMessage())
  result.error.issues.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`)
  })
}
```

### 节点验证

```typescript
import { validateNode, validateCreateNode } from '@sker/protocols'

const result = validateNode(data)

if (result.success) {
  const node = result.value
  // 类型安全的节点数据
}
```

### 类型守卫

```typescript
import {
  isValidAIProcessRequest,
  isValidNode
} from '@sker/protocols'

if (isValidAIProcessRequest(data)) {
  // TypeScript 知道 data 是 AIProcessRequest
  console.log(data.prompt)
}
```

## 📊 协议版本

```typescript
import { PROTOCOLS_VERSION, PROTOCOL_VERSIONS } from '@sker/protocols'

console.log(PROTOCOLS_VERSION)  // '2.0.0'
console.log(PROTOCOL_VERSIONS)  // { aiProcess: '2.0.0', node: '1.0.0' }
```

## 🎯 使用场景

### 场景 1: 一生万物（双击画布创建）

```typescript
// 用户双击画布
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: newNodeId,
  projectId: currentProjectId,
  userId: currentUserId,
  context: '',  // 无上下文
  prompt: '我想做一个电商网站',
  timestamp: new Date()
}

// 系统自动选择模型并生成内容
```

### 场景 2: 一生二（拖拽连线扩展）

```typescript
// 从父节点扩展
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: childNodeId,
  projectId: currentProjectId,
  userId: currentUserId,
  context: parentNode.content,  // 父节点作为上下文
  prompt: '分析技术架构',
  timestamp: new Date()
}
```

### 场景 3: 二生三（多输入融合）

```typescript
// 融合多个节点
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: fusionNodeId,
  projectId: currentProjectId,
  userId: currentUserId,
  context: `${node1.content}\n\n---\n\n${node2.content}`,
  prompt: '综合以上分析，制定产品MVP方案',
  timestamp: new Date(),
  metadata: {
    sourceNodeIds: [node1.id, node2.id]
  }
}
```

## 📚 API 参考

### 协议契约

#### AI 处理协议
- `AIProcessRequest` - AI 处理请求
- `AIProcessResponse` - AI 处理响应
- `AIGeneratedContent` - AI 生成的内容
- `AIProcessingStats` - 处理统计信息
- `TaskProgressUpdate` - 任务进度更新

#### 节点协议
- `Node` - 节点实体
- `CreateNodeRequest` - 创建节点请求
- `UpdateNodeRequest` - 更新节点请求
- `NodeStatus` - 节点状态
- `NodePosition` - 节点位置

#### 事件系统
- `EventKeys` - 所有事件键常量
- `TypeSafeEventBus` - 类型安全的事件总线接口
- `AITaskCompletedEvent` - AI 任务完成事件
- `NodeCreatedEvent` - 节点创建事件
- `ConnectionCreatedEvent` - 连接创建事件

### 验证器

#### AI 处理验证器
- `validateAIProcessRequest(data)` - 验证 AI 处理请求
- `validateAIProcessResponse(data)` - 验证 AI 处理响应
- `validateTaskProgressUpdate(data)` - 验证进度更新
- `isValidAIProcessRequest(data)` - 类型守卫

#### 节点验证器
- `validateNode(data)` - 验证节点实体
- `validateCreateNode(data)` - 验证创建请求
- `validateUpdateNode(data)` - 验证更新请求
- `isValidNode(data)` - 类型守卫

#### 核心工具
- `validate(schema, data)` - 通用验证
- `validateFromJSON(schema, json)` - 从 JSON 验证
- `validateFromBuffer(schema, buffer)` - 从 Buffer 验证

### Result 类型

- `ok(value)` - 创建成功结果
- `err(error)` - 创建失败结果
- `map(result, fn)` - 映射成功值
- `flatMap(result, fn)` - 链式映射
- `unwrap(result)` - 解包（失败时抛出）
- `unwrapOr(result, defaultValue)` - 解包或返回默认值

## 🏗️ 项目结构

```
src/
├── contracts/                      ← 协议定义
│   ├── ai-process.contract.ts      ← AI 处理协议（V2）
│   ├── node.contract.ts            ← 节点协议
│   └── index.ts
├── events/                         ← 类型安全事件系统
│   ├── event-keys.ts
│   ├── event-types.ts
│   ├── event-registry.ts
│   ├── event-bus.interface.ts
│   └── index.ts
├── validators/                     ← 验证器
│   ├── result.ts
│   ├── errors.ts
│   ├── message.validator.ts
│   ├── ai-process.validator.ts
│   ├── node.validator.ts
│   └── index.ts
└── index.ts                        ← 主导出
```

## 🔄 从旧版迁移

### AI 任务协议（V1 → V2）

```typescript
// ❌ 旧版 V1
const task: AITaskMessage = {
  type: 'generate',
  inputs: ['需求'],
  priority: 'high',
  parameters: { model: 'gpt-4' }
}

// ✅ 新版 V2
const request: AIProcessRequest = {
  context: '需求的内容',
  prompt: '生成技术方案'
  // 系统自动选择模型和优先级
}
```

### 事件系统（旧版 → 新版）

```typescript
// ❌ 旧版 - 没有类型检查
eventBus.on('ai.task.completed', (data: any) => {
  console.log(data.result)
})

// ✅ 新版 - 类型安全
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  console.log(event.result.content)  // 类型安全
})
```

## 📖 相关文档

- [使用示例](./USAGE_EXAMPLES.md) - 详细的使用示例
- [协议架构](./PROTOCOL_ARCHITECTURE.md) - 协议关系和设计依据
- [清理总结](./CLEANUP_SUMMARY.md) - 代码清理总结
- [重新设计方案](./REDESIGN_PLAN.md) - 完整的重新设计文档

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 构建
pnpm build
```

## 📝 许可证

MIT

---

**版本**: 2.0.0
**最后更新**: 2025-10-02
