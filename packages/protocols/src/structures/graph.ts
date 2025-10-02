/**
 * 图数据结构
 *
 * DAG图结构，支持拓扑排序、环检测、并行执行优化
 */

import { z } from 'zod'
import { EdgeSchema } from './edge.js'

// ============================================================================
// 图类型定义
// ============================================================================

export const GraphType = z.enum([
  'dag',           // 有向无环图
  'tree',          // 树形结构
  'general'        // 一般图（可能有环）
])

export type GraphType = z.infer<typeof GraphType>

// ============================================================================
// 图执行状态
// ============================================================================

export const GraphExecutionStatus = z.enum([
  'idle',          // 空闲
  'planning',      // 规划中
  'running',       // 执行中
  'paused',        // 已暂停
  'completed',     // 已完成
  'failed',        // 失败
  'cancelled'      // 已取消
])

export type GraphExecutionStatus = z.infer<typeof GraphExecutionStatus>

// ============================================================================
// 图节点执行信息
// ============================================================================

export const GraphNodeExecutionSchema = z.object({
  nodeId: z.string().uuid(),
  status: z.enum(['pending', 'ready', 'running', 'completed', 'failed', 'skipped']),
  dependencies: z.array(z.string().uuid()),    // 依赖节点ID列表
  dependents: z.array(z.string().uuid()),      // 被依赖节点ID列表
  level: z.number().int().nonnegative(),       // 拓扑层级
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().int().optional(),
  error: z.object({
    message: z.string(),
    code: z.string()
  }).optional()
}).strict()

export type GraphNodeExecution = z.infer<typeof GraphNodeExecutionSchema>

// ============================================================================
// 图执行计划
// ============================================================================

export const GraphExecutionPlanSchema = z.object({
  id: z.string().uuid(),
  graphId: z.string().uuid(),

  // 拓扑排序结果
  topologicalOrder: z.array(z.string().uuid()),

  // 层级划分（支持并行执行）
  levels: z.array(z.array(z.string().uuid())),

  // 关键路径
  criticalPath: z.array(z.string().uuid()),

  // 节点执行信息
  nodeExecutions: z.array(GraphNodeExecutionSchema),

  // 执行估算
  estimatedDuration: z.number().int().optional(),
  parallelizationFactor: z.number().min(1).optional(),

  createdAt: z.date()
}).strict()

export type GraphExecutionPlan = z.infer<typeof GraphExecutionPlanSchema>

// ============================================================================
// 图验证结果
// ============================================================================

export const GraphValidationResultSchema = z.object({
  isValid: z.boolean(),
  isDAG: z.boolean(),
  hasCycles: z.boolean(),
  cycles: z.array(z.array(z.string().uuid())).optional(), // 环路节点列表
  isolatedNodes: z.array(z.string().uuid()).optional(),   // 孤立节点
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional()
}).strict()

export type GraphValidationResult = z.infer<typeof GraphValidationResultSchema>

// ============================================================================
// 图实体 Schema
// ============================================================================

export const GraphSchema = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 基本信息
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: GraphType.default('dag'),

  // 图结构
  nodeIds: z.array(z.string().uuid()),
  edges: z.array(EdgeSchema),

  // 图统计
  stats: z.object({
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
    maxDepth: z.number().int().nonnegative(),
    avgDegree: z.number().nonnegative()
  }),

  // 执行状态
  executionStatus: GraphExecutionStatus.default('idle'),
  currentPlan: GraphExecutionPlanSchema.optional(),

  // 验证结果
  validation: GraphValidationResultSchema.optional(),

  // 执行配置
  config: z.object({
    maxParallelNodes: z.number().int().positive().default(5),
    enableParallelExecution: z.boolean().default(true),
    failFast: z.boolean().default(false),           // 遇错即停
    retryFailedNodes: z.boolean().default(true),
    maxRetries: z.number().int().nonnegative().default(3)
  }),

  // 元数据
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    version: z.number().int().positive().default(1),
    author: z.string().optional(),
    customData: z.record(z.unknown()).optional()
  }).optional(),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date(),
  lastExecutedAt: z.date().optional()
}).strict()

export type Graph = z.infer<typeof GraphSchema>

// ============================================================================
// 图创建请求 Schema
// ============================================================================

export const CreateGraphRequestSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: GraphType.optional(),
  nodeIds: z.array(z.string().uuid()).min(1),
  edges: z.array(z.object({
    sourceNodeId: z.string().uuid(),
    targetNodeId: z.string().uuid(),
    type: z.string().optional(),
    weight: z.number().optional()
  })).optional(),
  config: z.object({
    maxParallelNodes: z.number().int().positive().optional(),
    enableParallelExecution: z.boolean().optional(),
    failFast: z.boolean().optional(),
    retryFailedNodes: z.boolean().optional(),
    maxRetries: z.number().int().nonnegative().optional()
  }).optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type CreateGraphRequest = z.infer<typeof CreateGraphRequestSchema>

// ============================================================================
// 图更新请求 Schema
// ============================================================================

export const UpdateGraphRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: GraphType.optional(),
  config: z.object({
    maxParallelNodes: z.number().int().positive().optional(),
    enableParallelExecution: z.boolean().optional(),
    failFast: z.boolean().optional(),
    retryFailedNodes: z.boolean().optional(),
    maxRetries: z.number().int().nonnegative().optional()
  }).optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type UpdateGraphRequest = z.infer<typeof UpdateGraphRequestSchema>

// ============================================================================
// 图执行请求 Schema
// ============================================================================

export const ExecuteGraphRequestSchema = z.object({
  graphId: z.string().uuid(),
  startNodeIds: z.array(z.string().uuid()).optional(), // 指定起始节点
  endNodeIds: z.array(z.string().uuid()).optional(),   // 指定结束节点
  overrideConfig: z.object({
    maxParallelNodes: z.number().int().positive().optional(),
    enableParallelExecution: z.boolean().optional(),
    failFast: z.boolean().optional()
  }).optional()
}).strict()

export type ExecuteGraphRequest = z.infer<typeof ExecuteGraphRequestSchema>

// ============================================================================
// 类型守卫
// ============================================================================

export function isValidGraph(value: unknown): value is Graph {
  return GraphSchema.safeParse(value).success
}

export function isValidGraphType(value: string): value is GraphType {
  return GraphType.safeParse(value).success
}

// ============================================================================
// 图协议版本
// ============================================================================

export const GRAPH_PROTOCOL_VERSION = '1.0.0' as const

export const GraphContractV1 = {
  version: GRAPH_PROTOCOL_VERSION,
  schemas: {
    graph: GraphSchema,
    executionPlan: GraphExecutionPlanSchema,
    validationResult: GraphValidationResultSchema,
    nodeExecution: GraphNodeExecutionSchema,
    create: CreateGraphRequestSchema,
    update: UpdateGraphRequestSchema,
    execute: ExecuteGraphRequestSchema
  }
} as const
