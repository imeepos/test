/**
 * 认证状态管理
 * 管理用户登录状态和用户信息
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { UserService, type LoginDTO, type RegisterDTO } from '@/services'

interface AuthState {
  // 状态
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (data: LoginDTO) => Promise<void>
  register: (data: RegisterDTO) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: localStorage.getItem('auth_token'),
      isAuthenticated: !!localStorage.getItem('auth_token'),
      isLoading: false,
      error: null,

      // 登录
      login: async (data: LoginDTO) => {
        set({ isLoading: true, error: null })
        try {
          const response = await UserService.login(data)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '登录失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 注册
      register: async (data: RegisterDTO) => {
        set({ isLoading: true, error: null })
        try {
          const response = await UserService.register(data)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '注册失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 登出
      logout: async () => {
        try {
          await UserService.logout()
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
        }
      },

      // 刷新用户信息
      refreshUser: async () => {
        const { isAuthenticated } = get()
        if (!isAuthenticated) return

        set({ isLoading: true })
        try {
          const user = await UserService.getCurrentUser()
          set({ user, isLoading: false })
        } catch (error: any) {
          // 如果 token 失效,清除登录状态
          if (error.response?.status === 401) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
          }
          set({ isLoading: false })
        }
      },

      // 设置用户
      setUser: (user: User | null) => {
        set({ user })
      },

      // 设置 token
      setToken: (token: string | null) => {
        set({
          token,
          isAuthenticated: !!token,
        })
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)

export default useAuthStore
