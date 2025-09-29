#!/usr/bin/env node

/**
 * SKER Store Service Server
 * 数据存储服务的独立服务器启动文件
 */

import dotenv from 'dotenv'
import { databaseManager } from './config/database'

// 加载环境变量
dotenv.config()

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

    // 3. 启动健康检查端点（如果需要）
    const port = process.env.PORT || 3001
    console.log(`✅ SKER Store Service is running on port ${port}`)
    console.log('📈 Store service ready to handle requests')

    // 4. 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT. Graceful shutdown...')
      await gracefulShutdown(storeService)
    })

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM. Graceful shutdown...')
      await gracefulShutdown(storeService)
    })

  } catch (error) {
    console.error('❌ Failed to start SKER Store Service:', error)
    process.exit(1)
  }
}

/**
 * 优雅关闭
 */
async function gracefulShutdown(storeService: any) {
  try {
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