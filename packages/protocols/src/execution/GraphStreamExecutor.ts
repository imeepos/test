/**
 * 图流式执行器
 *
 * 支持流式执行DAG图，实时推送执行事件
 */

import type { Graph } from '../structures/graph.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'
import type { StreamEvent } from './StreamEvents.js'
import type { StreamingExecutor, StreamExecutionOptions } from './StreamingExecutor.js'
import {
  createExecutionStartEvent,
  createNodeStartEvent,
  createNodeOutputEvent,
  createNodeCompleteEvent,
  createNodeErrorEvent,
  createStateUpdateEvent,
  createExecutionCompleteEvent
} from './StreamEvents.js'
import { AsyncEventStream } from './StreamingExecutor.js'
import { GraphExecutor, type NodeExecutor, type GraphExecutionOptions } from './graph-executor.js'

// ============================================================================
// 流式节点执行器
// ============================================================================

export interface StreamingNodeExecutor {
  /**
   * 流式执行节点
   */
  executeStream(
    node: EnhancedNode,
    context: any
  ): AsyncIterableIterator<unknown>
}

// ============================================================================
// 图流式执行器
// ============================================================================

export class GraphStreamExecutor implements StreamingExecutor<GraphStreamInput, GraphStreamOutput> {
  private baseExecutor: GraphExecutor

  constructor(
    private streamingNodeExecutor: StreamingNodeExecutor,
    _defaultOptions: GraphExecutionOptions = {}
  ) {
    // 创建包装的NodeExecutor用于基础执行器
    const nodeExecutor: NodeExecutor = {
      execute: async (node, context) => {
        // 收集所有流式输出
        const chunks: unknown[] = []
        for await (const chunk of this.streamingNodeExecutor.executeStream(node, context)) {
          chunks.push(chunk)
        }
        // 返回最后一个chunk或合并结果
        return chunks[chunks.length - 1]
      }
    }

    this.baseExecutor = new GraphExecutor(nodeExecutor, _defaultOptions)
  }

  /**
   * 流式执行图
   */
  async *stream(
    input: GraphStreamInput,
    options: StreamExecutionOptions = {}
  ): AsyncIterableIterator<StreamEvent> {
    const executionId = crypto.randomUUID()
    const startTime = Date.now()

    const eventStream = new AsyncEventStream(options.filter)

    // 发送执行开始事件
    const startEvent = createExecutionStartEvent(
      executionId,
      input.graph.id,
      input.graph.nodeIds.length,
      input.initialState
    )
    eventStream.push(startEvent)

    try {
      // 创建执行上下文
      const completedNodes: string[] = []
      const failedNodes: string[] = []
      const currentState = { ...input.initialState }

      // 获取执行计划
      const plan = await this.baseExecutor.createExecutionPlan(input.graph)

      // 按计划执行节点
      for (const level of plan.levels) {
        // 并行执行同一层级的节点
        await Promise.all(
          level.map(async nodeId => {
            const enhancedNode = input.nodeMap.get(nodeId)
            if (!enhancedNode) return

            try {
              // 发送节点开始事件
              const nodeStartEvent = createNodeStartEvent(
                executionId,
                nodeId,
                enhancedNode.content
              )
              eventStream.push(nodeStartEvent)

              const nodeStartTime = Date.now()
              let chunkIndex = 0
              let lastChunk: unknown

              // 流式执行节点
              for await (const chunk of this.streamingNodeExecutor.executeStream(
                enhancedNode,
                { state: currentState, graph: input.graph }
              )) {
                lastChunk = chunk

                // 发送节点输出事件
                const outputEvent = createNodeOutputEvent(
                  executionId,
                  nodeId,
                  chunk,
                  false, // 不是最后一块
                  chunkIndex++
                )
                eventStream.push(outputEvent)
              }

              // 发送最后一块标记
              if (lastChunk !== undefined) {
                const finalOutputEvent = createNodeOutputEvent(
                  executionId,
                  nodeId,
                  lastChunk,
                  true, // 最后一块
                  chunkIndex
                )
                eventStream.push(finalOutputEvent)
              }

              const nodeDuration = Date.now() - nodeStartTime

              // 发送节点完成事件
              const completeEvent = createNodeCompleteEvent(
                executionId,
                nodeId,
                lastChunk,
                nodeDuration
              )
              eventStream.push(completeEvent)

              completedNodes.push(nodeId)

              // 更新状态
              if (lastChunk && typeof lastChunk === 'object') {
                Object.assign(currentState, lastChunk)

                if (options.includeStateUpdates) {
                  const stateUpdateEvent = createStateUpdateEvent(
                    executionId,
                    lastChunk as Record<string, unknown>,
                    currentState
                  )
                  eventStream.push(stateUpdateEvent)
                }
              }
            } catch (error) {
              // 发送节点错误事件
              const errorEvent = createNodeErrorEvent(
                executionId,
                nodeId,
                error as Error,
                false
              )
              eventStream.push(errorEvent)

              failedNodes.push(nodeId)

              // 根据配置决定是否继续
              if (input.options?.failFast) {
                throw error
              }
            }
          })
        )

        // 如果有失败且failFast，停止执行
        if (failedNodes.length > 0 && input.options?.failFast) {
          break
        }
      }

      const duration = Date.now() - startTime

      // 发送执行完成事件
      const completeEvent = createExecutionCompleteEvent(
        executionId,
        failedNodes.length === 0,
        currentState,
        duration,
        completedNodes,
        failedNodes.length > 0 ? failedNodes : undefined
      )
      eventStream.push(completeEvent)
    } catch (error) {
      // 发送执行错误事件
      const errorEvent: StreamEvent = {
        id: crypto.randomUUID(),
        type: 'error',
        timestamp: new Date(),
        executionId,
        data: {
          error: {
            message: (error as Error).message,
            stack: (error as Error).stack
          }
        }
      }
      eventStream.push(errorEvent)
      eventStream.throw(error as Error)
    } finally {
      eventStream.complete()
    }

    // 迭代事件流
    for await (const event of eventStream) {
      yield event
    }
  }

  /**
   * 非流式执行（返回最终结果）
   */
  async execute(
    input: GraphStreamInput,
    options: StreamExecutionOptions = {}
  ): Promise<GraphStreamOutput> {
    const events: StreamEvent[] = []
    let finalState: Record<string, unknown> = {}
    let success = false
    let completedNodes: string[] = []
    let failedNodes: string[] = []
    let duration = 0

    for await (const event of this.stream(input, options)) {
      events.push(event)

      if (event.type === 'complete') {
        finalState = event.data.finalState
        success = event.data.success
        completedNodes = event.data.completedNodes
        failedNodes = event.data.failedNodes || []
        duration = event.data.duration
      }
    }

    return {
      success,
      finalState,
      completedNodes,
      failedNodes,
      duration,
      events
    }
  }

}

// ============================================================================
// 输入输出类型
// ============================================================================

export interface GraphStreamInput {
  graph: Graph
  nodeMap: Map<string, EnhancedNode>
  initialState?: Record<string, unknown>
  options?: GraphExecutionOptions
}

export interface GraphStreamOutput {
  success: boolean
  finalState: Record<string, unknown>
  completedNodes: string[]
  failedNodes: string[]
  duration: number
  events: StreamEvent[]
}

// ============================================================================
// 流式节点执行器适配器
// ============================================================================

/**
 * 将普通NodeExecutor适配为StreamingNodeExecutor
 */
export function adaptNodeExecutor(executor: NodeExecutor): StreamingNodeExecutor {
  return {
    async *executeStream(node, context) {
      const result = await executor.execute(node, context)
      yield result
    }
  }
}
