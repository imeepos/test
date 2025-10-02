/**
 * 树执行引擎
 *
 * 支持树结构的遍历执行、子树批处理
 */

import type { Tree, TreeNode, TraversalStrategy } from '../structures/tree.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'
import {
  traverseTree,
  validateTree
} from '../structures/algorithms/tree-algorithms.js'

// ============================================================================
// 执行上下文
// ============================================================================

export interface TreeExecutionContext {
  treeId: string
  nodeMap: Map<string, TreeNode>
  enhancedNodeMap: Map<string, EnhancedNode>
  completedNodes: Set<string>
  failedNodes: Set<string>
  skippedNodes: Set<string>
  results: Map<string, unknown>
}

// ============================================================================
// 节点执行器接口
// ============================================================================

export interface TreeNodeExecutor {
  execute(node: EnhancedNode, context: TreeExecutionContext): Promise<unknown>
}

// ============================================================================
// 执行选项
// ============================================================================

export interface TreeExecutionOptions {
  strategy?: TraversalStrategy
  maxDepth?: number
  continueOnError?: boolean
  onNodeStart?: (nodeId: string) => void | Promise<void>
  onNodeComplete?: (nodeId: string, result: unknown) => void | Promise<void>
  onNodeError?: (nodeId: string, error: Error) => void | Promise<void>
  onProgress?: (completed: number, total: number) => void | Promise<void>
}

// ============================================================================
// 执行结果
// ============================================================================

export interface TreeExecutionResult {
  success: boolean
  completedNodes: string[]
  failedNodes: string[]
  skippedNodes: string[]
  results: Map<string, unknown>
  errors: Map<string, Error>
  duration: number
  traversalOrder: string[]
}

// ============================================================================
// 树执行器
// ============================================================================

export class TreeExecutor {
  constructor(
    private nodeExecutor: TreeNodeExecutor,
    private defaultOptions: TreeExecutionOptions = {}
  ) {}

  /**
   * 执行整棵树
   */
  async execute(
    tree: Tree,
    enhancedNodeMap: Map<string, EnhancedNode>,
    options: TreeExecutionOptions = {}
  ): Promise<TreeExecutionResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    // 验证树结构
    const nodeMap = new Map<string, TreeNode>(tree.nodes.map(n => [n.id, n]))
    const rootNode = nodeMap.get(tree.rootId)

    if (!rootNode) {
      throw new Error('Root node not found')
    }

    const validation = validateTree(rootNode, nodeMap)
    if (!validation.isValid) {
      throw new Error(`Invalid tree: ${validation.errors.join(', ')}`)
    }

    // 初始化执行上下文
    const context: TreeExecutionContext = {
      treeId: tree.id,
      nodeMap,
      enhancedNodeMap,
      completedNodes: new Set(),
      failedNodes: new Set(),
      skippedNodes: new Set(),
      results: new Map()
    }

    const errors = new Map<string, Error>()

    // 获取遍历顺序
    const strategy = opts.strategy || tree.defaultTraversal
    const startNode = rootNode

    const traversalResult = traverseTree(
      startNode,
      nodeMap,
      strategy,
      opts.maxDepth
    )

    const { visitOrder } = traversalResult

    // 执行节点
    for (const nodeId of visitOrder) {
      const treeNode = nodeMap.get(nodeId)
      if (!treeNode) continue

      const enhancedNode = enhancedNodeMap.get(treeNode.nodeId)
      if (!enhancedNode) {
        context.skippedNodes.add(nodeId)
        continue
      }

      try {
        // 开始回调
        if (opts.onNodeStart) {
          await opts.onNodeStart(nodeId)
        }

        // 执行节点
        const result = await this.nodeExecutor.execute(enhancedNode, context)

        // 记录结果
        context.results.set(nodeId, result)
        context.completedNodes.add(nodeId)

        // 完成回调
        if (opts.onNodeComplete) {
          await opts.onNodeComplete(nodeId, result)
        }
      } catch (error) {
        // 记录错误
        errors.set(nodeId, error as Error)
        context.failedNodes.add(nodeId)

        // 错误回调
        if (opts.onNodeError) {
          await opts.onNodeError(nodeId, error as Error)
        }

        // 检查是否继续
        if (!opts.continueOnError) {
          // 跳过剩余节点
          const currentIndex = visitOrder.indexOf(nodeId)
          for (let i = currentIndex + 1; i < visitOrder.length; i++) {
            const nextNodeId = visitOrder[i]
            if (nextNodeId) {
              context.skippedNodes.add(nextNodeId)
            }
          }
          break
        }
      }

      // 进度回调
      if (opts.onProgress) {
        const total = visitOrder.length
        const completed = context.completedNodes.size + context.failedNodes.size + context.skippedNodes.size
        await opts.onProgress(completed, total)
      }
    }

    const duration = Date.now() - startTime

    return {
      success: context.failedNodes.size === 0,
      completedNodes: Array.from(context.completedNodes),
      failedNodes: Array.from(context.failedNodes),
      skippedNodes: Array.from(context.skippedNodes),
      results: context.results,
      errors,
      duration,
      traversalOrder: visitOrder
    }
  }

}
