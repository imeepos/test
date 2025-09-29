import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import type { GatewayConfig } from '../types/GatewayConfig'
import { ApiRouter } from '../router/ApiRouter'
import { WebSocketManager } from '../websocket/WebSocketManager'
import { ErrorHandler } from '../middleware/ErrorHandler'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
import { ValidationMiddleware } from '../middleware/ValidationMiddleware'
import { RequestEnhancer } from '../middleware/RequestEnhancer'

/**
 * Gateway服务器 - 统一的API网关和WebSocket管理
 */
export class GatewayServer {
  private app: express.Application
  private server: any
  private apiRouter: ApiRouter
  private wsManager: WebSocketManager
  private config: GatewayConfig
  private isRunning: boolean = false

  constructor(config: GatewayConfig) {
    this.config = config
    this.app = express()
    this.server = createServer(this.app)

    this.apiRouter = new ApiRouter()
    this.wsManager = new WebSocketManager(this.server, config.websocket)

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
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

    // 限流中间件
    const limiter = rateLimit(this.config.rateLimit)
    this.app.use('/api', limiter)

    // 请求增强中间件（添加requestId等）
    this.app.use(RequestEnhancer.enhance())

    // 认证中间件（排除健康检查等公共端点）
    this.app.use('/api', AuthMiddleware.authenticate(this.config.auth, {
      exclude: ['/api/health', '/api/status']
    }))

    // 请求验证中间件
    this.app.use('/api', ValidationMiddleware.validate())
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

    // API路由
    this.app.use('/api', this.apiRouter.getRouter())

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
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Gateway server is already running')
    }

    return new Promise((resolve, reject) => {
      const { port, host = '0.0.0.0' } = this.config

      this.server.listen(port, host, (error?: Error) => {
        if (error) {
          reject(error)
          return
        }

        this.isRunning = true
        console.log(`🚀 Gateway server started on ${host}:${port}`)
        console.log(`📡 WebSocket server ready on ${this.config.websocket.path}`)

        // 启动WebSocket管理器
        this.wsManager.start()

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

    return new Promise((resolve) => {
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
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.wsManager.getConnectionCount(),
      isRunning: this.isRunning,
      config: {
        port: this.config.port,
        cors: this.config.cors.origin,
        rateLimitMax: this.config.rateLimit.max,
        wsPath: this.config.websocket.path
      }
    }
  }
}