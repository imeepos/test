/**
 * 流式处理辅助工具
 *
 * 提供常用的流式处理模式和工具函数
 */

import type { StreamEvent } from '../execution/StreamEvents.js'

// ============================================================================
// SSE (Server-Sent Events) 工具
// ============================================================================

/**
 * 将流式事件转换为SSE格式字符串
 */
export function toSSE(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

/**
 * 创建SSE流转换器
 */
export async function* toSSEStream(
  stream: AsyncIterableIterator<StreamEvent>
): AsyncIterableIterator<string> {
  for await (const event of stream) {
    yield toSSE(event)
  }
}

// ============================================================================
// 节点输出收集器
// ============================================================================

/**
 * 收集特定节点的所有输出
 */
export class NodeOutputCollector {
  private outputs = new Map<string, unknown[]>()

  /**
   * 处理事件
   */
  handleEvent(event: StreamEvent): void {
    if (event.type === 'node_output') {
      const { nodeId, chunk } = event.data

      if (!this.outputs.has(nodeId)) {
        this.outputs.set(nodeId, [])
      }

      this.outputs.get(nodeId)!.push(chunk)
    }
  }

  /**
   * 获取节点的所有输出
   */
  getOutputs(nodeId: string): unknown[] {
    return this.outputs.get(nodeId) || []
  }

  /**
   * 获取节点的最后一个输出
   */
  getLastOutput(nodeId: string): unknown | undefined {
    const outputs = this.outputs.get(nodeId)
    return outputs?.[outputs.length - 1]
  }

  /**
   * 获取所有节点的输出
   */
  getAllOutputs(): Map<string, unknown[]> {
    return new Map(this.outputs)
  }

  /**
   * 清除所有输出
   */
  clear(): void {
    this.outputs.clear()
  }
}

// ============================================================================
// 执行进度追踪器
// ============================================================================

export interface ExecutionProgress {
  totalNodes: number
  startedNodes: number
  completedNodes: number
  failedNodes: number
  progress: number // 0-1
  currentNode?: string
  estimatedTimeRemaining?: number
}

/**
 * 执行进度追踪器
 */
export class ProgressTracker {
  private totalNodes = 0
  private startedNodes = new Set<string>()
  private completedNodes = new Set<string>()
  private failedNodes = new Set<string>()
  private startTime: number | undefined
  private nodeStartTimes = new Map<string, number>()

  /**
   * 处理事件
   */
  handleEvent(event: StreamEvent): void {
    switch (event.type) {
      case 'start':
        this.totalNodes = event.data.totalNodes
        this.startTime = Date.now()
        break

      case 'node_start':
        this.startedNodes.add(event.data.nodeId)
        this.nodeStartTimes.set(event.data.nodeId, Date.now())
        break

      case 'node_complete':
        this.completedNodes.add(event.data.nodeId)
        this.nodeStartTimes.delete(event.data.nodeId)
        break

      case 'node_error':
        this.failedNodes.add(event.data.nodeId)
        this.nodeStartTimes.delete(event.data.nodeId)
        break
    }
  }

  /**
   * 获取当前进度
   */
  getProgress(): ExecutionProgress {
    const completed = this.completedNodes.size + this.failedNodes.size
    const progress = this.totalNodes > 0 ? completed / this.totalNodes : 0

    const result: ExecutionProgress = {
      totalNodes: this.totalNodes,
      startedNodes: this.startedNodes.size,
      completedNodes: this.completedNodes.size,
      failedNodes: this.failedNodes.size,
      progress
    }

    // 估算剩余时间
    if (this.startTime && completed > 0 && progress < 1) {
      const elapsed = Date.now() - this.startTime
      const avgTimePerNode = elapsed / completed
      const remaining = this.totalNodes - completed
      result.estimatedTimeRemaining = avgTimePerNode * remaining
    }

    // 获取当前执行节点
    const currentNode = Array.from(this.nodeStartTimes.keys())[0]
    if (currentNode) {
      result.currentNode = currentNode
    }

    return result
  }

  /**
   * 重置追踪器
   */
  reset(): void {
    this.totalNodes = 0
    this.startedNodes.clear()
    this.completedNodes.clear()
    this.failedNodes.clear()
    this.startTime = undefined
    this.nodeStartTimes.clear()
  }
}

// ============================================================================
// 状态快照收集器
// ============================================================================

/**
 * 状态快照收集器
 */
export class StateSnapshotCollector {
  private snapshots: Array<{
    timestamp: Date
    state: Record<string, unknown>
  }> = []

  /**
   * 处理事件
   */
  handleEvent(event: StreamEvent): void {
    if (event.type === 'state_update' && event.data.fullState) {
      this.snapshots.push({
        timestamp: event.timestamp,
        state: { ...event.data.fullState }
      })
    }
  }

  /**
   * 获取所有快照
   */
  getSnapshots() {
    return [...this.snapshots]
  }

  /**
   * 获取最新快照
   */
  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1]
  }

  /**
   * 获取指定时间点的快照
   */
  getSnapshotAt(timestamp: Date) {
    return this.snapshots.find(s => s.timestamp >= timestamp)
  }

  /**
   * 清除所有快照
   */
  clear(): void {
    this.snapshots = []
  }
}

// ============================================================================
// 错误收集器
// ============================================================================

export interface ErrorInfo {
  nodeId: string
  error: {
    message: string
    code?: string
    stack?: string
  }
  timestamp: Date
  willRetry: boolean
}

/**
 * 错误收集器
 */
export class ErrorCollector {
  private errors: ErrorInfo[] = []

  /**
   * 处理事件
   */
  handleEvent(event: StreamEvent): void {
    if (event.type === 'node_error') {
      const errorInfo: ErrorInfo = {
        nodeId: event.data.nodeId,
        error: {
          message: event.data.error.message
        },
        timestamp: event.timestamp,
        willRetry: event.data.willRetry
      }

      if (event.data.error.code) {
        errorInfo.error.code = event.data.error.code
      }
      if (event.data.error.stack) {
        errorInfo.error.stack = event.data.error.stack
      }

      this.errors.push(errorInfo)
    }
  }

  /**
   * 获取所有错误
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  /**
   * 获取特定节点的错误
   */
  getNodeErrors(nodeId: string): ErrorInfo[] {
    return this.errors.filter(e => e.nodeId === nodeId)
  }

  /**
   * 获取将要重试的错误
   */
  getRetryableErrors(): ErrorInfo[] {
    return this.errors.filter(e => e.willRetry)
  }

  /**
   * 获取致命错误
   */
  getFatalErrors(): ErrorInfo[] {
    return this.errors.filter(e => !e.willRetry)
  }

  /**
   * 是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 清除所有错误
   */
  clear(): void {
    this.errors = []
  }
}

// ============================================================================
// 综合事件处理器
// ============================================================================

/**
 * 综合事件处理器，整合所有收集器
 */
export class StreamEventHandler {
  public readonly outputs = new NodeOutputCollector()
  public readonly progress = new ProgressTracker()
  public readonly snapshots = new StateSnapshotCollector()
  public readonly errors = new ErrorCollector()

  private eventLog: StreamEvent[] = []
  private maxLogSize: number

  constructor(options?: { maxLogSize?: number }) {
    this.maxLogSize = options?.maxLogSize || 1000
  }

  /**
   * 处理事件
   */
  handleEvent(event: StreamEvent): void {
    // 记录事件
    this.eventLog.push(event)
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }

    // 分发到各个收集器
    this.outputs.handleEvent(event)
    this.progress.handleEvent(event)
    this.snapshots.handleEvent(event)
    this.errors.handleEvent(event)
  }

  /**
   * 处理流
   */
  async processStream(stream: AsyncIterableIterator<StreamEvent>): Promise<void> {
    for await (const event of stream) {
      this.handleEvent(event)
    }
  }

  /**
   * 获取事件日志
   */
  getEventLog(): StreamEvent[] {
    return [...this.eventLog]
  }

  /**
   * 获取执行摘要
   */
  getSummary() {
    const progress = this.progress.getProgress()
    const latestSnapshot = this.snapshots.getLatestSnapshot()
    const errors = this.errors.getErrors()

    return {
      progress,
      latestState: latestSnapshot?.state,
      errors,
      totalEvents: this.eventLog.length,
      hasErrors: errors.length > 0
    }
  }

  /**
   * 重置所有收集器
   */
  reset(): void {
    this.outputs.clear()
    this.progress.reset()
    this.snapshots.clear()
    this.errors.clear()
    this.eventLog = []
  }
}

// ============================================================================
// 流式处理辅助函数
// ============================================================================

/**
 * 监控并处理流式事件
 */
export async function monitorStream(
  stream: AsyncIterableIterator<StreamEvent>,
  options?: {
    onProgress?: (progress: ExecutionProgress) => void
    onError?: (error: ErrorInfo) => void
    onComplete?: (summary: any) => void
  }
): Promise<StreamEventHandler> {
  const handler = new StreamEventHandler()

  for await (const event of stream) {
    handler.handleEvent(event)

    // 进度回调
    if (options?.onProgress && event.type === 'node_complete') {
      options.onProgress(handler.progress.getProgress())
    }

    // 错误回调
    if (options?.onError && event.type === 'node_error') {
      const errors = handler.errors.getErrors()
      const lastError = errors[errors.length - 1]
      if (lastError) {
        options.onError(lastError)
      }
    }

    // 完成回调
    if (options?.onComplete && event.type === 'complete') {
      options.onComplete(handler.getSummary())
    }
  }

  return handler
}

/**
 * 只获取节点输出的流
 */
export async function* extractNodeOutputs(
  stream: AsyncIterableIterator<StreamEvent>
): AsyncIterableIterator<{ nodeId: string; chunk: unknown }> {
  for await (const event of stream) {
    if (event.type === 'node_output') {
      yield {
        nodeId: event.data.nodeId,
        chunk: event.data.chunk
      }
    }
  }
}

/**
 * 等待执行完成并返回最终状态
 */
export async function waitForFinalState(
  stream: AsyncIterableIterator<StreamEvent>
): Promise<Record<string, unknown> | null> {
  for await (const event of stream) {
    if (event.type === 'complete') {
      return event.data.finalState
    }
  }
  return null
}
