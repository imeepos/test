/**
 * 流式执行器基类
 *
 * 提供流式执行能力，支持实时事件推送和异步迭代
 */

import type { StreamEvent, StreamEventFilter } from './StreamEvents.js'
import { matchesFilter } from './StreamEvents.js'

// ============================================================================
// 流式执行器接口
// ============================================================================

export interface StreamingExecutor<TInput = any, TOutput = any> {
  /**
   * 执行并返回流式事件
   */
  stream(input: TInput, options?: StreamExecutionOptions): AsyncIterableIterator<StreamEvent>

  /**
   * 执行并返回最终结果（非流式）
   */
  execute(input: TInput, options?: StreamExecutionOptions): Promise<TOutput>
}

// ============================================================================
// 流式执行选项
// ============================================================================

export interface StreamExecutionOptions {
  /**
   * 事件过滤器
   */
  filter?: StreamEventFilter

  /**
   * 是否包含状态更新事件
   */
  includeStateUpdates?: boolean

  /**
   * 是否包含元数据事件
   */
  includeMetadata?: boolean

  /**
   * 批量大小（对于批量输出）
   */
  batchSize?: number

  /**
   * 超时时间（毫秒）
   */
  timeout?: number

  /**
   * 自定义元数据
   */
  metadata?: Record<string, unknown>
}


// ============================================================================
// 异步事件流生成器
// ============================================================================

export class AsyncEventStream {
  private queue: StreamEvent[] = []
  private resolvers: Array<(value: IteratorResult<StreamEvent>) => void> = []
  private isComplete = false
  private error: Error | null = null
  private filter: StreamEventFilter | undefined

  constructor(filter?: StreamEventFilter) {
    this.filter = filter
  }

  /**
   * 推送事件到流
   */
  push(event: StreamEvent): void {
    if (this.isComplete) {
      throw new Error('Cannot push to completed stream')
    }

    // 应用过滤器
    if (this.filter && !matchesFilter(event, this.filter)) {
      return
    }

    // 如果有等待的resolver，立即解析
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!
      resolve({ value: event, done: false })
      return
    }

    // 否则加入队列
    this.queue.push(event)
  }

  /**
   * 标记流完成
   */
  complete(): void {
    this.isComplete = true

    // 解析所有等待的resolver
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!
      resolve({ value: undefined, done: true })
    }
  }

  /**
   * 标记流错误
   */
  throw(error: Error): void {
    this.error = error
    this.isComplete = true

    // 解析所有等待的resolver（它们会在next中抛出错误）
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!
      resolve({ value: undefined, done: true })
    }
  }

  /**
   * 创建异步迭代器
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent> {
    return {
      next: async (): Promise<IteratorResult<StreamEvent>> => {
        // 如果有错误，抛出
        if (this.error) {
          throw this.error
        }

        // 如果队列有数据，立即返回
        if (this.queue.length > 0) {
          const event = this.queue.shift()!
          return { value: event, done: false }
        }

        // 如果已完成，返回done
        if (this.isComplete) {
          return { value: undefined, done: true }
        }

        // 否则等待新事件
        return new Promise<IteratorResult<StreamEvent>>(resolve => {
          this.resolvers.push(resolve)
        })
      },

      return: async (): Promise<IteratorResult<StreamEvent>> => {
        this.complete()
        return { value: undefined, done: true }
      },

      throw: async (error: Error): Promise<IteratorResult<StreamEvent>> => {
        this.throw(error)
        throw error
      },

      [Symbol.asyncIterator]() {
        return this
      }
    }
  }
}

