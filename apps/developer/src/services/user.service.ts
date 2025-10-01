/**
 * 用户服务
 * 处理用户相关的 API 调用
 */
import { request } from './api/client'
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from './api/endpoints'
import type { User, UserProfile } from '@/types'
import { ENABLE_MOCK, mockUserApi } from '@/mocks'

export interface LoginDTO {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterDTO {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export interface UpdateProfileDTO {
  displayName?: string
  bio?: string
  website?: string
  location?: string
  skills?: string[]
  github?: string
  twitter?: string
}

export interface ChangePasswordDTO {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 用户登录
   */
  static async login(data: LoginDTO): Promise<LoginResponse> {
    let response: LoginResponse

    if (ENABLE_MOCK) {
      response = await mockUserApi.login(data)
    } else {
      response = await request.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, data)
    }

    // 保存 token
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken)
      }
    }

    return response
  }

  /**
   * 用户注册
   */
  static async register(data: RegisterDTO): Promise<LoginResponse> {
    const response = await request.post<LoginResponse>(AUTH_ENDPOINTS.REGISTER, data)

    // 保存 token
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken)
      }
    }

    return response
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      await request.post(AUTH_ENDPOINTS.LOGOUT)
    } finally {
      // 清除本地存储
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  /**
   * 刷新 token
   */
  static async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await request.post<{ token: string; refreshToken: string }>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken }
    )

    // 更新 token
    if (response.token) {
      localStorage.setItem('auth_token', response.token)
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken)
      }
    }

    return response
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    if (ENABLE_MOCK) {
      return mockUserApi.getCurrentUser()
    }
    return request.get<User>(USER_ENDPOINTS.ME)
  }

  /**
   * 获取用户资料
   */
  static async getUserProfile(): Promise<UserProfile> {
    return request.get<UserProfile>(USER_ENDPOINTS.PROFILE)
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
    return request.put<UserProfile>(USER_ENDPOINTS.UPDATE_PROFILE, data)
  }

  /**
   * 修改密码
   */
  static async changePassword(data: ChangePasswordDTO): Promise<{ success: boolean; message: string }> {
    return request.post(USER_ENDPOINTS.CHANGE_PASSWORD, data)
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)

    return request.post<{ url: string }>(USER_ENDPOINTS.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * 忘记密码
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return request.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email })
  }

  /**
   * 重置密码
   */
  static async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return request.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, password })
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return request.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token })
  }
}

export default UserService
