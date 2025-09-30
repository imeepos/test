import EventEmitter from 'eventemitter3'

/**
 * 事件系统API
 * 提供插件间和插件与系统间的事件通信
 */
export interface EventSystemAPI {
  /**
   * 监听事件
   * @param event 事件名称
   * @param listener 事件监听器
   */
  on<T = any>(event: string, listener: (data: T) => void): void

  /**
   * 监听事件（一次性）
   * @param event 事件名称
   * @param listener 事件监听器
   */
  once<T = any>(event: string, listener: (data: T) => void): void

  /**
   * 取消监听事件
   * @param event 事件名称
   * @param listener 事件监听器
   */
  off<T = any>(event: string, listener?: (data: T) => void): void

  /**
   * 发射事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T = any>(event: string, data?: T): void

  /**
   * 获取事件监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  listenerCount(event: string): number

  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  eventNames(): string[]

  /**
   * 移除所有监听器
   * @param event 事件名称（可选）
   */
  removeAllListeners(event?: string): void

  /**
   * 设置最大监听器数量
   * @param count 最大数量
   */
  setMaxListeners(count: number): void

  /**
   * 获取最大监听器数量
   * @returns 最大数量
   */
  getMaxListeners(): number
}

/**
 * 事件系统实现
 */
export class EventSystem implements EventSystemAPI {
  private emitter: EventEmitter
  private namespace: string
  private globalEmitter: EventEmitter

  constructor(namespace: string, globalEmitter: EventEmitter) {
    this.emitter = new EventEmitter()
    this.namespace = namespace
    this.globalEmitter = globalEmitter
  }

  /**
   * 监听事件
   */
  on<T = any>(event: string, listener: (data: T) => void): void {
    const namespacedEvent = this.getNamespacedEvent(event)
    this.emitter.on(namespacedEvent, listener)

    // 如果是系统事件，也监听全局事件
    if (this.isSystemEvent(event)) {
      this.globalEmitter.on(event, listener)
    }
  }

  /**
   * 监听事件（一次性）
   */
  once<T = any>(event: string, listener: (data: T) => void): void {
    const namespacedEvent = this.getNamespacedEvent(event)
    this.emitter.once(namespacedEvent, listener)

    if (this.isSystemEvent(event)) {
      this.globalEmitter.once(event, listener)
    }
  }

  /**
   * 取消监听事件
   */
  off<T = any>(event: string, listener?: (data: T) => void): void {
    const namespacedEvent = this.getNamespacedEvent(event)
    if (listener) {
      this.emitter.off(namespacedEvent, listener)
      if (this.isSystemEvent(event)) {
        this.globalEmitter.off(event, listener)
      }
    } else {
      this.emitter.removeAllListeners(namespacedEvent)
      if (this.isSystemEvent(event)) {
        this.globalEmitter.removeAllListeners(event)
      }
    }
  }

  /**
   * 发射事件
   */
  emit<T = any>(event: string, data?: T): void {
    const namespacedEvent = this.getNamespacedEvent(event)

    // 创建事件数据包
    const eventPacket: EventPacket<T> = {
      event,
      data,
      namespace: this.getNamespace(),
      timestamp: Date.now(),
      source: 'plugin',
    }

    // 发射命名空间事件
    this.emitter.emit(namespacedEvent, eventPacket.data)

    // 发射全局事件（供其他插件监听）
    this.globalEmitter.emit(`plugin:${event}`, eventPacket)

    // 如果是插件间通信事件，发射到插件总线
    if (this.isPluginEvent(event)) {
      this.globalEmitter.emit('plugin.message', eventPacket)
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    const namespacedEvent = this.getNamespacedEvent(event)
    return this.emitter.listenerCount(namespacedEvent)
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    return this.emitter.eventNames().map(event => {
      const str = event.toString()
      return str.replace(`${this.namespace}:`, '')
    })
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      const namespacedEvent = this.getNamespacedEvent(event)
      this.emitter.removeAllListeners(namespacedEvent)
      if (this.isSystemEvent(event)) {
        this.globalEmitter.removeAllListeners(event)
      }
    } else {
      this.emitter.removeAllListeners()
    }
  }

  /**
   * 设置最大监听器数量
   */
  setMaxListeners(count: number): void {
    this.emitter.setMaxListeners(count)
  }

  /**
   * 获取最大监听器数量
   */
  getMaxListeners(): number {
    return this.emitter.getMaxListeners()
  }

  /**
   * 获取命名空间
   */
  getNamespace(): string {
    return this.namespace
  }

  /**
   * 获取命名空间事件名
   */
  private getNamespacedEvent(event: string): string {
    return `${this.namespace}:${event}`
  }

  /**
   * 判断是否为系统事件
   */
  private isSystemEvent(event: string): boolean {
    return event.startsWith('canvas.') ||
           event.startsWith('component.') ||
           event.startsWith('ai.') ||
           event.startsWith('system.')
  }

  /**
   * 判断是否为插件事件
   */
  private isPluginEvent(event: string): boolean {
    return event.startsWith('plugin.') ||
           event.includes('message') ||
           event.includes('broadcast')
  }

  /**
   * 监听插件间消息
   * @param fromPlugin 源插件ID（可选，不指定则监听所有插件）
   * @param listener 消息监听器
   */
  onPluginMessage<T = any>(
    fromPlugin: string | ((message: PluginMessage<T>) => void),
    listener?: (message: PluginMessage<T>) => void
  ): void {
    if (typeof fromPlugin === 'function') {
      // 监听所有插件消息
      this.globalEmitter.on('plugin.message', fromPlugin)
    } else if (listener) {
      // 监听特定插件消息
      this.globalEmitter.on('plugin.message', (message: PluginMessage<T>) => {
        if (message.fromPlugin === fromPlugin) {
          listener(message)
        }
      })
    }
  }

  /**
   * 向其他插件发送消息
   * @param toPlugin 目标插件ID
   * @param messageType 消息类型
   * @param data 消息数据
   */
  sendToPlugin<T = any>(toPlugin: string, messageType: string, data?: T): void {
    const message: PluginMessage<T> = {
      fromPlugin: this.namespace,
      toPlugin,
      messageType,
      data,
      timestamp: Date.now(),
    }

    this.globalEmitter.emit(`plugin:${toPlugin}:message`, message)
  }

  /**
   * 广播消息给所有插件
   * @param messageType 消息类型
   * @param data 消息数据
   */
  broadcast<T = any>(messageType: string, data?: T): void {
    const message: PluginMessage<T> = {
      fromPlugin: this.namespace,
      toPlugin: '*',
      messageType,
      data,
      timestamp: Date.now(),
    }

    this.globalEmitter.emit('plugin.broadcast', message)
  }

  /**
   * 监听广播消息
   * @param messageType 消息类型
   * @param listener 消息监听器
   */
  onBroadcast<T = any>(messageType: string, listener: (message: PluginMessage<T>) => void): void {
    this.globalEmitter.on('plugin.broadcast', (message: PluginMessage<T>) => {
      if (message.messageType === messageType && message.fromPlugin !== this.namespace) {
        listener(message)
      }
    })
  }

  /**
   * 销毁事件系统
   */
  destroy(): void {
    this.removeAllListeners()
    // 移除全局监听器
    this.globalEmitter.removeAllListeners(`plugin:${this.namespace}:message`)
  }
}

/**
 * 事件数据包
 */
export interface EventPacket<T = any> {
  /** 事件名称 */
  event: string
  /** 事件数据 */
  data?: T
  /** 命名空间 */
  namespace: string
  /** 时间戳 */
  timestamp: number
  /** 事件源 */
  source: 'system' | 'plugin' | 'user'
}

/**
 * 插件间消息
 */
export interface PluginMessage<T = any> {
  /** 发送插件ID */
  fromPlugin: string
  /** 接收插件ID */
  toPlugin: string
  /** 消息类型 */
  messageType: string
  /** 消息数据 */
  data?: T
  /** 时间戳 */
  timestamp: number
}

/**
 * 系统事件类型定义
 */
export interface SystemEvents {
  // 系统生命周期事件
  'system.startup': { version: string; timestamp: number }
  'system.shutdown': { timestamp: number }
  'system.error': { error: Error; context?: any }

  // 插件生命周期事件
  'plugin.installed': { pluginId: string; version: string }
  'plugin.activated': { pluginId: string }
  'plugin.deactivated': { pluginId: string }
  'plugin.uninstalled': { pluginId: string }
  'plugin.error': { pluginId: string; error: Error }

  // 插件通信事件
  'plugin.message': PluginMessage
  'plugin.broadcast': PluginMessage
  'plugin.log': { plugin: string; level: string; message: string; data?: any }

  // 权限事件
  'plugin.permission.request': { plugin: string; permission: string; callback: (granted: boolean) => void }
  'plugin.permission.granted': { plugin: string; permission: string }
  'plugin.permission.denied': { plugin: string; permission: string }

  // 配置事件
  'plugin.config.changed': { plugin: string; config: any }
  'system.config.changed': { config: any }

  // 用户事件
  'user.login': { userId: string; timestamp: number }
  'user.logout': { userId: string; timestamp: number }
  'user.action': { action: string; data?: any }
}

/**
 * 事件过滤器
 */
export interface EventFilter {
  /** 事件名称模式 */
  eventPattern?: string | RegExp
  /** 命名空间模式 */
  namespacePattern?: string | RegExp
  /** 数据过滤器 */
  dataFilter?: (data: any) => boolean
  /** 时间范围 */
  timeRange?: {
    start?: number
    end?: number
  }
}

/**
 * 事件历史记录
 */
export interface EventHistory {
  /** 事件 */
  event: string
  /** 数据 */
  data: any
  /** 命名空间 */
  namespace: string
  /** 时间戳 */
  timestamp: number
  /** 监听器数量 */
  listenerCount: number
}

/**
 * 高级事件系统
 * 提供事件历史、过滤、统计等功能
 */
export class AdvancedEventSystem extends EventSystem {
  private history: EventHistory[] = []
  private maxHistorySize = 1000
  private filters: Map<string, EventFilter> = new Map()
  private stats: Map<string, number> = new Map()

  /**
   * 启用事件历史记录
   * @param maxSize 最大记录数量
   */
  enableHistory(maxSize = 1000): void {
    this.maxHistorySize = maxSize
  }

  /**
   * 禁用事件历史记录
   */
  disableHistory(): void {
    this.history = []
  }

  /**
   * 获取事件历史
   * @param filter 过滤器
   * @returns 事件历史
   */
  getHistory(filter?: EventFilter): EventHistory[] {
    if (!filter) return [...this.history]

    return this.history.filter(record => this.matchesFilter(record, filter))
  }

  /**
   * 清空事件历史
   */
  clearHistory(): void {
    this.history = []
  }

  /**
   * 添加事件过滤器
   * @param filterId 过滤器ID
   * @param filter 过滤器
   */
  addFilter(filterId: string, filter: EventFilter): void {
    this.filters.set(filterId, filter)
  }

  /**
   * 移除事件过滤器
   * @param filterId 过滤器ID
   */
  removeFilter(filterId: string): void {
    this.filters.delete(filterId)
  }

  /**
   * 获取事件统计
   * @returns 事件统计
   */
  getStats(): Record<string, number> {
    return Object.fromEntries(this.stats)
  }

  /**
   * 重置事件统计
   */
  resetStats(): void {
    this.stats.clear()
  }

  /**
   * 覆盖emit方法以添加历史记录和统计
   */
  emit<T = any>(event: string, data?: T): void {
    // 记录事件历史
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift()
    }

    this.history.push({
      event,
      data,
      namespace: this.getNamespace(),
      timestamp: Date.now(),
      listenerCount: this.listenerCount(event),
    })

    // 更新统计
    const count = this.stats.get(event) || 0
    this.stats.set(event, count + 1)

    // 调用父类方法
    this.emitter.emit(event, data)
  }

  /**
   * 检查记录是否匹配过滤器
   */
  private matchesFilter(record: EventHistory, filter: EventFilter): boolean {
    if (filter.eventPattern) {
      if (typeof filter.eventPattern === 'string') {
        if (!record.event.includes(filter.eventPattern)) return false
      } else {
        if (!filter.eventPattern.test(record.event)) return false
      }
    }

    if (filter.namespacePattern) {
      if (typeof filter.namespacePattern === 'string') {
        if (!record.namespace.includes(filter.namespacePattern)) return false
      } else {
        if (!filter.namespacePattern.test(record.namespace)) return false
      }
    }

    if (filter.dataFilter && !filter.dataFilter(record.data)) {
      return false
    }

    if (filter.timeRange) {
      if (filter.timeRange.start && record.timestamp < filter.timeRange.start) return false
      if (filter.timeRange.end && record.timestamp > filter.timeRange.end) return false
    }

    return true
  }
}