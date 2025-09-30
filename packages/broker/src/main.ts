/**
 * Broker微服务启动入口
 */

import { startBrokerFromEnvironment } from './factory/createBrokerWithStore'
import { AIProcessingEngine } from './ai/AIProcessingEngine'

// 优雅关闭处理
let isShuttingDown = false

async function gracefulShutdown(services: any) {
  if (isShuttingDown) return
  isShuttingDown = true
  
  console.log('\n🛑 收到关闭信号，正在优雅停止服务...')
  
  try {
    if (services && services.stop) {
      await services.stop()
    }
    console.log('✅ 服务已安全停止')
    process.exit(0)
  } catch (error) {
    console.error('❌ 停止服务时发生错误:', error)
    process.exit(1)
  }
}

async function main() {
  try {
    console.log('🚀 启动 SKER Broker 微服务...')
    console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🐰 RabbitMQ: ${process.env.RABBITMQ_URL || 'amqp://localhost:5672'}`)
    console.log(`🗄️  Store Service: ${process.env.STORE_SERVICE_URL || 'http://localhost:3001'}`)
    
    // 创建AI处理引擎
    const aiEngine = new AIProcessingEngine({
      openaiApiKey: process.env.OPENAI_API_KEY,
      claudeApiKey: process.env.CLAUDE_API_KEY,
      defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-3.5-turbo',
      timeout: process.env.AI_TIMEOUT ? parseInt(process.env.AI_TIMEOUT) : 30000,
      maxRetries: process.env.AI_MAX_RETRIES ? parseInt(process.env.AI_MAX_RETRIES) : 3
    })
    
    console.log(`🤖 AI引擎配置完成 (模型: ${process.env.AI_DEFAULT_MODEL || 'gpt-3.5-turbo'})`)
    
    // 启动服务 - startBrokerFromEnvironment 会根据环境变量判断使用开发还是生产配置
    // 我们需要手动传递 aiEngine，所以使用更具体的函数
    const env = process.env.NODE_ENV || 'development'
    
    const config = {
      rabbitmq: {
        url: process.env.RABBITMQ_URL,
        reconnectDelay: process.env.RABBITMQ_RECONNECT_DELAY ? parseInt(process.env.RABBITMQ_RECONNECT_DELAY) : undefined,
        maxReconnectAttempts: process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS ? parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS) : undefined
      },
      scheduler: {
        defaultTimeout: process.env.AI_TASK_TIMEOUT ? parseInt(process.env.AI_TASK_TIMEOUT) : undefined
      },
      store: {
        baseURL: process.env.STORE_SERVICE_URL,
        authToken: process.env.STORE_AUTH_TOKEN,
        timeout: process.env.STORE_TIMEOUT ? parseInt(process.env.STORE_TIMEOUT) : undefined,
        retries: process.env.STORE_RETRIES ? parseInt(process.env.STORE_RETRIES) : undefined
      }
    }
    
    const { startDevelopmentBrokerWithStore, startProductionBrokerWithStore } = await import('./factory/createBrokerWithStore')
    
    const services = env === 'production' 
      ? await startProductionBrokerWithStore(config, { aiEngine })
      : await startDevelopmentBrokerWithStore(config, { aiEngine })
    console.log('✅ Broker 微服务启动成功!')
    
    // 设置进程信号处理
    process.on('SIGTERM', () => gracefulShutdown(services))
    process.on('SIGINT', () => gracefulShutdown(services))
    process.on('uncaughtException', (error) => {
      console.error('❌ 未捕获的异常:', error)
      gracefulShutdown(services)
    })
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ 未处理的Promise拒绝:', reason)
      gracefulShutdown(services)
    })
    
    // 健康检查端点 (如果需要HTTP服务器)
    if (process.env.ENABLE_HTTP_HEALTH_CHECK === 'true') {
      const http = await import('http')
      const healthServer = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            status: 'healthy',
            service: 'broker',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          }))
        } else {
          res.writeHead(404)
          res.end('Not Found')
        }
      })
      
      const port = process.env.HEALTH_CHECK_PORT || 3002
      healthServer.listen(port, () => {
        console.log(`🏥 健康检查端点: http://localhost:${port}/health`)
      })
    }
    
    console.log('📋 服务已就绪，等待处理消息...')
    
  } catch (error) {
    console.error('❌ 启动服务失败:', error)
    process.exit(1)
  }
}

// 启动应用
if (require.main === module) {
  main().catch(console.error)
}

export { main }