import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import type { GatewayConfig } from '../types/GatewayConfig.js'
import { ApiRouter } from '../router/ApiRouter.js'
import { WebSocketManager } from '../websocket/WebSocketManager.js'
import { ErrorHandler } from '../middleware/ErrorHandler.js'
import { AuthMiddleware } from '../middleware/AuthMiddleware.js'
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js'
import { RequestEnhancer } from '../middleware/RequestEnhancer.js'
import { QueueManager } from '../messaging/QueueManager.js'
import {
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS
} from '@sker/models'
import type { AIEngine } from '@sker/engine'
import { StoreClient } from '@sker/store-client'
import { MessageBroker } from '@sker/broker'

/**
 * Gateway服务器 - 统一的API网关和WebSocket管理
 */
export class GatewayServer {
  private app: express.Application
  private server: any
  private apiRouter: ApiRouter
  private wsManager: WebSocketManager
  private queueManager?: QueueManager
  private config: GatewayConfig
  private isRunning: boolean = false

  constructor(
    config: GatewayConfig,
    dependencies?: {
      aiEngine?: AIEngine
      storeClient?: StoreClient
      messageBroker?: MessageBroker
    }
  ) {
    this.config = config
    this.app = express()
    this.server = createServer(this.app)

    // 初始化队列管理器
    if (dependencies?.messageBroker) {
      this.queueManager = new QueueManager(dependencies.messageBroker, {
        exchanges: {
          aiTasks: EXCHANGE_NAMES.LLM_DIRECT,
          websocket: EXCHANGE_NAMES.REALTIME_FANOUT,
          system: EXCHANGE_NAMES.EVENTS_TOPIC,
          deadLetter: 'dlx.direct'
        },
        queues: {
          aiTaskResults: QUEUE_NAMES.AI_RESULTS,
          websocketBroadcast: QUEUE_NAMES.EVENTS_WEBSOCKET,
          systemNotifications: QUEUE_NAMES.EVENTS_STORAGE,
          deadLetterQueue: 'dlx.queue'
        },
        routingKeys: {
          aiTask: {
            request: ROUTING_KEYS.AI_PROCESS,
            result: ROUTING_KEYS.AI_RESULT,
            progress: ROUTING_KEYS.TASK_STATUS
          },
          websocket: {
            broadcast: ROUTING_KEYS.NODE_UPDATED,
            userMessage: ROUTING_KEYS.NODE_UPDATED,
            systemMessage: ROUTING_KEYS.PROJECT_UPDATED
          },
          system: {
            notification: ROUTING_KEYS.AI_TASK_COMPLETED,
            alert: ROUTING_KEYS.AI_TASK_FAILED,
            maintenance: ROUTING_KEYS.TASK_STATUS
          }
        }
      })
    }

    this.apiRouter = new ApiRouter({
      ...dependencies,
      queueManager: this.queueManager
    })
    this.wsManager = new WebSocketManager(this.server, config.websocket, config.auth)

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
    this.setupQueueEventHandlers()
    this.setupWebSocketEventHandlers()
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 信任代理（如果在负载均衡器后面）
    if (this.config.security.trustProxy) {
      this.app.set('trust proxy', 1)
    }

    // 安全中间件
    if (this.config.security.helmet) {
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }))
    }

    // 压缩中间件
    if (this.config.security.compression) {
      this.app.use(compression())
    }

    // CORS中间件
    this.app.use(cors(this.config.cors))

    // 解析请求体
    this.app.use(express.json({
      limit: this.config.security.bodyLimit || '10mb'
    }))
    this.app.use(express.urlencoded({
      extended: true,
      limit: this.config.security.bodyLimit || '10mb'
    }))

    // 限流中间件（开发环境可禁用）
    if (this.config.rateLimit.enabled !== false) {
      const limiter = rateLimit(this.config.rateLimit)
      this.app.use(limiter as any)
      console.log('✅ 限流中间件已启用')
    } else {
      console.log('⚠️  限流中间件已禁用（开发环境）')
    }

    // 请求增强中间件（添加requestId等）
    this.app.use(RequestEnhancer.enhance())

    // 认证中间件（排除健康检查等公共端点）
    // 支持 /api 和 /api/v1 两种路径
    const authMiddleware = AuthMiddleware.authenticate(this.config.auth, {
      exclude: [
        '/health',
        '/status',
        '/users/auth/login',
        '/users/auth/register',
        '/users/auth/refresh',
        '/users/auth/request-reset',
        '/users/auth/reset-password'
      ]
    })
    this.app.use('/api', authMiddleware)
    this.app.use('/api/v1', authMiddleware)

    // 请求验证中间件
    const validationMiddleware = ValidationMiddleware.validate()
    this.app.use('/api', validationMiddleware)
    this.app.use('/api/v1', validationMiddleware)
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      })
    })

    // API路由 - 同时支持 /api 和 /api/v1 两种路径
    this.app.use('/api', this.apiRouter.getRouter())
    this.app.use('/api/v1', this.apiRouter.getRouter())

    // 静态文件服务（如果需要）
    this.app.use('/static', express.static('public'))

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          timestamp: new Date(),
          requestId: (req as any).requestId
        }
      })
    })
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    this.app.use(ErrorHandler.handle())
  }

  /**
   * 设置队列事件处理器
   */
  private setupQueueEventHandlers(): void {
    if (!this.queueManager) return

    // 处理AI任务结果
    this.queueManager.on('aiTaskResult', (taskResult, metadata) => {
      console.log(`转发AI任务结果到WebSocket: ${taskResult.taskId}`)

      // 根据任务状态发送不同的WebSocket消息
      if (taskResult.status === 'completed' && taskResult.result) {
        // 发送成功的AI生成结果，同时包含requestId和taskId
        this.wsManager.sendToUser(taskResult.userId, {
          type: 'AI_GENERATE_RESPONSE',
          data: {
            requestId: taskResult.taskId,
            taskId: taskResult.taskId,
            ...taskResult.result
          }
        })
      } else if (taskResult.status === 'failed') {
        // 发送AI处理错误，同时包含requestId和taskId
        this.wsManager.sendToUser(taskResult.userId, {
          type: 'AI_GENERATE_ERROR',
          data: {
            requestId: taskResult.taskId,
            taskId: taskResult.taskId,
            error: taskResult.error || {
              code: 'AI_PROCESSING_FAILED',
              message: 'AI processing failed',
              timestamp: new Date()
            }
          }
        })
      } else if (taskResult.status === 'progress') {
        // 发送处理进度，同时包含requestId和taskId
        this.wsManager.sendToUser(taskResult.userId, {
          type: 'AI_GENERATE_PROGRESS',
          data: {
            requestId: taskResult.taskId,
            taskId: taskResult.taskId,
            stage: 'processing',
            progress: taskResult.progress || 50,
            message: taskResult.message || 'Processing...'
          }
        })
      }

      // 同时发送通用的任务结果消息（供queueService使用）
      this.wsManager.sendToUser(taskResult.userId, {
        type: 'ai_task_result',
        data: taskResult
      })
    })

    // 处理WebSocket广播消息
    this.queueManager.on('websocketBroadcast', (message, metadata) => {
      console.log(`处理WebSocket广播消息: ${message.type}`)

      // 根据消息目标进行广播
      if (message.target === 'all') {
        this.wsManager.broadcast(message)
      } else if (message.target.startsWith('user:')) {
        const userId = message.target.replace('user:', '')
        this.wsManager.sendToUser(userId, message)
      } else if (message.target.startsWith('project:')) {
        const projectId = message.target.replace('project:', '')
        this.wsManager.sendToProject(projectId, message)
      }
    })

    // 处理系统通知
    this.queueManager.on('systemNotification', (notification, metadata) => {
      console.log(`处理系统通知: ${notification.type}`)

      // 发送系统通知给管理员或相关用户
      if (notification.recipients) {
        notification.recipients.forEach((recipient: string) => {
          this.wsManager.sendToUser(recipient, {
            type: 'system_notification',
            data: notification
          })
        })
      }
    })

    // 处理broker连接事件
    this.queueManager.on('brokerConnected', () => {
      console.log('消息代理已连接')
    })

    this.queueManager.on('brokerDisconnected', () => {
      console.log('消息代理已断开')
    })

    this.queueManager.on('brokerError', (error) => {
      console.error('消息代理错误:', error)
    })
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketEventHandlers(): void {
    if (!this.queueManager) {
      console.warn('QueueManager未初始化，跳过WebSocket事件处理器设置')
      return
    }

    // 处理来自WebSocket的AI任务请求
    this.wsManager.on('aiTaskRequest', async (taskMessage) => {
      try {
        console.log(`处理来自WebSocket的AI任务请求: ${taskMessage.taskId}`)

        // 发送任务到消息队列
        await this.queueManager!.publishAITask(taskMessage)

        console.log(`AI任务已发布到队列: ${taskMessage.taskId}`)

        // 发送确认消息给WebSocket客户端
        if (taskMessage.userId) {
          this.wsManager.sendToUser(taskMessage.userId, {
            type: 'ai_task_queued',
            data: {
              taskId: taskMessage.taskId,
              status: 'queued',
              message: 'Task successfully queued for processing'
            }
          })
        }
      } catch (error) {
        console.error('处理AI任务请求失败:', error)

        // 发送错误消息给WebSocket客户端
        if (taskMessage.userId) {
          this.wsManager.sendToUser(taskMessage.userId, {
            type: 'ai_task_error',
            data: {
              taskId: taskMessage.taskId,
              requestId: taskMessage.requestId, // 添加requestId以兼容前端
              error: {
                code: 'QUEUE_PUBLISH_ERROR',
                message: error instanceof Error ? error.message : 'Failed to queue task',
                timestamp: new Date()
              }
            }
          })

          // 同时发送AI_GENERATE_ERROR事件以确保兼容性
          this.wsManager.sendToUser(taskMessage.userId, {
            type: 'AI_GENERATE_ERROR',
            data: {
              requestId: taskMessage.requestId,
              taskId: taskMessage.taskId,
              error: {
                code: 'QUEUE_PUBLISH_ERROR',
                message: error instanceof Error ? error.message : 'Failed to queue task',
                timestamp: new Date()
              }
            }
          })
        }
      }
    })
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Gateway server is already running')
    }

    return new Promise((resolve, reject) => {
      const { port, host = '0.0.0.0' } = this.config

      this.server.listen(port, host, async (error?: Error) => {
        if (error) {
          reject(error)
          return
        }

        this.isRunning = true
        console.log(`🚀 Gateway server started on ${host}:${port}`)
        console.log(`📡 WebSocket server ready on ${this.config.websocket.path}`)

        // 启动WebSocket管理器
        this.wsManager.start()

        // 初始化队列管理器
        if (this.queueManager) {
          try {
            await this.queueManager.initialize()
            console.log('📡 队列管理器已初始化')
          } catch (queueError) {
            console.warn('⚠️ 队列管理器初始化失败，但服务器仍将继续运行:', queueError)
          }
        }

        resolve()
      })

      // 处理服务器错误
      this.server.on('error', (error: Error) => {
        console.error('Gateway server error:', error)
        if (!this.isRunning) {
          reject(error)
        }
      })
    })
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    return new Promise(async (resolve) => {
      // 清理队列管理器
      if (this.queueManager) {
        try {
          await this.queueManager.cleanup()
          console.log('队列管理器已清理')
        } catch (error) {
          console.error('队列管理器清理失败:', error)
        }
      }

      // 停止WebSocket管理器
      this.wsManager.stop()

      // 关闭HTTP服务器
      this.server.close(() => {
        this.isRunning = false
        console.log('Gateway server stopped')
        resolve()
      })
    })
  }

  /**
   * 获取API路由器（用于添加自定义路由）
   */
  getApiRouter(): ApiRouter {
    return this.apiRouter
  }

  /**
   * 获取WebSocket管理器
   */
  getWebSocketManager(): WebSocketManager {
    return this.wsManager
  }

  /**
   * 获取队列管理器
   */
  getQueueManager(): QueueManager | undefined {
    return this.queueManager
  }

  /**
   * 获取Express应用实例
   */
  getApp(): express.Application {
    return this.app
  }

  /**
   * 获取服务器运行状态
   */
  isServerRunning(): boolean {
    return this.isRunning
  }

  /**
   * 获取服务器统计信息
   */
  getStats() {
    const queueStats = this.queueManager?.getStats()

    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.wsManager.getConnectionCount(),
      isRunning: this.isRunning,
      queue: queueStats || { isInitialized: false, brokerConnected: false },
      config: {
        port: this.config.port,
        cors: this.config.cors.origin,
        rateLimitMax: this.config.rateLimit.max,
        wsPath: this.config.websocket.path
      }
    }
  }
}