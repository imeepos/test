#!/usr/bin/env node

import dotenv from 'dotenv'
import { AIEngine } from '../core/AIEngine.js'
import { StudioAPIServer } from './StudioAPIServer.js'
import { MessageBroker } from '@sker/broker'
import { StoreClient } from '@sker/store-client'
import { AITaskQueueConsumer } from '../messaging/AITaskQueueConsumer.js'

// 加载环境变量
dotenv.config()

/**
 * 服务器启动脚本
 */
async function main() {
  try {
    const runMode = process.env.ENGINE_RUN_MODE || 'http' // 'http', 'queue', 'both'
    console.log(`🚀 启动 SKER Engine (模式: ${runMode})...`)

    // 创建 AI 引擎实例
    const aiEngine = new AIEngine({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
      models: {
        generation: 'gpt-3.5-turbo',
        optimization: 'gpt-3.5-turbo',
        analysis: 'gpt-3.5-turbo',
        fusion: 'gpt-3.5-turbo'
      },
      model: {
        name: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
        maxTokens: 4000
      },
      retryConfig: {
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
        backoffMultiplier: 2,
        retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']
      }
    })

    let apiServer: StudioAPIServer | undefined
    let queueConsumer: AITaskQueueConsumer | undefined

    // 根据运行模式启动相应服务
    if (runMode === 'http' || runMode === 'both') {
      // 启动HTTP API服务器
      apiServer = new StudioAPIServer(aiEngine, {
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

      await apiServer.start()
      console.log('✅ HTTP API服务器启动成功')
    }

    if (runMode === 'queue' || runMode === 'both') {
      // 启动队列消费者
      const messageBroker = new MessageBroker({
        connectionUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        exchanges: {
          'llm.direct': {
            type: 'direct',
            durable: true
          }
        },
        queues: {
          'ai.tasks': {
            durable: true
          }
        },
        retry: {
          maxRetries: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3'),
          maxAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3'),
          initialDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '1000'),
          maxDelay: parseInt(process.env.QUEUE_RETRY_MAX_DELAY || '10000'),
          backoffMultiplier: parseFloat(process.env.QUEUE_RETRY_BACKOFF || '2'),
          retryableErrors: ['ENOTFOUND', 'ECONNRESET', 'TIMEOUT']
        }
      })

      const storeClient = new StoreClient({
        baseURL: process.env.STORE_API_URL || 'http://localhost:3001',
        authToken: process.env.STORE_AUTH_TOKEN,
        timeout: parseInt(process.env.STORE_TIMEOUT || '30000')
      })

      queueConsumer = new AITaskQueueConsumer(
        messageBroker,
        aiEngine,
        storeClient,
        {
          concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
          retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3'),
          prefetchCount: parseInt(process.env.QUEUE_PREFETCH_COUNT || '10')
        }
      )

      await queueConsumer.start()
      console.log('✅ 队列消费者启动成功')
    }

    // 显示启动信息
    console.log(`✅ SKER Engine 启动完成! (模式: ${runMode})`)
    
    let status: any = null
    if (apiServer) {
      status = apiServer.getStatus()
      console.log(`📍 HTTP API 地址: http://${status.host}:${status.port}`)
      console.log(`🌍 运行环境: ${status.environment}`)
      console.log(`🔗 API 根路径: http://${status.host}:${status.port}/api/ai`)
      console.log(`❤️  健康检查: http://${status.host}:${status.port}/health`)

      if (status.environment === 'development') {
        console.log(`📚 API 文档: http://${status.host}:${status.port}/docs`)
      }
    }

    if (queueConsumer) {
      const queueStats = queueConsumer.getStats()
      console.log(`🎯 队列消费者状态: ${queueStats.isRunning ? '运行中' : '已停止'}`)
      console.log(`📊 并发处理数: ${queueStats.config.concurrency}`)
      console.log(`🔄 重试次数: ${queueStats.config.retryAttempts}`)
    }

    // 优雅关闭处理
    const shutdownHandler = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，开始优雅关闭...`)
      try {
        const shutdownPromises: Promise<void>[] = []

        if (apiServer) {
          shutdownPromises.push(apiServer.stop())
        }

        if (queueConsumer) {
          shutdownPromises.push(queueConsumer.stop())
        }

        await Promise.all(shutdownPromises)
        console.log('✅ Engine服务已优雅关闭')
        process.exit(0)
      } catch (error) {
        console.error('❌ 关闭Engine服务时出错:', error)
        process.exit(1)
      }
    }

    // 注册信号处理器
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'))
    process.on('SIGINT', () => shutdownHandler('SIGINT'))
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')) // nodemon 重启信号

    // 开发环境下的热重载支持
    if (status && status.environment === 'development') {
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 应用启动失败:', error)
    process.exit(1)
  })
}