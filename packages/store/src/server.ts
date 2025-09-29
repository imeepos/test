#!/usr/bin/env node

/**
 * SKER Store Service Server
 * 数据存储服务的独立服务器启动文件
 */

import dotenv from 'dotenv'
import http from 'http'
import { databaseManager } from './config/database'

// 加载环境变量
dotenv.config()

/**
 * 创建健康检查服务器
 */
function createHealthCheckServer(storeService: any) {
  const server = http.createServer(async (req, res) => {
    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // 健康检查端点
    if (req.url === '/health' && req.method === 'GET') {
      try {
        // 执行完整的健康检查
        const healthCheck = await databaseManager.healthCheck()
        const connectionStatus = databaseManager.getConnectionStatus()

        const isHealthy = healthCheck.postgres.status === 'healthy' &&
                         healthCheck.redis.status === 'healthy'

        const healthStatus = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'store',
          version: '1.0.0',
          connections: connectionStatus,
          healthCheck: healthCheck
        }

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(isHealthy ? 200 : 503)
        res.end(JSON.stringify(healthStatus, null, 2))
      } catch (error) {
        const errorStatus = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'store',
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(503)
        res.end(JSON.stringify(errorStatus, null, 2))
      }
      return
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  })

  return server
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    console.log('🚀 Starting SKER Store Service...')

    // 1. 调试环境变量
    console.log('🔍 Database config:')
    console.log(`  Host: ${process.env.PG_HOST}`)
    console.log(`  Port: ${process.env.PG_PORT}`)
    console.log(`  Database: ${process.env.PG_DATABASE}`)
    console.log(`  User: ${process.env.PG_USER}`)
    console.log(`  Password: ${process.env.PG_PASSWORD ? '***' : 'undefined'}`)

    // 2. 初始化数据库管理器
    console.log('📊 Initializing database manager...')
    await databaseManager.initialize()
    console.log('✅ Database manager initialized')

    // 2. 创建并初始化 Store 服务
    console.log('🏪 Creating store service...')
    const { StoreService } = await import('./services/StoreService')
    const storeService = new StoreService()
    await storeService.initialize()
    console.log('✅ Store service initialized')

    // 3. 启动 HTTP 服务器和健康检查端点
    const port = process.env.PORT || 3001
    const server = createHealthCheckServer(storeService)

    server.listen(port, () => {
      console.log(`✅ SKER Store Service is running on port ${port}`)
      console.log('🏥 Health check endpoint available at /health')
      console.log('📈 Store service ready to handle requests')
    })

    // 4. 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT. Graceful shutdown...')
      await gracefulShutdown(storeService, server)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM. Graceful shutdown...')
      await gracefulShutdown(storeService, server)
    })

  } catch (error) {
    console.error('❌ Failed to start SKER Store Service:', error)
    process.exit(1)
  }
}

/**
 * 优雅关闭
 */
async function gracefulShutdown(storeService: any, server: http.Server) {
  try {
    console.log('🛑 Closing HTTP server...')
    server.close(() => {
      console.log('✅ HTTP server closed')
    })

    console.log('📊 Closing database connections...')
    await databaseManager.close()
    console.log('✅ Store service shut down successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

// 启动服务器
if (require.main === module) {
  startServer()
}

export { startServer }