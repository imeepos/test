/**
 * 协议契约导出
 *
 * 提供所有协议定义的统一导出
 */

// ============================================================================
// AI 处理协议 V2（context + prompt 模式）
// ============================================================================

export {
  type TaskStatus as TaskStatusV2,
  type TaskMetadata as TaskMetadataV2,
  type AIProcessRequest,
  type AIGeneratedContent,
  type AIProcessingStats,
  type AIProcessError,
  type AIProcessResponse,
  type TaskProgressUpdate,
  TaskStatus as TaskStatusSchemaV2,
  TaskMetadataSchema as TaskMetadataSchemaV2,
  AIProcessRequestSchema,
  AIGeneratedContentSchema,
  AIProcessingStatsSchema,
  AIProcessErrorSchema,
  AIProcessResponseSchema,
  TaskProgressUpdateSchema,
  AI_PROCESS_PROTOCOL_VERSION,
  AIProcessContractV2
} from './ai-process.contract.js'

// ============================================================================
// 节点协议
// ============================================================================

export {
  type NodeStatus,
  type NodePosition,
  type NodeMetadata,
  type Node,
  type CreateNodeRequest,
  type UpdateNodeRequest,
  type DeleteNodeRequest,
  type QueryNodesRequest,
  NodeStatus as NodeStatusSchema,
  NodePositionSchema,
  NodeMetadataSchema,
  NodeSchemaV1,
  CreateNodeRequestSchema,
  UpdateNodeRequestSchema,
  DeleteNodeRequestSchema,
  QueryNodesRequestSchema,
  NODE_PROTOCOL_VERSION,
  NodeContractV1,
  isValidNodeStatus,
  isValidNode as isValidNodeContract,
  calculateNodeConfidence,
  shouldAutoSaveNode
} from './node.contract.js'
