/**
 * 向后兼容性工厂函数
 * 允许现有代码无缝切换到微服务架构
 */

import { StoreService } from '../services/StoreService.js'
import { StoreClient, createStoreClient, type StoreClientConfig } from '../client/index.js'

/**
 * Store创建选项
 */
export interface StoreCreationOptions {
  /** 是否使用微服务模式 */
  useMicroservice?: boolean
  /** Store服务URL (微服务模式) */
  storeServiceUrl?: string
  /** 认证令牌 */
  authToken?: string
  /** 传统模式的broker URL */
  brokerUrl?: string
  /** 数据库配置 (传统模式) */
  databaseConfig?: any
  /** HTTP客户端配置 (微服务模式) */
  clientConfig?: Partial<StoreClientConfig>
}

/**
 * 智能Store工厂
 * 根据环境和配置自动选择使用StoreService还是StoreClient
 */
export class LegacyStoreFactory {
  /**
   * 创建Store实例
   * 自动检测环境并选择合适的实现
   */
  static async create(options: StoreCreationOptions = {}): Promise<StoreService | StoreClient> {
    // 检查是否明确指定使用微服务模式
    if (options.useMicroservice === true || process.env.USE_MICROSERVICE === 'true') {
      return this.createMicroserviceStore(options)
    }

    // 检查是否明确指定使用传统模式
    if (options.useMicroservice === false || process.env.USE_MICROSERVICE === 'false') {
      return this.createLegacyStore(options)
    }

    // 自动检测：如果提供了Store服务URL，使用微服务模式
    if (options.storeServiceUrl || process.env.STORE_SERVICE_URL) {
      console.log('🔍 检测到Store服务URL，使用微服务模式')
      return this.createMicroserviceStore(options)
    }

    // 默认使用传统模式
    console.log('🔍 未检测到微服务配置，使用传统模式')
    return this.createLegacyStore(options)
  }

  /**
   * 创建微服务模式的Store (StoreClient)
   */
  static async createMicroserviceStore(options: StoreCreationOptions = {}): Promise<StoreClient> {
    const config: StoreClientConfig = {
      baseURL: options.storeServiceUrl || process.env.STORE_SERVICE_URL || 'http://localhost:3001',
      authToken: options.authToken || process.env.STORE_AUTH_TOKEN,
      timeout: parseInt(process.env.STORE_TIMEOUT || '30000'),
      retries: parseInt(process.env.STORE_RETRIES || '3'),
      retryDelay: parseInt(process.env.STORE_RETRY_DELAY || '1000'),
      ...options.clientConfig
    }

    const client = createStoreClient(config)
    await client.initialize()

    console.log(`✅ 微服务Store客户端已创建: ${config.baseURL}`)
    return client
  }

  /**
   * 创建传统模式的Store (StoreService)
   */
  static async createLegacyStore(options: StoreCreationOptions = {}): Promise<StoreService> {
    const service = new StoreService()
    await service.initialize(options.brokerUrl)

    console.log('✅ 传统Store服务已创建')
    return service
  }

  /**
   * 从环境变量创建Store
   */
  static async createFromEnvironment(): Promise<StoreService | StoreClient> {
    return this.create({
      useMicroservice: process.env.USE_MICROSERVICE === 'true',
      storeServiceUrl: process.env.STORE_SERVICE_URL,
      authToken: process.env.STORE_AUTH_TOKEN,
      brokerUrl: process.env.BROKER_URL
    })
  }

  /**
   * 检查是否为微服务模式
   */
  static isMicroserviceMode(store: StoreService | StoreClient): store is StoreClient {
    return 'setAuthToken' in store && typeof store.setAuthToken === 'function'
  }

  /**
   * 检查是否为传统模式
   */
  static isLegacyMode(store: StoreService | StoreClient): store is StoreService {
    return 'database' in store && typeof store.database === 'object'
  }
}

/**
 * 便捷函数：创建Store实例
 * 这是最简单的使用方式，适合大多数场景
 */
export async function createStore(options?: StoreCreationOptions): Promise<StoreService | StoreClient> {
  return LegacyStoreFactory.create(options)
}

/**
 * 便捷函数：创建微服务Store
 */
export async function createMicroserviceStore(
  storeServiceUrl?: string,
  authToken?: string
): Promise<StoreClient> {
  return LegacyStoreFactory.createMicroserviceStore({
    storeServiceUrl,
    authToken
  })
}

/**
 * 便捷函数：创建传统Store
 */
export async function createLegacyStore(brokerUrl?: string): Promise<StoreService> {
  return LegacyStoreFactory.createLegacyStore({
    brokerUrl
  })
}

/**
 * 类型守卫：判断是否为微服务Store
 */
export function isMicroserviceStore(store: StoreService | StoreClient): store is StoreClient {
  return LegacyStoreFactory.isMicroserviceMode(store)
}

/**
 * 类型守卫：判断是否为传统Store
 */
export function isLegacyStore(store: StoreService | StoreClient): store is StoreService {
  return LegacyStoreFactory.isLegacyMode(store)
}