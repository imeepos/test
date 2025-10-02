/**
 * 事件协议验证器
 *
 * 提供领域事件的验证功能
 */

import type { Result } from './result.js'
import { SchemaValidationError } from './errors.js'
import { validate, validateBatch } from './message.validator.js'
import {
  type DomainEvent,
  type EventMetadata,
  type NodeCreatedPayload,
  type NodeUpdatedPayload,
  type AITaskQueuedPayload,
  type AITaskCompletedPayload,
  type AITaskFailedPayload,
  type SystemErrorPayload,
  DomainEventSchemaV1,
  EventMetadataSchema,
  NodeCreatedPayloadSchema,
  NodeUpdatedPayloadSchema,
  AITaskQueuedPayloadSchema,
  AITaskCompletedPayloadSchema,
  AITaskFailedPayloadSchema,
  SystemErrorPayloadSchema,
  DomainEventTypes
} from '../contracts/event.contract.js'

// ============================================================================
// 领域事件验证
// ============================================================================

/**
 * 验证领域事件
 */
export function validateDomainEvent(
  data: unknown
): Result<DomainEvent, SchemaValidationError> {
  return validate(DomainEventSchemaV1, data, 'DomainEvent') as Result<DomainEvent, SchemaValidationError>
}

/**
 * 验证事件元数据
 */
export function validateEventMetadata(
  data: unknown
): Result<EventMetadata, SchemaValidationError> {
  return validate(EventMetadataSchema, data, 'EventMetadata')
}

// ============================================================================
// 事件载荷验证
// ============================================================================

/**
 * 验证节点创建事件载荷
 */
export function validateNodeCreatedPayload(
  data: unknown
): Result<NodeCreatedPayload, SchemaValidationError> {
  return validate(NodeCreatedPayloadSchema, data, 'NodeCreatedPayload')
}

/**
 * 验证节点更新事件载荷
 */
export function validateNodeUpdatedPayload(
  data: unknown
): Result<NodeUpdatedPayload, SchemaValidationError> {
  return validate(NodeUpdatedPayloadSchema, data, 'NodeUpdatedPayload')
}

/**
 * 验证 AI 任务排队事件载荷
 */
export function validateAITaskQueuedPayload(
  data: unknown
): Result<AITaskQueuedPayload, SchemaValidationError> {
  return validate(AITaskQueuedPayloadSchema, data, 'AITaskQueuedPayload')
}

/**
 * 验证 AI 任务完成事件载荷
 */
export function validateAITaskCompletedPayload(
  data: unknown
): Result<AITaskCompletedPayload, SchemaValidationError> {
  return validate(AITaskCompletedPayloadSchema, data, 'AITaskCompletedPayload')
}

/**
 * 验证 AI 任务失败事件载荷
 */
export function validateAITaskFailedPayload(
  data: unknown
): Result<AITaskFailedPayload, SchemaValidationError> {
  return validate(AITaskFailedPayloadSchema, data, 'AITaskFailedPayload')
}

/**
 * 验证系统错误事件载荷
 */
export function validateSystemErrorPayload(
  data: unknown
): Result<SystemErrorPayload, SchemaValidationError> {
  return validate(SystemErrorPayloadSchema, data, 'SystemErrorPayload')
}

// ============================================================================
// 事件类型特定验证
// ============================================================================

/**
 * 根据事件类型验证载荷
 */
export function validateEventPayloadByType(
  eventType: string,
  data: unknown
): Result<unknown, SchemaValidationError> {
  switch (eventType) {
    case DomainEventTypes.NODE_CREATED:
      return validateNodeCreatedPayload(data)

    case DomainEventTypes.NODE_UPDATED:
      return validateNodeUpdatedPayload(data)

    case DomainEventTypes.AI_TASK_QUEUED:
      return validateAITaskQueuedPayload(data)

    case DomainEventTypes.AI_TASK_COMPLETED:
      return validateAITaskCompletedPayload(data)

    case DomainEventTypes.AI_TASK_FAILED:
      return validateAITaskFailedPayload(data)

    case DomainEventTypes.SYSTEM_ERROR:
      return validateSystemErrorPayload(data)

    default:
      // 未知事件类型，跳过载荷验证
      return { success: true, value: data }
  }
}

/**
 * 验证完整的领域事件（包括载荷类型检查）
 */
export function validateDomainEventWithPayload(
  data: unknown
): Result<DomainEvent, SchemaValidationError> {
  // 先验证基础事件结构
  const eventResult = validateDomainEvent(data)
  if (!eventResult.success) {
    return eventResult
  }

  const event = eventResult.value

  // 再验证载荷
  const payloadResult = validateEventPayloadByType(event.eventType, event.payload)
  if (!payloadResult.success) {
    return payloadResult as Result<DomainEvent, SchemaValidationError>
  }

  return eventResult
}

// ============================================================================
// 批量验证
// ============================================================================

/**
 * 批量验证领域事件
 */
export function validateDomainEventBatch(
  dataArray: unknown[]
): Result<DomainEvent[], SchemaValidationError> {
  return validateBatch(DomainEventSchemaV1, dataArray, 'DomainEvent') as Result<DomainEvent[], SchemaValidationError>
}

// ============================================================================
// JSON 字符串验证
// ============================================================================

/**
 * 从 JSON 字符串验证领域事件
 */
export function validateDomainEventFromJSON(
  json: string
): Result<DomainEvent, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateDomainEvent(data)
  } catch (error) {
    return {
      success: false,
      error: new SchemaValidationError('Invalid JSON string', {
        issues: [{
          code: 'invalid_json',
          message: error instanceof Error ? error.message : 'Failed to parse JSON',
          path: []
        }]
      })
    }
  }
}

/**
 * 从 JSON 字符串验证带载荷的领域事件
 */
export function validateDomainEventWithPayloadFromJSON(
  json: string
): Result<DomainEvent, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateDomainEventWithPayload(data)
  } catch (error) {
    return {
      success: false,
      error: new SchemaValidationError('Invalid JSON string', {
        issues: [{
          code: 'invalid_json',
          message: error instanceof Error ? error.message : 'Failed to parse JSON',
          path: []
        }]
      })
    }
  }
}

// ============================================================================
// Buffer 验证（用于 RabbitMQ）
// ============================================================================

/**
 * 从 Buffer 验证领域事件
 */
export function validateDomainEventFromBuffer(
  buffer: Uint8Array
): Result<DomainEvent, SchemaValidationError> {
  const decoder = new TextDecoder('utf-8')
  return validateDomainEventFromJSON(decoder.decode(buffer))
}

/**
 * 从 Buffer 验证带载荷的领域事件
 */
export function validateDomainEventWithPayloadFromBuffer(
  buffer: Uint8Array
): Result<DomainEvent, SchemaValidationError> {
  const decoder = new TextDecoder('utf-8')
  return validateDomainEventWithPayloadFromJSON(decoder.decode(buffer))
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 检查是否为有效的领域事件（类型守卫）
 */
export function isValidDomainEvent(data: unknown): data is DomainEvent {
  const result = validateDomainEvent(data)
  return result.success
}

/**
 * 检查是否为有效的事件元数据（类型守卫）
 */
export function isValidEventMetadata(data: unknown): data is EventMetadata {
  const result = validateEventMetadata(data)
  return result.success
}

// ============================================================================
// 事件类型检查工具
// ============================================================================

/**
 * 检查是否为特定类型的事件
 */
export function isEventOfType(
  event: DomainEvent,
  eventType: string
): boolean {
  return event.eventType === eventType
}

/**
 * 检查是否为节点事件
 */
export function isNodeEvent(event: DomainEvent): boolean {
  return event.eventType.startsWith('node.')
}

/**
 * 检查是否为 AI 任务事件
 */
export function isAITaskEvent(event: DomainEvent): boolean {
  return event.eventType.startsWith('ai.task.')
}

/**
 * 检查是否为系统事件
 */
export function isSystemEvent(event: DomainEvent): boolean {
  return event.eventType.startsWith('system.')
}
