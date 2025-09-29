import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { AIEngine } from '../core/AIEngine.js'
import { createStudioAPIRouter } from './StudioAPIRouter.js'

/**
 * Studio API 服务器配置
 */
export interface StudioAPIServerConfig {
  port: number
  host: string
  cors: {
    origin: string | string[]
    credentials: boolean
  }
  rateLimit: {
    windowMs: number
    max: number
    message: string
  }
  timeout: number
  environment: 'development' | 'production' | 'test'
}

/**
 * 默认配置
 */
const defaultConfig: StudioAPIServerConfig = {
  port: parseInt(process.env.STUDIO_API_PORT || '8000'),
  host: process.env.STUDIO_API_HOST || '0.0.0.0',
  cors: {
    origin: process.env.STUDIO_CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP在窗口期内最多请求100次
    message: '请求过于频繁，请稍后再试'
  },
  timeout: 120000, // 2分钟超时
  environment: (process.env.NODE_ENV as any) || 'development'
}

/**
 * Studio API 服务器 - 为前端 Studio 提供 AI 服务接口
 */
export class StudioAPIServer {
  private app: Application
  private config: StudioAPIServerConfig
  private aiEngine: AIEngine
  private server?: any

  constructor(aiEngine: AIEngine, config: Partial<StudioAPIServerConfig> = {}) {
    this.aiEngine = aiEngine
    this.config = { ...defaultConfig, ...config }
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: this.config.environment === 'production',
      crossOriginEmbedderPolicy: false
    }))

    // CORS 跨域支持
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Request-ID', 'X-Processing-Time']
    }))

    // 压缩响应
    this.app.use(compression())

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // 请求超时设置
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.setTimeout(this.config.timeout, () => {
        const error = new Error('请求超时')
        error.name = 'TimeoutError'
        next(error)
      })
      next()
    })

    // 速率限制
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.config.rateLimit.message
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.config.rateLimit.message
          },
          metadata: {
            timestamp: new Date(),
            retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
          }
        })
      }
    })

    this.app.use('/api', limiter)

    // 请求日志中间件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()
      const requestId = this.generateRequestId()

      // 设置响应头
      res.setHeader('X-Request-ID', requestId)

      console.log(`[${requestId}] ${req.method} ${req.path} - ${req.ip}`)

      // 记录响应完成时间
      res.on('finish', () => {
        const processingTime = Date.now() - startTime
        res.setHeader('X-Processing-Time', processingTime.toString())
        console.log(
          `[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${processingTime}ms)`
        )
      })

      next()
    })
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查端点
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          version: process.env.npm_package_version || '1.0.0',
          environment: this.config.environment,
          uptime: process.uptime()
        }
      })
    })

    // 根路径信息
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: '@sker/engine Studio API Server',
        version: process.env.npm_package_version || '1.0.0',
        description: 'AI引擎服务 - 为SKER Studio提供AI处理能力',
        endpoints: {
          health: '/health',
          api: '/api/ai',
          docs: '/docs'
        },
        timestamp: new Date()
      })
    })

    // API 路由
    const apiRouter = createStudioAPIRouter(this.aiEngine)
    this.app.use('/api/ai', apiRouter)

    // API 文档 (开发环境)
    if (this.config.environment === 'development') {
      this.app.get('/docs', (req: Request, res: Response) => {
        res.json({
          title: 'SKER Engine Studio API Documentation',
          version: '1.0.0',
          baseUrl: `http://${this.config.host}:${this.config.port}/api/ai`,
          endpoints: [
            {
              path: '/health',
              method: 'GET',
              description: '检查AI引擎健康状态'
            },
            {
              path: '/models',
              method: 'GET',
              description: '获取可用的AI模型列表'
            },
            {
              path: '/generate',
              method: 'POST',
              description: '生成AI内容',
              body: {
                inputs: ['string[]'],
                context: 'string?',
                instruction: 'string?',
                options: {
                  temperature: 'number?',
                  maxTokens: 'number?',
                  model: 'string?'
                }
              }
            },
            {
              path: '/optimize',
              method: 'POST',
              description: '优化现有内容',
              body: {
                content: 'string',
                context: 'string?',
                targetStyle: 'string?'
              }
            },
            {
              path: '/fusion',
              method: 'POST',
              description: '多输入融合生成',
              body: {
                inputs: 'string[]',
                fusionType: "'summary' | 'synthesis' | 'comparison'"
              }
            },
            {
              path: '/title',
              method: 'POST',
              description: '生成标题',
              body: {
                content: 'string'
              }
            },
            {
              path: '/tags',
              method: 'POST',
              description: '提取标签',
              body: {
                content: 'string'
              }
            },
            {
              path: '/batch',
              method: 'POST',
              description: '批量处理请求',
              body: {
                requests: 'StudioAIGenerateRequest[]'
              }
            },
            {
              path: '/semantics',
              method: 'POST',
              description: '语义分析',
              body: {
                content: 'string',
                analysisType: "'basic' | 'deep'"
              }
            },
            {
              path: '/node/optimize',
              method: 'POST',
              description: '节点优化',
              body: {
                nodeId: 'string',
                currentContent: 'string',
                context: 'string?',
                focusArea: 'StudioOptimizationFocus?'
              }
            },
            {
              path: '/status/:nodeId',
              method: 'GET',
              description: '获取节点处理状态'
            },
            {
              path: '/stats',
              method: 'GET',
              description: '获取引擎统计信息'
            }
          ]
        })
      })
    }

    // 404 处理
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `端点 ${req.method} ${req.originalUrl} 不存在`
        },
        metadata: {
          timestamp: new Date(),
          availableEndpoints: ['/health', '/api/ai', '/docs']
        }
      })
    })
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 全局错误处理中间件
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('服务器错误:', err)

      // 确定错误状态码
      let statusCode = 500
      let errorCode = 'INTERNAL_SERVER_ERROR'

      if (err.name === 'ValidationError') {
        statusCode = 400
        errorCode = 'VALIDATION_ERROR'
      } else if (err.name === 'TimeoutError') {
        statusCode = 408
        errorCode = 'REQUEST_TIMEOUT'
      } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        statusCode = 400
        errorCode = 'INVALID_JSON'
      }

      const errorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: err.message || '服务器内部错误',
          details: this.config.environment === 'development' ? {
            stack: err.stack,
            name: err.name
          } : undefined
        },
        metadata: {
          timestamp: new Date(),
          requestId: res.getHeader('X-Request-ID') || 'unknown'
        }
      }

      res.status(statusCode).json(errorResponse)
    })

    // 未捕获异常处理
    process.on('uncaughtException', (err: Error) => {
      console.error('未捕获的异常:', err)
      if (this.config.environment === 'production') {
        this.gracefulShutdown('uncaughtException')
      }
    })

    // 未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('未处理的 Promise 拒绝:', reason)
      if (this.config.environment === 'production') {
        this.gracefulShutdown('unhandledRejection')
      }
    })
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 确保 AI 引擎已初始化
      await this.aiEngine.initialize()

      // 启动 HTTP 服务器
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`🚀 Studio API Server 启动成功`)
        console.log(`📍 地址: http://${this.config.host}:${this.config.port}`)
        console.log(`🌍 环境: ${this.config.environment}`)
        console.log(`🔗 API 端点: http://${this.config.host}:${this.config.port}/api/ai`)
        if (this.config.environment === 'development') {
          console.log(`📚 文档: http://${this.config.host}:${this.config.port}/docs`)
        }
      })

      // 设置服务器超时
      this.server.timeout = this.config.timeout
      this.server.keepAliveTimeout = 30000
      this.server.headersTimeout = 35000

    } catch (error) {
      console.error('❌ Studio API Server 启动失败:', error)
      throw error
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve()
        return
      }

      console.log('🛑 正在停止 Studio API Server...')

      this.server.close((err: any) => {
        if (err) {
          console.error('❌ 停止服务器时出错:', err)
          reject(err)
        } else {
          console.log('✅ Studio API Server 已停止')
          resolve()
        }
      })
    })
  }

  /**
   * 优雅关闭
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`收到 ${signal} 信号，开始优雅关闭...`)

    try {
      // 停止接受新请求
      await this.stop()

      // 清理 AI 引擎资源
      if (this.aiEngine && typeof this.aiEngine.cleanup === 'function') {
        await this.aiEngine.cleanup()
      }

      console.log('✅ 优雅关闭完成')
      process.exit(0)
    } catch (error) {
      console.error('❌ 优雅关闭失败:', error)
      process.exit(1)
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `studio-api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取Express应用实例
   */
  getApp(): Application {
    return this.app
  }

  /**
   * 获取服务器配置
   */
  getConfig(): StudioAPIServerConfig {
    return { ...this.config }
  }

  /**
   * 获取服务器状态
   */
  getStatus(): {
    running: boolean
    port: number
    host: string
    environment: string
    uptime: number
  } {
    return {
      running: !!this.server && this.server.listening,
      port: this.config.port,
      host: this.config.host,
      environment: this.config.environment,
      uptime: process.uptime()
    }
  }
}

/**
 * 创建并启动Studio API服务器的便利函数
 */
export async function createAndStartStudioAPIServer(
  aiEngine: AIEngine,
  config?: Partial<StudioAPIServerConfig>
): Promise<StudioAPIServer> {
  const server = new StudioAPIServer(aiEngine, config)
  await server.start()
  return server
}

// 信号处理
if (require.main === module) {
  // 处理优雅关闭信号
  const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2']
  let server: StudioAPIServer | null = null

  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      if (server) {
        await server.stop()
      }
      process.exit(0)
    })
  })
}