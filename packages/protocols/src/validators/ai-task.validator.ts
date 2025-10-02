/**
 * AI 任务协议验证器
 *
 * 提供 AI 任务消息的验证功能
 */

import type { Result } from './result.js'
import { SchemaValidationError } from './errors.js'
import { validate, validateBatch } from './message.validator.js'
import {
  type AITaskMessage,
  type AIResultMessage,
  type BatchTaskMessage,
  type BatchResultMessage,
  type TaskStatusUpdateMessage,
  type TaskCancelMessage,
  AITaskMessageSchemaV1,
  AIResultMessageSchemaV1,
  BatchTaskMessageSchemaV1,
  BatchResultMessageSchemaV1,
  TaskStatusUpdateMessageSchema,
  TaskCancelMessageSchema,
  type AITaskType,
  type TaskPriority,
  type TaskStatus,
  AITaskType as AITaskTypeSchema,
  TaskPriority as TaskPrioritySchema,
  TaskStatus as TaskStatusSchema
} from '../contracts/ai-task.contract.js'

// ============================================================================
// AI 任务消息验证
// ============================================================================

/**
 * 验证 AI 任务消息
 */
export function validateAITask(data: unknown): Result<AITaskMessage, SchemaValidationError> {
  return validate(AITaskMessageSchemaV1, data, 'AITaskMessage')
}

/**
 * 验证 AI 任务结果消息
 */
export function validateAIResult(data: unknown): Result<AIResultMessage, SchemaValidationError> {
  return validate(AIResultMessageSchemaV1, data, 'AIResultMessage')
}

/**
 * 验证批处理任务消息
 */
export function validateBatchTask(data: unknown): Result<BatchTaskMessage, SchemaValidationError> {
  return validate(BatchTaskMessageSchemaV1, data, 'BatchTaskMessage')
}

/**
 * 验证批处理结果消息
 */
export function validateBatchResult(data: unknown): Result<BatchResultMessage, SchemaValidationError> {
  return validate(BatchResultMessageSchemaV1, data, 'BatchResultMessage')
}

/**
 * 验证任务状态更新消息
 */
export function validateTaskStatusUpdate(
  data: unknown
): Result<TaskStatusUpdateMessage, SchemaValidationError> {
  return validate(TaskStatusUpdateMessageSchema, data, 'TaskStatusUpdateMessage')
}

/**
 * 验证任务取消消息
 */
export function validateTaskCancel(data: unknown): Result<TaskCancelMessage, SchemaValidationError> {
  return validate(TaskCancelMessageSchema, data, 'TaskCancelMessage')
}

// ============================================================================
// 批量验证
// ============================================================================

/**
 * 批量验证 AI 任务消息
 */
export function validateAITaskBatch(
  dataArray: unknown[]
): Result<AITaskMessage[], SchemaValidationError> {
  return validateBatch(AITaskMessageSchemaV1, dataArray, 'AITaskMessage')
}

/**
 * 批量验证 AI 结果消息
 */
export function validateAIResultBatch(
  dataArray: unknown[]
): Result<AIResultMessage[], SchemaValidationError> {
  return validateBatch(AIResultMessageSchemaV1, dataArray, 'AIResultMessage')
}

// ============================================================================
// 枚举值验证
// ============================================================================

/**
 * 验证 AI 任务类型
 */
export function validateTaskType(value: unknown): Result<AITaskType, SchemaValidationError> {
  return validate(AITaskTypeSchema, value, 'AITaskType')
}

/**
 * 验证任务优先级
 */
export function validateTaskPriority(value: unknown): Result<TaskPriority, SchemaValidationError> {
  return validate(TaskPrioritySchema, value, 'TaskPriority')
}

/**
 * 验证任务状态
 */
export function validateTaskStatus(value: unknown): Result<TaskStatus, SchemaValidationError> {
  return validate(TaskStatusSchema, value, 'TaskStatus')
}

// ============================================================================
// JSON 字符串验证（常用于消息队列）
// ============================================================================

/**
 * 从 JSON 字符串验证 AI 任务消息
 *
 * @param json - JSON 字符串
 * @returns Result<AITaskMessage, SchemaValidationError>
 */
export function validateAITaskFromJSON(json: string): Result<AITaskMessage, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateAITask(data)
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
 * 从 JSON 字符串验证 AI 结果消息
 *
 * @param json - JSON 字符串
 * @returns Result<AIResultMessage, SchemaValidationError>
 */
export function validateAIResultFromJSON(json: string): Result<AIResultMessage, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateAIResult(data)
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
 * 从 Buffer 验证 AI 任务消息
 *
 * @param buffer - Buffer 对象或 Uint8Array
 * @returns Result<AITaskMessage, SchemaValidationError>
 */
export function validateAITaskFromBuffer(
  buffer: Uint8Array
): Result<AITaskMessage, SchemaValidationError> {
  const decoder = new TextDecoder('utf-8')
  return validateAITaskFromJSON(decoder.decode(buffer))
}

/**
 * 从 Buffer 验证 AI 结果消息
 *
 * @param buffer - Buffer 对象或 Uint8Array
 * @returns Result<AIResultMessage, SchemaValidationError>
 */
export function validateAIResultFromBuffer(
  buffer: Uint8Array
): Result<AIResultMessage, SchemaValidationError> {
  const decoder = new TextDecoder('utf-8')
  return validateAIResultFromJSON(decoder.decode(buffer))
}

// ============================================================================
// 类型守卫（运行时检查）
// ============================================================================

/**
 * 检查是否为有效的 AI 任务消息（类型守卫）
 */
export function isValidAITask(data: unknown): data is AITaskMessage {
  const result = validateAITask(data)
  return result.success
}

/**
 * 检查是否为有效的 AI 结果消息（类型守卫）
 */
export function isValidAIResult(data: unknown): data is AIResultMessage {
  const result = validateAIResult(data)
  return result.success
}

/**
 * 检查是否为有效的批处理任务消息（类型守卫）
 */
export function isValidBatchTask(data: unknown): data is BatchTaskMessage {
  const result = validateBatchTask(data)
  return result.success
}
