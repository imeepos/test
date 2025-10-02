/**
 * 事件协议契约定义
 *
 * 定义领域事件的标准格式
 * 支持事件溯源和CQRS架构
 */

import { z } from 'zod'

// ============================================================================
// 事件元数据 Schema
// ============================================================================

export const EventMetadataSchema = z.object({
  source: z.string(), // 事件来源服务
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  clientInfo: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional()
  }).optional(),
  customData: z.record(z.unknown()).optional()
}).strict()

export type EventMetadata = z.infer<typeof EventMetadataSchema>

// ============================================================================
// 领域事件基础 Schema
// ============================================================================

export const DomainEventSchemaV1 = z.object({
  // 事件标识
  eventId: z.string().uuid(),
  eventType: z.string().min(1),

  // 聚合根信息
  aggregateId: z.string().uuid(),
  aggregateType: z.string().min(1),

  // 版本控制（乐观锁）
  version: z.number().int().positive(),

  // 时间戳
  timestamp: z.date(),

  // 事件载荷
  payload: z.unknown(),

  // 元数据
  metadata: EventMetadataSchema,

  // 因果关系
  causationId: z.string().uuid().optional(), // 导致此事件的命令/事件ID
  correlationId: z.string().uuid().optional() // 关联ID，追踪业务流程
}).strict()

export type DomainEvent<T = unknown> = Omit<
  z.infer<typeof DomainEventSchemaV1>,
  'payload'
> & {
  payload: T
}

// ============================================================================
// 领域事件类型常量
// ============================================================================

export const DomainEventTypes = {
  // 节点事件
  NODE_CREATED: 'node.created',
  NODE_UPDATED: 'node.updated',
  NODE_DELETED: 'node.deleted',
  NODE_CONTENT_CHANGED: 'node.content.changed',
  NODE_MOVED: 'node.moved',
  NODE_TAGGED: 'node.tagged',

  // AI任务事件
  AI_TASK_QUEUED: 'ai.task.queued',
  AI_TASK_STARTED: 'ai.task.started',
  AI_TASK_PROCESSING: 'ai.task.processing',
  AI_TASK_PROGRESS_UPDATED: 'ai.task.progress.updated',
  AI_TASK_COMPLETED: 'ai.task.completed',
  AI_TASK_FAILED: 'ai.task.failed',
  AI_TASK_CANCELLED: 'ai.task.cancelled',
  AI_TASK_TIMEOUT: 'ai.task.timeout',

  // 项目事件
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_SHARED: 'project.shared',
  PROJECT_ARCHIVED: 'project.archived',

  // 用户事件
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PROFILE_UPDATED: 'user.profile.updated',

  // 连接事件
  CONNECTION_CREATED: 'connection.created',
  CONNECTION_UPDATED: 'connection.updated',
  CONNECTION_DELETED: 'connection.deleted',

  // 系统事件
  SYSTEM_ERROR: 'system.error',
  SYSTEM_HEALTH_CHECK: 'system.health.check',
  SERVICE_STARTED: 'service.started',
  SERVICE_STOPPED: 'service.stopped',
  SERVICE_DEGRADED: 'service.degraded'
} as const

export type DomainEventType = (typeof DomainEventTypes)[keyof typeof DomainEventTypes]

// ============================================================================
// 特定事件载荷 Schema
// ============================================================================

// 节点创建事件载荷
export const NodeCreatedPayloadSchema = z.object({
  nodeId: z.string().uuid(),
  projectId: z.string().uuid(),
  content: z.string(),
  title: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  createdBy: z.string().uuid()
}).strict()

export type NodeCreatedPayload = z.infer<typeof NodeCreatedPayloadSchema>

// 节点更新事件载荷
export const NodeUpdatedPayloadSchema = z.object({
  nodeId: z.string().uuid(),
  changes: z.record(z.unknown()),
  previousVersion: z.number().int(),
  newVersion: z.number().int(),
  reason: z.string().optional()
}).strict()

export type NodeUpdatedPayload = z.infer<typeof NodeUpdatedPayloadSchema>

// AI任务排队事件载荷
export const AITaskQueuedPayloadSchema = z.object({
  taskId: z.string().uuid(),
  type: z.enum(['generate', 'optimize', 'fusion', 'analyze', 'expand']),
  nodeId: z.string().uuid(),
  priority: z.enum(['low', 'normal', 'high', 'urgent'])
}).strict()

export type AITaskQueuedPayload = z.infer<typeof AITaskQueuedPayloadSchema>

// AI任务完成事件载荷
export const AITaskCompletedPayloadSchema = z.object({
  taskId: z.string().uuid(),
  nodeId: z.string().uuid(),
  result: z.object({
    content: z.string(),
    title: z.string(),
    confidence: z.number(),
    tags: z.array(z.string())
  }),
  processingTime: z.number().positive()
}).strict()

export type AITaskCompletedPayload = z.infer<typeof AITaskCompletedPayloadSchema>

// AI任务失败事件载荷
export const AITaskFailedPayloadSchema = z.object({
  taskId: z.string().uuid(),
  nodeId: z.string().uuid(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean()
  }),
  attemptNumber: z.number().int().positive()
}).strict()

export type AITaskFailedPayload = z.infer<typeof AITaskFailedPayloadSchema>

// 系统错误事件载荷
export const SystemErrorPayloadSchema = z.object({
  service: z.string(),
  errorType: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical'])
}).strict()

export type SystemErrorPayload = z.infer<typeof SystemErrorPayloadSchema>

// ============================================================================
// 事件订阅模式
// ============================================================================

export const EventSubscriptionPatternSchema = z.object({
  pattern: z.string(), // 支持通配符，如 "node.*", "ai.task.completed"
  handler: z.function(),
  options: z.object({
    priority: z.number().int().min(0).max(10).optional(),
    retry: z.boolean().optional(),
    deadLetterQueue: z.boolean().optional()
  }).optional()
}).strict()

export type EventSubscriptionPattern = z.infer<typeof EventSubscriptionPatternSchema>

// ============================================================================
// 事件存储接口定义
// ============================================================================

export interface EventStore {
  /**
   * 追加新事件到事件流
   */
  append(event: DomainEvent): Promise<void>

  /**
   * 批量追加事件（事务性）
   */
  appendBatch(events: DomainEvent[]): Promise<void>

  /**
   * 根据聚合根ID获取事件流
   */
  getByAggregate(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>

  /**
   * 根据事件类型获取事件
   */
  getByType(eventType: string, limit?: number, offset?: number): Promise<DomainEvent[]>

  /**
   * 根据时间范围获取事件
   */
  getByTimeRange(from: Date, to: Date): Promise<DomainEvent[]>

  /**
   * 订阅事件模式
   */
  subscribe(pattern: string, handler: EventHandler): Subscription

  /**
   * 获取聚合根的当前版本
   */
  getAggregateVersion(aggregateId: string): Promise<number>

  /**
   * 检查事件是否存在（幂等性）
   */
  exists(eventId: string): Promise<boolean>
}

export type EventHandler = (event: DomainEvent) => Promise<void> | void

export interface Subscription {
  unsubscribe(): void
  pause(): void
  resume(): void
}

// ============================================================================
// 事件投影接口（CQRS读模型）
// ============================================================================

export interface EventProjection<TState = unknown> {
  /**
   * 投影名称
   */
  name: string

  /**
   * 初始状态
   */
  initialState: TState

  /**
   * 事件处理器映射
   */
  handlers: Record<string, (state: TState, event: DomainEvent) => TState>

  /**
   * 应用事件流到状态
   */
  project(events: DomainEvent[]): TState
}

// ============================================================================
// 事件协议版本
// ============================================================================

export const EVENT_PROTOCOL_VERSION = '1.0.0' as const

// ============================================================================
// 事件协议契约定义
// ============================================================================

export const EventContractV1 = {
  version: EVENT_PROTOCOL_VERSION,
  schemas: {
    domainEvent: DomainEventSchemaV1,
    metadata: EventMetadataSchema,
    payloads: {
      nodeCreated: NodeCreatedPayloadSchema,
      nodeUpdated: NodeUpdatedPayloadSchema,
      aiTaskQueued: AITaskQueuedPayloadSchema,
      aiTaskCompleted: AITaskCompletedPayloadSchema,
      aiTaskFailed: AITaskFailedPayloadSchema,
      systemError: SystemErrorPayloadSchema
    }
  },
  types: DomainEventTypes
} as const

// ============================================================================
// 事件工厂函数
// ============================================================================

export function createDomainEvent<T = unknown>(params: {
  eventType: string
  aggregateId: string
  aggregateType: string
  version: number
  payload: T
  metadata: EventMetadata
  causationId?: string
  correlationId?: string
}): DomainEvent<T> {
  return {
    eventId: crypto.randomUUID(),
    timestamp: new Date(),
    ...params
  }
}

// ============================================================================
// 事件匹配工具
// ============================================================================

export function matchesPattern(eventType: string, pattern: string): boolean {
  // 转换通配符模式为正则表达式
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(eventType)
}

// ============================================================================
// 事件排序工具
// ============================================================================

export function sortEventsByVersion(events: DomainEvent[]): DomainEvent[] {
  return [...events].sort((a, b) => a.version - b.version)
}

export function sortEventsByTimestamp(events: DomainEvent[]): DomainEvent[] {
  return [...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
}
