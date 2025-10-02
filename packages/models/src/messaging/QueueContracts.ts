/**
 * 消息队列契约定义 - 定义broker和engine之间的队列通信规范
 */

import type {
  UnifiedAITaskMessage,
  UnifiedAIResultMessage,
  UnifiedBatchTaskMessage,
  UnifiedBatchResultMessage,
  TaskStatusUpdateMessage,
  TaskCancelMessage
} from './AITaskTypes.js'

// 队列名称常量
export const QUEUE_NAMES = {
  // AI任务队列
  AI_TASKS: 'llm.process.queue',
  AI_RESULTS: 'result.notify.queue',

  // 优先级队列
  AI_TASKS_HIGH: 'llm.process.high.queue',
  AI_TASKS_NORMAL: 'llm.process.normal.queue',
  AI_TASKS_LOW: 'llm.process.low.queue',

  // 批处理队列
  AI_BATCH: 'llm.batch.process.queue',
  AI_BATCH_RESULTS: 'llm.batch.results.queue',

  // 状态更新队列
  TASK_STATUS: 'task.status.queue',

  // 取消队列
  TASK_CANCEL: 'task.cancel.queue',

  // 事件队列
  EVENTS_WEBSOCKET: 'events.websocket.queue',
  EVENTS_STORAGE: 'events.storage.queue'
} as const

// 交换机名称常量
export const EXCHANGE_NAMES = {
  LLM_DIRECT: 'llm.direct',
  EVENTS_TOPIC: 'events.topic',
  REALTIME_FANOUT: 'realtime.fanout',
  AI_RESULTS: 'ai.results.topic'
} as const

// 路由键常量
export const ROUTING_KEYS = {
  AI_PROCESS: 'llm.process',
  AI_RESULT: 'llm.result',
  AI_BATCH: 'llm.batch.process',
  AI_BATCH_RESULT: 'llm.batch.result',
  TASK_STATUS: 'task.status',
  TASK_CANCEL: 'task.cancel',

  // 事件路由键
  NODE_CREATED: 'node.created',
  NODE_UPDATED: 'node.updated',
  NODE_DELETED: 'node.deleted',
  NODE_OPTIMIZED: 'node.optimized',

  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',

  AI_TASK_STARTED: 'ai.task_started',
  AI_TASK_COMPLETED: 'ai.task_completed',
  AI_TASK_FAILED: 'ai.task_failed',

  // WebSocket 事件
  WEBSOCKET_CONNECTED: 'websocket.connected',
  WEBSOCKET_DISCONNECTED: 'websocket.disconnected',

  // 系统通知
  NOTIFICATION_SENT: 'notification.sent',
  ALERT_SENT: 'alert.sent',
  SYSTEM_UPDATED: 'system.updated'
} as const

// 消息类型接口映射
export interface MessageTypeMap {
  // AI任务消息
  [QUEUE_NAMES.AI_TASKS]: UnifiedAITaskMessage
  [QUEUE_NAMES.AI_TASKS_HIGH]: UnifiedAITaskMessage
  [QUEUE_NAMES.AI_TASKS_NORMAL]: UnifiedAITaskMessage
  [QUEUE_NAMES.AI_TASKS_LOW]: UnifiedAITaskMessage

  // AI结果消息
  [QUEUE_NAMES.AI_RESULTS]: UnifiedAIResultMessage

  // 批处理消息
  [QUEUE_NAMES.AI_BATCH]: UnifiedBatchTaskMessage
  [QUEUE_NAMES.AI_BATCH_RESULTS]: UnifiedBatchResultMessage

  // 状态消息
  [QUEUE_NAMES.TASK_STATUS]: TaskStatusUpdateMessage
  [QUEUE_NAMES.TASK_CANCEL]: TaskCancelMessage
}

// 队列配置 - 重命名以避免与其他模块冲突
export interface ModelQueueConfig {
  name: string
  durable: boolean
  exclusive: boolean
  autoDelete: boolean
  exchange?: string
  routingKey?: string | string[]
  arguments?: Record<string, any>
}

// 交换机配置 - 重命名以避免与其他模块冲突
export interface ModelExchangeConfig {
  name: string
  type: 'direct' | 'topic' | 'fanout' | 'headers'
  durable: boolean
  autoDelete: boolean
  arguments?: Record<string, any>
}

// 消息发布选项
export interface PublishOptions {
  exchange: string
  routingKey: string
  persistent?: boolean
  priority?: number
  expiration?: string
  correlationId?: string
  replyTo?: string
  messageId?: string
  headers?: Record<string, any>
}

// 消息消费选项
export interface ConsumeOptions {
  queue: string
  noAck?: boolean
  exclusive?: boolean
  priority?: number
  consumerTag?: string
  noLocal?: boolean
  arguments?: Record<string, any>
}

// 默认队列配置
export const DEFAULT_QUEUE_CONFIGS: Record<string, ModelQueueConfig> = {
  [QUEUE_NAMES.AI_TASKS]: {
    name: QUEUE_NAMES.AI_TASKS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-max-priority': 10,
      'x-message-ttl': 3600000, // 1小时
      'x-dead-letter-exchange': 'dlx.ai.tasks'
    }
  },

  [QUEUE_NAMES.AI_RESULTS]: {
    name: QUEUE_NAMES.AI_RESULTS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    exchange: EXCHANGE_NAMES.AI_RESULTS,
    routingKey: ROUTING_KEYS.AI_RESULT,
    arguments: {
      'x-message-ttl': 1800000, // 30分钟
      'x-max-length': 10000
    }
  },

  [QUEUE_NAMES.AI_BATCH]: {
    name: QUEUE_NAMES.AI_BATCH,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-max-priority': 5,
      'x-message-ttl': 7200000, // 2小时
      'x-dead-letter-exchange': 'dlx.ai.batch'
    }
  }
}

// 默认交换机配置
export const DEFAULT_EXCHANGE_CONFIGS: Record<string, ModelExchangeConfig> = {
  [EXCHANGE_NAMES.LLM_DIRECT]: {
    name: EXCHANGE_NAMES.LLM_DIRECT,
    type: 'direct',
    durable: true,
    autoDelete: false
  },

  [EXCHANGE_NAMES.EVENTS_TOPIC]: {
    name: EXCHANGE_NAMES.EVENTS_TOPIC,
    type: 'topic',
    durable: true,
    autoDelete: false
  },

  [EXCHANGE_NAMES.REALTIME_FANOUT]: {
    name: EXCHANGE_NAMES.REALTIME_FANOUT,
    type: 'fanout',
    durable: true,
    autoDelete: false
  },

  [EXCHANGE_NAMES.AI_RESULTS]: {
    name: EXCHANGE_NAMES.AI_RESULTS,
    type: 'topic',
    durable: true,
    autoDelete: false
  }
}

// 消息头部常量
export const MESSAGE_HEADERS = {
  TASK_TYPE: 'task-type',
  TASK_ID: 'task-id',
  USER_ID: 'user-id',
  PROJECT_ID: 'project-id',
  PRIORITY: 'priority',
  RETRY_COUNT: 'retry-count',
  TIMESTAMP: 'timestamp',
  SOURCE_SERVICE: 'source-service',
  TARGET_SERVICE: 'target-service'
} as const

// 消息属性常量
export const MESSAGE_PROPERTIES = {
  DELIVERY_MODE: {
    TRANSIENT: 1, // 非持久化
    PERSISTENT: 2  // 持久化
  },
  PRIORITY: {
    LOW: 1,
    NORMAL: 5,
    HIGH: 8,
    URGENT: 10
  }
} as const

// 服务标识
export const SERVICE_NAMES = {
  BROKER: '@sker/broker',
  ENGINE: '@sker/engine',
  GATEWAY: '@sker/gateway',
  STORE: '@sker/store'
} as const

// 工具函数：获取优先级队列名称
export function getPriorityQueueName(priority: 'low' | 'normal' | 'high'): string {
  switch (priority) {
    case 'high': return QUEUE_NAMES.AI_TASKS_HIGH
    case 'normal': return QUEUE_NAMES.AI_TASKS_NORMAL
    case 'low': return QUEUE_NAMES.AI_TASKS_LOW
    default: return QUEUE_NAMES.AI_TASKS_NORMAL
  }
}

// 工具函数：获取路由键
export function getResultRoutingKey(userId: string, projectId: string): string {
  return `task.result.${userId}.${projectId}`
}

export function getEventRoutingKey(eventType: string, entityType: string): string {
  return `${entityType}.${eventType}`
}

// 工具函数：创建消息头部
export function createMessageHeaders(
  taskId: string,
  taskType: string,
  userId: string,
  projectId: string,
  priority: number = MESSAGE_PROPERTIES.PRIORITY.NORMAL
): Record<string, any> {
  return {
    [MESSAGE_HEADERS.TASK_ID]: taskId,
    [MESSAGE_HEADERS.TASK_TYPE]: taskType,
    [MESSAGE_HEADERS.USER_ID]: userId,
    [MESSAGE_HEADERS.PROJECT_ID]: projectId,
    [MESSAGE_HEADERS.PRIORITY]: priority,
    [MESSAGE_HEADERS.TIMESTAMP]: new Date().toISOString(),
    [MESSAGE_HEADERS.SOURCE_SERVICE]: SERVICE_NAMES.BROKER
  }
}