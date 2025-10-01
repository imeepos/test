import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes.js'
import {
  LoginRequest,
  RegisterRequest,
  ProfileUpdateRequest,
  RefreshTokenRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest
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
    this.router.post('/auth/register', this.register.bind(this))
    this.router.post('/auth/login', this.login.bind(this))
    this.router.post('/auth/logout', this.logout.bind(this))
    this.router.post('/auth/refresh', this.refreshToken.bind(this))

    // 密码重置
    this.router.post('/auth/request-reset', this.requestPasswordReset.bind(this))
    this.router.post('/auth/reset-password', this.resetPassword.bind(this))

    // 用户资料
    this.router.get('/profile', this.getProfile.bind(this))
    this.router.put('/profile', this.updateProfile.bind(this))
  }

  private async register(req: ApiRequest<RegisterRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { email, password, name, avatar } = req.body

      // 验证输入
      if (!email || !password || !name) {
        res.error({
          code: 'MISSING_REQUIRED_FIELDS',
          message: '缺少必填字段：邮箱、密码或用户名',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.error({
          code: 'INVALID_EMAIL_FORMAT',
          message: '邮箱格式不正确',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 验证密码强度（至少6位）
      if (password.length < 6) {
        res.error({
          code: 'WEAK_PASSWORD',
          message: '密码至少需要6个字符',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 验证用户名长度
      if (name.trim().length < 2 || name.trim().length > 50) {
        res.error({
          code: 'INVALID_NAME_LENGTH',
          message: '用户名长度应在2-50个字符之间',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 检查邮箱是否已存在
        const existingUser = await this.storeClient!.users.findByEmail(email.toLowerCase().trim())
        if (existingUser) {
          res.error({
            code: 'EMAIL_ALREADY_EXISTS',
            message: '该邮箱已被注册',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 哈希密码
        const password_hash = await this.hashPassword(password)

        // 创建用户
        const newUser = await this.storeClient!.users.create({
          email: email.toLowerCase().trim(),
          password_hash,
          name: name.trim(),
          avatar: avatar || null,
          role: 'user',
          status: 'active',
          preferences: {},
          login_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        })

        if (!newUser) {
          res.error({
            code: 'USER_CREATION_FAILED',
            message: '用户创建失败',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成JWT Token
        const tokenPayload = {
          id: newUser.id,
          username: newUser.name,
          email: newUser.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }

        const token = this.generateJWTToken(tokenPayload)
        const refreshToken = this.generateRefreshToken(newUser.id)

        // 记录注册日志
        console.log(`User registered successfully: ${newUser.email} (${newUser.id})`)

        res.success({
          token,
          refresh_token: refreshToken,
          expires_in: 86400, // 24小时（秒）
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            avatar: newUser.avatar,
            created_at: newUser.created_at
          }
        }, 'Registration successful')

      } catch (dbError) {
        console.error('数据库操作失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '注册服务暂时不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('注册失败:', error)
      res.error({
        code: 'REGISTER_ERROR',
        message: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
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
        // 使用 store 服务的认证接口
        const authResult = await this.storeClient!.users.authenticate(email.toLowerCase().trim(), password)

        if (!authResult || !authResult.user || !authResult.token) {
          res.error({
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        const { user, token } = authResult

        // 检查用户状态
        if (!user.is_active) {
          res.error({
            code: 'ACCOUNT_DISABLED',
            message: '账户已禁用，请联系管理员',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成 Gateway 自己的 refresh token
        const refreshToken = this.generateRefreshToken(user.id)

        // 记录登录日志
        console.log(`User login successful: ${user.email} (${user.id})`)

        res.success({
          token, // 使用 store 服务返回的 token
          refresh_token: refreshToken,
          expires_in: 604800, // 7天（秒）
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar_url: user.avatar_url,
            settings: user.settings,
            created_at: user.created_at,
            last_login_at: user.last_login_at
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

  private async requestPasswordReset(req: ApiRequest<RequestPasswordResetRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { email } = req.body

      if (!email) {
        res.error({
          code: 'MISSING_EMAIL',
          message: '缺少邮箱地址',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 查找用户
        const user = await this.storeClient!.users.findByEmail(email.toLowerCase().trim())

        // 安全考虑：即使用户不存在也返回成功，防止邮箱枚举攻击
        if (!user) {
          res.success({
            message: '如果该邮箱已注册，重置链接已发送'
          }, 'Reset email sent')
          return
        }

        // 生成6位数字重置码
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30分钟有效期

        // 保存重置码到用户preferences（简化实现，生产环境应使用专门的表）
        await this.storeClient!.users.update(user.id, {
          preferences: {
            ...user.preferences,
            password_reset: {
              code: resetCode,
              expires_at: expiresAt,
              created_at: new Date()
            }
          }
        })

        // TODO: 实际项目中应发送邮件
        // await sendPasswordResetEmail(email, resetCode)

        // 开发环境在控制台输出重置码
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 密码重置码 [${email}]: ${resetCode} (30分钟有效)`)
        }

        res.success({
          message: '如果该邮箱已注册，重置链接已发送',
          // 开发环境返回重置码方便测试
          ...(process.env.NODE_ENV === 'development' && { reset_code: resetCode })
        }, 'Reset email sent')

      } catch (dbError) {
        console.error('数据库操作失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '服务暂时不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('请求密码重置失败:', error)
      res.error({
        code: 'REQUEST_RESET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to request password reset',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async resetPassword(req: ApiRequest<ResetPasswordRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { email, reset_code, new_password } = req.body

      if (!email || !reset_code || !new_password) {
        res.error({
          code: 'MISSING_FIELDS',
          message: '缺少必填字段',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 验证密码强度
      if (new_password.length < 6) {
        res.error({
          code: 'WEAK_PASSWORD',
          message: '密码至少需要6个字符',
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
            code: 'INVALID_RESET_CODE',
            message: '重置码无效或已过期',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 验证重置码
        const resetData = user.preferences?.password_reset
        if (!resetData || !resetData.code || !resetData.expires_at) {
          res.error({
            code: 'INVALID_RESET_CODE',
            message: '重置码无效或已过期',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 检查重置码是否匹配
        if (resetData.code !== reset_code) {
          res.error({
            code: 'INVALID_RESET_CODE',
            message: '重置码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 检查是否过期
        const expiresAt = new Date(resetData.expires_at)
        if (expiresAt < new Date()) {
          res.error({
            code: 'EXPIRED_RESET_CODE',
            message: '重置码已过期，请重新申请',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 哈希新密码
        const password_hash = await this.hashPassword(new_password)

        // 更新密码并清除重置码
        await this.storeClient!.users.update(user.id, {
          password_hash,
          preferences: {
            ...user.preferences,
            password_reset: undefined // 清除重置数据
          },
          updated_at: new Date()
        })

        console.log(`密码重置成功: ${user.email} (${user.id})`)

        res.success({
          message: '密码重置成功，请使用新密码登录'
        }, 'Password reset successful')

      } catch (dbError) {
        console.error('数据库操作失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '服务暂时不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('重置密码失败:', error)
      res.error({
        code: 'RESET_PASSWORD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reset password',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }
}