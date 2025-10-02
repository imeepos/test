import { io, Socket } from 'socket.io-client'
import type { WebSocketStatus, AIGenerateRequest, AIGenerateResponse } from '@/types'
import { useNodeStore } from '@/stores/nodeStore'

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
  private heartbeatTimer: NodeJS.Timeout | null = null

  constructor(config: WebSocketConfig) {
    this.config = config
    console.log('🔧 WebSocket服务初始化:', {
      url: config.url,
      heartbeatInterval: config.heartbeatInterval,
      reconnectInterval: config.reconnectInterval
    })
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
          reconnection: true,
          reconnectionAttempts: this.config.maxReconnectAttempts,
          reconnectionDelay: this.config.reconnectInterval,
          reconnectionDelayMax: 10000,
          forceNew: false
          // Socket.IO 会使用服务端的心跳配置
        })

        // 监听所有发送的数据包
        this.socket.io.on('packet', (packet) => {
          console.log('📦 发送数据包:', packet)
        })

        // 监听 Socket.IO 引擎事件
        this.socket.io.engine?.on('packet', (packet: any) => {
          console.log('🔧 引擎数据包:', packet)
        })
        
        this.socket.on('connect', () => {
          console.log('✅ WebSocket已连接:', {
            socketId: this.socket!.id,
            transport: (this.socket!.io.engine as any)?.transport?.name
          })
          this.updateStatus('connected')
          this.reconnectAttempts = 0
          this.authenticate()
          this.processMessageQueue()
          // 移除自定义心跳，使用 Socket.IO 内置机制
          // this.startHeartbeat()

          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket断开连接:', reason)
          this.updateStatus('disconnected')
          // 移除自定义心跳停止
          // this.stopHeartbeat()

          // Socket.IO 会自动重连，除非是服务器主动断开
          if (reason === 'io server disconnect') {
            console.warn('服务器主动断开连接，需要手动重连')
          }
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket连接错误:', {
            error: error.message,
            attempts: this.reconnectAttempts,
            maxAttempts: this.config.maxReconnectAttempts
          })
          this.reconnectAttempts++

          if (this.currentStatus === 'connecting') {
            // 第一次连接失败
            if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
              reject(new Error('WebSocket连接失败: ' + error.message))
            }
          }
        })

        this.socket.on('authenticated', (data) => {
          console.log('✅ WebSocket认证成功:', data)
        })

        this.socket.on('error', (error) => {
          console.error('❌ WebSocket错误:', error)
        })

        // 监听重连事件
        this.socket.io.on('reconnect', (attempt) => {
          console.log('🔄 WebSocket重连成功，尝试次数:', attempt)
          this.reconnectAttempts = 0
        })

        this.socket.io.on('reconnect_attempt', (attempt) => {
          console.log('🔄 WebSocket尝试重连:', attempt)
          this.updateStatus('connecting')
        })

        this.socket.io.on('reconnect_error', (error) => {
          console.error('❌ WebSocket重连错误:', error.message)
        })

        this.socket.io.on('reconnect_failed', () => {
          console.error('❌ WebSocket重连失败，已达最大尝试次数')
          this.updateStatus('disconnected')
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
    // 移除自定义心跳停止
    // this.stopHeartbeat()

    if (this.socket) {
      this.socket.disconnect()
      this.socket.removeAllListeners()
      this.socket = null
    }

    this.updateStatus('disconnected')
    console.log('🔌 WebSocket已断开')
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
        requestId, // 确保payload中包含requestId
        taskId: requestId // 同时设置taskId，确保与Gateway兼容
      },
      timestamp: Date.now(),
    }

    if (!this.socket?.connected) {
      // 如果连接不可用，添加到队列
      this.messageQueue.push(message)
      console.log(`📥 消息已加入队列 (${this.messageQueue.length}条待发送):`, type)

      // 异步尝试重连，不阻塞当前请求
      if (this.currentStatus === 'disconnected') {
        this.connect().catch(err => {
          console.warn('后台重连失败:', err)
        })
      }

      // 返回一个 Promise，将在重连后处理
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingMessages.delete(requestId)
          reject(new Error('消息等待发送超时'))
        }, this.config.messageTimeout)

        this.pendingMessages.set(requestId, { resolve, reject, timeout })
      })
    }

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(requestId)
        reject(new Error('消息响应超时'))
      }, this.config.messageTimeout)

      this.pendingMessages.set(requestId, { resolve, reject, timeout })

      try {
        console.log(`📤 发送WebSocket消息:`, {
          type,
          requestId,
          payload: message.payload,
          socketConnected: this.socket?.connected,
          socketId: this.socket?.id
        })

        if (!this.socket) {
          throw new Error('Socket未初始化')
        }

        if (!this.socket.connected) {
          throw new Error('Socket未连接')
        }

        // 检查 socket 的详细状态
        const transport = (this.socket.io.engine as any)?.transport?.name
        console.log(`🔍 Socket详细状态:`, {
          connected: this.socket.connected,
          disconnected: this.socket.disconnected,
          active: this.socket.active,
          recovered: this.socket.recovered,
          transport: transport,
          readyState: (this.socket.io.engine as any)?.readyState
        })

        // 使用 emit 发送消息
        console.log(`🚀 准备发送事件:`, type, message.payload)

        // 尝试直接发送数据包
        const socket = this.socket
        const result = socket.emit(type, message.payload, (ack: any) => {
          console.log(`📨 收到ACK响应:`, ack)
        })

        console.log(`✅ emit调用完成:`, {
          type,
          result: typeof result,
          listeners: socket.listeners(type).length
        })
      } catch (error) {
        console.error(`❌ 发送消息失败:`, error)
        this.pendingMessages.delete(requestId)
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * AI内容生成请求
   */
  async generateContent(request: AIGenerateRequest & { nodeId?: string }): Promise<AIGenerateResponse> {
    // 自动注入 projectId（从 nodeStore 获取）
    const projectId = request.projectId || this.getCurrentProjectId()

    // 验证 projectId 是否存在
    if (!projectId) {
      throw new Error('请先选择或创建项目后再使用AI功能')
    }

    const enrichedRequest = {
      ...request,
      projectId,
      // 如果提供了nodeId，将它作为自定义标识符传递
      nodeId: request.nodeId
    }
    return this.sendMessage('AI_GENERATE_REQUEST', enrichedRequest)
  }

  /**
   * 获取当前项目ID
   */
  private getCurrentProjectId(): string | undefined {
    // 从 nodeStore 获取当前项目ID
    try {
      const nodeStore = useNodeStore.getState()
      return nodeStore.currentProjectId || undefined
    } catch (error) {
      console.warn('无法获取当前项目ID:', error)
      return undefined
    }
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
      console.log(`📥 收到WebSocket消息:`, { eventName, data })

      // 尝试获取requestId/taskId，优先使用requestId
      const requestId = data.requestId || data.taskId

      // 处理响应消息 - 匹配pending请求
      if (requestId && (eventName.endsWith('_RESPONSE') || eventName.endsWith('_ERROR') || eventName === 'ai_task_result')) {
        console.log(`🔍 匹配请求ID:`, {
          requestId,
          eventName,
          hasPending: this.pendingMessages.has(requestId),
          pendingKeys: Array.from(this.pendingMessages.keys())
        })

        if (this.pendingMessages.has(requestId)) {
          const pendingMessage = this.pendingMessages.get(requestId)!
          clearTimeout(pendingMessage.timeout)
          this.pendingMessages.delete(requestId)

          // 根据事件类型和状态判断成功或失败
          const isError = eventName.endsWith('_ERROR') ||
                          (eventName === 'ai_task_result' && data.status === 'failed')

          if (isError) {
            console.error(`❌ AI请求失败:`, data.error || data)
            const errorMsg = data.error?.message || data.error || data.message || '请求失败'
            pendingMessage.reject(new Error(errorMsg))
          } else {
            console.log(`✅ AI请求成功:`, data)
            // 对于ai_task_result，提取result字段
            const responseData = eventName === 'ai_task_result' && data.result ? data.result : data
            pendingMessage.resolve(responseData)
          }

          // 即使匹配了pending请求，仍然继续广播给订阅者
        }
      }

      // 处理广播消息 - 总是触发订阅处理器
      const handler = this.messageHandlers.get(eventName)
      if (handler) {
        const message: WebSocketMessage = {
          id: this.generateMessageId(),
          type: eventName,
          payload: data,
          timestamp: Date.now()
        }
        handler(message)
      } else if (!this.pendingMessages.has(requestId)) {
        // 只有在没有pending请求且没有订阅处理器时才警告
        console.log(`ℹ️ 收到未订阅的消息: ${eventName}`)
      }

      // Socket.IO 内置心跳不需要手动处理
      // 移除自定义 pong 处理

    } catch (error) {
      console.error('Socket.IO消息处理错误:', error)
    }
  }

  /**
   * 认证方法
   */
  private authenticate(): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket未连接，无法认证')
      return
    }

    // 从localStorage获取认证token
    const token = localStorage.getItem('auth_token')

    console.log('🔐 开始WebSocket认证...', {
      hasToken: !!token,
      socketId: this.socket.id
    })

    if (token) {
      // 使用真实用户token进行认证
      this.socket.emit('authenticate', {
        token
      })
    } else {
      // 没有token时使用guest用户
      this.socket.emit('authenticate', {
        userId: 'guest',
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

  // Socket.IO 自动重连机制已启用，移除手动重连逻辑

  private processMessageQueue(): void {
    console.log(`📤 开始处理消息队列 (${this.messageQueue.length}条消息)`)

    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift()!
      try {
        // 检查是否已有 pending handler (在 sendMessage 中创建的)
        if (this.pendingMessages.has(message.id)) {
          // 直接发送，使用已有的 Promise handler
          this.socket.emit(message.type, message.payload)
          console.log(`✅ 队列消息已发送: ${message.type}`)
        } else {
          // 为旧消息创建新的处理器
          const timeout = setTimeout(() => {
            this.pendingMessages.delete(message.id)
          }, this.config.messageTimeout)

          this.pendingMessages.set(message.id, {
            resolve: () => {}, // 旧消息的resolve会被忽略
            reject: () => {},  // 旧消息的reject会被忽略
            timeout
          })

          this.socket.emit(message.type, message.payload)
          console.log(`✅ 队列消息已发送(旧): ${message.type}`)
        }
      } catch (error) {
        console.error('队列消息发送失败:', error)
        // 重新加入队列头部
        this.messageQueue.unshift(message)
        break
      }
    }

    if (this.messageQueue.length === 0) {
      console.log('✅ 消息队列已清空')
    }
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 移除自定义心跳机制，使用 Socket.IO 内置心跳
  // Socket.IO 会自动发送 ping/pong，无需手动实现
}

// 默认配置
const defaultConfig: WebSocketConfig = {
  // 根据环境自动选择URL
  // 开发环境: 使用localhost:8000
  // 生产环境(Docker): 使用当前域名的8000端口
  url: import.meta.env.VITE_WS_URL || (() => {
    if (import.meta.env.PROD) {
      // 生产环境：使用当前域名替换端口为8000
      const { protocol, hostname } = window.location
      return `${protocol}//${hostname}:8000`
    }
    // 开发环境：使用localhost
    return 'http://localhost:8000'
  })(),
  reconnectInterval: 1000, // 1秒 (Socket.IO 会指数退避)
  maxReconnectAttempts: 10,
  heartbeatInterval: 25000, // 25秒 (与 Socket.IO pingInterval 保持一致)
  messageTimeout: 30000, // 30秒
}

// 单例实例
export const websocketService = new WebSocketService(defaultConfig)

// 导出类型和服务
export { WebSocketService }
export type { WebSocketConfig, WebSocketMessage }