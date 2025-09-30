import { io, Socket } from 'socket.io-client'
import type { WebSocketStatus, AIGenerateRequest, AIGenerateResponse } from '@/types'

interface WebSocketMessage {
  id: string
  type: string
  payload: any
  timestamp: number
}

interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  messageTimeout: number
}

type MessageHandler = (message: WebSocketMessage) => void
type StatusHandler = (status: WebSocketStatus) => void

class WebSocketService {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private messageQueue: WebSocketMessage[] = []
  private pendingMessages: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map()
  private messageHandlers: Map<string, MessageHandler> = new Map()
  private statusHandlers: Set<StatusHandler> = new Set()
  private reconnectAttempts: number = 0
  private currentStatus: WebSocketStatus = 'disconnected'

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  /**
   * 连接WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.updateStatus('connecting')
      
      try {
        this.socket = io(this.config.url, {
          autoConnect: false,
          timeout: this.config.messageTimeout,
          retries: this.config.maxReconnectAttempts,
          forceNew: true
        })
        
        this.socket.on('connect', () => {
          this.updateStatus('connected')
          this.reconnectAttempts = 0
          this.authenticate()
          this.processMessageQueue()
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          this.updateStatus('disconnected')
          
          if (reason === 'io server disconnect') {
            // 服务器断开连接，需要手动重连
            if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
              this.scheduleReconnect()
            }
          }
        })

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO连接错误:', error)
          if (this.currentStatus === 'connecting') {
            reject(new Error('Socket.IO连接失败'))
          }
        })

        this.socket.on('authenticated', () => {
          console.log('Socket.IO认证成功')
        })

        this.socket.on('error', (error) => {
          console.error('Socket.IO错误:', error)
        })

        // 监听响应消息
        this.socket.onAny((eventName, data) => {
          this.handleMessage(eventName, data)
        })

        this.socket.connect()

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.updateStatus('disconnected')
  }

  /**
   * 发送消息
   */
  async sendMessage(type: string, payload: any): Promise<any> {
    const requestId = this.generateMessageId()
    const message: WebSocketMessage = {
      id: requestId,
      type,
      payload: {
        ...payload,
        requestId // 确保payload中包含requestId
      },
      timestamp: Date.now(),
    }

    if (!this.socket?.connected) {
      // 如果连接不可用，添加到队列
      this.messageQueue.push(message)
      
      // 尝试重连
      if (this.currentStatus === 'disconnected') {
        await this.connect()
      }
      
      return Promise.reject(new Error('Socket.IO未连接'))
    }

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(requestId)
        reject(new Error('消息响应超时'))
      }, this.config.messageTimeout)

      this.pendingMessages.set(requestId, { resolve, reject, timeout })
      
      try {
        this.socket!.emit(type, message.payload)
      } catch (error) {
        this.pendingMessages.delete(requestId)
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * AI内容生成请求
   */
  async generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    return this.sendMessage('AI_GENERATE_REQUEST', request)
  }

  /**
   * 订阅消息类型
   */
  subscribe(messageType: string, handler: MessageHandler): () => void {
    this.messageHandlers.set(messageType, handler)
    
    // 返回取消订阅函数
    return () => {
      this.messageHandlers.delete(messageType)
    }
  }

  /**
   * 订阅连接状态变化
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    
    // 立即触发当前状态
    handler(this.currentStatus)
    
    // 返回取消订阅函数
    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): WebSocketStatus {
    return this.currentStatus
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo() {
    return {
      status: this.currentStatus,
      reconnectAttempts: this.reconnectAttempts,
      queueLength: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
    }
  }

  // 私有方法
  private handleMessage(eventName: string, data: any): void {
    try {
      // 处理响应消息
      if (eventName.endsWith('_RESPONSE') || eventName.endsWith('_ERROR')) {
        // 根据requestId匹配对应的请求
        const requestId = data.requestId || data.taskId
        if (requestId && this.pendingMessages.has(requestId)) {
          const pendingMessage = this.pendingMessages.get(requestId)!
          clearTimeout(pendingMessage.timeout)
          this.pendingMessages.delete(requestId)
          
          if (eventName.endsWith('_ERROR')) {
            pendingMessage.reject(new Error(data.error?.message || data.error || '请求失败'))
          } else {
            pendingMessage.resolve(data)
          }
          return
        } else {
          console.warn(`收到响应消息但找不到对应的请求: ${eventName}, requestId: ${requestId}`)
        }
      }

      // 处理广播消息
      const handler = this.messageHandlers.get(eventName)
      if (handler) {
        const message: WebSocketMessage = {
          id: this.generateMessageId(),
          type: eventName,
          payload: data,
          timestamp: Date.now()
        }
        handler(message)
      }

      // 处理心跳响应
      if (eventName === 'pong') {
        console.log('Socket.IO心跳正常')
      }
      
    } catch (error) {
      console.error('Socket.IO消息处理错误:', error)
    }
  }

  /**
   * 认证方法
   */
  private authenticate(): void {
    if (this.socket) {
      this.socket.emit('authenticate', {
        userId: 'guest', // 临时使用guest用户
        token: null
      })
    }
  }

  private updateStatus(status: WebSocketStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status
      
      // 通知所有状态监听器
      this.statusHandlers.forEach(handler => {
        try {
          handler(status)
        } catch (error) {
          console.error('状态处理器执行错误:', error)
        }
      })
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // 最大30秒
    )

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`)
    
    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('重连失败:', error)
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect()
        } else {
          console.error('达到最大重连次数，停止重连')
        }
      }
    }, delay)
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift()!
      try {
        // 为队列中的消息重新设置Promise处理器
        const timeout = setTimeout(() => {
          this.pendingMessages.delete(message.id)
        }, this.config.messageTimeout)

        // 重新创建Promise处理器（如果还没有的话）
        if (!this.pendingMessages.has(message.id)) {
          this.pendingMessages.set(message.id, {
            resolve: () => {}, // 队列消息的resolve会被忽略
            reject: () => {},  // 队列消息的reject会被忽略
            timeout
          })
        }

        this.socket.emit(message.type, message.payload)
      } catch (error) {
        console.error('队列消息发送失败:', error)
        // 重新加入队列头部
        this.messageQueue.unshift(message)
        break
      }
    }
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 默认配置
const defaultConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  reconnectInterval: 2000, // 2秒
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000, // 30秒
  messageTimeout: 30000, // 30秒
}

// 单例实例
export const websocketService = new WebSocketService(defaultConfig)

// 导出类型和服务
export { WebSocketService }
export type { WebSocketConfig, WebSocketMessage }