/**
 * @sker/api - API客户端模块
 * 提供统一的HTTP客户端、WebSocket连接、状态同步功能
 */

// ==================== 客户端 ====================
export { RestClient } from './clients/RestClient.js'
export { WebSocketClient } from './clients/WebSocketClient.js'

// ==================== 管理器 ====================
export { AuthManager } from './managers/AuthManager.js'
export type { AuthCredentials, AuthManagerConfig, TokenStorage } from './managers/AuthManager.js'

export { CacheManager } from './managers/CacheManager.js'
export type {
  CacheStrategy,
  CacheStorageType,
  CacheItem,
  CacheManagerConfig,
  CacheStats
} from './managers/CacheManager.js'

// ==================== 类型定义 ====================
export type {
  // 响应类型
  APIResponse,
  APIError,
  PaginationInfo,
  QueryParams,

  // 配置类型
  RestClientConfig,
  AuthConfig,
  CacheConfig,
  WebSocketConfig,

  // 请求/响应类型
  RequestConfig,
  BatchRequest,
  BatchResponse,
  ResourceAPI,

  // 拦截器类型
  RequestInterceptor,
  ResponseInterceptor,

  // WebSocket事件类型
  WSEvent,
  WSConnectionEvent,
  WSRoomEvent,

  // 错误类型
  ErrorCategory,
  NetworkErrorInfo,

  // 统计类型
  RequestStats
} from './types/index.js'

// ==================== 错误类 ====================
export {
  NetworkError,
  AuthError,
  ValidationError,
  CacheHit,
  WebSocketError,
  SyncError
} from './errors/index.js'

// ==================== 工具函数 ====================

/**
 * 创建REST客户端
 */
import { RestClient } from './clients/RestClient.js'
import type { RestClientConfig } from './types/index.js'

export function createRestClient(config: RestClientConfig): RestClient {
  return new RestClient(config)
}

/**
 * 创建WebSocket客户端
 */
import { WebSocketClient } from './clients/WebSocketClient.js'
import type { WebSocketConfig } from './types/index.js'

export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config)
}

/**
 * 创建认证管理器
 */
import { AuthManager } from './managers/AuthManager.js'
import type { AuthManagerConfig } from './managers/AuthManager.js'

export function createAuthManager(config?: AuthManagerConfig): AuthManager {
  return new AuthManager(config)
}

/**
 * 创建缓存管理器
 */
import { CacheManager } from './managers/CacheManager.js'
import type { CacheManagerConfig } from './managers/CacheManager.js'

export function createCacheManager(config?: CacheManagerConfig): CacheManager {
  return new CacheManager(config)
}

// ==================== 默认导出 ====================

/**
 * 默认API客户端实例
 * 可以通过initDefaultClient初始化
 */
let defaultRestClient: RestClient | null = null
let defaultWSClient: WebSocketClient | null = null

/**
 * 初始化默认REST客户端
 */
export function initDefaultRestClient(config: RestClientConfig): RestClient {
  defaultRestClient = new RestClient(config)
  return defaultRestClient
}

/**
 * 获取默认REST客户端
 */
export function getDefaultRestClient(): RestClient {
  if (!defaultRestClient) {
    throw new Error('默认REST客户端未初始化,请先调用initDefaultRestClient')
  }
  return defaultRestClient
}

/**
 * 初始化默认WebSocket客户端
 */
export function initDefaultWSClient(config: WebSocketConfig): WebSocketClient {
  defaultWSClient = new WebSocketClient(config)
  return defaultWSClient
}

/**
 * 获取默认WebSocket客户端
 */
export function getDefaultWSClient(): WebSocketClient {
  if (!defaultWSClient) {
    throw new Error('默认WebSocket客户端未初始化,请先调用initDefaultWSClient')
  }
  return defaultWSClient
}

/**
 * 版本信息
 */
export const VERSION = '1.0.0'

/**
 * 包信息
 */
export const PACKAGE_INFO = {
  name: '@sker/api',
  version: VERSION,
  description: 'API客户端 - 统一的HTTP客户端、WebSocket连接、状态同步'
}
