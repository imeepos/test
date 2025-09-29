// AI服务相关类型定义

// AI生成请求
export interface AIGenerateRequest {
  inputs: string[]
  context?: string
  nodeId?: string
  type?: string
  instruction?: string
  options?: AIGenerateOptions
}

// AI生成选项
export interface AIGenerateOptions {
  temperature?: number
  maxTokens?: number
  model?: AIModel
  prompt?: string
}

// AI模型类型
export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'local'

// AI生成响应
export interface AIGenerateResponse {
  content: string
  title?: string
  confidence: number
  reasoning?: string
  suggestions?: string[]
  tags: string[]
  importance?: number
  metadata?: {
    requestId?: string
    model?: AIModel
    processingTime?: number
    tokenCount?: number
    error?: any
  }
}

// AI处理状态
export interface AIProcessingState {
  nodeId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  startTime: Date
  endTime?: Date
  error?: string
}

// AI服务配置
export interface AIServiceConfig {
  apiKey?: string
  baseUrl?: string
  model: AIModel
  timeout: number
  maxRetries: number
}

// AI结果缓存
export interface AIResultCache {
  inputs: string[]
  result: AIGenerateResponse
  timestamp: Date
  hitCount: number
}

// AI优化请求
export interface AIOptimizeRequest {
  nodeId: string
  currentContent: string
  context?: string
  focusArea?: OptimizationFocus
}

// 优化焦点
export type OptimizationFocus = 
  | 'clarity'
  | 'detail'
  | 'structure'
  | 'accuracy'
  | 'completeness'

// WebSocket AI消息类型
export interface AIWebSocketMessage {
  type: AIMessageType
  payload: any
  requestId: string
  timestamp: Date
}

// AI消息类型
export type AIMessageType =
  | 'generate_request'
  | 'generate_response'
  | 'optimize_request'
  | 'optimize_response'
  | 'status_update'
  | 'error'

// AI错误类型
export interface AIError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

// AI性能指标
export interface AIMetrics {
  requestCount: number
  averageResponseTime: number
  successRate: number
  errorRate: number
  cacheHitRate: number
}