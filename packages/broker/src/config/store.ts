/**
 * Broker的Store客户端配置
 */

import { createStoreClient, type StoreClientConfig } from '@sker/store'
import { createStoreAdapter, type StoreAdapter } from '../adapters/StoreAdapter'

/**
 * 默认Store客户端配置 (Broker)
 */
export const DEFAULT_BROKER_STORE_CONFIG: StoreClientConfig = {
  baseURL: process.env.STORE_SERVICE_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.STORE_TIMEOUT || '30000'),
  retries: parseInt(process.env.STORE_RETRIES || '3'),
  retryDelay: parseInt(process.env.STORE_RETRY_DELAY || '1000')
}

/**
 * 根据环境获取Broker的Store配置
 */
export function getBrokerStoreConfigForEnvironment(env?: string): StoreClientConfig {
  const environment = env || process.env.NODE_ENV || 'development'

  const baseConfig = { ...DEFAULT_BROKER_STORE_CONFIG }

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        baseURL: process.env.STORE_SERVICE_URL || 'http://localhost:3001',
        timeout: 30000,
        retries: 3
      }

    case 'test':
      return {
        ...baseConfig,
        baseURL: process.env.STORE_SERVICE_URL || 'http://localhost:3001',
        timeout: 10000,
        retries: 1
      }

    case 'production':
      return {
        ...baseConfig,
        baseURL: process.env.STORE_SERVICE_URL || 'http://store:3001',
        timeout: 15000,
        retries: 5,
        retryDelay: 2000
      }

    default:
      return baseConfig
  }
}

/**
 * 为Broker创建Store适配器
 */
export async function createStoreAdapterForBroker(
  config?: Partial<StoreClientConfig>
): Promise<StoreAdapter> {
  const baseConfig = getBrokerStoreConfigForEnvironment()
  const finalConfig = {
    ...baseConfig,
    ...config
  }

  // 确保 baseURL 不为空
  if (!finalConfig.baseURL) {
    finalConfig.baseURL = baseConfig.baseURL
  }

  console.log(`🏪 Broker Store适配器配置: ${finalConfig.baseURL}`)

  const client = createStoreClient(finalConfig)
  await client.initialize()

  const adapter = createStoreAdapter(client)

  console.log(`✅ Broker Store适配器已初始化`)

  return adapter
}

/**
 * 创建已认证的Store适配器
 */
export async function createAuthenticatedStoreAdapterForBroker(
  authToken: string,
  config?: Partial<StoreClientConfig>
): Promise<StoreAdapter> {
  const adapter = await createStoreAdapterForBroker(config)
  adapter.setAuthToken(authToken)
  return adapter
}

/**
 * 从环境变量创建Store适配器
 */
export async function createStoreAdapterFromEnv(): Promise<StoreAdapter> {
  const config: Partial<StoreClientConfig> = {
    baseURL: process.env.STORE_SERVICE_URL,
    authToken: process.env.STORE_AUTH_TOKEN,
    timeout: process.env.STORE_TIMEOUT ? parseInt(process.env.STORE_TIMEOUT) : undefined,
    retries: process.env.STORE_RETRIES ? parseInt(process.env.STORE_RETRIES) : undefined
  }

  return createStoreAdapterForBroker(config)
}