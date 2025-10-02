/**
 * 节点协议契约定义
 *
 * 定义节点实体的严格类型契约
 * 确保跨服务的节点数据一致性
 */

import { z } from 'zod'

// ============================================================================
// 节点状态定义
// ============================================================================

export const NodeStatus = z.enum([
  'idle',         // 空闲状态
  'processing',   // AI处理中
  'completed',    // 已完成
  'error'         // 错误状态
])

export type NodeStatus = z.infer<typeof NodeStatus>

// ============================================================================
// 节点位置 Schema
// ============================================================================

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number()
}).strict()

export type NodePosition = z.infer<typeof NodePositionSchema>

// ============================================================================
// 节点元数据 Schema
// ============================================================================

export const NodeMetadataSchema = z.object({
  aiGenerated: z.boolean().optional(),
  model: z.string().optional(),
  processingTime: z.number().nonnegative().optional(),
  lastModifiedBy: z.string().optional(),
  createdBy: z.string().optional(),
  sourceNodeIds: z.array(z.string().uuid()).optional(),
  relatedTaskId: z.string().uuid().optional(),
  customData: z.record(z.unknown()).optional()
}).strict()

export type NodeMetadata = z.infer<typeof NodeMetadataSchema>

// ============================================================================
// 节点实体 Schema (V1)
// ============================================================================

export const NodeSchemaV1 = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 内容信息
  content: z.string(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // 质量指标
  importance: z.number().int().min(1).max(5).optional(),
  confidence: z.number().min(0).max(1).optional(),

  // 状态信息
  status: NodeStatus.optional(),

  // 位置信息
  position: NodePositionSchema,

  // 版本控制
  version: z.number().int().positive().optional(),

  // 元数据
  metadata: NodeMetadataSchema.optional(),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Node = z.infer<typeof NodeSchemaV1>

// ============================================================================
// 节点创建请求 Schema
// ============================================================================

export const CreateNodeRequestSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().optional(),
  title: z.string().optional(),
  position: NodePositionSchema,
  importance: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  metadata: NodeMetadataSchema.optional()
}).strict()

export type CreateNodeRequest = z.infer<typeof CreateNodeRequestSchema>

// ============================================================================
// 节点更新请求 Schema
// ============================================================================

export const UpdateNodeRequestSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: NodeStatus.optional(),
  position: NodePositionSchema.optional(),
  metadata: NodeMetadataSchema.optional()
}).strict()

export type UpdateNodeRequest = z.infer<typeof UpdateNodeRequestSchema>

// ============================================================================
// 节点删除请求 Schema
// ============================================================================

export const DeleteNodeRequestSchema = z.object({
  nodeId: z.string().uuid(),
  reason: z.string().optional()
}).strict()

export type DeleteNodeRequest = z.infer<typeof DeleteNodeRequestSchema>

// ============================================================================
// 节点查询请求 Schema
// ============================================================================

export const QueryNodesRequestSchema = z.object({
  projectId: z.string().uuid(),
  status: NodeStatus.optional(),
  minImportance: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.date().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional()
}).strict()

export type QueryNodesRequest = z.infer<typeof QueryNodesRequestSchema>

// ============================================================================
// 节点协议版本
// ============================================================================

export const NODE_PROTOCOL_VERSION = '1.0.0' as const

// ============================================================================
// 节点协议契约定义
// ============================================================================

export const NodeContractV1 = {
  version: NODE_PROTOCOL_VERSION,
  schemas: {
    node: NodeSchemaV1,
    create: CreateNodeRequestSchema,
    update: UpdateNodeRequestSchema,
    delete: DeleteNodeRequestSchema,
    query: QueryNodesRequestSchema
  }
} as const

// ============================================================================
// 类型守卫
// ============================================================================

export function isValidNodeStatus(value: string): value is NodeStatus {
  return NodeStatus.safeParse(value).success
}

export function isValidNode(value: unknown): value is Node {
  return NodeSchemaV1.safeParse(value).success
}

// ============================================================================
// 实用工具函数
// ============================================================================

export function calculateNodeConfidence(
  aiConfidence: number,
  importance: number
): number {
  // 综合考虑AI置信度和重要性，计算最终置信度
  const importanceWeight = 0.3
  const aiWeight = 0.7

  const normalizedImportance = (importance - 1) / 4 // 归一化到 0-1
  return aiWeight * aiConfidence + importanceWeight * normalizedImportance
}

export function shouldAutoSaveNode(node: Partial<Node>): boolean {
  // 自动保存逻辑：内容长度 > 10 或 置信度 > 0.7
  return (
    (node.content?.length ?? 0) > 10 ||
    (node.confidence ?? 0) > 0.7
  )
}
