import type { AIGenerateRequest, AIGenerateResponse } from './ai'

/**
 * 消息队列相关类型定义
 */

// 队列任务类型
export type QueueTaskType =
  | 'ai_generate'
  | 'ai_optimize'
  | 'ai_fusion'
  | 'ai_batch'

// 任务状态
export type QueueTaskStatus =
  | 'pending'     // 待处理
  | 'queued'      // 已入队
  | 'processing'  // 处理中
  | 'completed'   // 已完成
  | 'failed'      // 处理失败
  | 'cancelled'   // 已取消

// 任务优先级
export type TaskPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// 队列任务接口
export interface QueueTask {
  id: string
  type: QueueTaskType
  status: QueueTaskStatus
  priority: TaskPriority
  data: QueueTaskData
  metadata: QueueTaskMetadata
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: QueueTaskError
}

// 任务数据
export interface QueueTaskData {
  request: AIGenerateRequest
  nodeId?: string
  userId?: string
  projectId?: string
  context?: {
    parentNodes?: string[]
    fusionNodes?: string[]
    optimizationTarget?: string
  }
}

// 任务元数据
export interface QueueTaskMetadata {
  retryCount: number
  maxRetries: number
  timeout: number
  estimatedDuration?: number
  actualDuration?: number
  queuePosition?: number
  processingNode?: string // 处理节点标识
}

// 任务错误信息
export interface QueueTaskError {
  code: string
  message: string
  details?: any
  timestamp: Date
  retryable: boolean
}

// 队列任务结果
export interface QueueTaskResult {
  taskId: string
  success: boolean
  data?: AIGenerateResponse
  error?: QueueTaskError
  metrics: TaskMetrics
}

// 任务性能指标
export interface TaskMetrics {
  queueTime: number      // 队列等待时间
  processingTime: number // 实际处理时间
  totalTime: number      // 总耗时
  tokenUsage?: {
    input: number
    output: number
    total: number
  }
  modelUsed?: string
}

// 队列状态统计
export interface QueueStats {
  totalTasks: number
  pendingTasks: number
  processingTasks: number
  completedTasks: number
  failedTasks: number
  averageQueueTime: number
  averageProcessingTime: number
  throughput: number // 每分钟处理任务数
  errorRate: number  // 错误率百分比
}

// 队列配置
export interface QueueConfig {
  maxConcurrentTasks: number
  defaultTimeout: number
  defaultRetries: number
  cleanupInterval: number
  maxQueueSize: number
  priorityLevels: TaskPriority[]
}

// WebSocket消息类型（队列相关）
export interface QueueWebSocketMessage {
  id: string
  type: QueueMessageType
  payload: any
  timestamp: number
  taskId?: string
}

// 队列WebSocket消息类型
export type QueueMessageType =
  | 'QUEUE_TASK_SUBMIT'      // 提交任务
  | 'QUEUE_TASK_CANCEL'      // 取消任务
  | 'QUEUE_TASK_STATUS'      // 任务状态更新
  | 'QUEUE_TASK_PROGRESS'    // 任务进度更新
  | 'QUEUE_TASK_RESULT'      // 任务结果
  | 'QUEUE_TASK_ERROR'       // 任务错误
  | 'QUEUE_STATS'            // 队列统计
  | 'QUEUE_CONFIG'           // 队列配置

// 任务进度信息
export interface TaskProgressInfo {
  taskId: string
  status: QueueTaskStatus
  progress: number // 0-100
  message: string
  estimatedTimeRemaining?: number
  currentStep?: string
}

// 批量任务请求
export interface BatchTaskRequest {
  tasks: QueueTaskData[]
  batchId: string
  options: {
    priority: TaskPriority
    maxConcurrency?: number
    failureStrategy: 'stop' | 'continue' | 'retry'
  }
}

// 批量任务结果
export interface BatchTaskResult {
  batchId: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  results: QueueTaskResult[]
  summary: {
    success: boolean
    duration: number
    errorMessages: string[]
  }
}

// 队列监控事件
export interface QueueMonitorEvent {
  type: QueueEventType
  timestamp: Date
  data: any
}

export type QueueEventType =
  | 'task_submitted'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'task_cancelled'
  | 'queue_full'
  | 'worker_started'
  | 'worker_stopped'
  | 'error_occurred'

// 队列服务接口
export interface IQueueService {
  // 基本任务操作
  submitTask(data: QueueTaskData, priority?: TaskPriority): Promise<string>
  cancelTask(taskId: string): Promise<boolean>
  getTask(taskId: string): Promise<QueueTask | null>
  getTaskStatus(taskId: string): Promise<QueueTaskStatus>

  // 批量操作
  submitBatch(request: BatchTaskRequest): Promise<string>
  getBatchResult(batchId: string): Promise<BatchTaskResult>

  // 队列管理
  getQueueStats(): Promise<QueueStats>
  getQueueConfig(): Promise<QueueConfig>
  updateQueueConfig(config: Partial<QueueConfig>): Promise<boolean>

  // 监控和事件
  subscribe(eventType: QueueEventType, callback: (event: QueueMonitorEvent) => void): () => void
  getTaskHistory(userId?: string, limit?: number): Promise<QueueTask[]>
}

// 任务调度策略
export type SchedulingStrategy =
  | 'fifo'        // 先进先出
  | 'priority'    // 优先级
  | 'round_robin' // 轮询
  | 'weighted'    // 加权

// 负载均衡配置
export interface LoadBalanceConfig {
  strategy: SchedulingStrategy
  weights?: Record<string, number>
  healthCheckInterval: number
  failoverThreshold: number
}

// Worker节点状态
export interface WorkerNodeStatus {
  id: string
  status: 'online' | 'offline' | 'busy' | 'error'
  currentTasks: number
  maxTasks: number
  lastHeartbeat: Date
  metrics: {
    tasksCompleted: number
    averageProcessingTime: number
    errorCount: number
    uptime: number
  }
}

// 队列健康检查结果
export interface QueueHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  components: {
    queue: 'healthy' | 'full' | 'error'
    workers: WorkerNodeStatus[]
    database: 'healthy' | 'slow' | 'error'
    broker: 'healthy' | 'disconnected' | 'error'
  }
  metrics: {
    responseTime: number
    throughput: number
    errorRate: number
  }
}