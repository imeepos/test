import { MessageBroker } from '@sker/broker'
import { EventEmitter } from 'events'
import type {
  DataEvent,
  DataEventType,
  EntityChangeEvent,
  BulkChangeEvent,
  EventPublisherConfig,
  EventFilter,
  EventAggregation
} from '../types/messaging'

/**
 * 数据事件发布器 - 发布数据变更事件到消息队列
 */
export class DataEventPublisher extends EventEmitter {
  private broker: MessageBroker
  private config: EventPublisherConfig
  private eventBuffer: Map<string, DataEvent[]> = new Map()
  private aggregationTimer: NodeJS.Timeout | null = null
  private filters: EventFilter[] = []
  private isEnabled: boolean = true

  constructor(broker: MessageBroker, config: EventPublisherConfig) {
    super()
    this.broker = broker
    this.config = config
    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.broker.on('connected', () => {
      console.log('数据事件发布器: 消息代理已连接')
      this.emit('brokerConnected')
    })

    this.broker.on('disconnected', () => {
      console.log('数据事件发布器: 消息代理已断开')
      this.emit('brokerDisconnected')
    })

    this.broker.on('error', (error) => {
      console.error('数据事件发布器: 消息代理错误:', error)
      this.emit('brokerError', error)
    })
  }

  /**
   * 发布实体变更事件
   */
  async publishEntityChange(event: EntityChangeEvent): Promise<void> {
    if (!this.isEnabled) return

    try {
      const dataEvent: DataEvent = {
        id: this.generateEventId(),
        type: 'entity_change',
        entityType: event.entityType,
        entityId: event.entityId,
        operation: event.operation,
        data: event.data,
        oldData: event.oldData,
        metadata: {
          userId: event.userId,
          projectId: event.projectId,
          source: 'store',
          timestamp: new Date(),
          ...event.metadata
        }
      }

      // 应用过滤器
      if (!this.shouldPublishEvent(dataEvent)) {
        return
      }

      // 根据配置决定是否聚合
      if (this.config.aggregation.enabled) {
        await this.addToBuffer(dataEvent)
      } else {
        await this.publishEvent(dataEvent)
      }

      console.log(`发布实体变更事件: ${event.entityType}:${event.entityId} - ${event.operation}`)

    } catch (error) {
      console.error('发布实体变更事件失败:', error)
      this.emit('publishError', error, event)
    }
  }

  /**
   * 发布批量变更事件
   */
  async publishBulkChange(event: BulkChangeEvent): Promise<void> {
    if (!this.isEnabled) return

    try {
      const dataEvent: DataEvent = {
        id: this.generateEventId(),
        type: 'bulk_change',
        entityType: event.entityType,
        operation: event.operation,
        data: {
          affectedCount: event.affectedCount,
          filter: event.filter,
          changes: event.changes
        },
        metadata: {
          userId: event.userId,
          projectId: event.projectId,
          source: 'store',
          timestamp: new Date(),
          ...event.metadata
        }
      }

      // 应用过滤器
      if (!this.shouldPublishEvent(dataEvent)) {
        return
      }

      await this.publishEvent(dataEvent)

      console.log(`发布批量变更事件: ${event.entityType} - ${event.operation}, 影响 ${event.affectedCount} 条记录`)

    } catch (error) {
      console.error('发布批量变更事件失败:', error)
      this.emit('publishError', error, event)
    }
  }

  /**
   * 发布数据库连接事件
   */
  async publishConnectionEvent(type: 'connected' | 'disconnected' | 'error', data?: any): Promise<void> {
    if (!this.isEnabled) return

    try {
      const dataEvent: DataEvent = {
        id: this.generateEventId(),
        type: 'connection_event',
        operation: type,
        data,
        metadata: {
          source: 'store',
          timestamp: new Date()
        }
      }

      await this.publishEvent(dataEvent)

      console.log(`发布数据库连接事件: ${type}`)

    } catch (error) {
      console.error('发布连接事件失败:', error)
      this.emit('publishError', error, { type, data })
    }
  }

  /**
   * 发布统计事件
   */
  async publishStatsEvent(stats: any): Promise<void> {
    if (!this.isEnabled) return

    try {
      const dataEvent: DataEvent = {
        id: this.generateEventId(),
        type: 'stats_update',
        operation: 'update',
        data: stats,
        metadata: {
          source: 'store',
          timestamp: new Date()
        }
      }

      await this.publishEvent(dataEvent)

      console.log('发布统计事件')

    } catch (error) {
      console.error('发布统计事件失败:', error)
      this.emit('publishError', error, stats)
    }
  }

  /**
   * 发布健康检查事件
   */
  async publishHealthEvent(health: any): Promise<void> {
    if (!this.isEnabled) return

    try {
      const dataEvent: DataEvent = {
        id: this.generateEventId(),
        type: 'health_check',
        operation: 'check',
        data: health,
        metadata: {
          source: 'store',
          timestamp: new Date()
        }
      }

      await this.publishEvent(dataEvent)

      console.log(`发布健康检查事件: ${health.status}`)

    } catch (error) {
      console.error('发布健康检查事件失败:', error)
      this.emit('publishError', error, health)
    }
  }

  /**
   * 发布事件到消息队列
   */
  private async publishEvent(event: DataEvent): Promise<void> {
    const routingKey = this.buildRoutingKey(event)

    await this.broker.publishWithConfirm(
      this.config.exchange,
      routingKey,
      event,
      {
        persistent: this.config.persistent,
        priority: this.mapEventPriority(event),
        correlationId: event.id,
        messageId: event.id,
        timestamp: event.metadata.timestamp,
        headers: {
          eventType: event.type,
          entityType: event.entityType,
          operation: event.operation,
          source: event.metadata.source,
          userId: event.metadata.userId,
          projectId: event.metadata.projectId
        }
      }
    )

    this.emit('eventPublished', event)
  }

  /**
   * 添加事件到缓冲区（用于聚合）
   */
  private async addToBuffer(event: DataEvent): Promise<void> {
    const aggregationKey = this.buildAggregationKey(event)

    if (!this.eventBuffer.has(aggregationKey)) {
      this.eventBuffer.set(aggregationKey, [])
    }

    this.eventBuffer.get(aggregationKey)!.push(event)

    // 启动聚合定时器
    if (!this.aggregationTimer) {
      this.aggregationTimer = setTimeout(
        () => this.flushAggregatedEvents(),
        this.config.aggregation.windowMs
      )
    }
  }

  /**
   * 刷新聚合事件
   */
  private async flushAggregatedEvents(): Promise<void> {
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer)
      this.aggregationTimer = null
    }

    for (const [aggregationKey, events] of this.eventBuffer.entries()) {
      if (events.length === 0) continue

      try {
        // 如果只有一个事件，直接发布
        if (events.length === 1) {
          await this.publishEvent(events[0])
        } else {
          // 聚合多个事件
          const aggregatedEvent = this.aggregateEvents(aggregationKey, events)
          await this.publishEvent(aggregatedEvent)
        }

        console.log(`刷新聚合事件: ${aggregationKey}, 包含 ${events.length} 个事件`)

      } catch (error) {
        console.error(`刷新聚合事件失败 [${aggregationKey}]:`, error)
        this.emit('aggregationError', error, aggregationKey, events)
      }
    }

    // 清空缓冲区
    this.eventBuffer.clear()
  }

  /**
   * 聚合事件
   */
  private aggregateEvents(aggregationKey: string, events: DataEvent[]): DataEvent {
    const firstEvent = events[0]

    return {
      id: this.generateEventId(),
      type: 'aggregated_change',
      entityType: firstEvent.entityType,
      operation: 'batch',
      data: {
        aggregationKey,
        eventCount: events.length,
        events: events.map(e => ({
          id: e.id,
          operation: e.operation,
          entityId: e.entityId,
          timestamp: e.metadata.timestamp
        })),
        firstEvent: firstEvent.metadata.timestamp,
        lastEvent: events[events.length - 1].metadata.timestamp
      },
      metadata: {
        source: 'store',
        timestamp: new Date(),
        aggregated: true,
        originalEventIds: events.map(e => e.id)
      }
    }
  }

  /**
   * 构建路由键
   */
  private buildRoutingKey(event: DataEvent): string {
    const parts = [
      'data',
      event.type,
      event.entityType || 'unknown',
      event.operation
    ]

    if (event.metadata.projectId) {
      parts.push(event.metadata.projectId)
    }

    return parts.join('.')
  }

  /**
   * 构建聚合键
   */
  private buildAggregationKey(event: DataEvent): string {
    return `${event.entityType}:${event.operation}:${event.metadata.projectId || 'global'}`
  }

  /**
   * 映射事件优先级
   */
  private mapEventPriority(event: DataEvent): number {
    switch (event.type) {
      case 'connection_event':
        return 10 // 最高优先级
      case 'health_check':
        return 8
      case 'entity_change':
        return 5
      case 'bulk_change':
        return 3
      case 'stats_update':
        return 1
      default:
        return 5
    }
  }

  /**
   * 判断是否应该发布事件
   */
  private shouldPublishEvent(event: DataEvent): boolean {
    return this.filters.every(filter => filter.condition(event))
  }

  /**
   * 添加事件过滤器
   */
  addFilter(filter: EventFilter): void {
    this.filters.push(filter)
    console.log(`添加事件过滤器: ${filter.name}`)
  }

  /**
   * 移除事件过滤器
   */
  removeFilter(filterName: string): void {
    const index = this.filters.findIndex(f => f.name === filterName)
    if (index >= 0) {
      this.filters.splice(index, 1)
      console.log(`移除事件过滤器: ${filterName}`)
    }
  }

  /**
   * 启用/禁用事件发布
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`事件发布器${enabled ? '已启用' : '已禁用'}`)

    if (!enabled && this.aggregationTimer) {
      // 立即刷新剩余的聚合事件
      this.flushAggregatedEvents()
    }
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    isEnabled: boolean
    brokerConnected: boolean
    bufferedEvents: number
    filtersCount: number
    aggregationEnabled: boolean
  } {
    return {
      isEnabled: this.isEnabled,
      brokerConnected: this.broker.isConnected(),
      bufferedEvents: Array.from(this.eventBuffer.values()).reduce((sum, events) => sum + events.length, 0),
      filtersCount: this.filters.length,
      aggregationEnabled: this.config.aggregation.enabled
    }
  }

  /**
   * 手动刷新缓冲区
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.size > 0) {
      await this.flushAggregatedEvents()
      console.log('手动刷新事件缓冲区完成')
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('清理数据事件发布器资源...')

    this.setEnabled(false)

    // 刷新剩余事件
    await this.flush()

    // 清理定时器
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer)
      this.aggregationTimer = null
    }

    // 清空缓冲区
    this.eventBuffer.clear()

    console.log('数据事件发布器清理完成')
  }
}

/**
 * 创建数据事件发布器的工厂函数
 */
export function createDataEventPublisher(
  broker: MessageBroker,
  config?: Partial<EventPublisherConfig>
): DataEventPublisher {
  const defaultConfig: EventPublisherConfig = {
    exchange: 'sker.data.events',
    persistent: true,
    aggregation: {
      enabled: true,
      windowMs: 5000, // 5秒聚合窗口
      maxEvents: 100
    }
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new DataEventPublisher(broker, finalConfig)
}