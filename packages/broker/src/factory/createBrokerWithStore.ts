/**
 * 集成Store微服务的Broker工厂函数
 */

import { MessageBroker } from '../core/MessageBroker'
import { AITaskScheduler } from '../scheduler/AITaskScheduler'
import { createStoreAdapterForBroker, createStoreAdapterFromEnv } from '../config/store'
import type { StoreClientConfig } from '@sker/store'
import type { StoreAdapter } from '../adapters/StoreAdapter'

export interface BrokerConfig {
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
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
): Promise<{
  messageBroker: MessageBroker
  aiTaskScheduler: AITaskScheduler
  storeAdapter: StoreAdapter
}> {
  // 创建Store适配器
  const storeAdapter = await createStoreAdapterForBroker(config.store)

  // 创建消息代理
  const messageBroker = new MessageBroker({
    url: config.rabbitmq?.url || process.env.RABBITMQ_URL || 'amqp://localhost',
    reconnectDelay: config.rabbitmq?.reconnectDelay || 5000,
    maxReconnectAttempts: config.rabbitmq?.maxReconnectAttempts || 10
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
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const devConfig: BrokerConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      reconnectDelay: 3000,
      maxReconnectAttempts: 5
    },
    scheduler: {
      defaultTimeout: 300000 // 5分钟
    },
    store: {
      baseURL: process.env.STORE_SERVICE_URL || 'http://localhost:3001',
      timeout: 30000,
      retries: 3
    },
    ...config
  }

  return createBrokerWithStore(devConfig, dependencies)
}

/**
 * 创建生产环境Broker
 */
export async function createProductionBrokerWithStore(
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const prodConfig: BrokerConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
      reconnectDelay: 5000,
      maxReconnectAttempts: 10
    },
    scheduler: {
      defaultTimeout: 600000 // 10分钟
    },
    store: {
      baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
      timeout: 15000,
      retries: 5,
      retryDelay: 2000
    },
    ...config
  }

  return createBrokerWithStore(prodConfig, dependencies)
}

/**
 * 启动完整的Broker服务
 */
export async function startBrokerWithStore(
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
): Promise<{
  messageBroker: MessageBroker
  aiTaskScheduler: AITaskScheduler
  storeAdapter: StoreAdapter
  stop: () => Promise<void>
}> {
  const { messageBroker, aiTaskScheduler, storeAdapter } = await createBrokerWithStore(config, dependencies)

  // 初始化消息代理
  await messageBroker.connect()
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
      await messageBroker.disconnect()

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
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  return startBrokerWithStore(config, dependencies)
}

/**
 * 启动生产环境Broker
 */
export async function startProductionBrokerWithStore(
  config: BrokerConfig = {},
  dependencies?: Omit<BrokerDependencies, 'storeAdapter'>
) {
  const prodConfig = {
    ...config,
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
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
export async function startBrokerFromEnvironment() {
  console.log('🚀 从环境变量启动Broker服务...')

  const config: BrokerConfig = {
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

  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return startProductionBrokerWithStore(config)
  } else {
    return startDevelopmentBrokerWithStore(config)
  }
}