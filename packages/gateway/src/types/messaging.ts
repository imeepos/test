/**
 * 消息队列相关类型定义
 */

/**
 * 队列消息处理器
 */
export type QueueMessageHandler = (
  message: string,
  metadata: MessageMetadata
) => Promise<void>

/**
 * 消息元数据
 */
export interface MessageMetadata {
  messageId: string
  correlationId: string
  timestamp: Date
  replyTo?: string
  routingKey: string
  exchange: string
  headers: Record<string, any>
  deliveryTag: number
  redelivered: boolean
  retryCount: number
}

/**
 * 队列订阅信息
 */
export interface QueueSubscription {
  queueName: string
  consumerTag: string
  handler: QueueMessageHandler
  options: {
    exchange?: string
    routingKey?: string
    autoAck?: boolean
    maxRetries?: number
  }
  active: boolean
}

/**
 * AI 任务消息
 */
export interface AITaskMessage {
  taskId: string
  type: AITaskType
  status: AITaskStatus
  userId: string
  projectId: string
  nodeId?: string
  priority?: TaskPriority
  data?: any
  result?: any
  error?: AITaskError
  progress?: TaskProgress
  metadata?: AITaskMetadata
  timestamp: Date
}

/**
 * AI 任务类型
 */
export type AITaskType =
  | 'content_generation'
  | 'content_optimization'
  | 'semantic_analysis'
  | 'content_fusion'
  | 'batch_processing'
  | 'node_enhancement'

/**
 * AI 任务状态
 */
export type AITaskStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * AI 任务错误
 */
export interface AITaskError {
  code: string
  message: string
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
}

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
}

/**
 * WebSocket 消息
 */
export interface WebSocketMessage {
  id: string
  type: WebSocketMessageType
  target?: string // 目标用户/房间/连接ID
  data: any
  timestamp: Date
  priority?: number
}

/**
 * WebSocket 消息类型
 */
export type WebSocketMessageType =
  | 'task_completed'
  | 'task_failed'
  | 'task_progress'
  | 'node_updated'
  | 'connection_created'
  | 'connection_deleted'
  | 'project_updated'
  | 'collaboration_invite'
  | 'collaboration_update'
  | 'system_notification'
  | 'user_status'
  | 'realtime_sync'

/**
 * 系统通知消息
 */
export interface SystemNotification {
  id: string
  type: SystemNotificationType
  title: string
  message: string
  data?: any
  recipients: string[] // 用户ID列表
  channels: NotificationChannel[]
  priority: NotificationPriority
  expireAt?: Date
  createdAt: Date
}

/**
 * 系统通知类型
 */
export type SystemNotificationType =
  | 'maintenance'
  | 'update'
  | 'security_alert'
  | 'quota_warning'
  | 'service_disruption'
  | 'feature_announcement'
  | 'critical_task_failure'

/**
 * 通知渠道
 */
export type NotificationChannel = 'websocket' | 'email' | 'push' | 'sms'

/**
 * 通知优先级
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Gateway 队列配置
 */
export interface GatewayQueueConfig {
  exchanges: {
    aiTasks: string
    websocket: string
    system: string
    deadLetter: string
  }
  queues: {
    aiTaskResults: string
    websocketBroadcast: string
    systemNotifications: string
    deadLetterQueue: string
  }
  routingKeys: {
    aiTask: {
      request: string
      result: string
      progress: string
    }
    websocket: {
      broadcast: string
      userMessage: string
      systemMessage: string
    }
    system: {
      notification: string
      alert: string
      maintenance: string
    }
  }
}

/**
 * 默认队列配置
 */
export const defaultGatewayQueueConfig: GatewayQueueConfig = {
  exchanges: {
    aiTasks: 'sker.ai.tasks',
    websocket: 'sker.websocket',
    system: 'sker.system',
    deadLetter: 'sker.dead_letter'
  },
  queues: {
    aiTaskResults: 'gateway.ai_task_results',
    websocketBroadcast: 'gateway.websocket_broadcast',
    systemNotifications: 'gateway.system_notifications',
    deadLetterQueue: 'gateway.dead_letters'
  },
  routingKeys: {
    aiTask: {
      request: 'task.request',
      result: 'task.result',
      progress: 'task.progress'
    },
    websocket: {
      broadcast: 'ws.broadcast',
      userMessage: 'ws.user',
      systemMessage: 'ws.system'
    },
    system: {
      notification: 'notification',
      alert: 'alert',
      maintenance: 'maintenance'
    }
  }
}

/**
 * 队列消息统计
 */
export interface QueueStats {
  queueName: string
  messageCount: number
  consumerCount: number
  publishRate: number
  deliveryRate: number
  ackRate: number
  unackedCount: number
}

/**
 * 消息处理结果
 */
export interface MessageProcessingResult {
  success: boolean
  processingTime: number
  error?: Error
  retryCount: number
  messageId: string
}

/**
 * 批量消息操作
 */
export interface BatchMessageOperation {
  messages: Array<{
    exchange: string
    routingKey: string
    content: any
    options?: any
  }>
  options?: {
    parallel: boolean
    maxConcurrency: number
    failFast: boolean
  }
}

/**
 * 消息过滤器
 */
export interface MessageFilter {
  headers?: Record<string, any>
  routingKeyPattern?: string
  contentFilter?: (content: any) => boolean
  userFilter?: (userId: string) => boolean
}

/**
 * 队列监控指标
 */
export interface QueueMetrics {
  totalMessages: number
  successfulMessages: number
  failedMessages: number
  averageProcessingTime: number
  messagesPerSecond: number
  errorRate: number
  retryRate: number
  deadLetterCount: number
  lastProcessedAt: Date
}

/**
 * 实时事件
 */
export interface RealtimeEvent {
  id: string
  type: string
  source: string
  target?: string
  data: any
  timestamp: Date
  propagate: boolean // 是否需要传播到其他服务
}

/**
 * 消息路由规则
 */
export interface MessageRouteRule {
  name: string
  description: string
  condition: MessageFilter
  action: RouteAction
  priority: number
  enabled: boolean
}

/**
 * 路由动作
 */
export interface RouteAction {
  type: 'forward' | 'transform' | 'filter' | 'duplicate' | 'delay'
  params: Record<string, any>
}

/**
 * 消息转换器
 */
export interface MessageTransformer {
  name: string
  transform: (message: any, metadata: MessageMetadata) => Promise<any>
  validate?: (message: any) => boolean
}

/**
 * 队列健康状态
 */
export interface QueueHealth {
  queueName: string
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  metrics: QueueMetrics
  lastChecked: Date
}