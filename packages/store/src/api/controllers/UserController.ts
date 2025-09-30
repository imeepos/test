import { Request, Response } from 'express'
import { BaseController } from '../BaseController.js'
import { UserRepository } from '../../repositories/UserRepository.js'
import { validateEmail, validateUsername, validatePassword } from '../../index.js'

/**
 * 用户管理API控制器
 */
export class UserController extends BaseController {
  private userRepo: UserRepository

  constructor() {
    super()
    this.userRepo = new UserRepository()
  }

  /**
   * 获取用户列表
   * GET /api/v1/users
   */
  getUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const search = req.query.search as string
    const status = req.query.status as string

    let filter: any = {}

    if (search) {
      filter.$or = [
        { email: { $ilike: `%${search}%` } },
        { username: { $ilike: `%${search}%` } }
      ]
    }

    if (status) {
      filter.status = status
    }

    const users = await this.userRepo.findMany({
      ...filter,
      limit,
      offset,
      select: ['id', 'email', 'username', 'created_at', 'last_login', 'status']
    })

    // 获取总数（简化实现）
    const total = users.length // 在实际实现中应该有专门的count查询

    const pagination = this.createPagination(page, limit, total)
    this.success(res, users, pagination)
  })

  /**
   * 根据ID获取用户
   * GET /api/v1/users/:id
   */
  getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const user = await this.userRepo.findById(id)
    if (!user) {
      return this.notFound(res, 'User')
    }

    // 移除敏感信息
    const { password_hash, ...userWithoutPassword } = user as any
    this.success(res, userWithoutPassword)
  })

  /**
   * 根据邮箱获取用户
   * GET /api/v1/users/by-email/:email
   */
  getUserByEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params

    if (!validateEmail(email)) {
      return this.validationError(res, ['Invalid email format'])
    }

    const user = await this.userRepo.findByEmail(email)
    if (!user) {
      return this.notFound(res, 'User')
    }

    // 移除敏感信息
    const { password_hash, ...userWithoutPassword } = user as any
    this.success(res, userWithoutPassword)
  })

  /**
   * 根据用户名获取用户
   * GET /api/v1/users/by-username/:username
   */
  getUserByUsername = this.asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params

    if (!validateUsername(username)) {
      return this.validationError(res, ['Invalid username format'])
    }

    const user = await this.userRepo.findByUsername(username)
    if (!user) {
      return this.notFound(res, 'User')
    }

    // 移除敏感信息
    const { password_hash, ...userWithoutPassword } = user as any
    this.success(res, userWithoutPassword)
  })

  /**
   * 创建用户
   * POST /api/v1/users
   */
  createUser = this.asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = ['email', 'username', 'password', 'settings']
    const userData = this.sanitizeInput(req.body, allowedFields)

    // 验证必需字段
    const requiredErrors = this.validateRequired(userData, ['email', 'username', 'password'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 验证邮箱格式
    if (!validateEmail(userData.email)) {
      return this.validationError(res, ['Invalid email format'])
    }

    // 验证用户名格式
    if (!validateUsername(userData.username)) {
      return this.validationError(res, ['Invalid username format'])
    }

    // 验证密码强度
    const passwordValidation = validatePassword(userData.password)
    if (!passwordValidation.isValid) {
      return this.validationError(res, passwordValidation.errors)
    }

    try {
      const user = await this.userRepo.createUser(userData)

      // 移除敏感信息
      const { password_hash, ...userWithoutPassword } = user as any
      this.created(res, userWithoutPassword)
    } catch (error) {
      if (error instanceof Error && error.message.includes('已被使用')) {
        return this.error(res, error, 409) // Conflict
      }
      throw error
    }
  })

  /**
   * 更新用户
   * PUT /api/v1/users/:id
   */
  updateUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const allowedFields = ['email', 'username', 'settings', 'status']
    const updateData = this.sanitizeInput(req.body, allowedFields)

    // 验证邮箱格式（如果提供）
    if (updateData.email && !validateEmail(updateData.email)) {
      return this.validationError(res, ['Invalid email format'])
    }

    // 验证用户名格式（如果提供）
    if (updateData.username && !validateUsername(updateData.username)) {
      return this.validationError(res, ['Invalid username format'])
    }

    try {
      const user = await this.userRepo.update(id, updateData)
      if (!user) {
        return this.notFound(res, 'User')
      }

      // 移除敏感信息
      const { password_hash, ...userWithoutPassword } = user as any
      this.success(res, userWithoutPassword)
    } catch (error) {
      if (error instanceof Error && error.message.includes('已被使用')) {
        return this.error(res, error, 409) // Conflict
      }
      throw error
    }
  })

  /**
   * 删除用户
   * DELETE /api/v1/users/:id
   */
  deleteUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.userRepo.delete(id)
    if (!success) {
      return this.notFound(res, 'User')
    }

    this.noContent(res)
  })

  /**
   * 用户认证
   * POST /api/v1/users/authenticate
   */
  authenticate = this.asyncHandler(async (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body

    const requiredErrors = this.validateRequired(req.body, ['emailOrUsername', 'password'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    try {
      const result = await this.userRepo.authenticate(emailOrUsername, password)
      this.success(res, result)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        return this.unauthorized(res, 'Invalid credentials')
      }
      throw error
    }
  })

  /**
   * 验证密码
   * POST /api/v1/users/:id/verify-password
   */
  verifyPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { password } = req.body

    const requiredErrors = this.validateRequired(req.body, ['password'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const isValid = await this.userRepo.verifyPassword(id, password)
    this.success(res, { isValid })
  })

  /**
   * 更新密码
   * PUT /api/v1/users/:id/password
   */
  updatePassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { oldPassword, newPassword } = req.body

    const requiredErrors = this.validateRequired(req.body, ['oldPassword', 'newPassword'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 验证新密码强度
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return this.validationError(res, passwordValidation.errors)
    }

    try {
      const success = await this.userRepo.updatePassword(id, oldPassword, newPassword)
      if (!success) {
        return this.unauthorized(res, 'Invalid old password')
      }

      this.success(res, { message: 'Password updated successfully' })
    } catch (error) {
      throw error
    }
  })

  /**
   * 更新最后登录时间
   * PUT /api/v1/users/:id/last-login
   */
  updateLastLogin = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    await this.userRepo.updateLastLogin(id)
    this.success(res, { message: 'Last login updated' })
  })

  /**
   * 获取用户统计信息
   * GET /api/v1/users/:id/stats
   */
  getUserStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const stats = await this.userRepo.getStatistics(id)
    this.success(res, stats)
  })

  /**
   * 获取活跃用户
   * GET /api/v1/users/active
   */
  getActiveUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30

    const users = await this.userRepo.getActiveUsers(days)
    this.success(res, users)
  })
}