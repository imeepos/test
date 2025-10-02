import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { EventEmitter } from 'events'
import jwt from 'jsonwebtoken'
import type {
  WebSocketConfig,
  AuthConfig
} from '../types/GatewayConfig.js'
import type {
  WebSocketEvent,
  WebSocketConnection,
  WebSocketAuthPayload,
  AIProgressEvent,
  NodeOperationEvent,
  CanvasStateEvent
} from '../types/WebSocketTypes.js'
import { WebSocketEventType } from '../types/WebSocketTypes.js'

/**
 * WebSocket管理器 - 处理实时通信和连接管理
 */
export class WebSocketManager extends EventEmitter {
  private io: SocketIOServer
  private connections: Map<string, WebSocketConnection> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()
  private config: WebSocketConfig
  private authConfig?: AuthConfig
  private isStarted: boolean = false

  constructor(httpServer: HTTPServer, config: WebSocketConfig, authConfig?: AuthConfig) {
    super()
    this.config = config
    this.authConfig = authConfig

    // 初始化Socket.IO服务器
    this.io = new SocketIOServer(httpServer, {
      path: config.path,
      cors: {
        origin: '*', // 在生产环境中应该设置具体的域名
        methods: ['GET', 'POST']
      },
      maxHttpBufferSize: 1e6, // 1MB
      // 心跳配置
      pingTimeout: 60000, // 60秒 ping 超时
      pingInterval: 25000, // 25秒发送一次 ping
      // 允许升级到 WebSocket
      allowUpgrades: true,
      transports: ['polling', 'websocket']
    })

    console.log('🔧 WebSocket服务器初始化:', {
      path: config.path,
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`WebSocket connection attempt: ${socket.id}`)

      // 设置认证超时
      const authTimeout = setTimeout(() => {
        if (!this.connections.has(socket.id)) {
          socket.emit('error', {
            code: 'AUTH_TIMEOUT',
            message: 'Authentication timeout'
          })
          socket.disconnect()
        }
      }, 10000) // 10秒认证超时

      // 监听认证事件
      socket.on('authenticate', async (data: WebSocketAuthPayload) => {
        clearTimeout(authTimeout)
        await this.handleAuthentication(socket, data)
      })

      // 监听断开连接
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket.id, reason)
      })

      // Socket.IO 内置心跳机制已启用，移除自定义 ping/pong
      // Socket.IO 会自动处理 ping/pong，无需手动监听

      // 监听所有事件用于调试（生产环境应移除或减少日志）
      socket.onAny((eventName, ...args) => {
        // 过滤掉 Socket.IO 内部事件，减少日志噪音
        if (!['ping', 'pong'].includes(eventName)) {
          console.log(`📨 WebSocket收到事件: ${eventName}`, args)
        }
      })

      // 监听AI处理请求
      socket.on(WebSocketEventType.AI_GENERATE_REQUEST, (data) => {
        console.log(`🎯 收到AI生成请求:`, data)
        this.handleAIGenerateRequest(socket, data)
      })

      // 监听节点操作事件
      socket.on(WebSocketEventType.NODE_CREATED, (data) => {
        this.broadcastToRoom(`project:${data.projectId}`, WebSocketEventType.NODE_CREATED, data)
      })

      socket.on(WebSocketEventType.NODE_UPDATED, (data) => {
        this.broadcastToRoom(`project:${data.projectId}`, WebSocketEventType.NODE_UPDATED, data)
      })

      socket.on(WebSocketEventType.NODE_DELETED, (data) => {
        this.broadcastToRoom(`project:${data.projectId}`, WebSocketEventType.NODE_DELETED, data)
      })

      // 监听画布状态变化
      socket.on(WebSocketEventType.CANVAS_STATE_CHANGED, (data) => {
        this.handleCanvasStateChange(socket, data)
      })

      // 监听订阅/取消订阅
      socket.on('subscribe', (channel: string) => {
        this.subscribeToChannel(socket, channel)
      })

      socket.on('unsubscribe', (channel: string) => {
        this.unsubscribeFromChannel(socket, channel)
      })
    })
  }

  /**
   * 处理认证
   */
  private async handleAuthentication(socket: any, data: WebSocketAuthPayload): Promise<void> {
    try {
      // 检查是否已经认证过
      if (this.connections.has(socket.id)) {
        console.warn(`⚠️ Socket ${socket.id} 重复认证，忽略`)
        return
      }

      let userId: string | undefined

      // 如果提供了认证配置，验证JWT token
      if (this.authConfig && data.token) {
        try {
          const decoded = jwt.verify(data.token, this.authConfig.secret) as any
          console.log('🔑 JWT 解码内容:', decoded)
          userId = decoded.sub || decoded.userId || decoded.id
          console.log('🔑 提取的 userId:', userId)
        } catch (error) {
          socket.emit('error', {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token'
          })
          socket.disconnect()
          return
        }
      } else {
        // 如果没有认证配置，使用提供的userId
        userId = data.userId
        console.log('🔑 使用提供的 userId:', userId)
      }

      // 检查连接数限制
      if (this.config.maxConnections && this.connections.size >= this.config.maxConnections) {
        socket.emit('error', {
          code: 'CONNECTION_LIMIT_EXCEEDED',
          message: 'Maximum connections exceeded'
        })
        socket.disconnect()
        return
      }

      // 创建连接记录
      const connection: WebSocketConnection = {
        id: socket.id,
        socket,
        userId,
        connected: true,
        connectedAt: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set()
      }

      this.connections.set(socket.id, connection)

      // 维护用户连接映射
      if (userId) {
        if (!this.userConnections.has(userId)) {
          this.userConnections.set(userId, new Set())
        }
        this.userConnections.get(userId)!.add(socket.id)
      }

      // 发送认证成功消息
      socket.emit('authenticated', {
        connectionId: socket.id,
        userId,
        timestamp: new Date()
      })

      console.log(`WebSocket authenticated: ${socket.id} (User: ${userId})`)

    } catch (error) {
      console.error('WebSocket authentication error:', error)
      socket.emit('error', {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      })
      socket.disconnect()
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(socketId: string, reason: string): void {
    const connection = this.connections.get(socketId)
    if (!connection) {
      return
    }

    // 从用户连接映射中移除
    if (connection.userId) {
      const userConnections = this.userConnections.get(connection.userId)
      if (userConnections) {
        userConnections.delete(socketId)
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId)
        }
      }
    }

    // 移除连接记录
    this.connections.delete(socketId)

    console.log(`WebSocket disconnected: ${socketId} (Reason: ${reason})`)
  }

  /**
   * 更新连接活动时间
   */
  private updateConnectionActivity(socketId: string): void {
    const connection = this.connections.get(socketId)
    if (connection) {
      connection.lastActivity = new Date()
    }
  }

  /**
   * 处理AI生成请求
   */
  private async handleAIGenerateRequest(socket: any, data: any): Promise<void> {
    const connection = this.connections.get(socket.id)
    if (!connection) {
      socket.emit(WebSocketEventType.AI_GENERATE_ERROR, {
        requestId: data.requestId,
        error: {
          code: 'CONNECTION_NOT_FOUND',
          message: 'WebSocket connection not found',
          timestamp: new Date()
        }
      })
      return
    }

    try {
      // 发送处理中状态
      socket.emit(WebSocketEventType.AI_GENERATE_PROGRESS, {
        requestId: data.requestId,
        stage: 'queued',
        progress: 0,
        message: 'Request queued for processing'
      } as AIProgressEvent)

      // 构造AI任务消息
      const taskMessage = {
        taskId: data.requestId || this.generateEventId(),
        type: data.type || 'generate',
        inputs: data.inputs || [],
        context: data.context,
        instruction: data.instruction,
        nodeId: data.nodeId,
        projectId: data.projectId,
        userId: connection.userId,
        priority: data.priority || 'normal',
        timestamp: new Date(),
        metadata: {
          socketId: socket.id,
          originalData: data
        }
      }

      // 触发AI任务发布事件，让Gateway的QueueManager处理
      this.emit('aiTaskRequest', taskMessage)

      console.log(`AI任务请求已接收: ${taskMessage.taskId}, 用户: ${connection.userId}`)

    } catch (error) {
      console.error('处理AI生成请求失败:', error)
      socket.emit(WebSocketEventType.AI_GENERATE_ERROR, {
        requestId: data.requestId,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'AI processing failed',
          timestamp: new Date()
        }
      })
    }
  }

  /**
   * 处理画布状态变化
   */
  private handleCanvasStateChange(socket: any, data: CanvasStateEvent): void {
    const connection = this.connections.get(socket.id)
    if (!connection) {
      return
    }

    // 广播给同一项目的其他用户
    if (data.projectId) {
      this.broadcastToRoom(
        `project:${data.projectId}`,
        WebSocketEventType.CANVAS_STATE_CHANGED,
        {
          ...data,
          userId: connection.userId,
          timestamp: new Date()
        },
        socket.id // 排除发送者
      )
    }
  }

  /**
   * 订阅频道
   */
  private subscribeToChannel(socket: any, channel: string): void {
    const connection = this.connections.get(socket.id)
    if (!connection) {
      return
    }

    connection.subscriptions.add(channel)
    socket.join(channel)

    socket.emit('subscribed', {
      channel,
      timestamp: new Date()
    })

    console.log(`Socket ${socket.id} subscribed to ${channel}`)
  }

  /**
   * 取消订阅频道
   */
  private unsubscribeFromChannel(socket: any, channel: string): void {
    const connection = this.connections.get(socket.id)
    if (!connection) {
      return
    }

    connection.subscriptions.delete(channel)
    socket.leave(channel)

    socket.emit('unsubscribed', {
      channel,
      timestamp: new Date()
    })

    console.log(`Socket ${socket.id} unsubscribed from ${channel}`)
  }

  /**
   * 广播消息到房间
   */
  broadcastToRoom(room: string, type: string, payload: any, excludeSocketId?: string): void {
    const event: WebSocketEvent = {
      type,
      payload,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(type, payload)
    } else {
      this.io.to(room).emit(type, payload)
    }
  }

  /**
   * 发送消息给特定用户
   */
  sendToUser(userId: string, message: { type: string, data?: any }): void {
    const userConnections = this.userConnections.get(userId)
    if (!userConnections) {
      console.warn(`用户 ${userId} 没有活跃连接`)
      return
    }

    const event: WebSocketEvent = {
      type: message.type,
      payload: message.data,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    userConnections.forEach(socketId => {
      const connection = this.connections.get(socketId)
      if (connection && connection.connected) {
        connection.socket.emit(message.type, message.data || {})
      }
    })

    console.log(`消息已发送给用户 ${userId}: ${message.type}`)
  }

  /**
   * 发送消息给项目成员
   */
  sendToProject(projectId: string, message: { type: string, data?: any }): void {
    this.broadcastToRoom(`project:${projectId}`, message.type, message.data)
  }

  /**
   * 广播消息给所有连接
   */
  broadcast(message: { type: string, data?: any }): void {
    const event: WebSocketEvent = {
      type: message.type,
      payload: message.data,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    this.io.emit(message.type, message.data || {})
    console.log(`广播消息: ${message.type}`)
  }

  /**
   * 启动WebSocket管理器
   */
  start(): void {
    if (this.isStarted) {
      return
    }

    this.isStarted = true

    // 启动定期清理任务
    this.startCleanupTasks()

    console.log('WebSocket Manager started')
  }

  /**
   * 停止WebSocket管理器
   */
  stop(): void {
    if (!this.isStarted) {
      return
    }

    // 断开所有连接
    this.connections.forEach(connection => {
      connection.socket.disconnect()
    })

    this.connections.clear()
    this.userConnections.clear()

    this.isStarted = false
    console.log('WebSocket Manager stopped')
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.size
  }

  /**
   * 获取用户连接数量
   */
  getUserConnectionCount(): number {
    return this.userConnections.size
  }

  /**
   * 获取连接统计信息
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedUsers: this.userConnections.size,
      averageConnectionTime: this.calculateAverageConnectionTime(),
      isStarted: this.isStarted
    }
  }

  /**
   * 启动清理任务
   */
  private startCleanupTasks(): void {
    // 每分钟清理一次超时连接
    setInterval(() => {
      this.cleanupTimeoutConnections()
    }, 60000)
  }

  /**
   * 清理超时连接
   */
  private cleanupTimeoutConnections(): void {
    const now = new Date()
    const timeoutMs = this.config.timeout

    this.connections.forEach((connection, socketId) => {
      const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime()

      if (timeSinceLastActivity > timeoutMs) {
        console.log(`Cleaning up timeout connection: ${socketId}`)
        connection.socket.disconnect()
        this.handleDisconnection(socketId, 'timeout')
      }
    })
  }

  /**
   * 计算平均连接时间
   */
  private calculateAverageConnectionTime(): number {
    if (this.connections.size === 0) {
      return 0
    }

    const now = new Date()
    let totalTime = 0

    this.connections.forEach(connection => {
      totalTime += now.getTime() - connection.connectedAt.getTime()
    })

    return totalTime / this.connections.size
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}