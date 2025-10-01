/**
 * API客户端类型定义
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// ==================== 通用类型 ====================

/**
 * API响应格式
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  pagination?: PaginationInfo
  timestamp?: string
  requestId?: string
}

/**
 * API错误信息
 */
export interface APIError {
  code: string
  message: string
  details?: any
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * 查询参数
 */
export interface QueryParams {
  page?: number
  pageSize?: number
  filter?: Record<string, any>
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
}

// ==================== 客户端配置 ====================

/**
 * REST客户端配置
 */
export interface RestClientConfig {
  baseURL: string
  timeout?: number
  retries?: number
  retryDelay?: number
  auth?: AuthConfig
  cache?: CacheConfig
  headers?: Record<string, string>
}

/**
 * 认证配置
 */
export interface AuthConfig {
  type: 'bearer' | 'basic' | 'custom'
  token?: string
  username?: string
  password?: string
  refreshToken?: string
  onTokenExpired?: () => void | Promise<void>
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean
  ttl?: number
  storage?: 'memory' | 'localStorage' | 'indexedDB'
  policy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only'
}

/**
 * WebSocket客户端配置
 */
export interface WebSocketConfig {
  url: string
  auth?: {
    token?: string
  }
  reconnect?: {
    enabled: boolean
    maxAttempts?: number
    backoff?: 'linear' | 'exponential'
  }
  heartbeat?: {
    enabled: boolean
    interval?: number
  }
  debug?: boolean
}

// ==================== 请求/响应类型 ====================

/**
 * 请求配置扩展
 */
export interface RequestConfig extends AxiosRequestConfig {
  cache?: boolean
  cacheTTL?: number
  retry?: boolean
  retryCount?: number
  skipAuth?: boolean
  skipErrorHandler?: boolean
}

/**
 * 批量操作请求
 */
export interface BatchRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url?: string
  id?: string
  data?: any
  config?: RequestConfig
}

/**
 * 批量操作响应
 */
export interface BatchResponse<T = any> {
  success: boolean
  results: T[]
  errors: Array<{
    index: number
    error: APIError
  }>
}

// ==================== 资源操作接口 ====================

/**
 * 资源API接口
 */
export interface ResourceAPI<T> {
  list(params?: QueryParams): Promise<T[]>
  get(id: string): Promise<T>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  batch(operations: BatchRequest[]): Promise<BatchResponse<T>>
}

// ==================== 拦截器类型 ====================

/**
 * 请求拦截器
 */
export interface RequestInterceptor {
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onRejected?: (error: any) => any
}

/**
 * 响应拦截器
 */
export interface ResponseInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>
  onRejected?: (error: any) => any
}

// ==================== WebSocket事件类型 ====================

/**
 * WebSocket事件基础类型
 */
export interface WSEvent {
  type: string
  data: any
  timestamp: Date
  userId?: string
  projectId?: string
}

/**
 * WebSocket连接事件
 */
export interface WSConnectionEvent {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error'
  message?: string
  attempt?: number
}

/**
 * WebSocket房间事件
 */
export interface WSRoomEvent {
  roomId: string
  userId: string
  action: 'joined' | 'left'
  timestamp: Date
}

// ==================== 错误类型 ====================

/**
 * 错误分类
 */
export type ErrorCategory =
  | 'auth'
  | 'permission'
  | 'network'
  | 'server'
  | 'client'
  | 'validation'
  | 'timeout'
  | 'unknown'

/**
 * 网络错误
 */
export interface NetworkErrorInfo {
  message: string
  statusCode?: number
  category: ErrorCategory
  retryable: boolean
  response?: any
  request?: any
}

// ==================== 统计类型 ====================

/**
 * 请求统计
 */
export interface RequestStats {
  total: number
  success: number
  failed: number
  cached: number
  avgResponseTime: number
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  entries: number
}
