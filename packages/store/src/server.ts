#!/usr/bin/env node

/**
 * SKER Store Service Server
 * 数据存储微服务的完整HTTP API服务器
 */

import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import { databaseManager } from './config/database.js'
import { createApiRouter, createSystemRouter } from './api/routes/index.js'
import {
  corsMiddleware,
  requestLogger,
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  healthCheckBypass,
  apiVersionMiddleware,
  validateContentType,
  errorHandler,
  bodyLimitConfig
} from './api/middleware/index.js'

// 加载环境变量
dotenv.config()

/**
 * 创建Express应用
 */
function createApp(storeService: any): express.Application {
  const app = express()

  // 信任代理（用于生产环境负载均衡）
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1)
  }

  // 全局中间件
  app.use(corsMiddleware)
  app.use(requestLogger)
  app.use(apiVersionMiddleware)

  // 健康检查绕过中间件
  app.use(healthCheckBypass)

  // 请求体解析
  app.use(express.json(bodyLimitConfig.json))
  app.use(express.urlencoded(bodyLimitConfig.urlencoded))

  // 内容类型验证
  app.use(validateContentType)

  // 限流中间件 - 应用到所有API路由
  app.use(rateLimitMiddleware as any)

  // 健康检查端点
  app.get('/health', async (req, res) => {
    try {
      const healthCheck = await databaseManager.healthCheck()
      const connectionStatus = databaseManager.getConnectionStatus()

      const isHealthy = healthCheck.postgres.status === 'healthy' &&
                       healthCheck.redis.status === 'healthy'

      const healthData = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: healthCheck,
        timestamp: new Date(),
        uptime: process.uptime(),
        service: 'store',
        version: '2.0.0',
        connections: connectionStatus,
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
      }

      // 返回标准 ApiResponse 格式
      const response = {
        success: true,
        data: healthData,
        timestamp: new Date().toISOString()
      }

      res.status(isHealthy ? 200 : 503).json(response)
    } catch (error) {
      const response = {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      }

      res.status(503).json(response)
    }
  })

  // 系统路由
  app.use('/api/system', createSystemRouter())

  // API路由 (v1)
  app.use('/api/v1', createApiRouter())

  // 兼容性路由 - 重定向旧版本API到v1
  app.use('/api', (req, res, next) => {
    if (!req.path.startsWith('/v1/') && !req.path.startsWith('/system/')) {
      return res.redirect(301, `/api/v1${req.path}`)
    }
    next()
  })

  // 根路径
  app.get('/', (req, res) => {
    res.json({
      name: 'SKER Store Service',
      version: '2.0.0',
      description: 'Microservice for data storage and management',
      endpoints: {
        health: '/health',
        api: '/api/v1',
        docs: process.env.NODE_ENV === 'development' ? '/api/docs' : undefined
      },
      timestamp: new Date().toISOString()
    })
  })

  // 404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`
      },
      timestamp: new Date().toISOString()
    })
  })

  // 错误处理中间件（必须在最后）
  app.use(errorHandler)

  return app
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    console.log('🚀 Starting SKER Store Microservice...')

    // 1. 调试环境变量
    console.log('🔍 Configuration:')
    console.log(`  Node Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`  Port: ${process.env.PORT || 3001}`)
    console.log(`  Database Host: ${process.env.PG_HOST || 'localhost'}`)
    console.log(`  Database Port: ${process.env.PG_PORT || 5432}`)
    console.log(`  Database Name: ${process.env.PG_DATABASE || 'sker'}`)
    console.log(`  Database User: ${process.env.PG_USER || 'postgres'}`)
    console.log(`  Redis Host: ${process.env.REDIS_HOST || 'localhost'}`)
    console.log(`  CORS Origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`)
    console.log(`  JWT Secret: ${process.env.JWT_SECRET ? '[SET]' : '[USING DEFAULT]'}`)

    // 2. 初始化数据库管理器
    console.log('📊 Initializing database manager...')
    await databaseManager.initialize()
    console.log('✅ Database manager initialized')

    // 3. 创建并初始化 Store 服务
    console.log('🏪 Creating store service...')
    const { StoreService } = await import('./services/StoreService')
    const storeService = new StoreService()
    await storeService.initialize()
    console.log('✅ Store service initialized')

    // 4. 创建Express应用
    console.log('🌐 Creating Express application...')
    const app = createApp(storeService)
    const server = http.createServer(app)

    // 5. 启动HTTP服务器
    const port = parseInt(process.env.PORT || '3001')
    const host = process.env.HOST || '0.0.0.0'

    server.listen(port, host, () => {
      console.log('✅ SKER Store Microservice is running')
      console.log(`🌐 Server: http://${host}:${port}`)
      console.log(`🏥 Health Check: http://${host}:${port}/health`)
      console.log(`📚 API Endpoints: http://${host}:${port}/api/v1`)
      console.log(`📋 System Info: http://${host}:${port}/api/system/version`)
      console.log('🎯 Ready to handle HTTP requests')
    })

    // 6. 服务器错误处理
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`)
      } else {
        console.error('❌ Server error:', error)
      }
      process.exit(1)
    })

    // 7. 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT. Graceful shutdown...')
      await gracefulShutdown(storeService, server)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM. Graceful shutdown...')
      await gracefulShutdown(storeService, server)
    })

  } catch (error) {
    console.error('❌ Failed to start SKER Store Microservice:', error)
    process.exit(1)
  }
}

/**
 * 优雅关闭
 */
async function gracefulShutdown(storeService: any, server: http.Server): Promise<void> {
  try {
    console.log('🛑 Starting graceful shutdown...')

    // 1. 停止接受新连接
    console.log('📡 Stopping HTTP server...')
    server.close(() => {
      console.log('✅ HTTP server stopped accepting new connections')
    })

    // 2. 等待现有连接完成（最多30秒）
    const shutdownTimeout = setTimeout(() => {
      console.log('⚠️  Forcing shutdown due to timeout')
      process.exit(1)
    }, 30000)

    // 3. 清理Store服务资源
    console.log('🏪 Cleaning up store service...')
    if (storeService && typeof storeService.cleanup === 'function') {
      await storeService.cleanup()
    }

    // 4. 关闭数据库连接
    console.log('📊 Closing database connections...')
    await databaseManager.close()

    // 5. 清理完成
    clearTimeout(shutdownTimeout)
    console.log('✅ SKER Store Microservice shut down successfully')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    console.log('🔥 Forcing immediate shutdown')
    process.exit(1)
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}

export { startServer }