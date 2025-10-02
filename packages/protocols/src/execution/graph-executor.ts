/**
 * 图执行引擎
 *
 * 支持DAG图的并行执行、依赖管理、错误处理
 */

import type { Graph, GraphExecutionPlan, GraphNodeExecution } from '../structures/graph.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'
import {
  topologicalSort,
  validateGraph,
  groupParallelNodes,
  analyzeDependencies
} from '../structures/algorithms/graph-algorithms.js'

// ============================================================================
// 执行上下文
// ============================================================================

export interface GraphExecutionContext {
  graphId: string
  plan: GraphExecutionPlan
  nodeMap: Map<string, EnhancedNode>
  completedNodes: Set<string>
  failedNodes: Set<string>
  skippedNodes: Set<string>
  results: Map<string, unknown>
}

// ============================================================================
// 节点执行器接口
// ============================================================================

export interface NodeExecutor {
  execute(node: EnhancedNode, context: GraphExecutionContext): Promise<unknown>
}

// ============================================================================
// 执行选项
// ============================================================================

export interface GraphExecutionOptions {
  maxParallelNodes?: number
  enableParallelExecution?: boolean
  failFast?: boolean
  retryFailedNodes?: boolean
  maxRetries?: number
  onNodeStart?: (nodeId: string) => void | Promise<void>
  onNodeComplete?: (nodeId: string, result: unknown) => void | Promise<void>
  onNodeError?: (nodeId: string, error: Error) => void | Promise<void>
  onProgress?: (completed: number, total: number) => void | Promise<void>
}

// ============================================================================
// 执行结果
// ============================================================================

export interface GraphExecutionResult {
  success: boolean
  completedNodes: string[]
  failedNodes: string[]
  skippedNodes: string[]
  results: Map<string, unknown>
  errors: Map<string, Error>
  duration: number
  plan: GraphExecutionPlan
}

// ============================================================================
// 图执行器
// ============================================================================

export class GraphExecutor {
  constructor(
    private nodeExecutor: NodeExecutor,
    private defaultOptions: GraphExecutionOptions = {}
  ) {}

  /**
   * 创建执行计划
   */
  async createExecutionPlan(graph: Graph): Promise<GraphExecutionPlan> {
    // 验证图结构
    const validation = validateGraph({
      nodeIds: graph.nodeIds,
      edges: graph.edges
    })

    if (!validation.isValid) {
      throw new Error(`Invalid graph: ${validation.errors?.join(', ')}`)
    }

    // 拓扑排序
    const sortResult = topologicalSort({
      nodeIds: graph.nodeIds,
      edges: graph.edges
    })

    if (!sortResult.success) {
      throw new Error(`Cannot create execution plan: ${sortResult.error}`)
    }

    // 分析节点依赖和层级
    const nodeExecutions: GraphNodeExecution[] = graph.nodeIds.map(nodeId => {
      const deps = analyzeDependencies(
        { nodeIds: graph.nodeIds, edges: graph.edges },
        nodeId
      )

      return {
        nodeId,
        status: 'pending',
        dependencies: deps.directDependencies,
        dependents: deps.directDependents,
        level: deps.level
      }
    })

    // 计算关键路径（假设所有节点执行时间相同）
    const criticalPath = this.findCriticalPathNodes(sortResult.levels)

    const plan: GraphExecutionPlan = {
      id: crypto.randomUUID(),
      graphId: graph.id,
      topologicalOrder: sortResult.order,
      levels: sortResult.levels,
      criticalPath,
      nodeExecutions,
      estimatedDuration: sortResult.levels.length * 1000, // 简单估算
      parallelizationFactor: Math.max(...sortResult.levels.map(l => l.length)),
      createdAt: new Date()
    }

    return plan
  }

  /**
   * 执行图
   */
  async execute(
    graph: Graph,
    nodeMap: Map<string, EnhancedNode>,
    options: GraphExecutionOptions = {}
  ): Promise<GraphExecutionResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...graph.config, ...options }

    // 创建执行计划
    const plan = await this.createExecutionPlan(graph)

    // 初始化执行上下文
    const context: GraphExecutionContext = {
      graphId: graph.id,
      plan,
      nodeMap,
      completedNodes: new Set(),
      failedNodes: new Set(),
      skippedNodes: new Set(),
      results: new Map()
    }

    const errors = new Map<string, Error>()

    try {
      if (opts.enableParallelExecution) {
        // 并行执行
        await this.executeParallel(plan, context, opts, errors)
      } else {
        // 顺序执行
        await this.executeSequential(plan, context, opts, errors)
      }
    } catch (error) {
      console.error('Graph execution failed:', error)
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
      plan
    }
  }

  /**
   * 并行执行
   */
  private async executeParallel(
    plan: GraphExecutionPlan,
    context: GraphExecutionContext,
    options: GraphExecutionOptions,
    errors: Map<string, Error>
  ): Promise<void> {
    const groups = groupParallelNodes(
      { nodeIds: plan.topologicalOrder, edges: [] },
      options.maxParallelNodes || 5
    )

    for (const group of groups) {
      // 并行执行当前组
      const promises = group.map(nodeId =>
        this.executeNode(nodeId, context, options, errors)
      )

      await Promise.all(promises)

      // 检查失败快速退出
      if (options.failFast && context.failedNodes.size > 0) {
        // 跳过剩余节点
        for (const level of groups.slice(groups.indexOf(group) + 1)) {
          level.forEach(id => context.skippedNodes.add(id))
        }
        break
      }

      // 进度回调
      if (options.onProgress) {
        const total = plan.topologicalOrder.length
        const completed = context.completedNodes.size + context.failedNodes.size + context.skippedNodes.size
        await options.onProgress(completed, total)
      }
    }
  }

  /**
   * 顺序执行
   */
  private async executeSequential(
    plan: GraphExecutionPlan,
    context: GraphExecutionContext,
    options: GraphExecutionOptions,
    errors: Map<string, Error>
  ): Promise<void> {
    for (const nodeId of plan.topologicalOrder) {
      await this.executeNode(nodeId, context, options, errors)

      // 检查失败快速退出
      if (options.failFast && context.failedNodes.has(nodeId)) {
        // 跳过剩余节点
        const currentIndex = plan.topologicalOrder.indexOf(nodeId)
        for (let i = currentIndex + 1; i < plan.topologicalOrder.length; i++) {
          const nextNodeId = plan.topologicalOrder[i]
          if (nextNodeId) {
            context.skippedNodes.add(nextNodeId)
          }
        }
        break
      }

      // 进度回调
      if (options.onProgress) {
        const total = plan.topologicalOrder.length
        const completed = context.completedNodes.size + context.failedNodes.size + context.skippedNodes.size
        await options.onProgress(completed, total)
      }
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    nodeId: string,
    context: GraphExecutionContext,
    options: GraphExecutionOptions,
    errors: Map<string, Error>
  ): Promise<void> {
    const node = context.nodeMap.get(nodeId)
    if (!node) {
      context.skippedNodes.add(nodeId)
      return
    }

    // 检查依赖是否满足
    const nodeExec = context.plan.nodeExecutions.find(n => n.nodeId === nodeId)
    if (nodeExec) {
      const depsCompleted = nodeExec.dependencies.every(depId =>
        context.completedNodes.has(depId)
      )

      const depsFailed = nodeExec.dependencies.some(depId =>
        context.failedNodes.has(depId)
      )

      if (depsFailed) {
        context.skippedNodes.add(nodeId)
        return
      }

      if (!depsCompleted) {
        context.skippedNodes.add(nodeId)
        return
      }
    }

    // 执行节点
    let retryCount = 0
    const maxRetries = options.maxRetries || 3

    while (retryCount <= maxRetries) {
      try {
        // 开始回调
        if (options.onNodeStart) {
          await options.onNodeStart(nodeId)
        }

        // 执行
        const result = await this.nodeExecutor.execute(node, context)

        // 记录结果
        context.results.set(nodeId, result)
        context.completedNodes.add(nodeId)

        // 完成回调
        if (options.onNodeComplete) {
          await options.onNodeComplete(nodeId, result)
        }

        return
      } catch (error) {
        retryCount++

        if (retryCount > maxRetries || !options.retryFailedNodes) {
          // 记录错误
          errors.set(nodeId, error as Error)
          context.failedNodes.add(nodeId)

          // 错误回调
          if (options.onNodeError) {
            await options.onNodeError(nodeId, error as Error)
          }

          return
        }

        // 重试延迟
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  }

  /**
   * 查找关键路径节点
   */
  private findCriticalPathNodes(levels: string[][]): string[] {
    // 简化实现：返回每层的第一个节点
    return levels.map(level => level[0]).filter((id): id is string => id !== undefined)
  }

  /**
   * 暂停执行
   */
  async pause(_context: GraphExecutionContext): Promise<void> {
    // TODO: 实现暂停逻辑
  }

  /**
   * 恢复执行
   */
  async resume(_context: GraphExecutionContext): Promise<void> {
    // TODO: 实现恢复逻辑
  }

  /**
   * 取消执行
   */
  async cancel(_context: GraphExecutionContext): Promise<void> {
    // TODO: 实现取消逻辑
  }
}
