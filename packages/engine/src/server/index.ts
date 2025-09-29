#!/usr/bin/env node

import dotenv from 'dotenv'
import { AIEngine } from '../core/AIEngine'
import { StudioAPIServer } from './StudioAPIServer'

// 加载环境变量
dotenv.config()

/**
 * 服务器启动脚本
 */
async function main() {
  try {
    console.log('🚀 启动 SKER Engine Studio API Server...')

    // 创建 AI 引擎实例
    const aiEngine = new AIEngine({
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL,
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3')
      },
      cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
        ttl: parseInt(process.env.CACHE_TTL || '3600000') // 1小时
      },
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM || '60'),
        tokensPerMinute: parseInt(process.env.RATE_LIMIT_TPM || '90000')
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metricsRetention: parseInt(process.env.METRICS_RETENTION || '86400000') // 24小时
      },
      concurrency: {
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
        queueSize: parseInt(process.env.QUEUE_SIZE || '100'),
        batchSize: parseInt(process.env.BATCH_SIZE || '5')
      }
    })

    // 创建 API 服务器
    const apiServer = new StudioAPIServer(aiEngine, {
      port: parseInt(process.env.STUDIO_API_PORT || '8000'),
      host: process.env.STUDIO_API_HOST || '0.0.0.0',
      cors: {
        origin: process.env.STUDIO_CORS_ORIGIN?.split(',') || [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8080'
        ],
        credentials: true
      },
      rateLimit: {
        windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '900000'), // 15分钟
        max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
        message: '请求过于频繁，请稍后再试'
      },
      timeout: parseInt(process.env.API_TIMEOUT || '120000'), // 2分钟
      environment: (process.env.NODE_ENV as any) || 'development'
    })

    // 启动服务器
    await apiServer.start()

    // 显示启动信息
    const status = apiServer.getStatus()
    console.log(`✅ 服务器启动成功!`)
    console.log(`📍 监听地址: http://${status.host}:${status.port}`)
    console.log(`🌍 运行环境: ${status.environment}`)
    console.log(`🔗 API 根路径: http://${status.host}:${status.port}/api/ai`)
    console.log(`❤️  健康检查: http://${status.host}:${status.port}/health`)

    if (status.environment === 'development') {
      console.log(`📚 API 文档: http://${status.host}:${status.port}/docs`)
    }

    // 优雅关闭处理
    const shutdownHandler = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，开始优雅关闭...`)
      try {
        await apiServer.stop()
        console.log('✅ 服务器已优雅关闭')
        process.exit(0)
      } catch (error) {
        console.error('❌ 关闭服务器时出错:', error)
        process.exit(1)
      }
    }

    // 注册信号处理器
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'))
    process.on('SIGINT', () => shutdownHandler('SIGINT'))
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')) // nodemon 重启信号

    // 开发环境下的热重载支持
    if (status.environment === 'development') {
      console.log('🔥 开发模式已启用 - 支持热重载')
    }

  } catch (error) {
    console.error('❌ 启动服务器失败:', error)

    // 显示详细的错误信息和解决建议
    if (error instanceof Error) {
      console.error('错误详情:', error.message)

      // 常见错误的解决建议
      if (error.message.includes('EADDRINUSE')) {
        console.log('\n💡 解决建议:')
        console.log('  - 端口已被占用，请检查是否有其他服务在运行')
        console.log('  - 尝试更改 STUDIO_API_PORT 环境变量')
        console.log('  - 使用 lsof -ti :8000 | xargs kill 停止占用端口的进程')
      } else if (error.message.includes('OPENAI_API_KEY')) {
        console.log('\n💡 解决建议:')
        console.log('  - 请设置 OPENAI_API_KEY 环境变量')
        console.log('  - 创建 .env 文件并添加: OPENAI_API_KEY=your-api-key')
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('\n💡 解决建议:')
        console.log('  - 检查网络连接')
        console.log('  - 确认 OpenAI API 服务可访问')
        console.log('  - 检查代理设置')
      }
    }

    process.exit(1)
  }
}

// 未捕获异常处理
process.on('uncaughtException', (error: Error) => {
  console.error('💥 未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 未处理的 Promise 拒绝:', reason)
  process.exit(1)
})

// 启动应用
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 应用启动失败:', error)
    process.exit(1)
  })
}