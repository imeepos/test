/**
 * AI 引擎消息队列相关类型定义 - 使用统一的消息类型
 */

import type {
  UnifiedAITaskMessage,
  UnifiedAITaskType,
  UnifiedTaskStatus,
  TaskPriority,
  UnifiedAIResultMessage,
  AIProcessingError,
  UnifiedBatchTaskMessage,
  UnifiedBatchResultMessage,
  TaskMetadata
} from '@sker/models/src/messaging/AITaskTypes.js'

import {
  dbToUnifiedTaskType,
  unifiedToDbTaskType
} from '@sker/models/src/messaging/AITaskTypes.js'

// 重新导出统一类型以保持向后兼容
export type AITaskMessage = UnifiedAITaskMessage
export type AITaskType = UnifiedAITaskType
export type AITaskStatus = UnifiedTaskStatus
export { TaskPriority }

// 兼容旧的任务类型映射
export const LEGACY_TASK_TYPE_MAP = {
  'content_generation': 'generate' as const,
  'content_optimization': 'optimize' as const,
  'semantic_analysis': 'analyze' as const,
  'content_fusion': 'fusion' as const,
  'node_enhancement': 'expand' as const,
  'batch_processing': 'fusion' as const
}

// 重新导出错误类型
export type AITaskError = AIProcessingError

/**
 * 任务进度
 */
export interface TaskProgress {
  percentage: number
  stage: string
  estimatedTimeRemaining?: number
  details?: string
}

/**
 * AI 任务元数据
 */
export interface AITaskMetadata {
  model: string
  tokenCount?: number
  cost?: number
  processingTime?: number
  retryCount: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  workerId?: string
}

/**
 * 队列处理器配置
 */
export interface QueueProcessorConfig {
  taskQueue: string
  batchQueue: string
  resultExchange: string
  highPriorityWorkers: number
  normalPriorityWorkers: number
  lowPriorityWorkers: number
  batchConcurrency: number
  maxRetries: number
  retryDelay: number
  taskTimeout: number
}

/**
 * 任务队列统计
 */
export interface TaskQueueStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageProcessingTime: number
  tasksPerMinute: number
  activeWorkers: number
  queuedTasks: number
  lastProcessedAt: Date
  errorRate: number
}

/**
 * 任务处理结果
 */
export interface TaskProcessingResult {
  success: boolean
  result?: any
  error?: Error
  processingTime: number
  taskId: string
}

/**
 * 批处理任务请求
 */
export interface BatchTaskRequest {
  batchId: string
  tasks: AITaskMessage[]
  options?: {
    failFast?: boolean
    maxConcurrency?: number
    timeout?: number
  }
  metadata?: {
    userId: string
    projectId: string
    createdAt: Date
  }
}

/**
 * 批处理任务结果
 */
export interface BatchTaskResult {
  batchId: string
  results: TaskProcessingResult[]
  stats: {
    total: number
    successful: number
    failed: number
    processingTime: number
  }
  timestamp: Date
}

/**
 * 任务调度配置
 */
export interface TaskScheduleConfig {
  cronExpression: string
  taskTemplate: Omit<AITaskMessage, 'taskId' | 'timestamp'>
  enabled: boolean
  maxInstances: number
  retryPolicy: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
}

/**
 * 任务队列监控
 */
export interface QueueMonitoringData {
  queueName: string
  stats: TaskQueueStats
  health: QueueHealthStatus
  alerts: QueueAlert[]
  lastUpdated: Date
}

/**
 * 队列健康状态
 */
export type QueueHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

/**
 * 队列告警
 */
export interface QueueAlert {
  id: string
  type: QueueAlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  resolved: boolean
}

/**
 * 队列告警类型
 */
export type QueueAlertType =
  | 'high_error_rate'
  | 'queue_backlog'
  | 'worker_failure'
  | 'processing_timeout'
  | 'memory_usage'
  | 'connection_issue'

/**
 * 任务重试策略
 */
export interface TaskRetryStrategy {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryableErrors: string[]
}

/**
 * 任务超时配置
 */
export interface TaskTimeoutConfig {
  defaultTimeout: number
  taskTypeTimeouts: Record<AITaskType, number>
  escalationTimeout: number
  cleanupTimeout: number
}

/**
 * 负载均衡配置
 */
export interface LoadBalancingConfig {
  strategy: 'round_robin' | 'least_connections' | 'weighted' | 'priority'
  weights?: Record<string, number>
  healthChecks: {
    enabled: boolean
    interval: number
    timeout: number
    unhealthyThreshold: number
  }
}

/**
 * 任务路由规则
 */
export interface TaskRoutingRule {
  id: string
  name: string
  condition: TaskRouteCondition
  action: TaskRouteAction
  priority: number
  enabled: boolean
}

/**
 * 任务路由条件
 */
export interface TaskRouteCondition {
  taskType?: AITaskType[]
  priority?: TaskPriority[]
  userId?: string[]
  projectId?: string[]
  dataSize?: { min?: number; max?: number }
  customFilter?: (task: AITaskMessage) => boolean
}

/**
 * 任务路由动作
 */
export interface TaskRouteAction {
  type: 'route' | 'transform' | 'delay' | 'reject'
  targetQueue?: string
  transform?: (task: AITaskMessage) => AITaskMessage
  delay?: number
  rejectReason?: string
}

/**
 * 队列性能指标
 */
export interface QueuePerformanceMetrics {
  throughput: {
    tasksPerSecond: number
    tasksPerMinute: number
    tasksPerHour: number
  }
  latency: {
    p50: number
    p95: number
    p99: number
    avg: number
  }
  errors: {
    total: number
    rate: number
    byType: Record<string, number>
  }
  workers: {
    active: number
    idle: number
    total: number
    utilization: number
  }
  queue: {
    depth: number
    maxDepth: number
    ageOldestMessage: number
  }
}

/**
 * 任务调度器状态
 */
export interface TaskSchedulerStatus {
  isRunning: boolean
  scheduledTasks: number
  runningTasks: number
  completedTasks: number
  failedTasks: number
  nextScheduledRun?: Date
  lastRunAt?: Date
  uptime: number
}

/**
 * 消息序列化配置
 */
export interface MessageSerializationConfig {
  format: 'json' | 'messagepack' | 'protobuf'
  compression: 'none' | 'gzip' | 'lz4'
  encryption: {
    enabled: boolean
    algorithm?: string
    keyRotation?: boolean
  }
}

/**
 * 队列分片配置
 */
export interface QueueShardingConfig {
  enabled: boolean
  shardCount: number
  shardStrategy: 'hash' | 'range' | 'custom'
  shardKey: string // 用于分片的字段名
  customShardFunction?: (task: AITaskMessage) => number
}

/**
 * 死信队列配置
 */
export interface DeadLetterQueueConfig {
  enabled: boolean
  queueName: string
  maxRetries: number
  retentionPeriod: number // 保留时间（秒）
  reprocessingEnabled: boolean
  alertsEnabled: boolean
}

/**
 * 任务优先级队列配置
 */
export interface PriorityQueueConfig {
  enabled: boolean
  priorities: TaskPriority[]
  queueMapping: Record<TaskPriority, string>
  workerAllocation: Record<TaskPriority, number>
  preemption: {
    enabled: boolean
    preemptionThreshold: number
  }
}

/**
 * 任务事件
 */
export interface TaskEvent {
  eventId: string
  taskId: string
  type: TaskEventType
  timestamp: Date
  data: any
  source: string
}

/**
 * 任务事件类型
 */
export type TaskEventType =
  | 'task_created'
  | 'task_queued'
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'task_cancelled'
  | 'task_retried'
  | 'task_timeout'