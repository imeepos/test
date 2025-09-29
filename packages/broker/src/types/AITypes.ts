// AI处理相关的消息类型

// AI任务消息
export interface AITaskMessage {
  taskId: string
  type: AITaskType
  inputs: string[]
  context?: string
  instruction?: string
  nodeId: string
  projectId: string
  userId: string
  priority: TaskPriority
  timestamp: Date
  metadata?: AITaskMetadata
}

// AI任务类型
export type AITaskType = 'generate' | 'optimize' | 'fusion' | 'analyze' | 'expand'

// 任务优先级
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

// AI任务元数据
export interface AITaskMetadata {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  retryCount?: number
  originalRequestId?: string
  sessionId?: string
  tags?: string[]
}

// AI处理结果消息
export interface AIResultMessage {
  taskId: string
  nodeId: string
  success: boolean
  result?: AIProcessingResult
  error?: AIProcessingError
  processingTime: number
  timestamp: Date
  metadata?: AIResultMetadata
}

// AI处理结果
export interface AIProcessingResult {
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  alternatives?: string[]
  metadata: {
    model: string
    tokenCount: number
    temperature: number
    processingSteps?: string[]
  }
}

// AI处理错误
export interface AIProcessingError {
  code: string
  message: string
  details?: any
  retryable: boolean
  retryAfter?: number
}

// AI结果元数据
export interface AIResultMetadata {
  processingNode?: string
  queueTime?: number
  startTime?: Date
  endTime?: Date
  retryCount?: number
  version?: string
}

// AI任务状态
export interface AITaskStatus {
  taskId: string
  status: AITaskStatusType
  stage?: string
  progress?: number
  message?: string
  timestamp: Date
  estimatedTimeRemaining?: number
}

// AI任务状态类型
export type AITaskStatusType =
  | 'queued'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

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

// AI批处理任务
export interface AIBatchTaskMessage {
  batchId: string
  tasks: AITaskMessage[]
  batchOptions: {
    concurrency: number
    failFast: boolean
    collectResults: boolean
  }
  timestamp: Date
}

// AI批处理结果
export interface AIBatchResultMessage {
  batchId: string
  results: AIResultMessage[]
  summary: {
    total: number
    successful: number
    failed: number
    processingTime: number
  }
  timestamp: Date
}

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