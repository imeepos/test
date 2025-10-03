/**
 * 边/连接数据结构
 *
 * 用于定义节点间的连接关系，支持有向/无向、权重、类型标记
 */

import { z } from 'zod'

// ============================================================================
// 边类型定义
// ============================================================================

export const EdgeType = z.enum([
  'dataflow',      // 数据流边：传递数据
  'controlflow',   // 控制流边：控制执行顺序
  'dependency',    // 依赖边：表示依赖关系
  'reference',     // 引用边：引用关系
  'hierarchy'      // 层次边：父子关系
])

export type EdgeType = z.infer<typeof EdgeType>

// ============================================================================
// 边方向定义
// ============================================================================

export const EdgeDirection = z.enum([
  'directed',      // 有向边
  'undirected',    // 无向边
  'bidirectional'  // 双向边
])

export type EdgeDirection = z.infer<typeof EdgeDirection>

// ============================================================================
// 边元数据
// ============================================================================

export const EdgeMetadataSchema = z.object({
  userCreated: z.boolean().default(false),     // 是否用户手动创建
  customData: z.record(z.unknown()).optional() // 自定义数据
}).strict()

export type EdgeMetadata = z.infer<typeof EdgeMetadataSchema>

// ============================================================================
// 边实体 Schema
// ============================================================================

export const EdgeSchema = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  // 连接关系
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),

  // 边属性
  type: EdgeType,
  direction: EdgeDirection.default('directed'),
  weight: z.number().min(0).max(1).default(1),       // 边权重 0-1
  priority: z.number().int().min(0).default(0),      // 执行优先级

  // 元数据
  metadata: EdgeMetadataSchema.optional(),

  // 状态标记
  isActive: z.boolean().default(true),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Edge = z.infer<typeof EdgeSchema>

// ============================================================================
// 边创建请求 Schema
// ============================================================================

export const CreateEdgeRequestSchema = z.object({
  projectId: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  type: EdgeType.default('dataflow'),
  direction: EdgeDirection.optional(),
  weight: z.number().min(0).max(1).optional(),
  priority: z.number().int().min(0).optional(),
  metadata: EdgeMetadataSchema.optional()
}).strict()

export type CreateEdgeRequest = z.infer<typeof CreateEdgeRequestSchema>

// ============================================================================
// 边更新请求 Schema
// ============================================================================

export const UpdateEdgeRequestSchema = z.object({
  type: EdgeType.optional(),
  direction: EdgeDirection.optional(),
  weight: z.number().min(0).max(1).optional(),
  priority: z.number().int().min(0).optional(),
  metadata: EdgeMetadataSchema.optional(),
  isActive: z.boolean().optional()
}).strict()

export type UpdateEdgeRequest = z.infer<typeof UpdateEdgeRequestSchema>

// ============================================================================
// 边查询请求 Schema
// ============================================================================

export const QueryEdgesRequestSchema = z.object({
  projectId: z.string().uuid(),
  sourceNodeId: z.string().uuid().optional(),
  targetNodeId: z.string().uuid().optional(),
  type: EdgeType.optional(),
  direction: EdgeDirection.optional(),
  minWeight: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional()
}).strict()

export type QueryEdgesRequest = z.infer<typeof QueryEdgesRequestSchema>

// ============================================================================
// 类型守卫
// ============================================================================

export function isValidEdge(value: unknown): value is Edge {
  return EdgeSchema.safeParse(value).success
}

export function isValidEdgeType(value: string): value is EdgeType {
  return EdgeType.safeParse(value).success
}

// ============================================================================
// 边协议版本
// ============================================================================

export const EDGE_PROTOCOL_VERSION = '1.0.0' as const

export const EdgeContractV1 = {
  version: EDGE_PROTOCOL_VERSION,
  schemas: {
    edge: EdgeSchema,
    create: CreateEdgeRequestSchema,
    update: UpdateEdgeRequestSchema,
    query: QueryEdgesRequestSchema
  }
} as const
