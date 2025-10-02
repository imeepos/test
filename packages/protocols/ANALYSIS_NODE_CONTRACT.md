# 节点协议分析报告

## 📊 协议 vs 数据库模型对比

### 当前状态

| 字段 | 协议 (node.contract.ts) | 数据库模型 (store) | 状态 | 建议 |
|------|-------------------------|-------------------|------|------|
| **核心标识** |
| `id` | ✅ `string.uuid()` | ✅ `string` | ✅ 匹配 | - |
| `projectId` / `project_id` | ✅ `string.uuid()` | ✅ `string` | ✅ 匹配 | 保持 camelCase |
| `userId` / `user_id` | ✅ `string.uuid()` | ✅ `string` | ✅ 匹配 | 保持 camelCase |
| **内容信息** |
| `content` | ✅ `string` | ✅ `string` | ✅ 匹配 | - |
| `title` | ✅ `string?` | ✅ `string?` | ✅ 匹配 | - |
| `tags` | ✅ `string[]?` | ✅ `string[]` | ⚠️ 可选性不同 | 协议应改为必需 |
| **质量指标** |
| `importance` | ⚠️ `number(1-5)?` | ✅ `ImportanceLevel (1|2|3|4|5)` | ⚠️ 类型不同 | 协议应使用 literal union |
| `confidence` | ✅ `number(0-1)?` | ✅ `number` | ⚠️ 可选性不同 | 协议应改为必需 |
| **状态** |
| `status` | ✅ `enum?` | ✅ `enum` | ⚠️ 值不同 | 协议缺少 'deleted' |
| **位置** |
| `position` | ✅ `{x, y}` | ✅ `{x, y}` | ✅ 匹配 | - |
| `size` | ❌ 缺失 | ✅ `{width, height}?` | ❌ 不匹配 | 协议应添加 |
| **版本控制** |
| `version` | ✅ `number?` | ✅ `number` | ⚠️ 可选性不同 | 协议应改为必需 |
| **元数据** |
| `metadata` | ⚠️ 简化版 | ✅ 复杂结构 | ❌ 结构不匹配 | 需要重新设计 |
| `parent_id` | ❌ 缺失 | ✅ `string?` | ❌ 不匹配 | 协议应添加 |
| `ai_generated` | ⚠️ 在metadata中 | ✅ 顶层字段 | ❌ 位置不同 | 协议应提升到顶层 |
| **时间戳** |
| `createdAt` / `created_at` | ✅ `Date` | ✅ `Date` | ✅ 匹配 | 保持 camelCase |
| `updatedAt` / `updated_at` | ✅ `Date` | ✅ `Date` | ✅ 匹配 | 保持 camelCase |

## ⚠️ 发现的问题

### 1. 状态枚举值不一致

**协议定义**:
```typescript
export const NodeStatus = z.enum([
  'idle',         // 空闲状态
  'processing',   // AI处理中
  'completed',    // 已完成
  'error'         // 错误状态
])
```

**数据库模型**:
```typescript
export type NodeStatus = 'idle' | 'processing' | 'completed' | 'error' | 'deleted'
```

❌ **问题**: 协议缺少 `'deleted'` 状态

### 2. 元数据结构严重不匹配

**协议定义** (简化版):
```typescript
export const NodeMetadataSchema = z.object({
  aiGenerated: z.boolean().optional(),
  model: z.string().optional(),
  processingTime: z.number().nonnegative().optional(),
  lastModifiedBy: z.string().optional(),
  createdBy: z.string().optional(),
  sourceNodeIds: z.array(z.string().uuid()).optional(),
  relatedTaskId: z.string().uuid().optional(),
  customData: z.record(z.unknown()).optional()
}).strict()
```

**数据库模型** (完整版):
```typescript
export interface NodeMetadata {
  semantic_types: SemanticType[]        // ❌ 协议缺失
  user_rating?: number                  // ❌ 协议缺失
  ai_rating?: number                    // ❌ 协议缺失
  edit_count: number                    // ❌ 协议缺失
  last_edit_reason?: string             // ❌ 协议缺失
  processing_history: ProcessingRecord[] // ❌ 协议缺失
  statistics: {                         // ❌ 协议缺失
    view_count: number
    edit_duration_total: number
    ai_interactions: number
  }
}
```

❌ **问题**: 协议元数据结构过于简化，缺少核心业务字段

### 3. 缺失重要字段

| 字段 | 数据库有 | 协议有 | 影响 |
|------|---------|--------|------|
| `size` | ✅ | ❌ | 无法验证节点尺寸 |
| `parent_id` | ✅ | ❌ | 无法验证层次结构 |
| `ai_generated` | ✅ (顶层) | ⚠️ (metadata中) | 字段位置不一致 |

### 4. 可选性设置不合理

以下字段在数据库中是必需的，但协议中是可选的：

- `tags` - 应该有默认值 `[]`
- `confidence` - 应该有默认值（如 `0.5`）
- `version` - 应该从 `1` 开始
- `status` - 应该有默认值 `'idle'`
- `importance` - 应该有默认值 `3`

### 5. 类型定义不够精确

**importance 字段**:
```typescript
// 协议 (不精确)
importance: z.number().int().min(1).max(5).optional()

// 数据库 (精确)
type ImportanceLevel = 1 | 2 | 3 | 4 | 5
```

应该使用 literal union 类型来确保只能是这 5 个值。

## 🔧 建议的修复方案

### 方案 A: 完全匹配数据库模型（推荐）

**优点**:
- 与数据库完全一致，避免转换错误
- 包含所有业务逻辑字段
- 类型安全性最高

**缺点**:
- 协议较复杂
- 需要更新所有使用方

### 方案 B: 分层协议设计

**核心协议** (最小必需):
```typescript
export const NodeCoreSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  position: NodePositionSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})
```

**完整协议** (包含所有字段):
```typescript
export const NodeFullSchema = NodeCoreSchema.extend({
  title: z.string().optional(),
  tags: z.array(z.string()),
  importance: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  confidence: z.number().min(0).max(1),
  status: NodeStatus,
  version: z.number().int().positive(),
  size: NodeSizeSchema.optional(),
  parentId: z.string().uuid().optional(),
  aiGenerated: z.boolean(),
  metadata: NodeMetadataSchema
})
```

**优点**:
- 灵活性高，支持不同场景
- 渐进式采用
- 向后兼容性好

### 方案 C: 保持当前简化版 + 转换层

在 Store 和协议之间添加转换层。

**优点**:
- 协议简单，易于使用
- 内部复杂性被封装

**缺点**:
- 需要维护转换逻辑
- 可能丢失数据
- 类型安全性降低

## 🎯 推荐的修复步骤

### 1. 立即修复（高优先级）

```typescript
// 1. 添加缺失的状态值
export const NodeStatus = z.enum([
  'idle',
  'processing',
  'completed',
  'error',
  'deleted'  // ✅ 添加
])

// 2. 使用精确的类型
export const ImportanceLevel = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
])

// 3. 添加 size 字段
export const NodeSizeSchema = z.object({
  width: z.number(),
  height: z.number()
}).strict()

// 4. 添加 parentId
export const NodeSchemaV1 = z.object({
  // ... 现有字段
  parentId: z.string().uuid().optional(),
  size: NodeSizeSchema.optional(),
  aiGenerated: z.boolean(),  // 提升到顶层
  // ...
})
```

### 2. 重新设计元数据（中优先级）

```typescript
export const SemanticType = z.enum([
  'requirement',
  'solution',
  'plan',
  'analysis',
  'idea',
  'question',
  'answer',
  'decision'
])

export const ProcessingRecordSchema = z.object({
  timestamp: z.date(),
  operation: z.string(),
  modelUsed: z.string().optional(),
  tokenCount: z.number().int().optional(),
  processingTime: z.number().nonnegative(),
  confidenceBefore: z.number().min(0).max(1).optional(),
  confidenceAfter: z.number().min(0).max(1).optional()
}).strict()

export const NodeMetadataSchema = z.object({
  semanticTypes: z.array(SemanticType),
  userRating: z.number().int().min(1).max(5).optional(),
  aiRating: z.number().int().min(1).max(5).optional(),
  editCount: z.number().int().nonnegative(),
  lastEditReason: z.string().optional(),
  processingHistory: z.array(ProcessingRecordSchema),
  statistics: z.object({
    viewCount: z.number().int().nonnegative(),
    editDurationTotal: z.number().nonnegative(),
    aiInteractions: z.number().int().nonnegative()
  })
}).strict()
```

### 3. 修正可选性（中优先级）

```typescript
export const NodeSchemaV1 = z.object({
  // 核心标识 - 必需
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 内容信息
  content: z.string(),
  title: z.string().optional(),
  tags: z.array(z.string()),  // ✅ 改为必需，默认 []

  // 质量指标
  importance: ImportanceLevel,  // ✅ 改为必需
  confidence: z.number().min(0).max(1),  // ✅ 改为必需

  // 状态信息
  status: NodeStatus,  // ✅ 改为必需

  // 位置信息
  position: NodePositionSchema,
  size: NodeSizeSchema.optional(),

  // 层次结构
  parentId: z.string().uuid().optional(),

  // 版本控制
  version: z.number().int().positive(),  // ✅ 改为必需

  // AI相关
  aiGenerated: z.boolean(),  // ✅ 改为必需

  // 元数据
  metadata: NodeMetadataSchema,  // ✅ 改为必需

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()
```

## 📝 迁移检查清单

- [ ] 更新 NodeStatus 枚举，添加 'deleted'
- [ ] 将 importance 改为 literal union 类型
- [ ] 添加 size 字段定义
- [ ] 添加 parentId 字段
- [ ] 将 aiGenerated 提升到顶层
- [ ] 重新设计 NodeMetadata 结构
- [ ] 修正必需字段的可选性
- [ ] 更新所有使用方（Engine, Broker, Gateway）
- [ ] 更新测试用例
- [ ] 更新文档

## 🚨 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 破坏现有代码 | 高 | 使用协议版本号 (V2) |
| 数据丢失 | 中 | 提供转换函数 |
| 性能影响 | 低 | 验证缓存 |
| 测试覆盖不足 | 中 | 增加集成测试 |

## 💡 结论

当前节点协议存在多处与数据库模型不一致的地方，建议：

1. **短期**: 修复高优先级问题（状态值、类型精确度）
2. **中期**: 重新设计元数据结构，匹配数据库模型
3. **长期**: 考虑使用代码生成工具从数据库 schema 自动生成协议定义

这将确保类型安全性和数据一致性，减少运行时错误。
