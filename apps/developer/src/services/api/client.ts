/**
 * API 客户端配置
 * 基于 Axios 的 HTTP 客户端
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

// API 配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// 创建 Axios 实例
export const apiClient: AxiosInstance = axios.create(API_CONFIG)

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证 token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    config.metadata = { startTime: Date.now() }

    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log('[API Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const duration = Date.now() - (response.config.metadata?.startTime || 0)

    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log('[API Response]', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      })
    }

    return response
  },
  (error: AxiosError) => {
    // 错误处理
    const duration = Date.now() - (error.config?.metadata?.startTime || 0)

    console.error('[API Response Error]', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      duration: `${duration}ms`,
      message: error.message,
      data: error.response?.data,
    })

    // 处理常见错误状态码
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 未授权 - 清除 token 并跳转登录
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break

        case 403:
          // 禁止访问
          console.error('Access forbidden:', data)
          break

        case 404:
          // 资源不存在
          console.error('Resource not found:', data)
          break

        case 500:
          // 服务器错误
          console.error('Server error:', data)
          break

        default:
          console.error('API error:', data)
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('No response received:', error.request)
    } else {
      // 请求配置错误
      console.error('Request config error:', error.message)
    }

    return Promise.reject(error)
  }
)

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

/**
 * 通用请求方法
 */
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
}

export default apiClient
