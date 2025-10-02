/**
 * 节点协议验证器
 *
 * 提供节点实体的验证功能
 */

import type { Result } from './result.js'
import { SchemaValidationError } from './errors.js'
import { validate, validateBatch } from './message.validator.js'
import {
  type Node,
  type CreateNodeRequest,
  type UpdateNodeRequest,
  type DeleteNodeRequest,
  type QueryNodesRequest,
  type NodeStatus,
  NodeSchemaV1,
  CreateNodeRequestSchema,
  UpdateNodeRequestSchema,
  DeleteNodeRequestSchema,
  QueryNodesRequestSchema,
  NodeStatus as NodeStatusSchema
} from '../contracts/node.contract.js'

// ============================================================================
// 节点验证
// ============================================================================

/**
 * 验证节点实体
 */
export function validateNode(data: unknown): Result<Node, SchemaValidationError> {
  return validate(NodeSchemaV1, data, 'Node')
}

/**
 * 验证创建节点请求
 */
export function validateCreateNode(
  data: unknown
): Result<CreateNodeRequest, SchemaValidationError> {
  return validate(CreateNodeRequestSchema, data, 'CreateNodeRequest')
}

/**
 * 验证更新节点请求
 */
export function validateUpdateNode(
  data: unknown
): Result<UpdateNodeRequest, SchemaValidationError> {
  return validate(UpdateNodeRequestSchema, data, 'UpdateNodeRequest')
}

/**
 * 验证删除节点请求
 */
export function validateDeleteNode(
  data: unknown
): Result<DeleteNodeRequest, SchemaValidationError> {
  return validate(DeleteNodeRequestSchema, data, 'DeleteNodeRequest')
}

/**
 * 验证查询节点请求
 */
export function validateQueryNodes(
  data: unknown
): Result<QueryNodesRequest, SchemaValidationError> {
  return validate(QueryNodesRequestSchema, data, 'QueryNodesRequest')
}

// ============================================================================
// 批量验证
// ============================================================================

/**
 * 批量验证节点
 */
export function validateNodeBatch(dataArray: unknown[]): Result<Node[], SchemaValidationError> {
  return validateBatch(NodeSchemaV1, dataArray, 'Node')
}

/**
 * 批量验证创建节点请求
 */
export function validateCreateNodeBatch(
  dataArray: unknown[]
): Result<CreateNodeRequest[], SchemaValidationError> {
  return validateBatch(CreateNodeRequestSchema, dataArray, 'CreateNodeRequest')
}

// ============================================================================
// 枚举值验证
// ============================================================================

/**
 * 验证节点状态
 */
export function validateNodeStatus(value: unknown): Result<NodeStatus, SchemaValidationError> {
  return validate(NodeStatusSchema, value, 'NodeStatus')
}

// ============================================================================
// JSON 字符串验证
// ============================================================================

/**
 * 从 JSON 字符串验证节点
 */
export function validateNodeFromJSON(json: string): Result<Node, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateNode(data)
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
 * 从 JSON 字符串验证创建节点请求
 */
export function validateCreateNodeFromJSON(
  json: string
): Result<CreateNodeRequest, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateCreateNode(data)
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
 * 从 JSON 字符串验证更新节点请求
 */
export function validateUpdateNodeFromJSON(
  json: string
): Result<UpdateNodeRequest, SchemaValidationError> {
  try {
    const data = JSON.parse(json)
    return validateUpdateNode(data)
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
// 类型守卫
// ============================================================================

/**
 * 检查是否为有效的节点（类型守卫）
 */
export function isValidNode(data: unknown): data is Node {
  const result = validateNode(data)
  return result.success
}

/**
 * 检查是否为有效的创建节点请求（类型守卫）
 */
export function isValidCreateNodeRequest(data: unknown): data is CreateNodeRequest {
  const result = validateCreateNode(data)
  return result.success
}

/**
 * 检查是否为有效的更新节点请求（类型守卫）
 */
export function isValidUpdateNodeRequest(data: unknown): data is UpdateNodeRequest {
  const result = validateUpdateNode(data)
  return result.success
}
