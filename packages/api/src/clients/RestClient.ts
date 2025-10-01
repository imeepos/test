/**
 * REST API客户端
 */

import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type {
  RestClientConfig,
  RequestConfig,
  APIResponse,
  QueryParams,
  BatchRequest,
  BatchResponse,
  ResourceAPI,
  RequestStats
} from '../types/index.js'
import { NetworkError } from '../errors/index.js'

/**
 * REST API客户端类
 */
export class RestClient {
  private http: AxiosInstance
  private config: RestClientConfig
  private stats: RequestStats = {
    total: 0,
    success: 0,
    failed: 0,
    cached: 0,
    avgResponseTime: 0
  }
  private responseTimes: number[] = []

  constructor(config: RestClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    }

    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      }
    })

    this.setupInterceptors()
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.http.interceptors.request.use(
      (config) => {
        // 添加认证token
        if (this.config.auth?.token && !config.headers.skipAuth) {
          const authType = this.config.auth.type || 'bearer'
          if (authType === 'bearer') {
            config.headers.Authorization = `Bearer ${this.config.auth.token}`
          } else if (authType === 'basic') {
            const credentials = btoa(
              `${this.config.auth.username}:${this.config.auth.password}`
            )
            config.headers.Authorization = `Basic ${credentials}`
          }
        }

        // 添加请求ID
        config.headers['X-Request-ID'] = this.generateRequestId()

        // 记录请求开始时间
        ;(config as any).__startTime = Date.now()

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.http.interceptors.response.use(
      (response) => {
        // 记录响应时间
        const startTime = (response.config as any).__startTime
        if (startTime) {
          const responseTime = Date.now() - startTime
          this.recordResponseTime(responseTime)
        }

        this.stats.total++
        this.stats.success++

        return response
      },
      async (error: AxiosError) => {
        this.stats.total++
        this.stats.failed++

        // 记录响应时间(即使失败)
        const startTime = (error.config as any)?.__startTime
        if (startTime) {
          const responseTime = Date.now() - startTime
          this.recordResponseTime(responseTime)
        }

        return this.handleError(error)
      }
    )
  }

  /**
   * 错误处理
   */
  private async handleError(error: AxiosError): Promise<any> {
    const networkError = NetworkError.fromAxiosError(error)

    // 401认证错误
    if (networkError.statusCode === 401) {
      if (this.config.auth?.onTokenExpired) {
        await this.config.auth.onTokenExpired()
      }
    }

    // 可重试的错误
    const config = error.config as RequestConfig
    if (
      networkError.retryable &&
      config &&
      config.retry !== false &&
      (!config.retryCount || config.retryCount < (this.config.retries || 3))
    ) {
      return this.retryRequest(config)
    }

    return Promise.reject(networkError)
  }

  /**
   * 重试请求
   */
  private async retryRequest(config: RequestConfig): Promise<any> {
    const retryCount = (config.retryCount || 0) + 1
    const retryDelay = this.calculateRetryDelay(retryCount)

    await this.sleep(retryDelay)

    config.retryCount = retryCount
    return this.http.request(config)
  }

  /**
   * 计算重试延迟(指数退避)
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelay || 1000
    return Math.min(baseDelay * Math.pow(2, retryCount - 1), 10000)
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 记录响应时间
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time)

    // 只保留最近100条记录
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift()
    }

    // 计算平均响应时间
    this.stats.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  // ==================== 公共API方法 ====================

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.http.get<APIResponse<T>>(url, config)
    return response.data.data as T
  }

  /**
   * POST请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.http.post<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.http.put<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.http.delete<APIResponse<T>>(url, config)
    return response.data.data as T
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.http.patch<APIResponse<T>>(url, data, config)
    return response.data.data as T
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    const response = await this.http.request<APIResponse<T>>(config)
    return response.data.data as T
  }

  /**
   * 批量请求
   */
  async batch<T = any>(operations: BatchRequest[]): Promise<BatchResponse<T>> {
    const results: T[] = []
    const errors: Array<{ index: number; error: any }> = []

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      try {
        let result: T

        switch (op.method) {
          case 'GET':
            result = await this.get<T>(op.url || '', op.config)
            break
          case 'POST':
            result = await this.post<T>(op.url || '', op.data, op.config)
            break
          case 'PUT':
            result = await this.put<T>(
              op.id ? `${op.url}/${op.id}` : op.url || '',
              op.data,
              op.config
            )
            break
          case 'DELETE':
            result = await this.delete<T>(
              op.id ? `${op.url}/${op.id}` : op.url || '',
              op.config
            )
            break
          case 'PATCH':
            result = await this.patch<T>(
              op.id ? `${op.url}/${op.id}` : op.url || '',
              op.data,
              op.config
            )
            break
          default:
            throw new Error(`Unsupported method: ${op.method}`)
        }

        results.push(result)
      } catch (error: any) {
        errors.push({
          index: i,
          error: {
            code: error.code || 'BATCH_ERROR',
            message: error.message,
            details: error
          }
        })
        results.push(null as any)
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    }
  }

  /**
   * 创建资源API代理
   */
  resource<T = any>(endpoint: string): ResourceAPI<T> {
    return {
      list: async (params?: QueryParams) => {
        return this.get<T[]>(endpoint, { params })
      },

      get: async (id: string) => {
        return this.get<T>(`${endpoint}/${id}`)
      },

      create: async (data: Partial<T>) => {
        return this.post<T>(endpoint, data)
      },

      update: async (id: string, data: Partial<T>) => {
        return this.put<T>(`${endpoint}/${id}`, data)
      },

      delete: async (id: string) => {
        return this.delete<void>(`${endpoint}/${id}`)
      },

      batch: async (operations: BatchRequest[]) => {
        return this.batch<T>(operations)
      }
    }
  }

  /**
   * 设置认证Token
   */
  setAuthToken(token: string): void {
    if (!this.config.auth) {
      this.config.auth = { type: 'bearer' }
    }
    this.config.auth.token = token
  }

  /**
   * 清除认证Token
   */
  clearAuthToken(): void {
    if (this.config.auth) {
      delete this.config.auth.token
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { skipAuth: true } as RequestConfig)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取请求统计信息
   */
  getStats(): RequestStats {
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      cached: 0,
      avgResponseTime: 0
    }
    this.responseTimes = []
  }

  /**
   * 获取axios实例(用于高级用法)
   */
  getAxiosInstance(): AxiosInstance {
    return this.http
  }
}
