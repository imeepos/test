/**
 * SKER 服务集成示例
 *
 * 此文件演示了如何将所有 SKER 服务包集成在一起工作
 */

import { MessageBroker, AITaskScheduler, createServiceIntegrator } from '@sker/broker'
import { StoreService, createStoreService } from '@sker/store'
import { AIEngine, createAIEngine } from '@sker/engine'
import { createDevelopmentGateway, type GatewayDependencies } from '@sker/gateway'
import { ErrorHandler, createErrorHandler, SystemMonitor, createSystemMonitor } from '@sker/utils'

/**
 * 服务集成配置
 */
interface SkerSystemConfig {
  // 消息代理配置
  brokerUrl: string

  // 数据库配置
  databaseUrl: string
  redisUrl: string

  // AI引擎配置
  openaiApiKey: string
  openaiBaseUrl?: string

  // 网关配置
  port: number
  host?: string
  corsOrigins: string[]

  // JWT配置
  jwtSecret: string
}

/**
 * SKER 系统主类
 */
export class SkerSystem {
  private config: SkerSystemConfig
  private messageBroker?: MessageBroker
  private storeService?: StoreService
  private aiEngine?: AIEngine
  private taskScheduler?: AITaskScheduler
  private gateway?: any
  private errorHandler?: ErrorHandler
  private systemMonitor?: SystemMonitor
  private isInitialized = false
  private isRunning = false

  constructor(config: SkerSystemConfig) {
    this.config = config
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('🚀 开始初始化 SKER 系统...')

    try {
      // 1. 初始化错误处理器
      console.log('🛡️ 初始化错误处理器...')
      this.errorHandler = createErrorHandler({
        enableRecovery: true,
        handleUncaughtExceptions: true,
        handleUnhandledRejections: true,
        exitOnUncaughtException: false,
        notifications: {
          enabled: true,
          levels: ['high', 'critical']
        }
      })

      // 2. 初始化系统监控
      console.log('📊 初始化系统监控...')
      this.systemMonitor = createSystemMonitor({
        collectInterval: 30000, // 30秒
        retentionDays: 7,
        alertThresholds: {
          errorRate: 0.05,
          responseTime: 2000,
          memoryUsage: 80,
          cpuUsage: 80
        }
      })

      // 设置监控事件处理
      this.systemMonitor.on('alerts', (alerts) => {
        console.warn('⚠️ 系统告警:', alerts)
        alerts.forEach(alert => {
          if (this.errorHandler) {
            this.errorHandler.handleError(new Error(alert.message), {
              category: 'system',
              severity: alert.severity,
              service: 'monitor',
              context: { alert }
            })
          }
        })
      })

      // 3. 初始化消息代理
      console.log('📡 初始化消息代理...')
      this.messageBroker = new MessageBroker({
        url: this.config.brokerUrl,
        exchangeName: 'sker.system'
      })
      await this.messageBroker.connect()

      // 4. 初始化存储服务（包含事件发布）
      console.log('💾 初始化存储服务...')
      this.storeService = await createStoreService({
        brokerUrl: this.config.brokerUrl
      })

      // 5. 初始化AI引擎
      console.log('🤖 初始化AI引擎...')
      this.aiEngine = createAIEngine({
        providers: {
          openai: {
            apiKey: this.config.openaiApiKey,
            baseUrl: this.config.openaiBaseUrl,
            models: ['gpt-4', 'gpt-3.5-turbo']
          }
        }
      })

      // 6. 初始化AI任务调度器
      console.log('⚡ 初始化AI任务调度器...')
      this.taskScheduler = new AITaskScheduler({
        messageBroker: this.messageBroker,
        aiEngine: this.aiEngine,
        storeService: this.storeService
      })
      await this.taskScheduler.initialize()

      // 7. 注册服务监控
      if (this.systemMonitor) {
        this.systemMonitor.registerService('store', async () => {
          const health = await this.storeService!.healthCheck()
          return {
            name: 'store',
            status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
            uptime: health.uptime,
            requests: { total: 0, success: 0, failed: 0, rate: 0 },
            response: { averageTime: 0, p95: 0, p99: 0 },
            errors: { total: 0, rate: 0 },
            resources: { memory: 0, cpu: 0 }
          }
        })

        this.systemMonitor.registerService('engine', async () => {
          const health = await this.aiEngine!.getHealthStatus()
          return {
            name: 'engine',
            status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
            uptime: process.uptime(),
            requests: { total: health.statistics.totalTasks, success: health.statistics.successfulTasks, failed: health.statistics.failedTasks, rate: 0 },
            response: { averageTime: health.statistics.averageProcessingTime, p95: 0, p99: 0 },
            errors: { total: health.statistics.failedTasks, rate: 0 },
            resources: { memory: 0, cpu: 0 }
          }
        })

        this.systemMonitor.registerService('broker', async () => ({
          name: 'broker',
          status: this.messageBroker!.isConnected() ? 'healthy' : 'unhealthy',
          uptime: process.uptime(),
          requests: { total: 0, success: 0, failed: 0, rate: 0 },
          response: { averageTime: 0, p95: 0, p99: 0 },
          errors: { total: 0, rate: 0 },
          resources: { memory: 0, cpu: 0 }
        }))
      }

      // 8. 初始化服务集成器
      console.log('🔗 初始化服务集成器...')
      const serviceIntegrator = createServiceIntegrator({
        serviceExchange: 'sker.services',
        broadcastExchange: 'sker.broadcast',
        services: [
          {
            serviceName: 'gateway',
            version: '1.0.0',
            description: 'API网关和WebSocket管理',
            capabilities: ['http_api', 'websocket', 'authentication'],
            messageHandlers: {}
          },
          {
            serviceName: 'store',
            version: '1.0.0',
            description: '数据存储服务',
            capabilities: ['data_storage', 'event_publishing', 'caching'],
            messageHandlers: {}
          },
          {
            serviceName: 'engine',
            version: '1.0.0',
            description: 'AI处理引擎',
            capabilities: ['ai_generation', 'content_optimization', 'semantic_analysis'],
            messageHandlers: {}
          },
          {
            serviceName: 'broker',
            version: '1.0.0',
            description: '消息代理服务',
            capabilities: ['message_routing', 'task_scheduling', 'service_discovery'],
            messageHandlers: {}
          }
        ],
        healthCheck: {
          enabled: true,
          interval: 30000
        }
      })

      await serviceIntegrator.initialize()

      // 9. 初始化网关服务
      console.log('🌐 初始化API网关...')
      const gatewayDependencies: GatewayDependencies = {
        aiEngine: this.aiEngine,
        storeService: this.storeService
      }

      this.gateway = createDevelopmentGateway({
        port: this.config.port,
        host: this.config.host,
        cors: {
          origin: this.config.corsOrigins,
          credentials: true
        },
        auth: {
          secret: this.config.jwtSecret,
          expiresIn: '24h'
        },
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15分钟
          max: 100 // 每个IP最多100个请求
        }
      }, gatewayDependencies)

      this.isInitialized = true
      console.log('✅ SKER 系统初始化完成!')

    } catch (error) {
      console.error('❌ SKER 系统初始化失败:', error)
      await this.cleanup()
      throw error
    }
  }

  /**
   * 启动所有服务
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (this.isRunning) return

    console.log('🎯 启动 SKER 系统...')

    try {
      // 启动监控系统
      if (this.systemMonitor) {
        this.systemMonitor.start()
      }

      // 启动网关服务
      await this.gateway?.start()

      console.log(`🎉 SKER 系统启动完成!`)
      console.log(`🌐 API Gateway: http://${this.config.host || 'localhost'}:${this.config.port}`)
      console.log(`📡 WebSocket: ws://${this.config.host || 'localhost'}:${this.config.port}/socket.io`)
      console.log(`💾 数据库连接状态: ${(await this.storeService?.healthCheck())?.status}`)
      console.log(`🤖 AI引擎状态: ${(await this.aiEngine?.getHealthStatus())?.status}`)

      this.isRunning = true
    } catch (error) {
      console.error('❌ SKER 系统启动失败:', error)
      await this.stop()
      throw error
    }
  }

  /**
   * 停止所有服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('🛑 停止 SKER 系统...')

    try {
      // 停止网关
      if (this.gateway) {
        await this.gateway.stop()
      }

      // 停止任务调度器
      if (this.taskScheduler) {
        await this.taskScheduler.cleanup()
      }

      // 停止存储服务
      if (this.storeService) {
        await this.storeService.close()
      }

      // 停止监控
      if (this.systemMonitor) {
        this.systemMonitor.stop()
      }

      // 断开消息代理
      if (this.messageBroker) {
        await this.messageBroker.disconnect()
      }

      this.isRunning = false
      console.log('👋 SKER 系统已停止')
    } catch (error) {
      console.error('❌ 停止 SKER 系统时出错:', error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.stop()
    this.isInitialized = false
  }

  /**
   * 获取系统健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    services: Record<string, any>
    timestamp: Date
  }> {
    const services: Record<string, any> = {}
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

    try {
      // 检查存储服务
      if (this.storeService) {
        services.store = await this.storeService.healthCheck()
        if (services.store.status !== 'healthy') {
          overallStatus = 'degraded'
        }
      } else {
        services.store = { status: 'unavailable' }
        overallStatus = 'degraded'
      }

      // 检查AI引擎
      if (this.aiEngine) {
        services.engine = await this.aiEngine.getHealthStatus()
        if (services.engine.status !== 'healthy') {
          overallStatus = 'degraded'
        }
      } else {
        services.engine = { status: 'unavailable' }
        overallStatus = 'degraded'
      }

      // 检查消息代理
      if (this.messageBroker) {
        services.broker = {
          status: this.messageBroker.isConnected() ? 'healthy' : 'unhealthy',
          connected: this.messageBroker.isConnected()
        }
        if (!services.broker.connected) {
          overallStatus = 'unhealthy'
        }
      } else {
        services.broker = { status: 'unavailable' }
        overallStatus = 'unhealthy'
      }

      // 检查网关
      services.gateway = {
        status: this.isRunning ? 'healthy' : 'stopped',
        running: this.isRunning
      }
      if (!this.isRunning) {
        overallStatus = 'unhealthy'
      }

      // 检查错误处理器
      if (this.errorHandler) {
        const errorMetrics = this.errorHandler.getMetrics()
        services.errorHandler = {
          status: 'healthy',
          totalErrors: errorMetrics.totalErrors,
          errorRate: errorMetrics.errorRate,
          lastErrorTime: errorMetrics.lastErrorTime
        }
      }

      // 检查监控系统
      if (this.systemMonitor) {
        const monitorSummary = this.systemMonitor.getSummary()
        services.monitor = {
          status: monitorSummary.status,
          totalServices: monitorSummary.totalServices,
          healthyServices: monitorSummary.healthyServices,
          alerts: monitorSummary.alerts
        }
      }

    } catch (error) {
      console.error('健康检查出错:', error)
      overallStatus = 'unhealthy'
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date()
    }
  }

  /**
   * 获取服务实例（用于外部访问）
   */
  get services() {
    return {
      messageBroker: this.messageBroker,
      storeService: this.storeService,
      aiEngine: this.aiEngine,
      taskScheduler: this.taskScheduler,
      gateway: this.gateway,
      errorHandler: this.errorHandler,
      systemMonitor: this.systemMonitor
    }
  }
}

/**
 * 便捷创建函数
 */
export function createSkerSystem(config: SkerSystemConfig): SkerSystem {
  return new SkerSystem(config)
}

/**
 * 快速启动函数
 */
export async function startSkerSystem(config: SkerSystemConfig): Promise<SkerSystem> {
  const system = createSkerSystem(config)
  await system.start()
  return system
}

/**
 * 示例使用方法
 */
export async function exampleUsage() {
  // 配置系统
  const config: SkerSystemConfig = {
    brokerUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost/sker',
    redisUrl: process.env.REDIS_URL || 'redis://localhost',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    port: parseInt(process.env.PORT || '3000'),
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here'
  }

  // 创建并启动系统
  const skerSystem = await startSkerSystem(config)

  // 设置优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n收到 SIGINT 信号，正在关闭系统...')
    await skerSystem.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n收到 SIGTERM 信号，正在关闭系统...')
    await skerSystem.stop()
    process.exit(0)
  })

  // 定期健康检查
  setInterval(async () => {
    const health = await skerSystem.getHealthStatus()
    if (health.status !== 'healthy') {
      console.warn('⚠️ 系统健康状态异常:', health)
    }
  }, 60000) // 每分钟检查一次

  return skerSystem
}

// 默认导出
export default {
  SkerSystem,
  createSkerSystem,
  startSkerSystem,
  exampleUsage
}