/**
 * 统一的AI任务类型定义 - 用于broker和engine之间的消息传递
 * 这些类型定义了微服务间的通信契约
 */

// 统一的AI任务类型 - 使用简化的命名约定
export type UnifiedAITaskType = 'generate' | 'optimize' | 'fusion' | 'analyze' | 'expand'

// 任务优先级
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

// 任务状态
export type UnifiedTaskStatus =
  | 'pending'    // 等待调度
  | 'queued'     // 已加入队列
  | 'processing' // 正在处理
  | 'completed'  // 处理完成
  | 'failed'     // 处理失败
  | 'cancelled'  // 已取消
  | 'timeout'    // 超时

// 统一的AI任务消息格式
export interface UnifiedAITaskMessage {
  taskId: string
  type: UnifiedAITaskType
  inputs: string[]
  context?: string
  instruction?: string
  nodeId: string
  projectId: string
  userId: string
  priority: TaskPriority
  timestamp: Date
  metadata?: TaskMetadata
}

// 任务元数据
export interface TaskMetadata {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  retryCount?: number
  originalRequestId?: string
  sessionId?: string
  tags?: string[]
  batchId?: string // 用于批处理任务
}

// 统一的AI处理结果格式
export interface UnifiedAIResultMessage {
  taskId: string
  nodeId: string
  success: boolean
  result?: AIProcessingResult
  error?: AIProcessingError
  processingTime: number
  timestamp: Date
  metadata?: ResultMetadata
}

// AI处理结果
export interface AIProcessingResult {
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  alternatives?: string[]
  semanticType?: string
  metadata: ProcessingMetadata
}

// 处理元数据
export interface ProcessingMetadata {
  model: string
  tokenCount: number
  temperature: number
  processingSteps?: string[]
  requestId: string
  processingTime: number
  cost?: number
}

// AI处理错误
export interface AIProcessingError {
  code: string
  message: string
  details?: any
  retryable: boolean
  retryAfter?: number
  severity: 'low' | 'medium' | 'high'
}

// 结果元数据
export interface ResultMetadata {
  processingNode?: string
  queueTime?: number
  startTime?: Date
  endTime?: Date
  retryCount?: number
  version?: string
  cached?: boolean
}

// 批处理任务消息
export interface UnifiedBatchTaskMessage {
  batchId: string
  tasks: UnifiedAITaskMessage[]
  batchOptions: {
    concurrency: number
    failFast: boolean
    collectResults: boolean
  }
  timestamp: Date
}

// 批处理结果
export interface UnifiedBatchResultMessage {
  batchId: string
  results: UnifiedAIResultMessage[]
  summary: {
    total: number
    successful: number
    failed: number
    processingTime: number
  }
  timestamp: Date
}

// 任务状态更新消息
export interface TaskStatusUpdateMessage {
  taskId: string
  status: UnifiedTaskStatus
  progress?: number
  message?: string
  timestamp: Date
  estimatedTimeRemaining?: number
}

// 任务取消消息
export interface TaskCancelMessage {
  taskId: string
  reason: string
  timestamp: Date
}

// 任务类型到数据库类型的映射
export const UNIFIED_TO_DB_TASK_TYPE_MAP: Record<UnifiedAITaskType, string> = {
  'generate': 'content_generation',
  'optimize': 'content_optimization',
  'fusion': 'content_fusion',
  'analyze': 'semantic_analysis',
  'expand': 'node_enhancement'
} as const

// 数据库类型到统一类型的映射
export const DB_TO_UNIFIED_TASK_TYPE_MAP: Record<string, UnifiedAITaskType> = {
  'content_generation': 'generate',
  'content_optimization': 'optimize',
  'content_fusion': 'fusion',
  'semantic_analysis': 'analyze',
  'node_enhancement': 'expand',
  'batch_processing': 'fusion' // 批处理通常是融合操作
} as const

// 工具函数：转换任务类型
export function unifiedToDbTaskType(unifiedType: UnifiedAITaskType): string {
  return UNIFIED_TO_DB_TASK_TYPE_MAP[unifiedType] || unifiedType
}

export function dbToUnifiedTaskType(dbType: string): UnifiedAITaskType {
  return DB_TO_UNIFIED_TASK_TYPE_MAP[dbType] || 'generate'
}

// 验证函数
export function isValidTaskType(type: string): type is UnifiedAITaskType {
  return ['generate', 'optimize', 'fusion', 'analyze', 'expand'].includes(type)
}

export function isValidPriority(priority: string): priority is TaskPriority {
  return ['low', 'normal', 'high', 'urgent'].includes(priority)
}

export function isValidTaskStatus(status: string): status is UnifiedTaskStatus {
  return ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'timeout'].includes(status)
}

// 常量定义
export const UNIFIED_TASK_TYPE = {
  GENERATE: 'generate' as const,
  OPTIMIZE: 'optimize' as const,
  FUSION: 'fusion' as const,
  ANALYZE: 'analyze' as const,
  EXPAND: 'expand' as const
}

export const TASK_PRIORITY = {
  LOW: 'low' as const,
  NORMAL: 'normal' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const
}

export const UNIFIED_TASK_STATUS = {
  PENDING: 'pending' as const,
  QUEUED: 'queued' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  TIMEOUT: 'timeout' as const
}