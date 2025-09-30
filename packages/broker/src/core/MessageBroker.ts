import * as amqp from 'amqplib'
import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import type {
  BrokerConfig,
  MessageOptions,
  ConsumerOptions,
  PublishConfirmConfig
} from '../types/BrokerConfig.js'
import { ConnectionManager } from '../connection/ConnectionManager.js'
import { QueueManager } from '../queue/QueueManager.js'

/**
 * 消息代理核心类 - 封装RabbitMQ操作
 */
export class MessageBroker extends EventEmitter {
  private config: BrokerConfig
  private connectionManager: ConnectionManager
  private queueManager: QueueManager
  private channel: amqp.Channel | null = null
  private confirmChannel: amqp.ConfirmChannel | null = null
  private isStarted: boolean = false
  private pendingConfirmations: Map<number, { resolve: Function; reject: Function; timer: NodeJS.Timeout }> = new Map()

  constructor(config: BrokerConfig) {
    super()
    this.config = config
    this.connectionManager = new ConnectionManager(config)
    this.queueManager = new QueueManager(config)

    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.connectionManager.on('connected', () => {
      this.emit('connected')
    })

    this.connectionManager.on('disconnected', () => {
      this.emit('disconnected')
    })

    this.connectionManager.on('error', (error) => {
      this.emit('error', error)
    })

    this.connectionManager.on('reconnected', async () => {
      await this.setupChannels()
      this.emit('reconnected')
    })
  }

  /**
   * 启动消息代理
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return
    }

    try {
      // 建立连接
      await this.connectionManager.connect()

      // 设置通道
      await this.setupChannels()

      // 初始化队列和交换机
      await this.queueManager.initialize(this.channel!)

      this.isStarted = true
      console.log('Message broker started successfully')

    } catch (error) {
      console.error('Failed to start message broker:', error)
      throw error
    }
  }

  /**
   * 停止消息代理
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return
    }

    try {
      // 清理待确认的消息
      this.pendingConfirmations.forEach(({ reject, timer }) => {
        clearTimeout(timer)
        reject(new Error('Broker stopping'))
      })
      this.pendingConfirmations.clear()

      // 关闭通道
      if (this.channel) {
        await this.channel.close()
        this.channel = null
      }

      if (this.confirmChannel) {
        await this.confirmChannel.close()
        this.confirmChannel = null
      }

      // 关闭连接
      await this.connectionManager.disconnect()

      this.isStarted = false
      console.log('Message broker stopped')

    } catch (error) {
      console.error('Error stopping message broker:', error)
      throw error
    }
  }

  /**
   * 设置通道
   */
  private async setupChannels(): Promise<void> {
    const connection = this.connectionManager.getConnection()
    if (!connection) {
      throw new Error('No connection available')
    }

    // 创建普通通道
    this.channel = await (connection as any).createChannel()
    if (this.config.prefetch) {
      await this.channel.prefetch(this.config.prefetch)
    }

    // 创建确认通道
    this.confirmChannel = await (connection as any).createConfirmChannel()
    if (this.config.prefetch) {
      await this.confirmChannel.prefetch(this.config.prefetch)
    }

    // 设置确认监听器
    this.confirmChannel.on('ack', (tag: any) => {
      this.handleConfirmation(tag.deliveryTag, true)
    })

    this.confirmChannel.on('nack', (tag: any) => {
      this.handleConfirmation(tag.deliveryTag, false)
    })

    this.confirmChannel.on('return', (msg) => {
      console.warn('Message returned:', msg)
      this.emit('messageReturned', msg)
    })
  }

  /**
   * 发布消息
   */
  async publish(
    exchange: string,
    routingKey: string,
    content: any,
    options: MessageOptions = {}
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }

    const messageBuffer = Buffer.from(JSON.stringify(content))
    const messageOptions: amqp.Options.Publish = {
      persistent: options.persistent !== false,
      priority: options.priority || 0,
      expiration: options.expiration,
      mandatory: options.mandatory || false,
      headers: options.headers || {},
      correlationId: options.correlationId || uuidv4(),
      replyTo: options.replyTo,
      messageId: options.messageId || uuidv4(),
      timestamp: options.timestamp ? (typeof options.timestamp === 'number' ? options.timestamp : options.timestamp.getTime()) : Date.now(),
      type: options.type,
      userId: options.userId,
      appId: options.appId || '@sker/broker'
    }

    try {
      const result = this.channel.publish(exchange, routingKey, messageBuffer, messageOptions)
      if (!result) {
        throw new Error('Failed to publish message - channel flow control')
      }
    } catch (error) {
      console.error('Error publishing message:', error)
      throw error
    }
  }

  /**
   * 发布消息（带确认）
   */
  async publishWithConfirm(
    exchange: string,
    routingKey: string,
    content: any,
    options: MessageOptions = {},
    confirmTimeout: number = 30000
  ): Promise<void> {
    if (!this.confirmChannel) {
      throw new Error('Confirm channel not available')
    }

    const messageBuffer = Buffer.from(JSON.stringify(content))
    const messageOptions: amqp.Options.Publish = {
      persistent: options.persistent !== false,
      priority: options.priority || 0,
      expiration: options.expiration,
      mandatory: options.mandatory || false,
      headers: options.headers || {},
      correlationId: options.correlationId || uuidv4(),
      replyTo: options.replyTo,
      messageId: options.messageId || uuidv4(),
      timestamp: options.timestamp ? (typeof options.timestamp === 'number' ? options.timestamp : options.timestamp.getTime()) : Date.now(),
      type: options.type,
      userId: options.userId,
      appId: options.appId || '@sker/broker'
    }

    return new Promise((resolve, reject) => {
      try {
        const result = this.confirmChannel!.publish(exchange, routingKey, messageBuffer, messageOptions)
        if (!result) {
          reject(new Error('Failed to publish message - channel flow control'))
          return
        }

        // 获取下一个序列号 - 使用时间戳作为唯一标识
        const seqNo = Date.now() + Math.random()

        // 设置确认超时
        const timer = setTimeout(() => {
          this.pendingConfirmations.delete(seqNo)
          reject(new Error('Message confirmation timeout'))
        }, confirmTimeout)

        // 保存确认回调
        this.pendingConfirmations.set(seqNo, { resolve, reject, timer })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 处理发布确认
   */
  private handleConfirmation(deliveryTag: number, isAck: boolean): void {
    const confirmation = this.pendingConfirmations.get(deliveryTag)
    if (!confirmation) {
      return
    }

    const { resolve, reject, timer } = confirmation
    clearTimeout(timer)
    this.pendingConfirmations.delete(deliveryTag)

    if (isAck) {
      resolve()
    } else {
      reject(new Error('Message was nacked by broker'))
    }
  }

  /**
   * 消费消息
   */
  async consume(
    queue: string,
    handler: (message: amqp.ConsumeMessage | null) => Promise<void>,
    options: ConsumerOptions = {}
  ): Promise<amqp.Replies.Consume> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }

    const consumerOptions: amqp.Options.Consume = {
      noAck: options.noAck || false,
      exclusive: options.exclusive || false,
      priority: options.priority || 0,
      consumerTag: options.consumerTag,
      noLocal: options.noLocal || false,
      arguments: options.arguments
    }

    return await this.channel.consume(queue, async (message) => {
      try {
        await handler(message)
      } catch (error) {
        console.error('Error processing message:', error)

        // 如果不是自动确认模式，拒绝消息
        if (!consumerOptions.noAck && message) {
          this.channel!.nack(message, false, false) // 不重新入队
        }

        this.emit('messageProcessingError', error, message)
      }
    }, consumerOptions)
  }

  /**
   * 确认消息
   */
  ack(message: amqp.ConsumeMessage): void {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    this.channel.ack(message)
  }

  /**
   * 拒绝消息
   */
  nack(message: amqp.ConsumeMessage, requeue: boolean = false): void {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    this.channel.nack(message, false, requeue)
  }

  /**
   * 拒绝消息（单条）
   */
  reject(message: amqp.ConsumeMessage, requeue: boolean = false): void {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    this.channel.reject(message, requeue)
  }

  /**
   * 发送RPC请求
   */
  async sendRPC<T>(
    exchange: string,
    routingKey: string,
    content: any,
    timeout: number = 30000
  ): Promise<T> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }

    return new Promise(async (resolve, reject) => {
      try {
        // 创建临时回复队列
        const replyQueue = await this.channel!.assertQueue('', {
          exclusive: true,
          autoDelete: true
        })

        const correlationId = uuidv4()
        let replyReceived = false

        // 设置超时
        const timer = setTimeout(() => {
          if (!replyReceived) {
            reject(new Error('RPC request timeout'))
          }
        }, timeout)

        // 消费回复
        await this.channel.consume(replyQueue.queue, (message) => {
          if (message && message.properties.correlationId === correlationId) {
            replyReceived = true
            clearTimeout(timer)

            try {
              const result = JSON.parse(message.content.toString())
              this.channel!.ack(message)
              resolve(result)
            } catch (error) {
              this.channel!.ack(message)
              reject(new Error('Failed to parse RPC response'))
            }
          }
        }, { noAck: false })

        // 发送请求
        await this.publish(exchange, routingKey, content, {
          correlationId,
          replyTo: replyQueue.queue,
          expiration: timeout.toString()
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 获取队列信息
   */
  async getQueueInfo(queue: string): Promise<amqp.Replies.AssertQueue> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    return await this.channel.checkQueue(queue)
  }

  /**
   * 清空队列
   */
  async purgeQueue(queue: string): Promise<amqp.Replies.PurgeQueue> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    return await this.channel.purgeQueue(queue)
  }

  /**
   * 删除队列
   */
  async deleteQueue(queue: string, options: { ifUnused?: boolean; ifEmpty?: boolean } = {}): Promise<amqp.Replies.DeleteQueue> {
    if (!this.isReady()) {
      throw new Error('Broker not ready - connection or channels not available')
    }
    return await this.channel.deleteQueue(queue, options)
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connectionManager.isConnected()
  }

  /**
   * 检查broker是否完全准备就绪（连接已建立且所有channel都可用）
   */
  isReady(): boolean {
    return this.isStarted && 
           this.isConnected() && 
           this.channel !== null && 
           this.confirmChannel !== null
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      isStarted: this.isStarted,
      isConnected: this.isConnected(),
      pendingConfirmations: this.pendingConfirmations.size,
      config: {
        connectionUrl: this.config.connectionUrl.replace(/\/\/.*@/, '//***:***@'), // 隐藏密码
        exchanges: Object.keys(this.config.exchanges),
        queues: Object.keys(this.config.queues),
        prefetch: this.config.prefetch
      }
    }
  }
}