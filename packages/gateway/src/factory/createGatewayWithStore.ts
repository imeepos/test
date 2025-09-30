/**
 * 集成Store微服务的Gateway工厂函数
 */

import { createGateway, type GatewayDependencies } from './createGateway.js'
import { createStoreClientForGateway } from '../config/store.js'
import type { GatewayConfig } from '../types/GatewayConfig.js'
import type { StoreClientConfig } from '@sker/store'
import type { AIEngine } from '@sker/engine'
import { MessageBroker } from '@sker/broker'

export interface ExtendedGatewayDependencies {
  aiEngine?: AIEngine
  messageBroker?: MessageBroker
  storeConfig?: Partial<StoreClientConfig>
}

/**
 * 创建集成Store微服务的Gateway
 */
export async function createGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
): Promise<import('../server/GatewayServer').GatewayServer> {
  // 创建Store客户端
  const storeClient = createStoreClientForGateway(dependencies?.storeConfig)

  // 初始化Store客户端
  await storeClient.initialize()

  // 创建Gateway依赖对象
  const gatewayDependencies: GatewayDependencies = {
    aiEngine: dependencies?.aiEngine,
    messageBroker: dependencies?.messageBroker,
    storeClient
  }

  // 创建Gateway实例
  const gateway = createGateway(gatewayConfig, gatewayDependencies)

  return gateway
}

/**
 * 创建开发环境Gateway with Store
 */
export async function createDevelopmentGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
) {
  const devConfig: Partial<GatewayConfig> = {
    port: 3000,
    host: 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    },
    ...gatewayConfig
  }

  return createGatewayWithStore(devConfig, dependencies)
}

/**
 * 创建生产环境Gateway with Store
 */
export async function createProductionGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
) {
  const prodConfig: Partial<GatewayConfig> = {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    security: {
      helmet: true,
      compression: true,
      trustProxy: true,
      bodyLimit: '10mb'
    },
    ...gatewayConfig
  }

  const storeConfig: Partial<StoreClientConfig> = {
    baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
    timeout: 15000,
    retries: 5,
    retryDelay: 2000,
    ...dependencies?.storeConfig
  }

  return createGatewayWithStore(prodConfig, {
    ...dependencies,
    storeConfig
  })
}

/**
 * 快速启动带Store的Gateway
 */
export async function startGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
) {
  const gateway = await createGatewayWithStore(gatewayConfig, dependencies)
  await gateway.start()
  return gateway
}

/**
 * 快速启动开发环境Gateway
 */
export async function startDevelopmentGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
) {
  const gateway = await createDevelopmentGatewayWithStore(gatewayConfig, dependencies)
  await gateway.start()
  return gateway
}

/**
 * 从环境变量创建完整的Gateway服务
 * 这是最常用的启动方式
 */
export async function startGatewayFromEnvironment() {
  console.log('🚀 从环境变量启动Gateway服务...')

  // Store配置
  const storeConfig: Partial<StoreClientConfig> = {
    baseURL: process.env.STORE_SERVICE_URL,
    authToken: process.env.STORE_AUTH_TOKEN,
    timeout: process.env.STORE_TIMEOUT ? parseInt(process.env.STORE_TIMEOUT) : undefined,
    retries: process.env.STORE_RETRIES ? parseInt(process.env.STORE_RETRIES) : undefined
  }

  // Gateway配置
  const gatewayConfig: Partial<GatewayConfig> = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || '0.0.0.0'
  }

  // 创建MessageBroker实例（如果配置了RABBITMQ_URL）
  let messageBroker: MessageBroker | undefined
  if (process.env.RABBITMQ_URL) {
    console.log('📡 初始化MessageBroker连接...')
    try {
      const { createBroker, DEFAULT_BROKER_CONFIG } = await import('@sker/broker')
      
      messageBroker = createBroker({
        connectionUrl: process.env.RABBITMQ_URL,
        exchanges: DEFAULT_BROKER_CONFIG.exchanges,
        queues: DEFAULT_BROKER_CONFIG.queues,
        retry: {
          maxRetries: 5,
          initialDelay: 3000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT', 'ECONNREFUSED']
        }
      })

      await messageBroker.start()
      console.log('✅ MessageBroker 已连接')
    } catch (error) {
      console.warn('⚠️ MessageBroker 初始化失败:', error)
      console.log('继续启动Gateway但MessageBroker功能将不可用')
      messageBroker = undefined
    }
  } else {
    console.log('⚠️ 未配置RABBITMQ_URL，MessageBroker功能将不可用')
  }

  // 准备依赖对象
  const dependencies: ExtendedGatewayDependencies = {
    storeConfig,
    messageBroker
  }

  // 根据环境选择启动方式
  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return startProductionGatewayWithStore(gatewayConfig, dependencies)
  } else {
    return startDevelopmentGatewayWithStore(gatewayConfig, dependencies)
  }
}

/**
 * 启动产品环境Gateway
 */
export async function startProductionGatewayWithStore(
  gatewayConfig: Partial<GatewayConfig> = {},
  dependencies?: ExtendedGatewayDependencies
) {
  const gateway = await createProductionGatewayWithStore(gatewayConfig, dependencies)
  await gateway.start()
  return gateway
}