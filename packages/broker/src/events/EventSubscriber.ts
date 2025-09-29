import type { MessageBroker } from '../core/MessageBroker'
import type { EventMessage } from '../types/EventTypes'

/**
 * 事件订阅器 - 订阅和处理系统事件
 */
export class EventSubscriber {
  private broker: MessageBroker
  private subscriptions: Map<string, { queue: string; consumerTag: string }> = new Map()

  constructor(broker: MessageBroker) {
    this.broker = broker
  }

  /**
   * 订阅事件
   */
  async subscribe(
    eventPattern: string,
    handler: (event: EventMessage) => Promise<void>,
    options: {
      queue?: string
      exchange?: string
      exclusive?: boolean
      autoDelete?: boolean
    } = {}
  ): Promise<string> {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queueName = options.queue || `temp.${subscriptionId}`
    const exchange = options.exchange || this.getExchangeForPattern(eventPattern)

    try {
      // 声明临时队列
      await this.broker['channel']?.assertQueue(queueName, {
        exclusive: options.exclusive || false,
        autoDelete: options.autoDelete !== false,
        durable: false
      })

      // 绑定队列到交换机
      await this.broker['channel']?.bindQueue(queueName, exchange, eventPattern)

      // 开始消费
      const consumerInfo = await this.broker.consume(
        queueName,
        async (message) => {
          if (!message) return

          try {
            const eventMessage: EventMessage = JSON.parse(message.content.toString())
            await handler(eventMessage)
            this.broker.ack(message)
          } catch (error) {
            console.error('Error handling event:', error)
            this.broker.nack(message, false) // 不重新入队
          }
        },
        {
          noAck: false,
          exclusive: options.exclusive || false
        }
      )

      // 保存订阅信息
      this.subscriptions.set(subscriptionId, {
        queue: queueName,
        consumerTag: consumerInfo.consumerTag
      })

      console.log(`Event subscription created: ${subscriptionId} for pattern ${eventPattern}`)
      return subscriptionId

    } catch (error) {
      console.error('Failed to create event subscription:', error)
      throw error
    }
  }

  /**
   * 订阅节点事件
   */
  async subscribeNodeEvents(
    handler: (event: EventMessage) => Promise<void>,
    actions?: ('created' | 'updated' | 'deleted' | 'optimized')[]
  ): Promise<string> {
    const pattern = actions ? `node.{${actions.join(',')}}` : 'node.*'
    return this.subscribe(pattern, handler)
  }

  /**
   * 订阅项目事件
   */
  async subscribeProjectEvents(
    handler: (event: EventMessage) => Promise<void>,
    actions?: ('created' | 'updated' | 'deleted' | 'shared')[]
  ): Promise<string> {
    const pattern = actions ? `project.{${actions.join(',')}}` : 'project.*'
    return this.subscribe(pattern, handler)
  }

  /**
   * 订阅用户事件
   */
  async subscribeUserEvents(
    handler: (event: EventMessage) => Promise<void>,
    actions?: ('login' | 'logout' | 'register' | 'profile_updated')[]
  ): Promise<string> {
    const pattern = actions ? `user.{${actions.join(',')}}` : 'user.*'
    return this.subscribe(pattern, handler)
  }

  /**
   * 订阅AI事件
   */
  async subscribeAIEvents(
    handler: (event: EventMessage) => Promise<void>,
    actions?: ('task_started' | 'task_completed' | 'task_failed' | 'model_changed')[]
  ): Promise<string> {
    const pattern = actions ? `ai.{${actions.join(',')}}` : 'ai.*'
    return this.subscribe(pattern, handler)
  }

  /**
   * 订阅系统事件
   */
  async subscribeSystemEvents(
    handler: (event: EventMessage) => Promise<void>
  ): Promise<string> {
    return this.subscribe('', handler, {
      exchange: 'realtime.fanout'
    })
  }

  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return false
    }

    try {
      // 取消消费者
      await this.broker['channel']?.cancel(subscription.consumerTag)

      // 删除临时队列
      try {
        await this.broker['channel']?.deleteQueue(subscription.queue, {
          ifEmpty: true,
          ifUnused: true
        })
      } catch (error) {
        // 忽略队列删除错误（可能已经被自动删除）
        console.warn('Failed to delete queue:', error)
      }

      // 移除订阅记录
      this.subscriptions.delete(subscriptionId)

      console.log(`Event subscription cancelled: ${subscriptionId}`)
      return true

    } catch (error) {
      console.error('Failed to cancel event subscription:', error)
      return false
    }
  }

  /**
   * 取消所有订阅
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(
      subscriptionId => this.unsubscribe(subscriptionId)
    )

    await Promise.all(unsubscribePromises)
    console.log('All event subscriptions cancelled')
  }

  /**
   * 获取活跃订阅列表
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * 获取订阅统计信息
   */
  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      subscriptions: Array.from(this.subscriptions.entries()).map(([id, info]) => ({
        id,
        queue: info.queue,
        consumerTag: info.consumerTag
      }))
    }
  }

  /**
   * 根据事件模式获取交换机
   */
  private getExchangeForPattern(pattern: string): string {
    if (pattern.startsWith('node.')) {
      return 'events.topic'
    }
    if (pattern.startsWith('project.')) {
      return 'events.topic'
    }
    if (pattern.startsWith('user.')) {
      return 'events.topic'
    }
    if (pattern.startsWith('ai.')) {
      return 'events.topic'
    }
    if (pattern.startsWith('system.')) {
      return 'realtime.fanout'
    }
    return 'events.topic' // 默认交换机
  }
}