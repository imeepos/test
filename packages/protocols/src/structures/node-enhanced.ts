/**
 * 增强节点定义
 *
 * 扩展现有节点，支持层次化和图结构
 */

import { z } from 'zod'
import { NodeSchemaV1 } from '../contracts/node.contract.js'

// ============================================================================
// 节点增强类型
// ============================================================================

export const NodeEnhancementType = z.enum([
  'standalone',    // 独立节点
  'chain-member',  // 链条成员
  'graph-node',    // 图节点
  'tree-node'      // 树节点
])

export type NodeEnhancementType = z.infer<typeof NodeEnhancementType>

// ============================================================================
// 节点关系 Schema
// ============================================================================

export const NodeRelationshipSchema = z.object({
  // 父子关系
  parentId: z.string().uuid().optional(),
  childIds: z.array(z.string().uuid()).default([]),

  // 依赖关系
  dependencyIds: z.array(z.string().uuid()).default([]),
  dependentIds: z.array(z.string().uuid()).default([]),

  // 引用关系
  referenceIds: z.array(z.string().uuid()).default([]),
  referencedByIds: z.array(z.string().uuid()).default([]),

  // 同级关系
  siblingIds: z.array(z.string().uuid()).default([]),
  previousId: z.string().uuid().optional(),
  nextId: z.string().uuid().optional()
}).strict()

export type NodeRelationship = z.infer<typeof NodeRelationshipSchema>

// ============================================================================
// 节点层次信息 Schema
// ============================================================================

export const NodeHierarchySchema = z.object({
  level: z.number().int().nonnegative(),       // 层级深度
  path: z.array(z.string().uuid()),            // 从根到当前节点的路径
  isRoot: z.boolean().default(false),
  isLeaf: z.boolean().default(false),
  depth: z.number().int().nonnegative(),       // 子树最大深度
  descendantCount: z.number().int().nonnegative() // 后代节点数量
}).strict()

export type NodeHierarchy = z.infer<typeof NodeHierarchySchema>

// ============================================================================
// 节点图信息 Schema
// ============================================================================

export const NodeGraphInfoSchema = z.object({
  inDegree: z.number().int().nonnegative(),    // 入度
  outDegree: z.number().int().nonnegative(),   // 出度
  topologicalLevel: z.number().int().nonnegative().optional(), // 拓扑层级
  isCriticalPath: z.boolean().default(false),  // 是否在关键路径上
  isIsolated: z.boolean().default(false),      // 是否孤立节点
  cycleIds: z.array(z.array(z.string().uuid())).optional() // 所属环路
}).strict()

export type NodeGraphInfo = z.infer<typeof NodeGraphInfoSchema>

// ============================================================================
// 节点执行信息 Schema
// ============================================================================

export const NodeExecutionInfoSchema = z.object({
  // 执行状态
  status: z.enum(['idle', 'ready', 'queued', 'running', 'completed', 'failed', 'skipped']),

  // 执行控制
  canExecute: z.boolean().default(false),      // 依赖是否满足
  shouldSkip: z.boolean().default(false),
  retryCount: z.number().int().nonnegative().default(0),
  maxRetries: z.number().int().nonnegative().default(3),

  // 执行时间
  queuedAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().int().optional(),       // 毫秒

  // 执行结果
  result: z.unknown().optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    stack: z.string().optional()
  }).optional(),

  // 资源使用
  resources: z.object({
    cpuTime: z.number().optional(),
    memoryUsed: z.number().optional(),
    tokenCount: z.number().int().optional(),
    cost: z.number().optional()
  }).optional()
}).strict()

export type NodeExecutionInfo = z.infer<typeof NodeExecutionInfoSchema>

// ============================================================================
// 增强节点 Schema
// ============================================================================

export const EnhancedNodeSchema = NodeSchemaV1.extend({
  // 增强类型
  enhancementType: NodeEnhancementType.default('standalone'),

  // 关系信息
  relationships: NodeRelationshipSchema.optional(),

  // 层次信息
  hierarchy: NodeHierarchySchema.optional(),

  // 图信息
  graphInfo: NodeGraphInfoSchema.optional(),

  // 执行信息
  executionInfo: NodeExecutionInfoSchema.optional(),

  // 所属结构
  structureRefs: z.object({
    chainIds: z.array(z.string().uuid()).default([]),
    graphIds: z.array(z.string().uuid()).default([]),
    treeIds: z.array(z.string().uuid()).default([])
  }).optional()
}).strict()

export type EnhancedNode = z.infer<typeof EnhancedNodeSchema>

// ============================================================================
// 增强节点批量操作 Schema
// ============================================================================

export const BatchNodeOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'link', 'unlink']),
  nodeIds: z.array(z.string().uuid()).min(1),
  updates: z.record(z.unknown()).optional(),
  linkType: z.enum(['parent-child', 'dependency', 'reference']).optional(),
  targetNodeId: z.string().uuid().optional()
}).strict()

export type BatchNodeOperation = z.infer<typeof BatchNodeOperationSchema>

// ============================================================================
// 节点关系查询 Schema
// ============================================================================

export const NodeRelationshipQuerySchema = z.object({
  nodeId: z.string().uuid(),
  relationshipType: z.enum(['parent', 'children', 'siblings', 'dependencies', 'dependents', 'ancestors', 'descendants']),
  maxDepth: z.number().int().positive().optional(),
  includeMetadata: z.boolean().default(false)
}).strict()

export type NodeRelationshipQuery = z.infer<typeof NodeRelationshipQuerySchema>

// ============================================================================
// 类型守卫
// ============================================================================

export function isEnhancedNode(value: unknown): value is EnhancedNode {
  return EnhancedNodeSchema.safeParse(value).success
}

export function isValidEnhancementType(value: string): value is NodeEnhancementType {
  return NodeEnhancementType.safeParse(value).success
}

// ============================================================================
// 增强节点协议版本
// ============================================================================

export const ENHANCED_NODE_PROTOCOL_VERSION = '1.0.0' as const

export const EnhancedNodeContractV1 = {
  version: ENHANCED_NODE_PROTOCOL_VERSION,
  schemas: {
    enhancedNode: EnhancedNodeSchema,
    relationship: NodeRelationshipSchema,
    hierarchy: NodeHierarchySchema,
    graphInfo: NodeGraphInfoSchema,
    executionInfo: NodeExecutionInfoSchema,
    batchOperation: BatchNodeOperationSchema,
    relationshipQuery: NodeRelationshipQuerySchema
  }
} as const

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 将标准节点转换为增强节点
 */
export function enhanceNode(node: z.infer<typeof NodeSchemaV1>, type: NodeEnhancementType = 'standalone'): EnhancedNode {
  return {
    ...node,
    enhancementType: type,
    relationships: {
      childIds: [],
      dependencyIds: [],
      dependentIds: [],
      referenceIds: [],
      referencedByIds: [],
      siblingIds: []
    },
    structureRefs: {
      chainIds: [],
      graphIds: [],
      treeIds: []
    }
  }
}

/**
 * 检查节点是否可以执行（依赖已满足）
 */
export function canExecuteNode(node: EnhancedNode, completedNodeIds: Set<string>): boolean {
  if (!node.relationships?.dependencyIds) return true

  return node.relationships.dependencyIds.every(depId => completedNodeIds.has(depId))
}

/**
 * 计算节点的拓扑层级
 */
export function calculateTopologicalLevel(
  nodeId: string,
  dependencies: Map<string, string[]>
): number {
  const visited = new Set<string>()

  function dfs(id: string): number {
    if (visited.has(id)) return 0
    visited.add(id)

    const deps = dependencies.get(id) || []
    if (deps.length === 0) return 0

    return 1 + Math.max(...deps.map(depId => dfs(depId)))
  }

  return dfs(nodeId)
}
