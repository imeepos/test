/**
 * 类型安全的事件键系统
 *
 * 使用 Branded Types 确保事件订阅/发布时的类型安全
 */

/**
 * 事件键类型 - 使用 Phantom Type 实现类型安全
 *
 * @example
 * const key: EventKey<MyEvent> = createEventKey('my.event')
 *
 * eventBus.on(key, (event) => {
 *   // event 的类型自动推断为 MyEvent
 * })
 */
export type EventKey<T> = string & { readonly __eventType?: T }

/**
 * 创建类型安全的事件键
 *
 * @param key - 事件键字符串（如 'ai.task.completed'）
 * @returns 类型安全的事件键
 *
 * @example
 * const AI_TASK_COMPLETED = createEventKey<AITaskCompletedEvent>('ai.task.completed')
 */
export function createEventKey<T>(key: string): EventKey<T> {
  return key as EventKey<T>
}

/**
 * 提取事件键的字符串值
 *
 * @param key - 事件键
 * @returns 原始字符串
 */
export function getEventKeyString<T>(key: EventKey<T>): string {
  return key as string
}
