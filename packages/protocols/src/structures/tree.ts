/**
 * 树数据结构
 *
 * 层次结构，支持DFS/BFS遍历、路径查询、子树操作
 */

import { z } from 'zod'

// ============================================================================
// 树节点类型
// ============================================================================

export const TreeNodeType = z.enum([
  'root',          // 根节点
  'branch',        // 分支节点
  'leaf'           // 叶子节点
])

export type TreeNodeType = z.infer<typeof TreeNodeType>

// ============================================================================
// 遍历策略
// ============================================================================

export const TraversalStrategy = z.enum([
  'dfs-preorder',   // 深度优先-前序
  'dfs-inorder',    // 深度优先-中序
  'dfs-postorder',  // 深度优先-后序
  'bfs'             // 广度优先
])

export type TraversalStrategy = z.infer<typeof TraversalStrategy>

// ============================================================================
// 树节点 Schema
// ============================================================================

export const TreeNodeSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),                   // 关联的实际节点ID
  type: TreeNodeType,

  // 层次关系
  parentId: z.string().uuid().optional(),
  childIds: z.array(z.string().uuid()).default([]),

  // 层次信息
  level: z.number().int().nonnegative(),       // 层级（root为0）
  path: z.array(z.string().uuid()),            // 从根到当前节点的路径
  order: z.number().int().nonnegative(),       // 同级节点中的顺序

  // 元数据
  metadata: z.object({
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type TreeNode = z.infer<typeof TreeNodeSchema>

// ============================================================================
// 树路径 Schema
// ============================================================================

export const TreePathSchema = z.object({
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  path: z.array(z.string().uuid()),
  length: z.number().int().nonnegative(),
  commonAncestorId: z.string().uuid().optional()
}).strict()

export type TreePath = z.infer<typeof TreePathSchema>

// ============================================================================
// 子树 Schema
// ============================================================================

export const SubtreeSchema = z.object({
  rootNodeId: z.string().uuid(),
  nodes: z.array(TreeNodeSchema),
  depth: z.number().int().nonnegative(),
  stats: z.object({
    totalNodes: z.number().int(),
    branchNodes: z.number().int(),
    leafNodes: z.number().int(),
    maxDepth: z.number().int()
  })
}).strict()

export type Subtree = z.infer<typeof SubtreeSchema>

// ============================================================================
// 树实体 Schema
// ============================================================================

export const TreeSchema = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 基本信息
  name: z.string().min(1).max(255),
  description: z.string().optional(),

  // 树结构
  rootId: z.string().uuid(),
  nodes: z.array(TreeNodeSchema).min(1),

  // 树统计
  stats: z.object({
    totalNodes: z.number().int().nonnegative(),
    maxDepth: z.number().int().nonnegative(),
    branchCount: z.number().int().nonnegative(),
    leafCount: z.number().int().nonnegative()
  }),

  // 遍历配置
  defaultTraversal: TraversalStrategy.default('bfs'),

  // 元数据
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    version: z.number().int().positive().default(1),
    customData: z.record(z.unknown()).optional()
  }).optional(),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Tree = z.infer<typeof TreeSchema>

// ============================================================================
// 树创建请求 Schema
// ============================================================================

export const CreateTreeRequestSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rootNodeId: z.string().uuid(),
  structure: z.array(z.object({
    nodeId: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    order: z.number().int().nonnegative().optional()
  })).min(1),
  defaultTraversal: TraversalStrategy.optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type CreateTreeRequest = z.infer<typeof CreateTreeRequestSchema>

// ============================================================================
// 树更新请求 Schema
// ============================================================================

export const UpdateTreeRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  defaultTraversal: TraversalStrategy.optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type UpdateTreeRequest = z.infer<typeof UpdateTreeRequestSchema>

// ============================================================================
// 树节点操作请求 Schema
// ============================================================================

export const TreeNodeOperationSchema = z.object({
  operation: z.enum(['add', 'move', 'delete']),
  nodeId: z.string().uuid(),
  targetParentId: z.string().uuid().optional(),  // 用于move/add操作
  newNodeId: z.string().uuid().optional(),       // 用于add操作
  order: z.number().int().nonnegative().optional()
}).strict()

export type TreeNodeOperation = z.infer<typeof TreeNodeOperationSchema>

// ============================================================================
// 树遍历请求 Schema
// ============================================================================

export const TraverseTreeRequestSchema = z.object({
  treeId: z.string().uuid(),
  strategy: TraversalStrategy,
  startNodeId: z.string().uuid().optional(),     // 起始节点（默认root）
  maxDepth: z.number().int().positive().optional(), // 最大深度限制
  filter: z.object({
    nodeType: TreeNodeType.optional()
  }).optional()
}).strict()

export type TraverseTreeRequest = z.infer<typeof TraverseTreeRequestSchema>

// ============================================================================
// 路径查询请求 Schema
// ============================================================================

export const FindPathRequestSchema = z.object({
  treeId: z.string().uuid(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  includeCommonAncestor: z.boolean().optional()
}).strict()

export type FindPathRequest = z.infer<typeof FindPathRequestSchema>

// ============================================================================
// 子树查询请求 Schema
// ============================================================================

export const GetSubtreeRequestSchema = z.object({
  treeId: z.string().uuid(),
  rootNodeId: z.string().uuid(),
  maxDepth: z.number().int().positive().optional(),
  includeStats: z.boolean().default(true)
}).strict()

export type GetSubtreeRequest = z.infer<typeof GetSubtreeRequestSchema>

// ============================================================================
// 类型守卫
// ============================================================================

export function isValidTree(value: unknown): value is Tree {
  return TreeSchema.safeParse(value).success
}

export function isValidTreeNode(value: unknown): value is TreeNode {
  return TreeNodeSchema.safeParse(value).success
}

export function isValidTreeNodeType(value: string): value is TreeNodeType {
  return TreeNodeType.safeParse(value).success
}

// ============================================================================
// 树协议版本
// ============================================================================

export const TREE_PROTOCOL_VERSION = '1.0.0' as const

export const TreeContractV1 = {
  version: TREE_PROTOCOL_VERSION,
  schemas: {
    tree: TreeSchema,
    treeNode: TreeNodeSchema,
    path: TreePathSchema,
    subtree: SubtreeSchema,
    create: CreateTreeRequestSchema,
    update: UpdateTreeRequestSchema,
    nodeOperation: TreeNodeOperationSchema,
    traverse: TraverseTreeRequestSchema,
    findPath: FindPathRequestSchema,
    getSubtree: GetSubtreeRequestSchema
  }
} as const
