# AI 处理协议使用示例

## 核心理念

**用户只关心：context + prompt → content**

- ❌ 没有任务类型区分（generate/optimize/fusion 等）
- ❌ 没有优先级设置（所有任务平等）
- ❌ 没有模型参数（系统自动选择最合适的模型）
- ✅ 只有上下文和提示词

系统根据 context + prompt 的内容自动：
- 选择最合适的 AI 模型
- 优化处理参数
- 管理任务调度

## 使用示例

### 场景 1: 一生万物（双击画布创建）

```typescript
import { AIProcessRequest } from '@sker/protocols'

const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: newNodeId,
  projectId: currentProjectId,
  userId: currentUserId,

  // 核心：无上下文 + 用户想法
  context: '',
  prompt: '我想做一个电商网站',

  timestamp: new Date()
}

// 发送请求
await api.post('/ai/process', request)
```

**系统行为**：
- 分析 prompt 复杂度
- 自动选择合适的模型（如 GPT-4）
- 生成初始需求内容

---

### 场景 2: 一生二（拖拽连线扩展）

```typescript
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: newNodeId,
  projectId: currentProjectId,
  userId: currentUserId,

  // 核心：父节点内容作为上下文
  context: parentNode.content,
  prompt: '分析这个需求的技术架构',

  timestamp: new Date()
}
```

**系统行为**：
- 分析 context 的内容长度和复杂度
- 根据 prompt 的任务类型（分析）选择合适模型
- 可能选择 Claude-3 Opus（擅长分析）

---

### 场景 3: 二生三（多输入融合）

```typescript
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: fusionNodeId,
  projectId: currentProjectId,
  userId: currentUserId,

  // 核心：多个节点内容拼接
  context: `${node1.title}\n${node1.content}\n\n---\n\n${node2.title}\n${node2.content}`,
  prompt: '综合以上分析，制定产品 MVP 方案',

  timestamp: new Date(),
  metadata: {
    sourceNodeIds: [node1.id, node2.id]  // 可选：用于追踪
  }
}
```

**系统行为**：
- 检测到多个输入源（通过 context 长度和结构）
- 选择擅长综合分析的模型
- 自动调整 token 限制

---

### 场景 4: 万物重生（内容优化）

```typescript
const request: AIProcessRequest = {
  taskId: uuid(),
  nodeId: existingNodeId,
  projectId: currentProjectId,
  userId: currentUserId,

  // 核心：当前内容 + 优化指令
  context: `${existingNode.title}\n${existingNode.content}`,
  prompt: '增加更详细的技术实现细节',

  timestamp: new Date()
}
```

**系统行为**：
- 识别这是内容优化任务
- 选择擅长扩展的模型
- 保持原有结构，增加细节

---

## 处理响应

### 成功响应

```typescript
import { AIProcessResponse, EventKeys } from '@sker/protocols'

// 监听完成事件
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  console.log('生成内容:', event.result.content)
  console.log('生成标题:', event.result.title)
  console.log('自动选择的模型:', event.stats?.modelUsed)  // 如 'gpt-4' 或 'claude-3-opus'
})

// 或通过 API 响应
const response: AIProcessResponse = {
  taskId: '...',
  nodeId: '...',
  projectId: '...',
  userId: '...',
  status: 'completed',
  success: true,

  result: {
    content: '生成的内容...',
    title: '自动生成的标题',
    semanticType: 'requirement',  // 系统推断的语义类型
    importanceLevel: 4,           // 系统推断的重要性
    confidence: 0.95
  },

  stats: {
    modelUsed: 'gpt-4',           // 系统自动选择的模型
    tokenCount: 1500,
    processingTime: 2000,
    requestId: 'req-123'
  },

  timestamp: new Date()
}
```

### 失败响应

```typescript
const response: AIProcessResponse = {
  taskId: '...',
  nodeId: '...',
  projectId: '...',
  userId: '...',
  status: 'failed',
  success: false,

  error: {
    code: 'AI_PROCESSING_ERROR',
    message: 'Model API rate limit exceeded',
    retryable: true,  // 可以重试
    details: {
      rateLimitReset: 1678901234
    }
  },

  stats: {
    modelUsed: 'gpt-4',
    processingTime: 100
  },

  timestamp: new Date()
}
```

---

## 类型安全的事件系统

```typescript
import { EventKeys, TypeSafeEventBus } from '@sker/protocols'

// 订阅事件 - 类型自动推断
eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
  // event 类型自动为 AITaskCompletedEvent
  console.log(event.result.content)      // ✅ 类型安全
  console.log(event.result.confidence)   // ✅ 类型安全
})

eventBus.on(EventKeys.NODE_CREATED, (event) => {
  // event 类型自动为 NodeCreatedEvent
  console.log(event.position.x)          // ✅ 类型安全
  console.log(event.aiGenerated)         // ✅ 类型安全
})

// 发布事件 - 编译时检查
eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
  taskId: '...',
  nodeId: '...',
  result: {
    content: '...',
    title: '...',
    confidence: 0.9
  },
  processingTime: 1500,
  timestamp: new Date()
  // TypeScript 会检查所有必需字段
})
```

---

## 验证器使用

```typescript
import {
  validateAIProcessRequest,
  validateAIProcessResponse,
  isValidAIProcessRequest
} from '@sker/protocols'

// 验证请求
const result = validateAIProcessRequest(data)

if (result.success) {
  // 类型安全的数据
  const request = result.value
  console.log('有效请求:', request.prompt)
} else {
  // 详细的错误信息
  console.error('验证失败:', result.error.getFormattedMessage())
  result.error.issues.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`)
  })
}

// 类型守卫
if (isValidAIProcessRequest(data)) {
  // TypeScript 知道 data 是 AIProcessRequest
  console.log(data.prompt)
}
```

---

## 关键设计原则

### 1. 一切平等
- 所有任务按到达顺序处理
- 没有优先级区分
- 没有任务类型区分

### 2. 智能自动化
- 系统根据内容自动选择模型
- 系统自动优化处理参数
- 用户无需了解技术细节

### 3. 简洁清晰
- 用户输入：context + prompt
- 系统输出：content
- 所有其他都是自动的

### 4. 可追踪性
- stats.modelUsed 记录自动选择的模型
- metadata 可选添加追踪信息
- requestId 用于日志关联

---

## 与旧版本对比

### ❌ 旧版（V1）- 过于复杂

```typescript
// 用户需要指定任务类型、优先级、模型参数
{
  taskId: uuid(),
  type: 'generate',           // ❌ 需要选择类型
  inputs: ['...'],
  priority: 'high',           // ❌ 需要设置优先级
  parameters: {
    model: 'gpt-4',          // ❌ 需要选择模型
    temperature: 0.7,        // ❌ 需要调整参数
    maxTokens: 2000
  }
}
```

### ✅ 新版（V2）- 简洁直接

```typescript
// 用户只需提供上下文和意图
{
  taskId: uuid(),
  nodeId: uuid(),
  projectId: uuid(),
  userId: uuid(),
  context: '...',             // ✅ 上下文
  prompt: '...',              // ✅ 用户意图
  timestamp: new Date()
}

// 系统自动：
// - 选择最合适的模型
// - 优化处理参数
// - 管理任务调度
```

---

## 总结

新的协议设计遵循"简单至上"的原则：

1. **用户视角**：只关心输入（context + prompt）和输出（content）
2. **系统视角**：智能决策（模型选择、参数优化、任务调度）
3. **开发视角**：类型安全（编译时检查 + 运行时验证）

让 AI 处理变得像调用普通函数一样简单！
