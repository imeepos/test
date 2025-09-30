/**
 * 集成Store微服务的Broker工厂函数
 */

import { MessageBroker } from '../core/MessageBroker'
import { AITaskScheduler } from '../scheduler/AITaskScheduler'
import { createStoreAdapterForBroker, createStoreAdapterFromEnv } from '../config/store'
import type { StoreClientConfig } from '@sker/store'
import type { StoreAdapter } from '../adapters/StoreAdapter'

export interface BrokerFactoryConfig {
  rabbitmq?: {
    url?: string
    reconnectDelay?: number
    maxReconnectAttempts?: number
  }
  scheduler?: {
    defaultTimeout?: number
  }
  store?: Partial<StoreClientConfig>
}

export interface BrokerDependencies {
  aiEngine?: any
  storeAdapter?: StoreAdapter
}

/**
 * 创建集成Store的Broker服务
 */
export async function createBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
): Promise<{
  messageBroker: MessageBroker
  aiTaskScheduler: AITaskScheduler
  storeAdapter: StoreAdapter
}> {
  // 【调试日志3】打印传入的配置
  console.log('🔍 createBrokerWithStore 接收到的配置:')
  console.log(`   config.rabbitmq:`, JSON.stringify(config.rabbitmq, null, 2))
  console.log(`   config.store:`, JSON.stringify(config.store, null, 2))

  // 创建Store适配器
  const storeAdapter = await createStoreAdapterForBroker(config.store)

  // 【调试日志4】确定最终的连接URL
  const finalConnectionUrl = config.rabbitmq?.url || 'amqp://guest:guest@localhost:5672'
  console.log('🔍 MessageBroker 连接配置:')
  console.log(`   config.rabbitmq?.url: ${config.rabbitmq?.url}`)
  console.log(`   最终connectionUrl: ${finalConnectionUrl}`)
  console.log(`   重试配置: maxRetries=${config.rabbitmq?.maxReconnectAttempts || 10}, initialDelay=${config.rabbitmq?.reconnectDelay || 5000}`)

  // 创建消息代理
  const messageBroker = new MessageBroker({
    connectionUrl: finalConnectionUrl,
    retry: {
      maxRetries: config.rabbitmq?.maxReconnectAttempts || 10,
      initialDelay: config.rabbitmq?.reconnectDelay || 5000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'ECONNREFUSED']
    },
    exchanges: {},
    queues: {},
    prefetch: 5,
    heartbeat: 60,
    deadLetter: { enabled: false, exchange: 'dlx', routingKey: 'failed' },
    monitoring: { enabled: false, metricsInterval: 60000, healthCheckInterval: 30000, alertThresholds: { queueLength: 100, processingDelay: 10000, errorRate: 0.1 } }
  })

  // 创建AI任务调度器
  const aiTaskScheduler = new AITaskScheduler({
    messageBroker,
    aiEngine: dependencies?.aiEngine,
    storeService: storeAdapter as any, // 类型适配
    defaultTimeout: config.scheduler?.defaultTimeout || 300000
  })

  return {
    messageBroker,
    aiTaskScheduler,
    storeAdapter
  }
}

/**
 * 创建开发环境Broker
 */
export async function createDevelopmentBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const devConfig: BrokerFactoryConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://sker_user:sker_password@rabbitmq:5672',
      reconnectDelay: config.rabbitmq?.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.rabbitmq?.maxReconnectAttempts ?? 5
    },
    scheduler: {
      defaultTimeout: config.scheduler?.defaultTimeout ?? 300000 // 5分钟
    },
    store: {
      baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
      timeout: config.store?.timeout ?? 30000,
      retries: config.store?.retries ?? 3,
      ...(config.store?.authToken && { authToken: config.store.authToken })
    }
  }

  console.log(`🔧 开发环境配置 - RabbitMQ: ${devConfig.rabbitmq.url}`)
  console.log(`🔧 开发环境配置 - Store: ${devConfig.store.baseURL}`)

  return createBrokerWithStore(devConfig, dependencies)
}

/**
 * 创建生产环境Broker
 */
export async function createProductionBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const prodConfig: BrokerFactoryConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://sker_user:sker_password@rabbitmq:5672',
      reconnectDelay: config.rabbitmq?.reconnectDelay ?? 5000,
      maxReconnectAttempts: config.rabbitmq?.maxReconnectAttempts ?? 10
    },
    scheduler: {
      defaultTimeout: config.scheduler?.defaultTimeout ?? 600000 // 10分钟
    },
    store: {
      baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
      timeout: config.store?.timeout ?? 15000,
      retries: config.store?.retries ?? 5,
      retryDelay: config.store?.retryDelay ?? 2000,
      ...(config.store?.authToken && { authToken: config.store.authToken })
    }
  }

  console.log(`🔧 生产环境配置`)
  console.log(`   RabbitMQ URL: ${prodConfig.rabbitmq.url}`)
  console.log(`   Store URL: ${prodConfig.store.baseURL}`)
  console.log(`   环境变量 RABBITMQ_URL: ${process.env.RABBITMQ_URL}`)
  console.log(`   环境变量 STORE_SERVICE_URL: ${process.env.STORE_SERVICE_URL}`)

  return createBrokerWithStore(prodConfig, dependencies)
}

/**
 * 启动完整的Broker服务
 */
export async function startBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
): Promise<{
  messageBroker: MessageBroker
  aiTaskScheduler: AITaskScheduler
  storeAdapter: StoreAdapter
  stop: () => Promise<void>
}> {
  const { messageBroker, aiTaskScheduler, storeAdapter } = await createBrokerWithStore(config, dependencies)

  // 初始化消息代理
  await messageBroker.start()
  console.log('✅ MessageBroker已连接')

  // 初始化AI任务调度器
  await aiTaskScheduler.initialize()
  console.log('✅ AITaskScheduler已初始化')

  // 返回服务实例和停止函数
  return {
    messageBroker,
    aiTaskScheduler,
    storeAdapter,
    stop: async () => {
      console.log('🛑 正在停止Broker服务...')

      // 清理调度器
      aiTaskScheduler.cleanup()

      // 断开消息代理
      await messageBroker.stop()

      // 关闭Store适配器
      await storeAdapter.close()

      console.log('✅ Broker服务已停止')
    }
  }
}

/**
 * 启动开发环境Broker
 */
export async function startDevelopmentBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  return startBrokerWithStore(config, dependencies)
}

/**
 * 启动生产环境Broker
 */
export async function startProductionBrokerWithStore(
  config: BrokerFactoryConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const prodConfig = {
    ...config,
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://sker_user:sker_password@rabbitmq:5672',
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...config.rabbitmq
    },
    scheduler: {
      defaultTimeout: 600000,
      ...config.scheduler
    },
    store: {
      baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
      timeout: 15000,
      retries: 5,
      retryDelay: 2000,
      ...config.store
    }
  }

  return startBrokerWithStore(prodConfig, dependencies)
}

/**
 * 从环境变量启动Broker服务
 */
export async function startBrokerFromEnvironment(dependencies?: BrokerDependencies) {
  console.log('🚀 从环境变量启动Broker服务...')

  const env = process.env.NODE_ENV || 'development'
  
  // 【调试日志1】打印所有相关环境变量的原始值
  console.log('🔍 环境变量调试信息:')
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`   RABBITMQ_URL: ${process.env.RABBITMQ_URL}`)
  console.log(`   RABBITMQ_RECONNECT_DELAY: ${process.env.RABBITMQ_RECONNECT_DELAY}`)
  console.log(`   RABBITMQ_MAX_RECONNECT_ATTEMPTS: ${process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS}`)
  console.log(`   STORE_SERVICE_URL: ${process.env.STORE_SERVICE_URL}`)
  console.log(`   STORE_AUTH_TOKEN: ${process.env.STORE_AUTH_TOKEN ? '[已设置]' : '[未设置]'}`)
  
  // 只传递有效的非默认配置，让环境特定函数处理默认值
  const config: BrokerFactoryConfig = {
    rabbitmq: {
      // 🔧 修复：直接传递RABBITMQ_URL到url字段
      ...(process.env.RABBITMQ_URL && { url: process.env.RABBITMQ_URL }),
      // 只有当环境变量存在时才覆盖默认值
      ...(process.env.RABBITMQ_RECONNECT_DELAY && { reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY) }),
      ...(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS && { maxReconnectAttempts: parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS) })
    },
    scheduler: {
      ...(process.env.AI_TASK_TIMEOUT && { defaultTimeout: parseInt(process.env.AI_TASK_TIMEOUT) })
    },
    store: {
      // 只传递非空的环境变量，让工厂函数处理默认值
      ...(process.env.STORE_AUTH_TOKEN && { authToken: process.env.STORE_AUTH_TOKEN }),
      ...(process.env.STORE_TIMEOUT && { timeout: parseInt(process.env.STORE_TIMEOUT) }),
      ...(process.env.STORE_RETRIES && { retries: parseInt(process.env.STORE_RETRIES) })
    }
  }

  // 【调试日志2】打印解析后的配置对象
  console.log('🔍 解析后的配置对象:')
  console.log(`   环境: ${env}`)
  console.log(`   config.rabbitmq:`, JSON.stringify(config.rabbitmq, null, 2))
  console.log(`   config.store:`, JSON.stringify(config.store, null, 2))

  if (env === 'production') {
    return startProductionBrokerWithStore(config, dependencies)
  } else {
    return startDevelopmentBrokerWithStore(config, dependencies)
  }
}