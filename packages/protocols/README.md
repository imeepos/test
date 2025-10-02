# @sker/protocols

SKER 系统的协议定义和验证器包，提供类型安全的契约定义和运行时验证。

## 特性

✨ **协议优先**: 所有服务间通信基于严格定义的协议契约
🛡️ **类型安全**: 编译时 TypeScript 类型检查 + 运行时 Zod 验证
📦 **Result 类型**: 函数式错误处理，避免异常抛出
🔄 **版本管理**: 协议版本化，支持渐进式升级
✅ **详细错误**: 验证失败时提供清晰的错误信息

## 安装

```bash
pnpm install @sker/protocols
```

## 使用

### 1. 导入协议和验证器

```typescript
import {
  validateAITask,
  validateAIResult,
  type AITaskMessage,
  type AIResultMessage
} from '@sker/protocols'
```

### 2. 验证消息

```typescript
// 验证 AI 任务消息
const result = validateAITask(unknownData)

if (result.success) {
  // 类型安全的数据
  const task: AITaskMessage = result.value
  console.log(`Task ID: ${task.taskId}`)
} else {
  // 详细的验证错误
  const error = result.error
  console.error('Validation failed:', error.getFormattedMessage())
  error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  })
}
```

### 3. Result 类型操作

```typescript
import { map, flatMap, unwrapOr } from '@sker/protocols'

// 映射成功值
const doubled = map(result, task => ({ ...task, priority: 'high' }))

// 链式操作
const processed = flatMap(result, task => {
  // 处理任务...
  return ok(processedTask)
})

// 提供默认值
const task = unwrapOr(result, defaultTask)
```

### 4. 从 JSON 验证

```typescript
// 用于消息队列等场景
const result = validateAITaskFromJSON(jsonString)

// 或从 Buffer
const result = validateAITaskFromBuffer(buffer)
```

### 5. 类型守卫

```typescript
// 运行时类型检查
if (isValidAITask(data)) {
  // TypeScript 知道 data 是 AITaskMessage
  console.log(data.taskId)
}
```

## 协议定义

### AI 任务协议

```typescript
import { AITaskContractV1 } from '@sker/protocols'

// 协议版本
console.log(AITaskContractV1.version) // '1.0.0'

// Schema定义
const taskSchema = AITaskContractV1.schemas.task
const resultSchema = AITaskContractV1.schemas.result
```

### 节点协议

```typescript
import { NodeContractV1 } from '@sker/protocols'

const nodeSchema = NodeContractV1.schemas.node
const createSchema = NodeContractV1.schemas.create
const updateSchema = NodeContractV1.schemas.update
```

### 事件协议

```typescript
import {
  EventContractV1,
  DomainEventTypes,
  validateDomainEvent
} from '@sker/protocols'

// 事件类型常量
const eventType = DomainEventTypes.AI_TASK_COMPLETED

// 验证领域事件
const result = validateDomainEvent(eventData)
```

## API

### 验证器

#### AI 任务

- `validateAITask(data)` - 验证 AI 任务消息
- `validateAIResult(data)` - 验证 AI 结果消息
- `validateBatchTask(data)` - 验证批处理任务
- `validateTaskStatusUpdate(data)` - 验证状态更新
- `validateAITaskFromJSON(json)` - 从 JSON 验证
- `validateAITaskFromBuffer(buffer)` - 从 Buffer 验证

#### 节点

- `validateNode(data)` - 验证节点实体
- `validateCreateNode(data)` - 验证创建请求
- `validateUpdateNode(data)` - 验证更新请求
- `validateQueryNodes(data)` - 验证查询请求

#### 事件

- `validateDomainEvent(data)` - 验证领域事件
- `validateEventMetadata(data)` - 验证事件元数据
- `validateDomainEventWithPayload(data)` - 验证带载荷的事件

### Result 类型

#### 构造函数

- `ok(value)` - 创建成功结果
- `err(error)` - 创建失败结果

#### 操作函数

- `map(result, fn)` - 映射成功值
- `mapErr(result, fn)` - 映射错误值
- `flatMap(result, fn)` - 链式映射
- `unwrap(result)` - 解包（失败时抛出）
- `unwrapOr(result, defaultValue)` - 解包或返回默认值
- `combine(results)` - 组合多个 Result

#### 异步操作

- `tryCatch(fn)` - 捕获同步异常
- `tryCatchAsync(fn)` - 捕获异步异常
- `fromPromise(promise)` - 从 Promise 创建 Result
- `toPromise(result)` - 转换为 Promise

### 错误类型

- `ValidationError` - 验证错误基类
- `SchemaValidationError` - Schema 验证错误
- `ProtocolVersionError` - 协议版本错误
- `TypeMismatchError` - 类型不匹配
- `RequiredFieldError` - 必需字段缺失
- `InvalidFieldError` - 字段值无效

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm typecheck
```

## 许可证

MIT
