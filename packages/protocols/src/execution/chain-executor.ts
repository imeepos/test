/**
 * 链条执行引擎
 *
 * 支持顺序执行、断点续传、错误重试
 */

import type { Chain, ChainNode, ChainCheckpoint } from '../structures/chain.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'

// ============================================================================
// 执行上下文
// ============================================================================

export interface ChainExecutionContext {
  chainId: string
  chain: Chain
  nodeMap: Map<string, EnhancedNode>
  currentIndex: number
  executionState: Map<string, unknown>
  completedNodes: Set<string>
  failedNodes: Set<string>
  skippedNodes: Set<string>
  results: Map<string, unknown>
}

// ============================================================================
// 节点执行器接口
// ============================================================================

export interface ChainNodeExecutor {
  execute(node: EnhancedNode, context: ChainExecutionContext): Promise<unknown>
}

// ============================================================================
// 执行选项
// ============================================================================

export interface ChainExecutionOptions {
  fromCheckpoint?: boolean
  checkpointId?: string
  continueOnError?: boolean
  maxRetries?: number
  onNodeStart?: (nodeId: string) => void | Promise<void>
  onNodeComplete?: (nodeId: string, result: unknown) => void | Promise<void>
  onNodeError?: (nodeId: string, error: Error) => void | Promise<void>
  onCheckpoint?: (checkpoint: ChainCheckpoint) => void | Promise<void>
  onProgress?: (current: number, total: number) => void | Promise<void>
}

// ============================================================================
// 执行结果
// ============================================================================

export interface ChainExecutionResult {
  success: boolean
  completedNodes: string[]
  failedNodes: string[]
  skippedNodes: string[]
  results: Map<string, unknown>
  errors: Map<string, Error>
  duration: number
  lastCheckpoint?: ChainCheckpoint
}

// ============================================================================
// 链条执行器
// ============================================================================

export class ChainExecutor {
  constructor(
    private nodeExecutor: ChainNodeExecutor,
    private defaultOptions: ChainExecutionOptions = {}
  ) {}

  /**
   * 执行链条
   */
  async execute(
    chain: Chain,
    nodeMap: Map<string, EnhancedNode>,
    options: ChainExecutionOptions = {}
  ): Promise<ChainExecutionResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }

    // 初始化执行上下文
    let startIndex = 0
    let executionState = new Map<string, unknown>()

    // 从断点恢复
    if (opts.fromCheckpoint && chain.lastCheckpoint) {
      const checkpoint = chain.lastCheckpoint
      startIndex = chain.nodes.findIndex(n => n.id === checkpoint.currentNodeId)
      executionState = new Map(Object.entries(checkpoint.state))
    }

    const context: ChainExecutionContext = {
      chainId: chain.id,
      chain,
      nodeMap,
      currentIndex: startIndex,
      executionState,
      completedNodes: new Set(),
      failedNodes: new Set(),
      skippedNodes: new Set(),
      results: new Map()
    }

    const errors = new Map<string, Error>()
    let lastCheckpoint: ChainCheckpoint | undefined

    // 执行节点
    for (let i = startIndex; i < chain.nodes.length; i++) {
      context.currentIndex = i
      const chainNode = chain.nodes[i]

      if (!chainNode) continue

      // 检查跳过条件
      if (await this.shouldSkipNode(chainNode, context)) {
        context.skippedNodes.add(chainNode.id)
        chainNode.status = 'skipped'
        continue
      }

      const enhancedNode = nodeMap.get(chainNode.nodeId)
      if (!enhancedNode) {
        context.skippedNodes.add(chainNode.id)
        chainNode.status = 'skipped'
        continue
      }

      // 执行节点（带重试）
      try {
        const result = await this.executeNodeWithRetry(
          chainNode,
          enhancedNode,
          context,
          opts,
          errors
        )

        if (chainNode.status === 'completed') {
          context.completedNodes.add(chainNode.id)
          context.results.set(chainNode.id, result)
        }
      } catch (error) {
        // 错误已在 executeNodeWithRetry 中处理
        context.failedNodes.add(chainNode.id)

        // 检查是否继续
        if (!chainNode.continueOnError && !opts.continueOnError) {
          // 跳过剩余节点
          for (let j = i + 1; j < chain.nodes.length; j++) {
            const nextNode = chain.nodes[j]
            if (nextNode) {
              context.skippedNodes.add(nextNode.id)
              nextNode.status = 'skipped'
            }
          }
          break
        }
      }

      // 创建断点
      if (chain.enableCheckpoint && i % 5 === 0) {
        lastCheckpoint = await this.createCheckpoint(chain, chainNode, context)
        if (opts.onCheckpoint) {
          await opts.onCheckpoint(lastCheckpoint)
        }
      }

      // 进度回调
      if (opts.onProgress) {
        await opts.onProgress(i + 1, chain.nodes.length)
      }
    }

    const duration = Date.now() - startTime

    const result: ChainExecutionResult = {
      success: context.failedNodes.size === 0,
      completedNodes: Array.from(context.completedNodes),
      failedNodes: Array.from(context.failedNodes),
      skippedNodes: Array.from(context.skippedNodes),
      results: context.results,
      errors,
      duration
    }

    if (lastCheckpoint) {
      result.lastCheckpoint = lastCheckpoint
    }

    return result
  }

  /**
   * 执行节点（带重试）
   */
  private async executeNodeWithRetry(
    chainNode: ChainNode,
    enhancedNode: EnhancedNode,
    context: ChainExecutionContext,
    options: ChainExecutionOptions,
    errors: Map<string, Error>
  ): Promise<unknown> {
    const maxRetries = options.maxRetries || chainNode.maxRetries
    let retryCount = 0

    while (retryCount <= maxRetries) {
      try {
        // 更新状态
        chainNode.status = 'running'
        chainNode.startedAt = new Date()

        // 开始回调
        if (options.onNodeStart) {
          await options.onNodeStart(chainNode.id)
        }

        // 执行节点
        const result = await this.executeNodeWithTimeout(
          enhancedNode,
          context,
          chainNode.timeout
        )

        // 更新状态
        chainNode.status = 'completed'
        chainNode.completedAt = new Date()
        chainNode.result = result
        chainNode.retryCount = retryCount

        // 完成回调
        if (options.onNodeComplete) {
          await options.onNodeComplete(chainNode.id, result)
        }

        return result
      } catch (error) {
        retryCount++
        chainNode.retryCount = retryCount

        if (retryCount > maxRetries) {
          // 执行失败
          chainNode.status = 'failed'
          chainNode.completedAt = new Date()
          chainNode.error = {
            message: (error as Error).message,
            code: 'EXECUTION_FAILED',
            timestamp: new Date()
          }

          errors.set(chainNode.id, error as Error)

          // 错误回调
          if (options.onNodeError) {
            await options.onNodeError(chainNode.id, error as Error)
          }

          throw error
        }

        // 重试延迟
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    throw new Error('Unexpected execution path')
  }

  /**
   * 执行节点（带超时）
   */
  private async executeNodeWithTimeout(
    node: EnhancedNode,
    context: ChainExecutionContext,
    timeout?: number
  ): Promise<unknown> {
    if (!timeout) {
      return this.nodeExecutor.execute(node, context)
    }

    return Promise.race([
      this.nodeExecutor.execute(node, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Node execution timeout')), timeout)
      )
    ])
  }

  /**
   * 检查是否跳过节点
   */
  private async shouldSkipNode(
    chainNode: ChainNode,
    context: ChainExecutionContext
  ): Promise<boolean> {
    if (!chainNode.skipCondition) return false

    try {
      // 简单的条件表达式求值
      // 实际应用中应使用更安全的表达式解析器
      const shouldSkip = this.evaluateCondition(
        chainNode.skipCondition,
        context.executionState
      )
      return shouldSkip
    } catch (error) {
      console.error('Error evaluating skip condition:', error)
      return false
    }
  }

  /**
   * 求值条件表达式
   */
  private evaluateCondition(
    condition: string,
    state: Map<string, unknown>
  ): boolean {
    // 简化实现
    // 实际应用中应使用安全的表达式解析器，如 expr-eval
    try {
      const stateObj = Object.fromEntries(state)
      const fn = new Function('state', `return ${condition}`)
      return fn(stateObj)
    } catch {
      return false
    }
  }

  /**
   * 创建断点
   */
  private async createCheckpoint(
    chain: Chain,
    currentNode: ChainNode,
    context: ChainExecutionContext
  ): Promise<ChainCheckpoint> {
    const checkpoint: ChainCheckpoint = {
      id: crypto.randomUUID(),
      chainId: chain.id,
      currentNodeId: currentNode.id,
      completedNodeIds: Array.from(context.completedNodes),
      state: Object.fromEntries(context.executionState),
      createdAt: new Date()
    }

    return checkpoint
  }

  /**
   * 暂停执行
   */
  async pause(context: ChainExecutionContext): Promise<ChainCheckpoint> {
    const currentNode = context.chain.nodes[context.currentIndex]

    if (!currentNode) {
      throw new Error('No current node to pause at')
    }

    return {
      id: crypto.randomUUID(),
      chainId: context.chainId,
      currentNodeId: currentNode.id,
      completedNodeIds: Array.from(context.completedNodes),
      state: Object.fromEntries(context.executionState),
      createdAt: new Date()
    }
  }

  /**
   * 从断点恢复
   */
  async resume(
    chain: Chain,
    checkpoint: ChainCheckpoint,
    nodeMap: Map<string, EnhancedNode>,
    options: ChainExecutionOptions = {}
  ): Promise<ChainExecutionResult> {
    return this.execute(chain, nodeMap, {
      ...options,
      fromCheckpoint: true,
      checkpointId: checkpoint.id
    })
  }

  /**
   * 重试失败节点
   */
  async retryFailed(
    chain: Chain,
    nodeMap: Map<string, EnhancedNode>,
    options: ChainExecutionOptions = {}
  ): Promise<ChainExecutionResult> {
    // 重置失败节点状态
    chain.nodes.forEach(node => {
      if (node.status === 'failed') {
        node.status = 'pending'
        node.retryCount = 0
        node.error = undefined
      }
    })

    return this.execute(chain, nodeMap, options)
  }
}
