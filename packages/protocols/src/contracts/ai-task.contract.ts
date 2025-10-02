/**
 * AI任务协议契约定义
 *
 * 基于协议优先原则，定义严格的类型安全契约
 * 使用Zod进行运行时验证，确保跨服务通信的可靠性
 */

import { z } from 'zod'

// ============================================================================
// Branded Types - 防止ID类型混用
// ============================================================================

export type TaskId = string & { readonly __brand: 'TaskId' }
export type NodeId = string & { readonly __brand: 'NodeId' }
export type ProjectId = string & { readonly __brand: 'ProjectId' }
export type UserId = string & { readonly __brand: 'UserId' }

// ============================================================================
// AI任务类型定义
// ============================================================================

export const AITaskType = z.enum([
  'generate',  // 内容生成
  'optimize',  // 内容优化
  'fusion',    // 多输入融合
  'analyze',   // 语义分析
  'expand'     // 内容扩展
])

export type AITaskType = z.infer<typeof AITaskType>

// ============================================================================
// 任务优先级定义
// ============================================================================

export const TaskPriority = z.enum(['low', 'normal', 'high', 'urgent'])
export type TaskPriority = z.infer<typeof TaskPriority>

export const PRIORITY_VALUES: Record<TaskPriority, number> = {
  low: 1,
  normal: 5,
  high: 8,
  urgent: 10
}

// ============================================================================
// 任务状态定义
// ============================================================================

export const TaskStatus = z.enum([
  'pending',      // 等待调度
  'queued',       // 已加入队列
  'processing',   // 正在处理
  'completed',    // 处理完成
  'failed',       // 处理失败
  'cancelled',    // 已取消
  'timeout'       // 超时
])

export type TaskStatus = z.infer<typeof TaskStatus>

// ============================================================================
// 任务元数据 Schema
// ============================================================================

export const TaskMetadataSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  timeout: z.number().positive().optional(),
  retryCount: z.number().int().min(0).max(3).optional(),
  originalRequestId: z.string().optional(),
  sessionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  batchId: z.string().optional()
}).strict()

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>

// ============================================================================
// AI任务消息 Schema (V1)
// ============================================================================

export const AITaskMessageSchemaV1 = z.object({
  // 核心标识
  taskId: z.string().uuid(),
  type: AITaskType,

  // 任务内容
  inputs: z.array(z.string()).min(1),
  context: z.string().optional(),
  instruction: z.string().optional(),

  // 关联实体
  nodeId: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 调度信息
  priority: TaskPriority,
  timestamp: z.date(),

  // 可选元数据
  metadata: TaskMetadataSchema.optional()
}).strict()

export type AITaskMessage = z.infer<typeof AITaskMessageSchemaV1>

// ============================================================================
// AI处理结果 Schema
// ============================================================================

export const AIProcessingMetadataSchema = z.object({
  model: z.string(),
  tokenCount: z.number().int().positive(),
  temperature: z.number().min(0).max(2),
  processingSteps: z.array(z.string()).optional(),
  requestId: z.string(),
  processingTime: z.number().positive(),
  cost: z.number().nonnegative().optional()
}).strict()

export type AIProcessingMetadata = z.infer<typeof AIProcessingMetadataSchema>

export const AIProcessingResultSchema = z.object({
  content: z.string().min(1),
  title: z.string().min(1),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  reasoning: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
  semanticType: z.string().optional(),
  metadata: AIProcessingMetadataSchema
}).strict()

export type AIProcessingResult = z.infer<typeof AIProcessingResultSchema>

// ============================================================================
// AI处理错误 Schema
// ============================================================================

export const AIProcessingErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  retryable: z.boolean(),
  retryAfter: z.number().positive().optional(),
  severity: z.enum(['low', 'medium', 'high']),
  timestamp: z.date().optional()
}).strict()

export type AIProcessingError = z.infer<typeof AIProcessingErrorSchema>

// ============================================================================
// 结果元数据 Schema
// ============================================================================

export const ResultMetadataSchema = z.object({
  processingNode: z.string().optional(),
  queueTime: z.number().nonnegative().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  retryCount: z.number().int().min(0).optional(),
  version: z.string().optional(),
  cached: z.boolean().optional()
}).strict()

export type ResultMetadata = z.infer<typeof ResultMetadataSchema>

// ============================================================================
// AI结果消息 Schema (V1)
// ============================================================================

const AIResultMessageSchemaBase = z.object({
  // 任务标识
  taskId: z.string().uuid(),
  type: AITaskType,

  // 关联实体
  nodeId: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 处理状态
  status: TaskStatus,
  success: z.boolean(),

  // 处理结果（成功时）
  result: AIProcessingResultSchema.optional(),

  // 错误信息（失败时）
  error: AIProcessingErrorSchema.optional(),

  // 处理信息
  processingTime: z.number().nonnegative(),
  timestamp: z.date(),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),

  // 保存的数据
  savedData: z.unknown().optional(),

  // 元数据
  metadata: ResultMetadataSchema.optional()
}).strict()

export const AIResultMessageSchemaV1 = AIResultMessageSchemaBase.refine(
  (data) => {
    // 成功时必须有result，失败时必须有error
    if (data.success && !data.result) return false
    if (!data.success && !data.error) return false
    return true
  },
  {
    message: 'Success tasks must have result, failed tasks must have error'
  }
)

export type AIResultMessage = z.infer<typeof AIResultMessageSchemaV1>

// ============================================================================
// 批处理任务 Schema
// ============================================================================

export const BatchTaskOptionsSchema = z.object({
  concurrency: z.number().int().min(1).max(10).optional(),
  failFast: z.boolean().optional(),
  collectResults: z.boolean().optional()
}).strict()

export type BatchTaskOptions = z.infer<typeof BatchTaskOptionsSchema>

export const BatchTaskMessageSchemaV1 = z.object({
  batchId: z.string().uuid(),
  tasks: z.array(AITaskMessageSchemaV1).min(1),
  batchOptions: BatchTaskOptionsSchema,
  timestamp: z.date()
}).strict()

export type BatchTaskMessage = z.infer<typeof BatchTaskMessageSchemaV1>

// ============================================================================
// 批处理结果 Schema
// ============================================================================

export const BatchResultSummarySchema = z.object({
  total: z.number().int().positive(),
  successful: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  processingTime: z.number().positive()
}).strict()

export type BatchResultSummary = z.infer<typeof BatchResultSummarySchema>

export const BatchResultMessageSchemaV1 = z.object({
  batchId: z.string().uuid(),
  results: z.array(AIResultMessageSchemaV1),
  summary: BatchResultSummarySchema,
  timestamp: z.date()
}).strict()

export type BatchResultMessage = z.infer<typeof BatchResultMessageSchemaV1>

// ============================================================================
// 任务状态更新消息 Schema
// ============================================================================

export const TaskStatusUpdateMessageSchema = z.object({
  taskId: z.string().uuid(),
  status: TaskStatus,
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
  timestamp: z.date(),
  estimatedTimeRemaining: z.number().positive().optional()
}).strict()

export type TaskStatusUpdateMessage = z.infer<typeof TaskStatusUpdateMessageSchema>

// ============================================================================
// 任务取消消息 Schema
// ============================================================================

export const TaskCancelMessageSchema = z.object({
  taskId: z.string().uuid(),
  reason: z.string(),
  timestamp: z.date()
}).strict()

export type TaskCancelMessage = z.infer<typeof TaskCancelMessageSchema>

// ============================================================================
// 协议版本常量
// ============================================================================

export const AI_TASK_PROTOCOL_VERSION = '1.0.0' as const

// ============================================================================
// 协议契约定义
// ============================================================================

export const AITaskContractV1 = {
  version: AI_TASK_PROTOCOL_VERSION,
  schemas: {
    task: AITaskMessageSchemaV1,
    result: AIResultMessageSchemaV1,
    batchTask: BatchTaskMessageSchemaV1,
    batchResult: BatchResultMessageSchemaV1,
    statusUpdate: TaskStatusUpdateMessageSchema,
    cancel: TaskCancelMessageSchema
  }
} as const

// ============================================================================
// 类型守卫工具
// ============================================================================

export function isValidTaskType(value: string): value is AITaskType {
  return AITaskType.safeParse(value).success
}

export function isValidPriority(value: string): value is TaskPriority {
  return TaskPriority.safeParse(value).success
}

export function isValidTaskStatus(value: string): value is TaskStatus {
  return TaskStatus.safeParse(value).success
}

// ============================================================================
// 品牌类型构造器
// ============================================================================

export function createTaskId(id: string): TaskId {
  return id as TaskId
}

export function createNodeId(id: string): NodeId {
  return id as NodeId
}

export function createProjectId(id: string): ProjectId {
  return id as ProjectId
}

export function createUserId(id: string): UserId {
  return id as UserId
}
