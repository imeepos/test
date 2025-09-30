import amqp from 'amqplib'
import { EventEmitter } from 'events'
import type { BrokerConfig } from '../types/BrokerConfig'

/**
 * 连接管理器 - 管理RabbitMQ连接的建立、维护和重连
 */
export class ConnectionManager extends EventEmitter {
  private config: BrokerConfig
  private connection: amqp.Connection | null = null
  private isConnecting: boolean = false
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10

  constructor(config: BrokerConfig) {
    super()
    this.config = config
    
    // 【调试日志5】ConnectionManager构造函数接收到的配置
    console.log('🔍 ConnectionManager 构造配置:')
    console.log(`   connectionUrl: ${config.connectionUrl}`)
    console.log(`   connectionOptions:`, JSON.stringify(config.connectionOptions, null, 2))
    console.log(`   retry:`, JSON.stringify(config.retry, null, 2))
  }

  /**
   * 建立连接
   */
  async connect(): Promise<void> {
    if (this.connection || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      // 【调试日志6】连接尝试时的详细信息
      console.log('🔍 正在尝试连接RabbitMQ:')
      console.log(`   connectionUrl: ${this.config.connectionUrl}`)
      console.log(`   connectionOptions:`, JSON.stringify(this.config.connectionOptions || {}, null, 2))
      
      console.log('Connecting to RabbitMQ...')

      this.connection = await amqp.connect(
        this.config.connectionUrl,
        this.config.connectionOptions || {}
      )

      this.setupConnectionEventHandlers()
      this.isConnecting = false
      this.reconnectAttempts = 0

      console.log('Connected to RabbitMQ successfully')
      this.emit('connected')

    } catch (error) {
      this.isConnecting = false
      console.error('Failed to connect to RabbitMQ:', error)
      this.emit('error', error)

      // 尝试重连
      this.scheduleReconnect()
      throw error
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connection) {
      try {
        await this.connection.close()
      } catch (error) {
        console.error('Error closing connection:', error)
      }
      this.connection = null
    }

    this.emit('disconnected')
    console.log('Disconnected from RabbitMQ')
  }

  /**
   * 设置连接事件处理器
   */
  private setupConnectionEventHandlers(): void {
    if (!this.connection) {
      return
    }

    this.connection.on('close', () => {
      console.log('RabbitMQ connection closed')
      this.connection = null
      this.emit('disconnected')

      // 尝试重连
      this.scheduleReconnect()
    })

    this.connection.on('error', (error) => {
      console.error('RabbitMQ connection error:', error)
      this.emit('error', error)
    })

    this.connection.on('blocked', (reason) => {
      console.warn('RabbitMQ connection blocked:', reason)
      this.emit('blocked', reason)
    })

    this.connection.on('unblocked', () => {
      console.log('RabbitMQ connection unblocked')
      this.emit('unblocked')
    })
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.emit('maxReconnectAttemptsReached')
      }
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000) // 指数退避，最大30秒

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null

      try {
        await this.connect()
        this.emit('reconnected')
      } catch (error) {
        // connect方法已经处理了错误和重连调度
      }
    }, delay)
  }

  /**
   * 获取连接实例
   */
  getConnection(): amqp.Connection | null {
    return this.connection
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connection !== null && !this.isConnecting
  }

  /**
   * 获取连接统计信息
   */
  getStats() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasReconnectTimer: this.reconnectTimer !== null
    }
  }
}