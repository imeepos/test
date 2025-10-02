/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关操作
 */

import { apiClient, type ExtendedRequestConfig } from './apiClient'
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth'

export class AuthService {
  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/users/auth/register', data)

      // 保存Token到APIClient
      if (response.token) {
        apiClient.setAuthToken(response.token)
      }

      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/users/auth/login', data)

      // 保存Token到APIClient
      if (response.token) {
        apiClient.setAuthToken(response.token)
      }

      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 发送登出请求，跳过401错误处理避免死循环
      const config: ExtendedRequestConfig = {
        skipAuthError: true, // 关键：跳过401认证错误处理
        skipRetry: true // 登出不需要重试
      }
      // 使用 undefined 代替 null，避免发送 "null" 字符串
      await apiClient.post('/api/users/auth/logout', undefined, config)
    } catch (error) {
      console.error('登出请求失败:', error)
      // 即使请求失败也要清除本地Token
    } finally {
      // 清除Token
      apiClient.clearAuthToken()
    }
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/users/auth/refresh', {
        refresh_token: refreshToken,
      })

      // 更新Token
      if (response.token) {
        apiClient.setAuthToken(response.token)
      }

      return response
    } catch (error) {
      console.error('刷新Token失败:', error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiClient.get<User>('/api/users/profile')
      return user
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 检查Token是否有效
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }
}

// 导出单例实例
export const authService = new AuthService()
