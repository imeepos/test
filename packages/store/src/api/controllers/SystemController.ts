import { Request, Response } from 'express'
import { BaseController } from '../BaseController'
import { databaseManager } from '../../config/database'
import { storeService } from '../../services/StoreService'

/**
 * 系统管理API控制器
 */
export class SystemController extends BaseController {
  constructor() {
    super()
  }

  /**
   * 获取系统统计信息
   * GET /api/system/stats
   */
  getSystemStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await storeService.getSystemStats()
    this.success(res, stats)
  })

  /**
   * 缓存操作 - 设置缓存
   * POST /api/system/cache
   */
  setCache = this.asyncHandler(async (req: Request, res: Response) => {
    const { key, value, ttl } = req.body

    const requiredErrors = this.validateRequired(req.body, ['key', 'value'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const success = await storeService.cache(key, value, ttl)
    this.success(res, { success })
  })

  /**
   * 缓存操作 - 获取缓存
   * GET /api/system/cache/:key
   */
  getCache = this.asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params
    const decodedKey = decodeURIComponent(key)

    const value = await storeService.cache(decodedKey)
    this.success(res, value)
  })

  /**
   * 缓存操作 - 删除缓存
   * DELETE /api/system/cache
   */
  deleteCache = this.asyncHandler(async (req: Request, res: Response) => {
    const { key, isPattern } = req.body

    const requiredErrors = this.validateRequired(req.body, ['key'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const success = await storeService.deleteCache(key, isPattern)
    this.success(res, success)
  })

  /**
   * 执行数据库查询（受限制的管理功能）
   * POST /api/system/query
   */
  executeQuery = this.asyncHandler(async (req: Request, res: Response) => {
    const { sql, params } = req.body

    const requiredErrors = this.validateRequired(req.body, ['sql'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 安全检查：只允许SELECT语句
    const trimmedSql = sql.trim().toLowerCase()
    if (!trimmedSql.startsWith('select')) {
      return this.validationError(res, ['Only SELECT queries are allowed'])
    }

    const result = await databaseManager.query(sql, params)
    this.success(res, result)
  })

  /**
   * 获取数据库连接状态
   * GET /api/system/connection-status
   */
  getConnectionStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const status = databaseManager.getConnectionStatus()
    this.success(res, status)
  })

  /**
   * 验证数据完整性
   * POST /api/system/validate-integrity
   */
  validateDataIntegrity = this.asyncHandler(async (req: Request, res: Response) => {
    const result = await storeService.validateDataIntegrity()
    this.success(res, result)
  })

  /**
   * 修复数据完整性问题
   * POST /api/system/repair-integrity
   */
  repairDataIntegrity = this.asyncHandler(async (req: Request, res: Response) => {
    const result = await storeService.repairDataIntegrity()
    this.success(res, result)
  })

  /**
   * 系统清理
   * POST /api/system/cleanup
   */
  cleanup = this.asyncHandler(async (req: Request, res: Response) => {
    const options = this.sanitizeInput(req.body, ['oldTasks', 'oldLogs', 'oldArchived'])
    const result = await storeService.cleanup(options)
    this.success(res, result)
  })

  /**
   * 执行数据库迁移
   * POST /api/system/migrate
   */
  migrate = this.asyncHandler(async (req: Request, res: Response) => {
    await storeService.migrate()
    this.success(res, { message: 'Migration completed successfully' })
  })

  /**
   * 获取迁移状态
   * GET /api/system/migration-status
   */
  getMigrationStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const status = await storeService.getMigrationStatus()
    this.success(res, status)
  })

  /**
   * 创建数据库备份
   * POST /api/system/backup
   */
  createBackup = this.asyncHandler(async (req: Request, res: Response) => {
    const backup = await storeService.createBackup()
    this.success(res, backup)
  })

  /**
   * 系统性能指标
   * GET /api/system/metrics
   */
  getMetrics = this.asyncHandler(async (req: Request, res: Response) => {
    const metrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV
    }

    this.success(res, metrics)
  })

  /**
   * 检查服务依赖状态
   * GET /api/system/dependencies
   */
  checkDependencies = this.asyncHandler(async (req: Request, res: Response) => {
    const healthCheck = await databaseManager.healthCheck()

    const dependencies = {
      postgres: {
        status: healthCheck.postgres.status,
        latency: healthCheck.postgres.latency,
        error: healthCheck.postgres.error
      },
      redis: {
        status: healthCheck.redis.status,
        latency: healthCheck.redis.latency,
        error: healthCheck.redis.error
      }
    }

    this.success(res, dependencies)
  })

  /**
   * API版本信息（覆盖路由中的简单版本）
   * GET /api/system/version
   */
  getVersion = this.asyncHandler(async (req: Request, res: Response) => {
    const packageInfo = {
      service: 'sker-store',
      version: '2.0.0',
      apiVersion: 'v1',
      build: process.env.BUILD_VERSION || 'dev',
      commit: process.env.GIT_COMMIT || 'unknown',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }

    this.success(res, packageInfo)
  })
}