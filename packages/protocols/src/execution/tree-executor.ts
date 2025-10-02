/**
 * 树执行引擎
 *
 * 支持树结构的遍历执行、子树批处理
 */

import type { Tree, TreeNode, TraversalStrategy } from '../structures/tree.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'
import {
  traverseTree,
  validateTree,
  getSubtree
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
  startNodeId?: string          // 从指定节点开始
  includeSiblings?: boolean     // 是否包含兄弟节点
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
    const startNode = opts.startNodeId && nodeMap.get(opts.startNodeId)
      ? nodeMap.get(opts.startNodeId)!
      : rootNode

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

  /**
   * 执行子树
   */
  async executeSubtree(
    tree: Tree,
    rootNodeId: string,
    enhancedNodeMap: Map<string, EnhancedNode>,
    options: TreeExecutionOptions = {}
  ): Promise<TreeExecutionResult> {
    const nodeMap = new Map<string, TreeNode>(tree.nodes.map(n => [n.id, n]))

    // 获取子树
    const subtree = getSubtree(rootNodeId, nodeMap, options.maxDepth)
    if (!subtree) {
      throw new Error('Subtree not found')
    }

    const stats = subtree.stats || {
      totalNodes: subtree.nodes.length,
      branchNodes: 0,
      leafNodes: 0,
      maxDepth: subtree.depth
    }

    // 创建子树的Tree对象
    const subtreeObj: Tree = {
      ...tree,
      rootId: rootNodeId,
      nodes: subtree.nodes,
      stats: {
        ...tree.stats,
        totalNodes: stats.totalNodes,
        maxDepth: stats.maxDepth,
        branchCount: stats.branchNodes,
        leafCount: stats.leafNodes,
        avgBranchingFactor: 0 // 简化
      }
    }

    return this.execute(subtreeObj, enhancedNodeMap, options)
  }

  /**
   * 执行叶子节点
   */
  async executeLeaves(
    tree: Tree,
    enhancedNodeMap: Map<string, EnhancedNode>,
    options: TreeExecutionOptions = {}
  ): Promise<TreeExecutionResult> {
    const nodeMap = new Map<string, TreeNode>(tree.nodes.map(n => [n.id, n]))
    const leafNodes = tree.nodes.filter(n => n.type === 'leaf')

    const startTime = Date.now()

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
    const visitOrder: string[] = []

    // 执行所有叶子节点
    for (const treeNode of leafNodes) {
      visitOrder.push(treeNode.id)

      const enhancedNode = enhancedNodeMap.get(treeNode.nodeId)
      if (!enhancedNode) {
        context.skippedNodes.add(treeNode.id)
        continue
      }

      try {
        if (options.onNodeStart) {
          await options.onNodeStart(treeNode.id)
        }

        const result = await this.nodeExecutor.execute(enhancedNode, context)

        context.results.set(treeNode.id, result)
        context.completedNodes.add(treeNode.id)

        if (options.onNodeComplete) {
          await options.onNodeComplete(treeNode.id, result)
        }
      } catch (error) {
        errors.set(treeNode.id, error as Error)
        context.failedNodes.add(treeNode.id)

        if (options.onNodeError) {
          await options.onNodeError(treeNode.id, error as Error)
        }

        if (!options.continueOnError) break
      }

      if (options.onProgress) {
        const total = leafNodes.length
        const completed = context.completedNodes.size + context.failedNodes.size
        await options.onProgress(completed, total)
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

  /**
   * 按层级执行
   */
  async executeByLevel(
    tree: Tree,
    enhancedNodeMap: Map<string, EnhancedNode>,
    options: TreeExecutionOptions = {}
  ): Promise<TreeExecutionResult> {
    const nodeMap = new Map<string, TreeNode>(tree.nodes.map(n => [n.id, n]))

    // 按层级分组
    const levelGroups = new Map<number, TreeNode[]>()
    tree.nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, [])
      }
      levelGroups.get(node.level)!.push(node)
    })

    const startTime = Date.now()

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
    const visitOrder: string[] = []

    // 按层级顺序执行
    const levels = Array.from(levelGroups.keys()).sort((a, b) => a - b)
    const maxLevel = options.maxDepth !== undefined
      ? Math.min(Math.max(...levels), options.maxDepth)
      : Math.max(...levels)

    for (const level of levels) {
      if (level > maxLevel) break

      const nodes = levelGroups.get(level) || []

      // 并行执行同层节点
      const promises = nodes.map(async treeNode => {
        visitOrder.push(treeNode.id)

        const enhancedNode = enhancedNodeMap.get(treeNode.nodeId)
        if (!enhancedNode) {
          context.skippedNodes.add(treeNode.id)
          return
        }

        try {
          if (options.onNodeStart) {
            await options.onNodeStart(treeNode.id)
          }

          const result = await this.nodeExecutor.execute(enhancedNode, context)

          context.results.set(treeNode.id, result)
          context.completedNodes.add(treeNode.id)

          if (options.onNodeComplete) {
            await options.onNodeComplete(treeNode.id, result)
          }
        } catch (error) {
          errors.set(treeNode.id, error as Error)
          context.failedNodes.add(treeNode.id)

          if (options.onNodeError) {
            await options.onNodeError(treeNode.id, error as Error)
          }
        }
      })

      await Promise.all(promises)

      // 检查是否继续
      if (!options.continueOnError && context.failedNodes.size > 0) {
        // 跳过剩余层级
        for (const nextLevel of levels) {
          if (nextLevel > level) {
            const nextNodes = levelGroups.get(nextLevel) || []
            nextNodes.forEach(n => context.skippedNodes.add(n.id))
          }
        }
        break
      }

      if (options.onProgress) {
        const totalNodes = tree.nodes.length
        const completed = context.completedNodes.size + context.failedNodes.size + context.skippedNodes.size
        await options.onProgress(completed, totalNodes)
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
