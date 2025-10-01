/**
 * 认证相关类型定义
 */

// 用户信息
export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string | null
  bio?: string | null
  preferences?: Record<string, unknown>
  created_at: Date | string
  last_login_at?: Date | string | null
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  email: string
  password: string
  name: string
  avatar?: string
}

// 认证响应
export interface AuthResponse {
  token: string
  refresh_token: string
  expires_in: number
  user: User
}

// 认证状态
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

// 认证错误
export interface AuthError {
  code: string
  message: string
}
