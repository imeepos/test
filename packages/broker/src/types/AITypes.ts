// AI处理相关的消息类型 - 使用统一的类型定义
import type {
  UnifiedAITaskMessage,
  UnifiedAITaskType,
  TaskPriority,
  TaskMetadata,
  UnifiedTaskStatus,
  UnifiedAIResultMessage,
  AIProcessingResult,
  AIProcessingError,
  ResultMetadata,
  UnifiedBatchTaskMessage,
  UnifiedBatchResultMessage,
  TaskStatusUpdateMessage
} from '@sker/models'

// 重新导出统一类型以保持向后兼容
export type AITaskMessage = UnifiedAITaskMessage
export type AITaskType = UnifiedAITaskType
export { TaskPriority }
export type AITaskMetadata = TaskMetadata
export type AIResultMessage = UnifiedAIResultMessage
export { AIProcessingResult, AIProcessingError }
export type AIResultMetadata = ResultMetadata
export type AITaskStatusType = UnifiedTaskStatus

// 重新导出任务状态更新消息
export type AITaskStatus = TaskStatusUpdateMessage

// AI任务请求
export interface AITaskRequest {
  type: AITaskType
  inputs: string[]
  context?: string
  instruction?: string
  nodeId: string
  projectId: string
  priority?: TaskPriority
  options?: AITaskOptions
}

// AI任务选项
export interface AITaskOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  streaming?: boolean
  includeReasoning?: boolean
  includeAlternatives?: boolean
  customPrompt?: string
}

// 重新导出批处理类型
export type AIBatchTaskMessage = UnifiedBatchTaskMessage
export type AIBatchResultMessage = UnifiedBatchResultMessage

// AI模型信息
export interface AIModelInfo {
  id: string
  name: string
  provider: string
  capabilities: string[]
  maxTokens: number
  costPerToken: number
  availability: 'available' | 'busy' | 'maintenance' | 'offline'
  averageResponseTime: number
}

// AI处理统计
export interface AIProcessingStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageProcessingTime: number
  averageQueueTime: number
  currentQueueLength: number
  activeProcessors: number
  errorRate: number
  tokensProcessed: number
  timestamp: Date
}