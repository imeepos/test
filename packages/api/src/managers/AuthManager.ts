/**
 * 认证管理器
 */

import { AuthError } from '../errors/index.js'

/**
 * Token存储类型
 */
export type TokenStorage = 'localStorage' | 'sessionStorage' | 'memory'

/**
 * 认证凭据
 */
export interface AuthCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenType?: string
}

/**
 * 认证管理器配置
 */
export interface AuthManagerConfig {
  tokenStorage?: TokenStorage
  refreshThreshold?: number // Token过期前多久刷新(秒)
  autoRefresh?: boolean
  onTokenExpired?: () => void | Promise<void>
  onTokenRefreshed?: (tokens: AuthCredentials) => void | Promise<void>
}

/**
 * 认证管理器类
 */
export class AuthManager {
  private config: Required<AuthManagerConfig>
  private credentials: AuthCredentials | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()

  constructor(config: AuthManagerConfig = {}) {
    this.config = {
      tokenStorage: config.tokenStorage || 'localStorage',
      refreshThreshold: config.refreshThreshold || 300,
      autoRefresh: config.autoRefresh !== false,
      onTokenExpired: config.onTokenExpired || (() => {}),
      onTokenRefreshed: config.onTokenRefreshed || (() => {})
    }

    // 从存储加载token
    this.loadFromStorage()
  }

  /**
   * 设置认证凭据
   */
  async setCredentials(credentials: AuthCredentials): Promise<void> {
    this.credentials = {
      ...credentials,
      tokenType: credentials.tokenType || 'Bearer'
    }

    // 保存到存储
    this.saveToStorage()

    // 设置自动刷新
    if (this.config.autoRefresh && credentials.expiresAt) {
      this.scheduleRefresh()
    }

    // 触发事件
    this.emit('authStateChanged', true)
  }

  /**
   * 获取访问Token
   */
  getAccessToken(): string | null {
    if (!this.credentials) {
      return null
    }

    if (this.isTokenExpired()) {
      return null
    }

    return this.credentials.accessToken
  }

  /**
   * 获取刷新Token
   */
  getRefreshToken(): string | null {
    return this.credentials?.refreshToken || null
  }

  /**
   * 检查Token是否有效
   */
  isTokenValid(): boolean {
    if (!this.credentials?.accessToken) {
      return false
    }

    return !this.isTokenExpired()
  }

  /**
   * 检查Token是否过期
   */
  private isTokenExpired(): boolean {
    if (!this.credentials?.expiresAt) {
      return false // 没有过期时间,认为永久有效
    }

    return new Date() >= this.credentials.expiresAt
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<AuthCredentials> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new AuthError('没有可用的刷新Token')
    }

    try {
      // 这里需要实际的刷新逻辑,由使用方提供
      // 抛出错误提示需要实现
      throw new AuthError('需要实现refreshToken方法')
    } catch (error: any) {
      await this.config.onTokenExpired()
      throw error
    }
  }

  /**
   * 调度Token刷新
   */
  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (!this.credentials?.expiresAt) {
      return
    }

    const now = new Date().getTime()
    const expiresAt = this.credentials.expiresAt.getTime()
    const threshold = this.config.refreshThreshold * 1000

    const refreshAt = expiresAt - threshold
    const delay = refreshAt - now

    if (delay > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch((error) => {
          console.error('Token自动刷新失败:', error)
        })
      }, delay)
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    this.credentials = null

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    this.clearStorage()
    this.emit('authStateChanged', false)
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const storage = this.getStorage()
      if (!storage) return

      const data = storage.getItem('auth_credentials')
      if (data) {
        const credentials = JSON.parse(data)
        // 转换日期对象
        if (credentials.expiresAt) {
          credentials.expiresAt = new Date(credentials.expiresAt)
        }
        this.credentials = credentials

        if (this.config.autoRefresh && credentials.expiresAt) {
          this.scheduleRefresh()
        }
      }
    } catch (error) {
      console.error('加载认证信息失败:', error)
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const storage = this.getStorage()
      if (!storage || !this.credentials) return

      storage.setItem('auth_credentials', JSON.stringify(this.credentials))
    } catch (error) {
      console.error('保存认证信息失败:', error)
    }
  }

  /**
   * 清除存储
   */
  private clearStorage(): void {
    try {
      const storage = this.getStorage()
      if (!storage) return

      storage.removeItem('auth_credentials')
    } catch (error) {
      console.error('清除认证信息失败:', error)
    }
  }

  /**
   * 获取存储对象
   */
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null
    }

    if (this.config.tokenStorage === 'localStorage') {
      return window.localStorage
    } else if (this.config.tokenStorage === 'sessionStorage') {
      return window.sessionStorage
    }

    return null
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback)
    } else {
      this.eventListeners.delete(event)
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error)
        }
      })
    }
  }
}
