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
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private messageQueue: WebSocketMessage[] = []
  private pendingMessages: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map()
  private messageHandlers: Map<string, MessageHandler> = new Map()
  private statusHandlers: Set<StatusHandler> = new Set()
  private reconnectAttempts: number = 0
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private currentStatus: WebSocketStatus = 'disconnected'

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  /**
   * 连接WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.updateStatus('connecting')
      
      try {
        this.ws = new WebSocket(this.config.url)
        
        this.ws.onopen = () => {
          this.updateStatus('connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          this.updateStatus('disconnected')
          this.stopHeartbeat()
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          if (this.currentStatus === 'connecting') {
            reject(new Error('WebSocket连接失败'))
          }
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.updateStatus('disconnected')
  }

  /**
   * 发送消息
   */
  async sendMessage(type: string, payload: any): Promise<any> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: Date.now(),
    }

    if (this.ws?.readyState !== WebSocket.OPEN) {
      // 如果连接不可用，添加到队列
      this.messageQueue.push(message)
      
      // 尝试重连
      if (this.currentStatus === 'disconnected') {
        await this.connect()
      }
      
      return Promise.reject(new Error('WebSocket未连接'))
    }

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(message.id)
        reject(new Error('消息响应超时'))
      }, this.config.messageTimeout)

      this.pendingMessages.set(message.id, { resolve, reject, timeout })
      
      try {
        this.ws!.send(JSON.stringify(message))
      } catch (error) {
        this.pendingMessages.delete(message.id)
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
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      // 处理响应消息
      if (message.type.endsWith('_RESPONSE') || message.type.endsWith('_ERROR')) {
        const pendingMessage = this.pendingMessages.get(message.id)
        if (pendingMessage) {
          clearTimeout(pendingMessage.timeout)
          this.pendingMessages.delete(message.id)
          
          if (message.type.endsWith('_ERROR')) {
            pendingMessage.reject(new Error(message.payload.error || '请求失败'))
          } else {
            pendingMessage.resolve(message.payload)
          }
          return
        }
      }

      // 处理广播消息
      const handler = this.messageHandlers.get(message.type)
      if (handler) {
        handler(message)
      }

      // 处理心跳响应
      if (message.type === 'PONG') {
        console.log('WebSocket心跳正常')
      }
      
    } catch (error) {
      console.error('WebSocket消息解析错误:', error)
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
    if (this.reconnectTimer) return

    this.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // 最大30秒
    )

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`)
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
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
    }, delay) as any
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          id: this.generateMessageId(),
          type: 'PING',
          payload: {},
          timestamp: Date.now(),
        }))
      }
    }, this.config.heartbeatInterval) as any
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!
      try {
        this.ws.send(JSON.stringify(message))
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
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/socket.io',
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