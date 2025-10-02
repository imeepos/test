/**
 * 事件系统模块导出
 *
 * 提供类型安全的事件系统，包括：
 * - EventKey<T> 品牌类型
 * - 所有事件类型定义
 * - 事件注册表
 * - 事件总线接口
 */

// 事件键系统
export { createEventKey, getEventKeyString, type EventKey } from './event-keys.js'

// 所有事件类型
export type {
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

// 事件注册表
export {
  EventKeys,
  type EventKeyType,
  type EventTypeMap,
  type EventName,
  type EventPayload
} from './event-registry.js'

// 事件总线接口
export type {
  TypeSafeEventHandler,
  UnsubscribeFn,
  TypeSafeEventBus,
  AsyncEventBus,
  EventBusOptions,
  EventBusMetrics
} from './event-bus.interface.js'
