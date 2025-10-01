/**
 * Store Client 类型定义
 */

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

/**
 * Store客户端配置选项
 */
export interface StoreClientConfig {
  /** Store服务基础URL */
  baseURL: string
  /** 认证令牌 */
  authToken?: string
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}
