import { MessageBroker } from '@sker/broker'
import { EventEmitter } from 'events'
import {
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS,
  MESSAGE_PROPERTIES
} from '@sker/models'
import type {
  QueueMessageHandler,
  QueueSubscription,
  MessageMetadata,
  WebSocketMessage,
  GatewayQueueConfig
} from '../types/messaging.js'
import type { UnifiedAITaskMessage, UnifiedAIResultMessage } from '@sker/models'

// 类型别名以兼容现有代码
type AITaskMessage = UnifiedAITaskMessage
type AIResultMessage = UnifiedAIResultMessage

/**
 * Gateway 队列管理器 - 处理各种消息队列操作
 */
export class QueueManager extends EventEmitter {
  private broker: MessageBroker
  private config: GatewayQueueConfig
  private subscriptions: Map<string, QueueSubscription> = new Map()
  private isInitialized: boolean = false

  constructor(broker: MessageBroker, config: GatewayQueueConfig) {
    super()
    this.broker = broker
    this.config = config
    this.setupBrokerEventHandlers()
  }

  /**
   * 设置消息代理事件处理器
   */
  private setupBrokerEventHandlers(): void {
    this.broker.on('connected', () => {
      console.log('队列管理器: 消息代理已连接')
      this.emit('brokerConnected')
    })

    this.broker.on('disconnected', () => {
      console.log('队列管理器: 消息代理已断开')
      this.emit('brokerDisconnected')
    })

    this.broker.on('error', (error) => {
      console.error('队列管理器: 消息代理错误:', error)
      this.emit('brokerError', error)
    })

    this.broker.on('reconnected', () => {
      console.log('队列管理器: 消息代理已重连')
      this.emit('brokerReconnected')
      this.restoreSubscriptions()
    })
  }

  /**
   * 初始化队列管理器
   */
  async initialize(): Promise<void> {
    try {
      if (!this.broker.isConnected()) {
        await this.broker.start()
      }

      // 设置默认订阅
      await this.setupDefaultSubscriptions()

      this.isInitialized = true
      console.log('队列管理器初始化成功')
    } catch (error) {
      console.error('队列管理器初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置默认订阅
   */
  private async setupDefaultSubscriptions(): Promise<void> {
    // 订阅 AI 任务结果
    await this.subscribeToAITaskResults()

    // 订阅 WebSocket 消息广播
    await this.subscribeToWebSocketBroadcast()

    // 订阅系统通知
    await this.subscribeToSystemNotifications()
  }

  /**
   * 订阅 AI 任务结果
   */
  private async subscribeToAITaskResults(): Promise<void> {
    const subscription = await this.subscribe(
      QUEUE_NAMES.AI_RESULTS,
      async (message, metadata) => {
        try {
          const taskResult: AIResultMessage = JSON.parse(message)
          console.log(`收到AI任务结果: ${taskResult.taskId}, 状态: ${taskResult.status}`)

          // 发送任务结果给相关的 WebSocket 连接
          this.emit('aiTaskResult', taskResult, metadata)

          // 根据任务状态执行不同操作
          switch (taskResult.status) {
            case 'completed':
              await this.handleTaskCompleted(taskResult)
              break
            case 'failed':
              await this.handleTaskFailed(taskResult)
              break
            case 'processing':
              await this.handleTaskProgress(taskResult)
              break
          }

        } catch (error) {
          console.error('处理AI任务结果失败:', error)
          throw error
        }
      },
      {
        exchange: EXCHANGE_NAMES.AI_RESULTS,
        routingKey: 'task.result.*',
        autoAck: false
      }
    )

    this.subscriptions.set('aiTaskResults', subscription)
  }

  /**
   * 订阅 WebSocket 消息广播
   */
  private async subscribeToWebSocketBroadcast(): Promise<void> {
    const subscription = await this.subscribe(
      QUEUE_NAMES.EVENTS_WEBSOCKET,
      async (message, metadata) => {
        try {
          const wsMessage: WebSocketMessage = JSON.parse(message)
          console.log(`收到WebSocket广播消息: ${wsMessage.type}`)

          // 广播消息给所有相关的 WebSocket 连接
          this.emit('websocketBroadcast', wsMessage, metadata)

        } catch (error) {
          console.error('处理WebSocket广播消息失败:', error)
          throw error
        }
      },
      {
        exchange: EXCHANGE_NAMES.REALTIME_FANOUT,
        routingKey: 'broadcast.*',
        autoAck: false
      }
    )

    this.subscriptions.set('websocketBroadcast', subscription)
  }

  /**
   * 订阅系统通知
   */
  private async subscribeToSystemNotifications(): Promise<void> {
    const subscription = await this.subscribe(
      QUEUE_NAMES.EVENTS_STORAGE,
      async (message, metadata) => {
        try {
          const notification = JSON.parse(message)
          console.log(`收到系统通知: ${notification.type}`)

          // 处理系统通知
          this.emit('systemNotification', notification, metadata)

        } catch (error) {
          console.error('处理系统通知失败:', error)
          throw error
        }
      },
      {
        exchange: EXCHANGE_NAMES.EVENTS_TOPIC,
        routingKey: 'notification.*',
        autoAck: false
      }
    )

    this.subscriptions.set('systemNotifications', subscription)
  }

  /**
   * 通用订阅方法
   */
  async subscribe(
    queueName: string,
    handler: QueueMessageHandler,
    options: {
      exchange?: string
      routingKey?: string
      autoAck?: boolean
      maxRetries?: number
    } = {}
  ): Promise<QueueSubscription> {
    const {
      exchange = '',
      routingKey = '',
      autoAck = false,
      maxRetries = 3
    } = options

    // 创建消费者
    const consumerInfo = await this.broker.consume(
      queueName,
      async (message) => {
        if (!message) return

        const messageContent = message.content.toString()
        const metadata: MessageMetadata = {
          messageId: message.properties.messageId || '',
          correlationId: message.properties.correlationId || '',
          timestamp: message.properties.timestamp || new Date(),
          replyTo: message.properties.replyTo,
          routingKey: message.fields.routingKey,
          exchange: message.fields.exchange,
          headers: message.properties.headers || {},
          deliveryTag: message.fields.deliveryTag,
          redelivered: message.fields.redelivered,
          retryCount: this.getRetryCount(message)
        }

        try {
          // 调用处理器
          await handler(messageContent, metadata)

          // 手动确认消息（如果不是自动确认）
          if (!autoAck) {
            this.broker.ack(message)
          }

        } catch (error) {
          console.error(`处理队列消息失败 [${queueName}]:`, error)

          // 重试逻辑
          if (metadata.retryCount < maxRetries) {
            console.log(`重试消息处理 [${queueName}], 尝试 ${metadata.retryCount + 1}/${maxRetries}`)

            // 增加重试计数并重新发布到队列
            await this.retryMessage(message, exchange, routingKey, metadata.retryCount + 1)

            if (!autoAck) {
              this.broker.ack(message) // 确认原消息
            }
          } else {
            console.error(`消息处理失败，已达到最大重试次数 [${queueName}]:`, error)

            // 发送到死信队列或记录错误
            await this.handleFailedMessage(message, error)

            if (!autoAck) {
              this.broker.nack(message, false) // 拒绝消息，不重新入队
            }
          }
        }
      },
      {
        noAck: autoAck
      }
    )

    const subscription: QueueSubscription = {
      queueName,
      consumerTag: consumerInfo.consumerTag,
      handler,
      options,
      active: true
    }

    return subscription
  }

  /**
   * 发布 AI 任务
   */
  async publishAITask(task: UnifiedAITaskMessage): Promise<void> {
    try {
      const routingKey = `${ROUTING_KEYS.AI_PROCESS}.${task.type}.${task.priority || 'normal'}`

      await this.broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        routingKey,
        task,
        {
          persistent: true,
          priority: this.mapPriorityToNumber(task.priority),
          correlationId: task.taskId,
          messageId: task.taskId,
          timestamp: new Date(),
          headers: {
            taskType: task.type,
            userId: task.userId,
            projectId: task.projectId
          }
        }
      )

      console.log(`AI任务已发布: ${task.taskId}, 类型: ${task.type}`)
    } catch (error) {
      console.error('发布AI任务失败:', error)
      throw error
    }
  }

  /**
   * 发布 WebSocket 消息
   */
  async publishWebSocketMessage(message: WebSocketMessage): Promise<void> {
    try {
      const routingKey = `ws.${message.type}.${message.target || 'all'}`

      await this.broker.publish(
        EXCHANGE_NAMES.REALTIME_FANOUT,
        routingKey,
        message,
        {
          persistent: false, // WebSocket 消息不需要持久化
          priority: 0,
          correlationId: message.id,
          timestamp: message.timestamp,
          headers: {
            messageType: message.type,
            target: message.target
          }
        }
      )

      console.log(`WebSocket消息已发布: ${message.type}`)
    } catch (error) {
      console.error('发布WebSocket消息失败:', error)
      throw error
    }
  }

  /**
   * 发布系统通知
   */
  async publishSystemNotification(notification: {
    type: string
    message: string
    data?: any
    recipients?: string[]
  }): Promise<void> {
    try {
      const routingKey = `notification.${notification.type}`

      await this.broker.publish(
        EXCHANGE_NAMES.EVENTS_TOPIC,
        routingKey,
        notification,
        {
          persistent: true,
          priority: 1,
          timestamp: new Date(),
          headers: {
            notificationType: notification.type,
            recipients: notification.recipients?.join(',') || 'all'
          }
        }
      )

      console.log(`系统通知已发布: ${notification.type}`)
    } catch (error) {
      console.error('发布系统通知失败:', error)
      throw error
    }
  }

  /**
   * 处理任务完成
   */
  private async handleTaskCompleted(taskResult: AIResultMessage): Promise<void> {
    // 发送 WebSocket 通知
    await this.publishWebSocketMessage({
      id: `task-complete-${taskResult.taskId}`,
      type: 'task_completed',
      target: `user:${taskResult.userId}`,
      data: {
        taskId: taskResult.taskId,
        result: taskResult.result
      },
      timestamp: new Date()
    })
  }

  /**
   * 处理任务失败
   */
  private async handleTaskFailed(taskResult: AIResultMessage): Promise<void> {
    // 发送 WebSocket 通知
    await this.publishWebSocketMessage({
      id: `task-failed-${taskResult.taskId}`,
      type: 'task_failed',
      target: `user:${taskResult.userId}`,
      data: {
        taskId: taskResult.taskId,
        error: taskResult.error
      },
      timestamp: new Date()
    })

    // 发送系统通知（如果是严重错误）
    if (taskResult.error && taskResult.error.severity === 'high') {
      await this.publishSystemNotification({
        type: 'critical_task_failure',
        message: `Critical AI task failure: ${taskResult.taskId}`,
        data: taskResult.error,
        recipients: ['admin']
      })
    }
  }

  /**
   * 处理任务进度
   */
  private async handleTaskProgress(taskResult: AIResultMessage): Promise<void> {
    // 发送 WebSocket 进度通知
    await this.publishWebSocketMessage({
      id: `task-progress-${taskResult.taskId}`,
      type: 'task_progress',
      target: `user:${taskResult.userId}`,
      data: {
        taskId: taskResult.taskId,
        progress: taskResult.progress
      },
      timestamp: new Date()
    })
  }

  /**
   * 重试消息
   */
  private async retryMessage(
    originalMessage: any,
    exchange: string,
    routingKey: string,
    retryCount: number
  ): Promise<void> {
    const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 30000) // 指数退避，最大30秒

    setTimeout(async () => {
      try {
        await this.broker.publish(
          exchange,
          routingKey,
          JSON.parse(originalMessage.content.toString()),
          {
            ...originalMessage.properties,
            headers: {
              ...originalMessage.properties.headers,
              retryCount
            }
          }
        )
      } catch (error) {
        console.error('重试消息发布失败:', error)
      }
    }, delayMs)
  }

  /**
   * 处理失败消息
   */
  private async handleFailedMessage(message: any, error: Error): Promise<void> {
    try {
      // 发送到死信队列
      await this.broker.publish(
        this.config.exchanges.deadLetter,
        'failed.message',
        {
          originalMessage: JSON.parse(message.content.toString()),
          error: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date()
          },
          originalProperties: message.properties,
          originalFields: message.fields
        },
        {
          persistent: true,
          timestamp: new Date(),
          headers: {
            originalQueue: message.fields.routingKey,
            errorType: error.constructor.name
          }
        }
      )

      console.log('失败消息已发送到死信队列')
    } catch (dlqError) {
      console.error('发送到死信队列失败:', dlqError)
    }
  }

  /**
   * 获取重试次数
   */
  private getRetryCount(message: any): number {
    return (message.properties.headers?.retryCount as number) || 0
  }

  /**
   * 映射优先级到数字
   */
  private mapPriorityToNumber(priority?: string): number {
    switch (priority) {
      case 'low': return MESSAGE_PROPERTIES.PRIORITY.LOW
      case 'normal': return MESSAGE_PROPERTIES.PRIORITY.NORMAL
      case 'high': return MESSAGE_PROPERTIES.PRIORITY.HIGH
      case 'urgent': return MESSAGE_PROPERTIES.PRIORITY.URGENT
      default: return MESSAGE_PROPERTIES.PRIORITY.NORMAL
    }
  }

  /**
   * 恢复订阅（重连后）
   */
  private async restoreSubscriptions(): Promise<void> {
    console.log('恢复队列订阅...')

    const subscriptionEntries = Array.from(this.subscriptions.entries())
    this.subscriptions.clear()

    for (const [name, subscription] of subscriptionEntries) {
      try {
        const newSubscription = await this.subscribe(
          subscription.queueName,
          subscription.handler,
          subscription.options
        )
        this.subscriptions.set(name, newSubscription)
        console.log(`恢复订阅成功: ${name}`)
      } catch (error) {
        console.error(`恢复订阅失败 [${name}]:`, error)
      }
    }
  }

  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionName: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionName)
    if (!subscription) {
      console.warn(`订阅不存在: ${subscriptionName}`)
      return
    }

    try {
      // 这里需要实现取消消费者的逻辑
      subscription.active = false
      this.subscriptions.delete(subscriptionName)
      console.log(`取消订阅成功: ${subscriptionName}`)
    } catch (error) {
      console.error(`取消订阅失败 [${subscriptionName}]:`, error)
      throw error
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    isInitialized: boolean
    brokerConnected: boolean
    activeSubscriptions: number
    subscriptions: string[]
  } {
    return {
      isInitialized: this.isInitialized,
      brokerConnected: this.broker.isConnected(),
      activeSubscriptions: this.subscriptions.size,
      subscriptions: Array.from(this.subscriptions.keys())
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('清理队列管理器资源...')

    // 取消所有订阅
    const subscriptionNames = Array.from(this.subscriptions.keys())
    for (const name of subscriptionNames) {
      await this.unsubscribe(name)
    }

    // 停止消息代理
    if (this.broker.isConnected()) {
      await this.broker.stop()
    }

    this.isInitialized = false
    console.log('队列管理器清理完成')
  }
}