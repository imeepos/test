import amqp from 'amqplib'
import type { BrokerConfig, ExchangeConfig, QueueConfig } from '../types/BrokerConfig'

/**
 * 队列管理器 - 管理交换机和队列的声明和配置
 */
export class QueueManager {
  private config: BrokerConfig
  private initialized: boolean = false

  constructor(config: BrokerConfig) {
    this.config = config
  }

  /**
   * 初始化所有交换机和队列
   */
  async initialize(channel: amqp.Channel): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log('Initializing exchanges and queues...')

      // 声明交换机
      await this.declareExchanges(channel)

      // 声明队列
      await this.declareQueues(channel)

      // 绑定队列到交换机
      await this.bindQueues(channel)

      this.initialized = true
      console.log('Exchanges and queues initialized successfully')

    } catch (error) {
      console.error('Failed to initialize exchanges and queues:', error)
      throw error
    }
  }

  /**
   * 声明交换机
   */
  private async declareExchanges(channel: amqp.Channel): Promise<void> {
    for (const [name, config] of Object.entries(this.config.exchanges)) {
      try {
        await channel.assertExchange(name, config.type, {
          durable: config.durable !== false,
          autoDelete: config.autoDelete || false,
          internal: config.internal || false,
          arguments: config.arguments || {}
        })

        console.log(`Exchange declared: ${name} (type: ${config.type})`)
      } catch (error) {
        console.error(`Failed to declare exchange ${name}:`, error)
        throw error
      }
    }
  }

  /**
   * 声明队列
   */
  private async declareQueues(channel: amqp.Channel): Promise<void> {
    for (const [name, config] of Object.entries(this.config.queues)) {
      try {
        const queueOptions: amqp.Options.AssertQueue = {
          durable: config.durable !== false,
          exclusive: config.exclusive || false,
          autoDelete: config.autoDelete || false,
          arguments: {
            ...config.arguments,
            ...this.buildQueueArguments(config)
          }
        }

        await channel.assertQueue(name, queueOptions)
        console.log(`Queue declared: ${name}`)
      } catch (error) {
        console.error(`Failed to declare queue ${name}:`, error)
        throw error
      }
    }
  }

  /**
   * 构建队列参数
   */
  private buildQueueArguments(config: QueueConfig): Record<string, any> {
    const args: Record<string, any> = {}

    // 死信配置
    if (config.deadLetterExchange) {
      args['x-dead-letter-exchange'] = config.deadLetterExchange
    }
    if (config.deadLetterRoutingKey) {
      args['x-dead-letter-routing-key'] = config.deadLetterRoutingKey
    }

    // 队列长度限制
    if (config.maxLength) {
      args['x-max-length'] = config.maxLength
    }

    // 消息优先级
    if (config.maxPriority) {
      args['x-max-priority'] = config.maxPriority
    }

    // 消息TTL
    if (config.ttl) {
      args['x-message-ttl'] = config.ttl
    }

    return args
  }

  /**
   * 绑定队列到交换机
   */
  private async bindQueues(channel: amqp.Channel): Promise<void> {
    for (const [queueName, config] of Object.entries(this.config.queues)) {
      if (config.exchange && config.routingKey) {
        try {
          const routingKeys = Array.isArray(config.routingKey) ? config.routingKey : [config.routingKey]

          for (const routingKey of routingKeys) {
            await channel.bindQueue(queueName, config.exchange, routingKey)
            console.log(`Queue bound: ${queueName} -> ${config.exchange} (${routingKey})`)
          }
        } catch (error) {
          console.error(`Failed to bind queue ${queueName}:`, error)
          throw error
        }
      }
    }
  }

  /**
   * 声明死信队列和交换机
   */
  async declareDLX(channel: amqp.Channel): Promise<void> {
    const dlxConfig = this.config.deadLetter
    if (!dlxConfig || !dlxConfig.enabled) {
      return
    }

    try {
      // 声明死信交换机
      await channel.assertExchange(dlxConfig.exchange, 'direct', {
        durable: true,
        autoDelete: false
      })

      // 声明死信队列
      const dlqName = `${dlxConfig.exchange}.dlq`
      const queueOptions: amqp.Options.AssertQueue = {
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {}
      }

      // 如果配置了TTL，死信消息会在TTL后过期
      if (dlxConfig.ttl) {
        queueOptions.arguments!['x-message-ttl'] = dlxConfig.ttl
      }

      await channel.assertQueue(dlqName, queueOptions)

      // 绑定死信队列到死信交换机
      await channel.bindQueue(dlqName, dlxConfig.exchange, dlxConfig.routingKey)

      console.log(`Dead letter exchange and queue configured: ${dlxConfig.exchange}`)
    } catch (error) {
      console.error('Failed to configure dead letter exchange:', error)
      throw error
    }
  }

  /**
   * 检查队列是否存在
   */
  async checkQueue(channel: amqp.Channel, queueName: string): Promise<amqp.Replies.AssertQueue | null> {
    try {
      return await channel.checkQueue(queueName)
    } catch (error) {
      return null
    }
  }

  /**
   * 检查交换机是否存在
   */
  async checkExchange(channel: amqp.Channel, exchangeName: string): Promise<boolean> {
    try {
      await channel.checkExchange(exchangeName)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取队列信息
   */
  async getQueueInfo(channel: amqp.Channel, queueName: string): Promise<{
    queue: string
    messageCount: number
    consumerCount: number
  } | null> {
    try {
      const result = await channel.checkQueue(queueName)
      return {
        queue: result.queue,
        messageCount: result.messageCount,
        consumerCount: result.consumerCount
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 获取所有已配置队列的信息
   */
  async getAllQueuesInfo(channel: amqp.Channel): Promise<Record<string, any>> {
    const queuesInfo: Record<string, any> = {}

    for (const queueName of Object.keys(this.config.queues)) {
      const info = await this.getQueueInfo(channel, queueName)
      if (info) {
        queuesInfo[queueName] = info
      }
    }

    return queuesInfo
  }

  /**
   * 清空队列
   */
  async purgeQueue(channel: amqp.Channel, queueName: string): Promise<number> {
    try {
      const result = await channel.purgeQueue(queueName)
      console.log(`Queue purged: ${queueName} (${result.messageCount} messages removed)`)
      return result.messageCount
    } catch (error) {
      console.error(`Failed to purge queue ${queueName}:`, error)
      throw error
    }
  }

  /**
   * 删除队列
   */
  async deleteQueue(
    channel: amqp.Channel,
    queueName: string,
    options: { ifUnused?: boolean; ifEmpty?: boolean } = {}
  ): Promise<number> {
    try {
      const result = await channel.deleteQueue(queueName, options)
      console.log(`Queue deleted: ${queueName} (${result.messageCount} messages lost)`)
      return result.messageCount
    } catch (error) {
      console.error(`Failed to delete queue ${queueName}:`, error)
      throw error
    }
  }

  /**
   * 删除交换机
   */
  async deleteExchange(
    channel: amqp.Channel,
    exchangeName: string,
    options: { ifUnused?: boolean } = {}
  ): Promise<void> {
    try {
      await channel.deleteExchange(exchangeName, options)
      console.log(`Exchange deleted: ${exchangeName}`)
    } catch (error) {
      console.error(`Failed to delete exchange ${exchangeName}:`, error)
      throw error
    }
  }

  /**
   * 重置初始化状态
   */
  reset(): void {
    this.initialized = false
  }

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取配置的交换机列表
   */
  getExchanges(): string[] {
    return Object.keys(this.config.exchanges)
  }

  /**
   * 获取配置的队列列表
   */
  getQueues(): string[] {
    return Object.keys(this.config.queues)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      initialized: this.initialized,
      exchangeCount: Object.keys(this.config.exchanges).length,
      queueCount: Object.keys(this.config.queues).length,
      exchanges: this.getExchanges(),
      queues: this.getQueues()
    }
  }
}