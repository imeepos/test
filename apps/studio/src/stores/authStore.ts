/**
 * 认证状态管理
 * 管理用户登录状态、用户信息等
 */

import { create } from 'zustand'
import { authService } from '@/services/authService'
import { setupAuthErrorHandler } from '@/services/apiClient'
import type { User, AuthStatus, AuthError, LoginRequest, RegisterRequest } from '@/types/auth'

export interface AuthState {
  // 状态
  status: AuthStatus
  user: User | null
  error: AuthError | null

  // 操作
  register: (data: RegisterRequest) => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  initialize: () => Promise<void>
}

// 设置认证错误处理器
let authErrorHandlerSetup = false

export const useAuthStore = create<AuthState>((set, get) => {
  // 设置认证错误处理器（仅执行一次）
  if (!authErrorHandlerSetup) {
    setupAuthErrorHandler(() => {
      console.warn('🔒 认证失败，自动登出')
      get().logout()
    })
    authErrorHandlerSetup = true
  }

  return {
    // 初始状态
    status: 'loading',
    user: null,
    error: null,

    // 用户注册
    register: async (data: RegisterRequest) => {
      try {
        set({ status: 'loading', error: null })

        const response = await authService.register(data)

        set({
          status: 'authenticated',
          user: response.user,
          error: null,
        })

        console.log('注册成功:', response.user)
      } catch (error) {
        const authError: AuthError = {
          code: 'REGISTER_FAILED',
          message: error instanceof Error ? error.message : '注册失败',
        }

        set({
          status: 'error',
          user: null,
          error: authError,
        })

        throw error
      }
    },

    // 用户登录
    login: async (data: LoginRequest) => {
      try {
        set({ status: 'loading', error: null })

        const response = await authService.login(data)

        set({
          status: 'authenticated',
          user: response.user,
          error: null,
        })

        console.log('登录成功:', response.user)
      } catch (error) {
        const authError: AuthError = {
          code: 'LOGIN_FAILED',
          message: error instanceof Error ? error.message : '登录失败',
        }

        set({
          status: 'error',
          user: null,
          error: authError,
        })

        throw error
      }
    },

    // 用户登出
    logout: async () => {
      try {
        await authService.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        set({
          status: 'unauthenticated',
          user: null,
          error: null,
        })

        console.log('用户已登出')
      }
    },

    // 刷新用户信息
    refreshUser: async () => {
      try {
        set({ status: 'loading', error: null })

        const user = await authService.getCurrentUser()

        set({
          status: 'authenticated',
          user,
          error: null,
        })
      } catch (error) {
        const authError: AuthError = {
          code: 'REFRESH_FAILED',
          message: error instanceof Error ? error.message : '获取用户信息失败',
        }

        set({
          status: 'error',
          user: null,
          error: authError,
        })

        throw error
      }
    },

    // 清除错误
    clearError: () => {
      set({ error: null })
    },

    // 初始化认证状态
    initialize: async () => {
      try {
        // 检查是否有Token
        if (!authService.isAuthenticated()) {
          set({ status: 'unauthenticated', user: null, error: null })
          return
        }

        // 验证Token有效性并获取用户信息
        set({ status: 'loading' })

        const isValid = await authService.validateToken()
        if (!isValid) {
          // Token无效，清除登录状态
          await authService.logout()
          set({ status: 'unauthenticated', user: null, error: null })
          return
        }

        // Token有效，获取用户信息
        const user = await authService.getCurrentUser()
        set({
          status: 'authenticated',
          user,
          error: null,
        })

        console.log('认证初始化完成:', user)
      } catch (error) {
        console.error('认证初始化失败:', error)
        // 初始化失败，清除登录状态
        await authService.logout()
        set({
          status: 'unauthenticated',
          user: null,
          error: null,
        })
      }
    },
  }
})
