/**
 * HTTP API客户端
 * 基于axios封装的统一HTTP请求客户端
 * 提供认证、错误处理、重试等功能
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG } from '@/config/api'

/**
 * API响应格式
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp?: string
  requestId?: string
}

/**
 * 扩展的请求配置，支持自定义选项
 */
export interface ExtendedRequestConfig extends AxiosRequestConfig {
  skipAuthError?: boolean // 跳过401错误处理
  skipRetry?: boolean // 跳过重试逻辑
  _retry?: number // 内部重试计数
}

/**
 * API客户端配置
 */
export interface APIClientConfig {
  baseURL: string
  timeout?: number
  retries?: number
  retryDelay?: number
  onAuthError?: () => void
  onNetworkError?: (error: Error) => void
}

/**
 * HTTP API客户端类
 */
export class APIClient {
  private http: AxiosInstance
  private config: Required<APIClientConfig>
  private authToken: string | null = null

  constructor(config: APIClientConfig) {
    this.config = {
      timeout: API_CONFIG.timeout,
      retries: API_CONFIG.retries,
      retryDelay: API_CONFIG.retryDelay,
      onAuthError: () => console.error('认证失败'),
      onNetworkError: (error) => console.error('网络错误:', error),
      ...config,
    }

    // 创建axios实例
    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 设置拦截器
    this.setupInterceptors()

    // 从localStorage加载token
    this.loadAuthToken()
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器 - 添加认证token
    this.http.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }
        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId()
        return config
      },
      (error) => {
        console.error('请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 统一处理响应和错误
    this.http.interceptors.response.use(
      (response: AxiosResponse<APIResponse>) => {
        // 检查业务状态码
        if (response.data && response.data.success === false) {
          const error = new Error(response.data.error?.message || 'API请求失败')
          ;(error as any).code = response.data.error?.code
          ;(error as any).details = response.data.error?.details
          return Promise.reject(error)
        }
        return response
      },
      async (error: AxiosError<APIResponse>) => {
        // 处理不同类型的错误
        return this.handleError(error)
      }
    )
  }

  /**
   * 处理API错误
   */
  private async handleError(error: AxiosError<APIResponse>): Promise<any> {
    const config = error.config as ExtendedRequestConfig

    // 401 认证错误
    if (error.response?.status === 401) {
      // 检查是否跳过认证错误处理（例如logout请求）
      if (!config?.skipAuthError) {
        this.clearAuthToken()
        this.config.onAuthError()
      }
      return Promise.reject(new Error('认证失败,请重新登录'))
    }

    // 网络错误或超时
    if (!error.response) {
      this.config.onNetworkError(new Error('网络连接失败'))

      // 检查是否跳过重试逻辑
      if (!config?.skipRetry && config && (!config._retry || config._retry < this.config.retries)) {
        config._retry = (config._retry || 0) + 1

        // 延迟后重试
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay * config._retry!))

        console.log(`重试请求 (${config._retry}/${this.config.retries}): ${config.url}`)
        return this.http.request(config)
      }

      return Promise.reject(new Error('网络请求失败,请检查网络连接'))
    }

    // 服务器错误
    const errorMessage =
      error.response.data?.error?.message || error.message || '服务器错误,请稍后重试'

    return Promise.reject(new Error(errorMessage))
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 设置认证token
   */
  setAuthToken(token: string): void {
    this.authToken = token
    localStorage.setItem('auth_token', token)
  }

  /**
   * 清除认证token
   */
  clearAuthToken(): void {
    this.authToken = null
    localStorage.removeItem('auth_token')
  }

  /**
   * 从localStorage加载token
   */
  private loadAuthToken(): void {
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.authToken = token
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.get<APIResponse<T>>(url, config)
    // 确保返回有效数据，避免 undefined 或 null
    return (response.data.data ?? null) as T
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.post<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.put<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.delete<APIResponse<T>>(url, config)
    return response.data.data as T
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.patch<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * 获取完整响应(包含分页等信息)
   */
  async getFullResponse<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.http.get<APIResponse<T>>(url, config)
    return response.data
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health')
      return true
    } catch {
      return false
    }
  }

  /**
   * 设置认证错误回调
   */
  setAuthErrorHandler(handler: () => void): void {
    this.config.onAuthError = handler
  }
}

/**
 * 创建默认的API客户端实例
 */
export const gatewayClient = new APIClient({
  baseURL: API_CONFIG.gateway,
})

export const storeClient = new APIClient({
  baseURL: API_CONFIG.store,
})

/**
 * 导出单例实例(默认使用Gateway)
 */
export const apiClient = gatewayClient

/**
 * 设置认证错误回调
 * 在应用启动时由authStore调用，建立双向连接
 */
export function setupAuthErrorHandler(onAuthError: () => void): void {
  gatewayClient.setAuthErrorHandler(onAuthError)
  storeClient.setAuthErrorHandler(onAuthError)
}
