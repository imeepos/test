/**
 * AI 处理协议验证器 V2
 *
 * 统一的 context + prompt 模式验证
 */

import { validate, validateFromJSON, validateFromBuffer } from './message.validator.js'
import {
  AIProcessRequestSchema,
  AIProcessResponseSchema,
  TaskProgressUpdateSchema,
  type AIProcessRequest,
  type AIProcessResponse,
  type TaskProgressUpdate
} from '../contracts/ai-process.contract.js'
import { type Result } from './result.js'
import { type SchemaValidationError } from './errors.js'

// ============================================================================
// AI 处理请求验证
// ============================================================================

/**
 * 验证 AI 处理请求
 *
 * @param data - 待验证的数据
 * @returns 验证结果
 *
 * @example
 * const result = validateAIProcessRequest({
 *   taskId: uuid(),
 *   nodeId: uuid(),
 *   projectId: uuid(),
 *   userId: uuid(),
 *   context: '我想做一个电商网站的需求',
 *   prompt: '分析技术架构',
 *   priority: 'normal',
 *   timestamp: new Date()
 * })
 *
 * if (result.success) {
 *   console.log('Valid request:', result.value)
 * } else {
 *   console.error('Validation failed:', result.error.getFormattedMessage())
 * }
 */
export function validateAIProcessRequest(
  data: unknown
): Result<AIProcessRequest, SchemaValidationError> {
  return validate(AIProcessRequestSchema, data, 'AIProcessRequest')
}

/**
 * 从 JSON 字符串验证 AI 处理请求
 */
export function validateAIProcessRequestFromJSON(
  json: string
): Result<AIProcessRequest, SchemaValidationError> {
  return validateFromJSON(AIProcessRequestSchema, json, 'AIProcessRequest')
}

/**
 * 从 Buffer 验证 AI 处理请求
 */
export function validateAIProcessRequestFromBuffer(
  buffer: Uint8Array
): Result<AIProcessRequest, SchemaValidationError> {
  return validateFromBuffer(AIProcessRequestSchema, buffer, 'AIProcessRequest')
}

/**
 * 类型守卫：检查是否为有效的 AI 处理请求
 */
export function isValidAIProcessRequest(data: unknown): data is AIProcessRequest {
  const result = validateAIProcessRequest(data)
  return result.success
}

// ============================================================================
// AI 处理响应验证
// ============================================================================

/**
 * 验证 AI 处理响应
 *
 * @param data - 待验证的数据
 * @returns 验证结果
 *
 * @example
 * const result = validateAIProcessResponse({
 *   taskId: uuid(),
 *   nodeId: uuid(),
 *   projectId: uuid(),
 *   userId: uuid(),
 *   status: 'completed',
 *   success: true,
 *   result: {
 *     content: '生成的内容',
 *     title: '标题',
 *     confidence: 0.95
 *   },
 *   stats: {
 *     processingTime: 1500
 *   },
 *   timestamp: new Date()
 * })
 */
export function validateAIProcessResponse(
  data: unknown
): Result<AIProcessResponse, SchemaValidationError> {
  return validate(AIProcessResponseSchema, data, 'AIProcessResponse')
}

/**
 * 从 JSON 字符串验证 AI 处理响应
 */
export function validateAIProcessResponseFromJSON(
  json: string
): Result<AIProcessResponse, SchemaValidationError> {
  return validateFromJSON(AIProcessResponseSchema, json, 'AIProcessResponse')
}

/**
 * 从 Buffer 验证 AI 处理响应
 */
export function validateAIProcessResponseFromBuffer(
  buffer: Uint8Array
): Result<AIProcessResponse, SchemaValidationError> {
  return validateFromBuffer(AIProcessResponseSchema, buffer, 'AIProcessResponse')
}

/**
 * 类型守卫：检查是否为有效的 AI 处理响应
 */
export function isValidAIProcessResponse(data: unknown): data is AIProcessResponse {
  const result = validateAIProcessResponse(data)
  return result.success
}

// ============================================================================
// 任务进度更新验证
// ============================================================================

/**
 * 验证任务进度更新
 *
 * @param data - 待验证的数据
 * @returns 验证结果
 */
export function validateTaskProgressUpdate(
  data: unknown
): Result<TaskProgressUpdate, SchemaValidationError> {
  return validate(TaskProgressUpdateSchema, data, 'TaskProgressUpdate')
}

/**
 * 从 JSON 字符串验证任务进度更新
 */
export function validateTaskProgressUpdateFromJSON(
  json: string
): Result<TaskProgressUpdate, SchemaValidationError> {
  return validateFromJSON(TaskProgressUpdateSchema, json, 'TaskProgressUpdate')
}

/**
 * 类型守卫：检查是否为有效的任务进度更新
 */
export function isValidTaskProgressUpdate(data: unknown): data is TaskProgressUpdate {
  const result = validateTaskProgressUpdate(data)
  return result.success
}
