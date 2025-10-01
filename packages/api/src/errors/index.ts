/**
 * API客户端错误类型
 */

import type { ErrorCategory, NetworkErrorInfo } from '../types/index.js'

/**
 * 网络错误基类
 */
export class NetworkError extends Error {
  public readonly statusCode?: number
  public readonly category: ErrorCategory
  public readonly retryable: boolean
  public readonly response?: any
  public readonly request?: any

  constructor(info: NetworkErrorInfo) {
    super(info.message)
    this.name = 'NetworkError'
    this.statusCode = info.statusCode
    this.category = info.category
    this.retryable = info.retryable
    this.response = info.response
    this.request = info.request

    // 保持原型链
    Object.setPrototypeOf(this, NetworkError.prototype)
  }

  /**
   * 从axios错误创建NetworkError
   */
  static fromAxiosError(error: any): NetworkError {
    const statusCode = error.response?.status
    const category = NetworkError.categorizeError(error)
    const retryable = NetworkError.isRetryable(category, statusCode)

    return new NetworkError({
      message: error.message || '网络请求失败',
      statusCode,
      category,
      retryable,
      response: error.response?.data,
      request: error.config
    })
  }

  /**
   * 错误分类
   */
  static categorizeError(error: any): ErrorCategory {
    const status = error.response?.status

    if (!status) {
      return 'network'
    }

    if (status === 401) return 'auth'
    if (status === 403) return 'permission'
    if (status === 408 || error.code === 'ECONNABORTED') return 'timeout'
    if (status >= 500) return 'server'
    if (status >= 400) return 'client'
    if (error.name === 'ValidationError') return 'validation'

    return 'unknown'
  }

  /**
   * 判断错误是否可重试
   */
  static isRetryable(category: ErrorCategory, statusCode?: number): boolean {
    // 网络错误、服务器错误、超时错误可重试
    if (['network', 'server', 'timeout'].includes(category)) {
      return true
    }

    // 429 (Too Many Requests) 可重试
    if (statusCode === 429) {
      return true
    }

    // 503 (Service Unavailable) 可重试
    if (statusCode === 503) {
      return true
    }

    return false
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    switch (this.category) {
      case 'auth':
        return '请重新登录'
      case 'permission':
        return '您没有权限执行此操作'
      case 'network':
        return '网络连接异常,请检查网络设置'
      case 'server':
        return '服务器暂时无法响应,请稍后重试'
      case 'timeout':
        return '请求超时,请检查网络连接'
      case 'validation':
        return '数据格式错误,请检查输入'
      case 'client':
        return '请求参数错误'
      default:
        return '发生未知错误,请联系技术支持'
    }
  }
}

/**
 * 认证错误
 */
export class AuthError extends Error {
  constructor(message: string = '认证失败') {
    super(message)
    this.name = 'AuthError'
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

/**
 * 验证错误
 */
export class ValidationError extends Error {
  public readonly field?: string
  public readonly value?: any

  constructor(message: string, field?: string, value?: any) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * 缓存命中标记(用于中断请求流程)
 */
export class CacheHit extends Error {
  public readonly data: any

  constructor(data: any) {
    super('Cache hit')
    this.name = 'CacheHit'
    this.data = data
    Object.setPrototypeOf(this, CacheHit.prototype)
  }
}

/**
 * WebSocket错误
 */
export class WebSocketError extends Error {
  public readonly code?: number
  public readonly reason?: string

  constructor(message: string, code?: number, reason?: string) {
    super(message)
    this.name = 'WebSocketError'
    this.code = code
    this.reason = reason
    Object.setPrototypeOf(this, WebSocketError.prototype)
  }
}

/**
 * 同步错误
 */
export class SyncError extends Error {
  public readonly conflictData?: any

  constructor(message: string, conflictData?: any) {
    super(message)
    this.name = 'SyncError'
    this.conflictData = conflictData
    Object.setPrototypeOf(this, SyncError.prototype)
  }
}
