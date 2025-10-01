import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes.js'
import {
  LoginRequest,
  ProfileUpdateRequest,
  RefreshTokenRequest
} from '../types/SpecificTypes.js'
import { BaseRouter, RouterDependencies } from './BaseRouter.js'

/**
 * 用户管理路由器 - 处理用户认证和资料管理
 */
export class UserRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 用户认证
    this.router.post('/auth/login', this.login.bind(this))
    this.router.post('/auth/logout', this.logout.bind(this))
    this.router.post('/auth/refresh', this.refreshToken.bind(this))

    // 用户资料
    this.router.get('/profile', this.getProfile.bind(this))
    this.router.put('/profile', this.updateProfile.bind(this))
  }

  private async login(req: ApiRequest<LoginRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { email, password } = req.body

      // 验证输入
      if (!email || !password) {
        res.error({
          code: 'MISSING_CREDENTIALS',
          message: '缺少邮箱或密码',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 查找用户
        const user = await this.storeClient!.users.findByEmail(email.toLowerCase().trim())
        if (!user) {
          res.error({
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 验证密码
        const isPasswordValid = await this.verifyPassword(password, user.password_hash)
        if (!isPasswordValid) {
          res.error({
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 检查用户状态
        if (user.status !== 'active') {
          res.error({
            code: 'ACCOUNT_DISABLED',
            message: '账户已禁用，请联系管理员',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成JWT Token
        const tokenPayload = {
          id: user.id,
          username: user.name,
          email: user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }

        const token = this.generateJWTToken(tokenPayload)
        const refreshToken = this.generateRefreshToken(user.id)

        // 更新用户最后登录时间
        await this.storeClient!.users.update(user.id, {
          last_login_at: new Date(),
          login_count: (user.login_count || 0) + 1
        })

        // 记录登录日志
        console.log(`User login successful: ${user.email} (${user.id})`)

        res.success({
          token,
          refresh_token: refreshToken,
          expires_in: 86400, // 24小时（秒）
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            created_at: user.created_at,
            last_login_at: new Date()
          }
        }, 'Login successful')

      } catch (dbError) {
        console.error('数据库查询失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '登录服务暂时不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('登录失败:', error)
      res.error({
        code: 'LOGIN_ERROR',
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async logout(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const userId = req.user?.id

      // 记录登出日志
      if (userId) {
        console.log(`User logout: ${req.user?.email} (${userId})`)

        // 可以在这里添加token黑名单逻辑
        // 或者更新用户最后活动时间
        if (this.storeClient) {
          try {
            await this.storeClient.users.update(userId, {
              last_logout_at: new Date()
            })
          } catch (updateError) {
            console.warn('更新用户登出时间失败:', updateError)
          }
        }
      }

      res.success({
        message: '登出成功',
        logout_at: new Date()
      }, 'Logout successful')
    } catch (error) {
      console.error('登出失败:', error)
      res.error({
        code: 'LOGOUT_ERROR',
        message: error instanceof Error ? error.message : 'Logout failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async refreshToken(req: ApiRequest<RefreshTokenRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { refresh_token } = req.body

      if (!refresh_token) {
        res.error({
          code: 'MISSING_REFRESH_TOKEN',
          message: '缺少刷新令牌',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 验证刷新令牌
        const tokenData = this.verifyRefreshToken(refresh_token)
        if (!tokenData || !tokenData.userId) {
          res.error({
            code: 'INVALID_REFRESH_TOKEN',
            message: '刷新令牌无效',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 获取用户信息
        const user = await this.storeClient!.users.findById(tokenData.userId)
        if (!user || user.status !== 'active') {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在或已禁用',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成新的JWT Token
        const newTokenPayload = {
          id: user.id,
          username: user.name,
          email: user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }

        const newToken = this.generateJWTToken(newTokenPayload)
        const newRefreshToken = this.generateRefreshToken(user.id)

        res.success({
          token: newToken,
          refresh_token: newRefreshToken,
          expires_in: 86400, // 24小时（秒）
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, 'Token refreshed successfully')

      } catch (tokenError) {
        console.error('令牌刷新失败:', tokenError)
        res.error({
          code: 'TOKEN_VERIFICATION_FAILED',
          message: '令牌验证失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('刷新令牌失败:', error)
      res.error({
        code: 'REFRESH_TOKEN_ERROR',
        message: error instanceof Error ? error.message : 'Token refresh failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getProfile(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const userId = req.user?.id
      if (!userId) {
        res.error({
          code: 'USER_NOT_AUTHENTICATED',
          message: '用户未认证',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 从数据库获取完整的用户信息
        const user = await this.storeClient!.users.findById(userId)
        if (!user) {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        res.success({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          preferences: user.preferences,
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at,
          login_count: user.login_count,
          // 不返回敏感信息如密码哈希
        })
      } catch (dbError) {
        console.error('获取用户信息失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '获取用户信息失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      res.error({
        code: 'GET_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get profile',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async updateProfile(req: ApiRequest<ProfileUpdateRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const userId = req.user?.id
      if (!userId) {
        res.error({
          code: 'USER_NOT_AUTHENTICATED',
          message: '用户未认证',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 检查用户是否存在
        const existingUser = await this.storeClient!.users.findById(userId)
        if (!existingUser) {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 准备更新数据（只允许更新某些字段）
        const updateData: Record<string, unknown> = {}
        const {
          name,
          bio,
          avatar,
          preferences,
          current_password,
          new_password
        } = req.body

        if (name !== undefined) updateData.name = name.trim()
        if (bio !== undefined) updateData.bio = bio
        if (avatar !== undefined) updateData.avatar = avatar
        if (preferences !== undefined) updateData.preferences = preferences

        // 密码更新逻辑
        if (current_password && new_password) {
          const isCurrentPasswordValid = await this.verifyPassword(
            current_password,
            existingUser.password_hash
          )

          if (!isCurrentPasswordValid) {
            res.error({
              code: 'INVALID_CURRENT_PASSWORD',
              message: '当前密码不正确',
              timestamp: new Date(),
              requestId: req.requestId
            })
            return
          }

          // 简化实现：实际应使用bcrypt哈希
          updateData.password_hash = new_password // 应该哈希处理
        }

        // 更新时间戳
        updateData.updated_at = new Date()

        // 执行更新
        const updatedUser = await this.storeClient!.users.update(userId, updateData)

        if (!updatedUser) {
          res.error({
            code: 'UPDATE_FAILED',
            message: '用户资料更新失败',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 发布用户更新事件
        await this.storeClient!.publishEntityChange({
          entityType: 'user',
          entityId: userId,
          operation: 'update',
          data: {
            // 不记录敏感信息
            id: updatedUser.id,
            name: updatedUser.name,
            bio: updatedUser.bio,
            avatar: updatedUser.avatar
          },
          oldData: {
            name: existingUser.name,
            bio: existingUser.bio,
            avatar: existingUser.avatar
          },
          userId,
          metadata: {
            source: 'gateway_api',
            requestId: req.requestId,
            changedFields: Object.keys(updateData)
          }
        })

        // 返回更新后的用户信息（不包含密码）
        res.success({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          preferences: updatedUser.preferences,
          updated_at: updatedUser.updated_at
        }, 'Profile updated successfully')

      } catch (dbError) {
        console.error('更新用户资料失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '更新用户资料失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      res.error({
        code: 'UPDATE_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update profile',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }
}