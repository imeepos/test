import { v4 as uuidv4 } from 'uuid'
import type { MessageBroker } from '../core/MessageBroker.js'
import type { EventMessage } from '../types/EventTypes'

/**
 * 事件发布器 - 发布系统事件到消息队列
 */
export class EventPublisher {
  private broker: MessageBroker

  constructor(broker: MessageBroker) {
    this.broker = broker
  }

  /**
   * 发布事件
   */
  async publish(
    eventType: string,
    payload: any,
    options: {
      exchange?: string
      routingKey?: string
      correlation?: {
        traceId?: string
        userId?: string
        sessionId?: string
      }
      priority?: number
    } = {}
  ): Promise<void> {
    const eventMessage: EventMessage = {
      eventId: uuidv4(),
      type: eventType,
      source: '@sker/broker',
      payload,
      timestamp: new Date(),
      correlation: options.correlation
    }

    const exchange = options.exchange || this.getExchangeForEvent(eventType)
    const routingKey = options.routingKey || eventType

    await this.broker.publish(exchange, routingKey, eventMessage, {
      priority: options.priority || 5,
      persistent: true,
      messageId: eventMessage.eventId,
      type: eventType,
      correlationId: options.correlation?.traceId
    })
  }

  /**
   * 发布节点事件
   */
  async publishNodeEvent(
    action: 'created' | 'updated' | 'deleted' | 'optimized',
    nodeData: any,
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    await this.publish(`node.${action}`, nodeData, {
      exchange: 'events.topic',
      correlation
    })
  }

  /**
   * 发布项目事件
   */
  async publishProjectEvent(
    action: 'created' | 'updated' | 'deleted' | 'shared',
    projectData: any,
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    await this.publish(`project.${action}`, projectData, {
      exchange: 'events.topic',
      correlation
    })
  }

  /**
   * 发布用户事件
   */
  async publishUserEvent(
    action: 'login' | 'logout' | 'register' | 'profile_updated',
    userData: any,
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    await this.publish(`user.${action}`, userData, {
      exchange: 'events.topic',
      correlation
    })
  }

  /**
   * 发布AI事件
   */
  async publishAIEvent(
    action: 'task_started' | 'task_completed' | 'task_failed' | 'model_changed',
    aiData: any,
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    await this.publish(`ai.${action}`, aiData, {
      exchange: 'events.topic',
      correlation,
      priority: 7 // AI事件优先级较高
    })
  }

  /**
   * 发布系统事件
   */
  async publishSystemEvent(
    action: 'health_check' | 'service_started' | 'service_stopped' | 'error_occurred',
    systemData: any,
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    await this.publish(`system.${action}`, systemData, {
      exchange: 'realtime.fanout',
      routingKey: '',
      correlation,
      priority: 8 // 系统事件优先级最高
    })
  }

  /**
   * 批量发布事件
   */
  async publishBatch(events: Array<{
    type: string
    payload: any
    correlation?: { traceId?: string; userId?: string; sessionId?: string }
  }>): Promise<void> {
    const publishPromises = events.map(event =>
      this.publish(event.type, event.payload, {
        correlation: event.correlation
      })
    )

    await Promise.all(publishPromises)
  }

  /**
   * 根据事件类型获取交换机
   */
  private getExchangeForEvent(eventType: string): string {
    if (eventType.startsWith('node.')) {
      return 'events.topic'
    }
    if (eventType.startsWith('project.')) {
      return 'events.topic'
    }
    if (eventType.startsWith('user.')) {
      return 'events.topic'
    }
    if (eventType.startsWith('ai.')) {
      return 'events.topic'
    }
    if (eventType.startsWith('system.')) {
      return 'realtime.fanout'
    }
    return 'events.topic' // 默认交换机
  }
}