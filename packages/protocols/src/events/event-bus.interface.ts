/**
 * 类型安全的事件总线接口
 *
 * 定义事件订阅/发布的统一接口，确保编译时类型安全
 */

import type { EventKey } from './event-keys.js'

/**
 * 类型安全的事件处理器函数类型
 */
export type TypeSafeEventHandler<T> = (event: T) => void | Promise<void>

/**
 * 取消订阅函数
 */
export type UnsubscribeFn = () => void

/**
 * 类型安全的事件总线接口
 *
 * @example
 * import { EventKeys, type TypeSafeEventBus } from '@sker/protocols'
 *
 * class MyEventBus implements TypeSafeEventBus {
 *   on<T>(key: EventKey<T>, handler: EventHandler<T>): UnsubscribeFn {
 *     // 实现订阅逻辑
 *   }
 *
 *   emit<T>(key: EventKey<T>, event: T): void {
 *     // 实现发布逻辑
 *   }
 * }
 *
 * const bus = new MyEventBus()
 *
 * // 订阅事件 - 类型安全
 * bus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
 *   // event 类型自动推断为 AITaskCompletedEvent
 *   console.log(event.result.content)
 * })
 *
 * // 发布事件 - 类型安全
 * bus.emit(EventKeys.AI_TASK_COMPLETED, {
 *   taskId: '...',
 *   nodeId: '...',
 *   result: { ... },
 *   // TypeScript 会检查所有必需字段
 * })
 */
export interface TypeSafeEventBus {
  /**
   * 订阅事件
   *
   * @param key - 事件键（类型安全）
   * @param handler - 事件处理器（event 参数类型自动推断）
   * @returns 取消订阅函数
   *
   * @example
   * const unsubscribe = eventBus.on(EventKeys.AI_TASK_COMPLETED, (event) => {
   *   console.log(`Task ${event.taskId} completed`)
   * })
   *
   * // 取消订阅
   * unsubscribe()
   */
  on<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): UnsubscribeFn

  /**
   * 一次性订阅事件（触发一次后自动取消订阅）
   *
   * @param key - 事件键
   * @param handler - 事件处理器
   * @returns 取消订阅函数
   *
   * @example
   * eventBus.once(EventKeys.AI_TASK_COMPLETED, (event) => {
   *   console.log('Task completed (only once)')
   * })
   */
  once<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): UnsubscribeFn

  /**
   * 发布事件
   *
   * @param key - 事件键
   * @param event - 事件数据（类型检查）
   *
   * @example
   * eventBus.emit(EventKeys.AI_TASK_COMPLETED, {
   *   taskId: '550e8400-e29b-41d4-a716-446655440000',
   *   nodeId: '550e8400-e29b-41d4-a716-446655440001',
   *   result: {
   *     content: '生成的内容',
   *     title: '标题',
   *     confidence: 0.85
   *   },
   *   processingTime: 1500,
   *   timestamp: new Date()
   * })
   */
  emit<T>(key: EventKey<T>, event: T): void | Promise<void>

  /**
   * 取消订阅指定处理器
   *
   * @param key - 事件键
   * @param handler - 要取消的处理器
   *
   * @example
   * const handler = (event) => console.log(event)
   * eventBus.on(EventKeys.AI_TASK_COMPLETED, handler)
   * eventBus.off(EventKeys.AI_TASK_COMPLETED, handler)
   */
  off<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): void

  /**
   * 取消订阅指定事件的所有处理器
   *
   * @param key - 事件键
   *
   * @example
   * eventBus.offAll(EventKeys.AI_TASK_COMPLETED)
   */
  offAll<T>(key: EventKey<T>): void

  /**
   * 移除所有事件的所有订阅
   *
   * @example
   * eventBus.clear()
   */
  clear(): void
}

/**
 * 异步事件总线接口（所有操作返回 Promise）
 */
export interface AsyncEventBus {
  on<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): Promise<UnsubscribeFn>
  once<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): Promise<UnsubscribeFn>
  emit<T>(key: EventKey<T>, event: T): Promise<void>
  off<T>(key: EventKey<T>, handler: TypeSafeEventHandler<T>): Promise<void>
  offAll<T>(key: EventKey<T>): Promise<void>
  clear(): Promise<void>
}

/**
 * 事件总线选项
 */
export interface EventBusOptions {
  /**
   * 是否在发布事件时捕获处理器错误
   * 默认: true
   */
  catchErrors?: boolean

  /**
   * 错误处理器
   */
  onError?: (error: Error, event: unknown, handler: TypeSafeEventHandler<unknown>) => void

  /**
   * 是否启用事件历史记录
   * 默认: false
   */
  enableHistory?: boolean

  /**
   * 历史记录最大长度
   * 默认: 100
   */
  maxHistoryLength?: number

  /**
   * 是否启用性能监控
   * 默认: false
   */
  enableMetrics?: boolean
}

/**
 * 事件总线统计信息
 */
export interface EventBusMetrics {
  /** 总订阅数 */
  totalSubscriptions: number
  /** 总发布次数 */
  totalEmissions: number
  /** 总错误次数 */
  totalErrors: number
  /** 按事件类型分组的统计 */
  byEventType: Record<
    string,
    {
      subscriptions: number
      emissions: number
      errors: number
    }
  >
}
