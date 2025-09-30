import { BaseRepository } from './BaseRepository.js'
import { User, UserStats, QueryOptions, DatabaseError } from '../models/index.js'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

/**
 * 用户仓库 - 处理用户相关的数据库操作
 */
export class UserRepository extends BaseRepository<User> {
  private readonly jwtSecret: string

  constructor() {
    super('users')
    this.jwtSecret = process.env.JWT_SECRET || 'sker-default-secret'
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() })
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username })
  }

  /**
   * 根据邮箱或用户名查找用户
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE email = $1 OR username = $1
        LIMIT 1
      `
      const result = await this.pool.query(query, [emailOrUsername.toLowerCase()])
      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(
        `根据邮箱或用户名查找用户失败: ${error instanceof Error ? error.message : error}`,
        'FIND_BY_EMAIL_OR_USERNAME_ERROR',
        { emailOrUsername }
      )
    }
  }

  /**
   * 创建用户
   */
  async createUser(userData: {
    email: string
    username: string
    password: string
    settings?: any
  }): Promise<User> {
    try {
      // 检查邮箱是否已存在
      const existingByEmail = await this.findByEmail(userData.email)
      if (existingByEmail) {
        throw new DatabaseError('邮箱已被使用', 'EMAIL_ALREADY_EXISTS', { email: userData.email })
      }

      // 检查用户名是否已存在
      const existingByUsername = await this.findByUsername(userData.username)
      if (existingByUsername) {
        throw new DatabaseError('用户名已被使用', 'USERNAME_ALREADY_EXISTS', { username: userData.username })
      }

      // 加密密码
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(userData.password, saltRounds)

      // 默认设置
      const defaultSettings = {
        theme: 'light',
        language: 'zh-CN',
        notifications: {
          email: true,
          push: true,
          task_completion: true,
          collaboration: true
        },
        ai_preferences: {
          default_model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000
        },
        ...userData.settings
      }

      // 创建用户
      return this.create({
        email: userData.email.toLowerCase(),
        username: userData.username,
        password_hash: passwordHash,
        settings: defaultSettings,
        is_active: true
      } as Partial<User>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `创建用户失败: ${error instanceof Error ? error.message : error}`,
        'CREATE_USER_ERROR',
        userData
      )
    }
  }

  /**
   * 验证用户密码
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.findById(userId)
      if (!user) return false

      return bcrypt.compare(password, user.password_hash)
    } catch (error) {
      throw new DatabaseError(
        `验证密码失败: ${error instanceof Error ? error.message : error}`,
        'VERIFY_PASSWORD_ERROR',
        { userId }
      )
    }
  }

  /**
   * 用户登录验证
   */
  async authenticate(emailOrUsername: string, password: string): Promise<{
    user: User
    token: string
  } | null> {
    try {
      const user = await this.findByEmailOrUsername(emailOrUsername)
      if (!user || !user.is_active) return null

      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) return null

      // 更新最后登录时间
      await this.updateLastLogin(user.id)

      // 生成JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username
        },
        this.jwtSecret,
        { expiresIn: '7d' }
      )

      return {
        user: { ...user, password_hash: '' } as User, // 清空密码哈希
        token
      }
    } catch (error) {
      throw new DatabaseError(
        `用户认证失败: ${error instanceof Error ? error.message : error}`,
        'AUTHENTICATE_ERROR',
        { emailOrUsername }
      )
    }
  }

  /**
   * 验证JWT token
   */
  verifyToken(token: string): { userId: string; email: string; username: string } | null {
    try {
      return jwt.verify(token, this.jwtSecret) as {
        userId: string
        email: string
        username: string
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.update(userId, {
        last_login_at: new Date(),
        updated_at: new Date()
      } as Partial<User>)
    } catch (error) {
      // 登录时间更新失败不应该阻止登录过程，仅记录错误
      console.error(`更新用户最后登录时间失败: ${error}`)
    }
  }

  /**
   * 更新用户密码
   */
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // 验证旧密码
      const isValidOldPassword = await this.verifyPassword(userId, oldPassword)
      if (!isValidOldPassword) {
        throw new DatabaseError('旧密码不正确', 'INVALID_OLD_PASSWORD', { userId })
      }

      // 加密新密码
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      const result = await this.update(userId, {
        password_hash: newPasswordHash,
        updated_at: new Date()
      } as Partial<User>)

      return result !== null
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `更新密码失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_PASSWORD_ERROR',
        { userId }
      )
    }
  }

  /**
   * 重置密码（用于忘记密码功能）
   */
  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email)
      if (!user) {
        throw new DatabaseError('用户不存在', 'USER_NOT_FOUND', { email })
      }

      // 加密新密码
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(newPassword, saltRounds)

      // 更新密码
      const result = await this.update(user.id, {
        password_hash: passwordHash,
        updated_at: new Date()
      } as Partial<User>)

      return result !== null
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `重置密码失败: ${error instanceof Error ? error.message : error}`,
        'RESET_PASSWORD_ERROR',
        { email }
      )
    }
  }

  /**
   * 更新用户设置
   */
  async updateSettings(userId: string, settings: Partial<any>): Promise<User | null> {
    try {
      const user = await this.findById(userId)
      if (!user) return null

      // 合并设置
      const updatedSettings = {
        ...user.settings,
        ...settings
      }

      return this.update(userId, {
        settings: updatedSettings,
        updated_at: new Date()
      } as Partial<User>)
    } catch (error) {
      throw new DatabaseError(
        `更新用户设置失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_SETTINGS_ERROR',
        { userId, settings }
      )
    }
  }

  /**
   * 更新用户头像
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<User | null> {
    return this.update(userId, {
      avatar_url: avatarUrl,
      updated_at: new Date()
    } as Partial<User>)
  }

  /**
   * 激活用户账号
   */
  async activateUser(userId: string): Promise<boolean> {
    const result = await this.update(userId, {
      is_active: true,
      updated_at: new Date()
    } as Partial<User>)
    return result !== null
  }

  /**
   * 停用用户账号
   */
  async deactivateUser(userId: string): Promise<boolean> {
    const result = await this.update(userId, {
      is_active: false,
      updated_at: new Date()
    } as Partial<User>)
    return result !== null
  }

  /**
   * 获取用户统计信息
   */
  async getStatistics(userId: string): Promise<UserStats> {
    try {
      // 项目统计
      const projectStatsQuery = `
        SELECT COUNT(*) as project_count
        FROM projects
        WHERE user_id = $1
      `
      const projectStatsResult = await this.pool.query(projectStatsQuery, [userId])
      const projectStats = projectStatsResult.rows[0]

      // 节点统计
      const nodeStatsQuery = `
        SELECT COUNT(*) as node_count_total
        FROM nodes n
        INNER JOIN projects p ON n.project_id = p.id
        WHERE p.user_id = $1 AND n.status != 'deleted'
      `
      const nodeStatsResult = await this.pool.query(nodeStatsQuery, [userId])
      const nodeStats = nodeStatsResult.rows[0]

      // AI任务统计
      const aiStatsQuery = `
        SELECT
          COUNT(*) as ai_task_count_total,
          COALESCE(SUM(actual_cost), 0) as total_ai_cost
        FROM ai_tasks a
        INNER JOIN projects p ON a.project_id = p.id
        WHERE p.user_id = $1
      `
      const aiStatsResult = await this.pool.query(aiStatsQuery, [userId])
      const aiStats = aiStatsResult.rows[0]

      // 协作统计
      const collaborationStatsQuery = `
        SELECT COUNT(*) as collaboration_count
        FROM project_collaborators
        WHERE user_id = $1 AND status = 'active'
      `
      const collaborationStatsResult = await this.pool.query(collaborationStatsQuery, [userId])
      const collaborationStats = collaborationStatsResult.rows[0]

      // 账号年龄
      const user = await this.findById(userId)
      const accountAgeDays = user
        ? Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        project_count: parseInt(projectStats.project_count) || 0,
        node_count_total: parseInt(nodeStats.node_count_total) || 0,
        ai_task_count_total: parseInt(aiStats.ai_task_count_total) || 0,
        total_ai_cost: parseFloat(aiStats.total_ai_cost) || 0,
        collaboration_count: parseInt(collaborationStats.collaboration_count) || 0,
        account_age_days: accountAgeDays
      }
    } catch (error) {
      throw new DatabaseError(
        `获取用户统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_USER_STATISTICS_ERROR',
        { userId }
      )
    }
  }

  /**
   * 搜索用户（用于协作邀请等）
   */
  async searchUsers(
    query: string,
    excludeUserIds: string[] = [],
    options: QueryOptions = {}
  ): Promise<User[]> {
    try {
      const { limit = 20, offset = 0 } = options

      let whereConditions = [`(username ILIKE $1 OR email ILIKE $1)`, `is_active = true`]
      let params: any[] = [`%${query}%`]
      let paramIndex = 2

      if (excludeUserIds.length > 0) {
        const placeholders = excludeUserIds.map(() => `$${paramIndex++}`).join(', ')
        whereConditions.push(`id NOT IN (${placeholders})`)
        params.push(...excludeUserIds)
      }

      const sql = `
        SELECT id, username, email, avatar_url, created_at
        FROM ${this.tableName}
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY username
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `

      params.push(limit, offset)
      const result = await this.pool.query(sql, params)
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `搜索用户失败: ${error instanceof Error ? error.message : error}`,
        'SEARCH_USERS_ERROR',
        { query, excludeUserIds, options }
      )
    }
  }

  /**
   * 获取活跃用户列表
   */
  async getActiveUsers(days: number = 30, limit: number = 100): Promise<User[]> {
    try {
      const query = `
        SELECT DISTINCT u.id, u.username, u.email, u.avatar_url, u.last_login_at
        FROM ${this.tableName} u
        INNER JOIN activity_logs al ON u.id = al.user_id
        WHERE u.is_active = true
          AND al.created_at >= CURRENT_TIMESTAMP - INTERVAL '$1 days'
        ORDER BY u.last_login_at DESC
        LIMIT $2
      `

      const result = await this.pool.query(query, [days, limit])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取活跃用户失败: ${error instanceof Error ? error.message : error}`,
        'GET_ACTIVE_USERS_ERROR',
        { days, limit }
      )
    }
  }

  /**
   * 获取新注册用户
   */
  async getNewUsers(days: number = 7, limit: number = 50): Promise<User[]> {
    try {
      const query = `
        SELECT id, username, email, avatar_url, created_at
        FROM ${this.tableName}
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '$1 days'
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT $2
      `

      const result = await this.pool.query(query, [days, limit])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取新用户失败: ${error instanceof Error ? error.message : error}`,
        'GET_NEW_USERS_ERROR',
        { days, limit }
      )
    }
  }

  /**
   * 删除用户账号及相关数据
   */
  async deleteUserAccount(userId: string): Promise<boolean> {
    return this.transaction(async (client) => {
      try {
        // 删除用户的活动日志
        await client.query('DELETE FROM activity_logs WHERE user_id = $1', [userId])

        // 删除用户的AI任务
        await client.query('DELETE FROM ai_tasks WHERE user_id = $1', [userId])

        // 删除用户的协作关系
        await client.query('DELETE FROM project_collaborators WHERE user_id = $1', [userId])

        // 删除用户的项目和相关数据（级联删除会处理nodes, connections等）
        await client.query('DELETE FROM projects WHERE user_id = $1', [userId])

        // 最后删除用户账号
        const result = await client.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [userId])

        return (result.rowCount || 0) > 0
      } catch (error) {
        throw new DatabaseError(
          `删除用户账号失败: ${error instanceof Error ? error.message : error}`,
          'DELETE_USER_ACCOUNT_ERROR',
          { userId }
        )
      }
    })
  }

  /**
   * 检查用户名可用性
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.findByUsername(username)
    return user === null
  }

  /**
   * 检查邮箱可用性
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return user === null
  }

  /**
   * 获取用户公开信息（用于协作等场景）
   */
  async getPublicProfile(userId: string): Promise<{
    id: string
    username: string
    avatar_url?: string
    created_at: Date
  } | null> {
    try {
      const query = `
        SELECT id, username, avatar_url, created_at
        FROM ${this.tableName}
        WHERE id = $1 AND is_active = true
      `

      const result = await this.pool.query(query, [userId])
      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(
        `获取用户公开信息失败: ${error instanceof Error ? error.message : error}`,
        'GET_PUBLIC_PROFILE_ERROR',
        { userId }
      )
    }
  }
}