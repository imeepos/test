/**
 * Store客户端配置
 */

import { createStoreClient, type StoreClientConfig } from '@sker/store'

/**
 * 默认Store客户端配置
 */
export const DEFAULT_STORE_CONFIG: StoreClientConfig = {
  baseURL: process.env.STORE_SERVICE_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.STORE_TIMEOUT || '30000'),
  retries: parseInt(process.env.STORE_RETRIES || '3'),
  retryDelay: parseInt(process.env.STORE_RETRY_DELAY || '1000')
}

/**
 * 根据环境获取Store配置
 */
export function getStoreConfigForEnvironment(env?: string): StoreClientConfig {
  const environment = env || process.env.NODE_ENV || 'development'

  const baseConfig = { ...DEFAULT_STORE_CONFIG }

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
 * 创建Store客户端实例
 */
export function createStoreClientForGateway(config?: Partial<StoreClientConfig>) {
  const finalConfig = {
    ...getStoreConfigForEnvironment(),
    ...config
  }

  const client = createStoreClient(finalConfig)

  console.log(`🏪 Store客户端配置: ${finalConfig.baseURL}`)

  return client
}

/**
 * 创建已认证的Store客户端
 */
export function createAuthenticatedStoreClient(
  authToken: string,
  config?: Partial<StoreClientConfig>
) {
  const client = createStoreClientForGateway(config)
  client.setAuthToken(authToken)
  return client
}