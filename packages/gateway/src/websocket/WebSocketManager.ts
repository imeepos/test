import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import type {
  WebSocketConfig,
  AuthConfig
} from '../types/GatewayConfig'
import type {
  WebSocketEvent,
  WebSocketConnection,
  WebSocketEventType,
  WebSocketAuthPayload,
  AIProgressEvent,
  NodeOperationEvent,
  CanvasStateEvent
} from '../types/WebSocketTypes'

/**
 * WebSocket管理器 - 处理实时通信和连接管理
 */
export class WebSocketManager {
  private io: SocketIOServer
  private connections: Map<string, WebSocketConnection> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()
  private config: WebSocketConfig
  private authConfig?: AuthConfig
  private isStarted: boolean = false

  constructor(httpServer: HTTPServer, config: WebSocketConfig, authConfig?: AuthConfig) {
    this.config = config
    this.authConfig = authConfig

    // 初始化Socket.IO服务器
    this.io = new SocketIOServer(httpServer, {
      path: config.path,
      cors: {
        origin: '*', // 在生产环境中应该设置具体的域名
        methods: ['GET', 'POST']
      },
      compression: config.compression !== false,
      maxHttpBufferSize: 1e6, // 1MB
      pingTimeout: config.timeout,
      pingInterval: config.heartbeatInterval
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

      // 监听心跳
      socket.on('ping', () => {
        socket.emit('pong')
        this.updateConnectionActivity(socket.id)
      })

      // 监听AI处理请求
      socket.on(WebSocketEventType.AI_GENERATE_REQUEST, (data) => {
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
      let userId: string | undefined

      // 如果提供了认证配置，验证JWT token
      if (this.authConfig && data.token) {
        try {
          const decoded = jwt.verify(data.token, this.authConfig.secret) as any
          userId = decoded.sub || decoded.userId || decoded.id
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
    try {
      // 发送处理中状态
      socket.emit(WebSocketEventType.AI_GENERATE_PROGRESS, {
        requestId: data.requestId,
        stage: 'queued',
        progress: 0,
        message: 'Request queued for processing'
      } as AIProgressEvent)

      // TODO: 集成@sker/broker服务，将请求发送到消息队列
      // 这里暂时模拟异步处理
      setTimeout(() => {
        socket.emit(WebSocketEventType.AI_GENERATE_PROGRESS, {
          requestId: data.requestId,
          stage: 'processing',
          progress: 50,
          message: 'Processing with AI model'
        } as AIProgressEvent)

        setTimeout(() => {
          socket.emit(WebSocketEventType.AI_GENERATE_RESPONSE, {
            requestId: data.requestId,
            content: 'Generated content based on inputs',
            title: 'AI Generated Title',
            confidence: 0.85,
            tags: ['ai-generated'],
            metadata: {
              requestId: data.requestId,
              model: 'gpt-4',
              processingTime: 2000,
              tokenCount: 150
            }
          })
        }, 1000)
      }, 500)

    } catch (error) {
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
  sendToUser(userId: string, type: string, payload: any): void {
    const userConnections = this.userConnections.get(userId)
    if (!userConnections) {
      return
    }

    const event: WebSocketEvent = {
      type,
      payload,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    userConnections.forEach(socketId => {
      const connection = this.connections.get(socketId)
      if (connection && connection.connected) {
        connection.socket.emit(type, payload)
      }
    })
  }

  /**
   * 广播消息给所有连接
   */
  broadcast(type: string, payload: any): void {
    const event: WebSocketEvent = {
      type,
      payload,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    this.io.emit(type, payload)
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