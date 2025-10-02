/**
 * 事件注册表 - 类型安全的事件键常量
 *
 * 所有系统事件的统一注册中心
 */

import { createEventKey } from './event-keys.js'
import type {
  // AI 任务事件
  AITaskQueuedEvent,
  AITaskProcessingEvent,
  AITaskCompletedEvent,
  AITaskFailedEvent,
  // 节点事件
  NodeCreatedEvent,
  NodeUpdatedEvent,
  NodeDeletedEvent,
  NodeStatusChangedEvent,
  // 连接事件
  ConnectionCreatedEvent,
  ConnectionDeletedEvent,
  // 项目事件
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectDeletedEvent,
  // 系统事件
  SystemHealthCheckEvent,
  SystemErrorEvent
} from './event-types.js'

/**
 * 事件键注册表 - 类型安全的常量
 *
 * @example
 * import { EventKeys } from '@sker/protocols'
 *
 * eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
 *   // event 类型自动推断为 AITaskCompletedEvent
 *   console.log(event.result.content)
 * })
 */
export const EventKeys = {
  // ========================================
  // AI 任务事件
  // ========================================
  AI_TASK_QUEUED: createEventKey<AITaskQueuedEvent>('ai.task.queued'),
  AI_TASK_PROCESSING: createEventKey<AITaskProcessingEvent>('ai.task.processing'),
  AI_TASK_COMPLETED: createEventKey<AITaskCompletedEvent>('ai.task.completed'),
  AI_TASK_FAILED: createEventKey<AITaskFailedEvent>('ai.task.failed'),

  // ========================================
  // 节点事件
  // ========================================
  NODE_CREATED: createEventKey<NodeCreatedEvent>('node.created'),
  NODE_UPDATED: createEventKey<NodeUpdatedEvent>('node.updated'),
  NODE_DELETED: createEventKey<NodeDeletedEvent>('node.deleted'),
  NODE_STATUS_CHANGED: createEventKey<NodeStatusChangedEvent>('node.status.changed'),

  // ========================================
  // 连接事件
  // ========================================
  CONNECTION_CREATED: createEventKey<ConnectionCreatedEvent>('connection.created'),
  CONNECTION_DELETED: createEventKey<ConnectionDeletedEvent>('connection.deleted'),

  // ========================================
  // 项目事件
  // ========================================
  PROJECT_CREATED: createEventKey<ProjectCreatedEvent>('project.created'),
  PROJECT_UPDATED: createEventKey<ProjectUpdatedEvent>('project.updated'),
  PROJECT_DELETED: createEventKey<ProjectDeletedEvent>('project.deleted'),

  // ========================================
  // 系统事件
  // ========================================
  SYSTEM_HEALTH_CHECK: createEventKey<SystemHealthCheckEvent>('system.health.check'),
  SYSTEM_ERROR: createEventKey<SystemErrorEvent>('system.error')
} as const

/**
 * 事件键类型 - 所有可用事件的联合类型
 */
export type EventKeyType = (typeof EventKeys)[keyof typeof EventKeys]

/**
 * 事件名称到事件类型的映射
 */
export type EventTypeMap = {
  'ai.task.queued': AITaskQueuedEvent
  'ai.task.processing': AITaskProcessingEvent
  'ai.task.completed': AITaskCompletedEvent
  'ai.task.failed': AITaskFailedEvent
  'node.created': NodeCreatedEvent
  'node.updated': NodeUpdatedEvent
  'node.deleted': NodeDeletedEvent
  'node.status.changed': NodeStatusChangedEvent
  'connection.created': ConnectionCreatedEvent
  'connection.deleted': ConnectionDeletedEvent
  'project.created': ProjectCreatedEvent
  'project.updated': ProjectUpdatedEvent
  'project.deleted': ProjectDeletedEvent
  'system.health.check': SystemHealthCheckEvent
  'system.error': SystemErrorEvent
}

/**
 * 所有事件名称的联合类型
 */
export type EventName = keyof EventTypeMap

/**
 * 根据事件名称获取事件类型
 */
export type EventPayload<K extends EventName> = EventTypeMap[K]
