import { databaseManager } from '../config/database'
import { UserRepository } from '../repositories/UserRepository'
import { ProjectRepository } from '../repositories/ProjectRepository'
import { NodeRepository } from '../repositories/NodeRepository'
import { ConnectionRepository } from '../repositories/ConnectionRepository'
import { AITaskRepository } from '../repositories/AITaskRepository'
import { DatabaseError } from '../models'
// import { MessageBroker } from '@sker/broker'
// 临时类型定义，直到 @sker/broker 包可用
interface MessageBroker {
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  on(event: string, callback: (...args: any[]) => void): void
}
import { DataEventPublisher, createDataEventPublisher } from '../messaging/DataEventPublisher'

/**
 * 存储服务 - 提供统一的数据访问接口
 */
export class StoreService {
  private userRepo: UserRepository
  private projectRepo: ProjectRepository
  private nodeRepo: NodeRepository
  private connectionRepo: ConnectionRepository
  private aiTaskRepo: AITaskRepository
  private isInitialized: boolean = false
  private eventPublisher?: DataEventPublisher
  private messageBroker?: MessageBroker

  constructor() {
    this.userRepo = new UserRepository()
    this.projectRepo = new ProjectRepository()
    this.nodeRepo = new NodeRepository()
    this.connectionRepo = new ConnectionRepository()
    this.aiTaskRepo = new AITaskRepository()
  }

  /**
   * 初始化服务
   */
  async initialize(brokerUrl?: string): Promise<void> {
    try {
      await databaseManager.initialize()

      // 初始化消息代理和事件发布器（可选）
      if (brokerUrl) {
        try {
          // MessageBroker 暂时不可用，跳过消息代理初始化
          console.log('⚠️ MessageBroker 包不可用，跳过消息代理初始化')
        } catch (error) {
          console.warn('消息代理初始化失败，继续运行不包含事件发布功能:', error)
        }
        console.log('🎉 StoreService 初始化成功（不包含事件发布）')
      } else {
        console.log('🎉 StoreService 初始化成功（不包含事件发布）')
      }

      this.isInitialized = true
    } catch (error) {
      console.error('❌ StoreService 初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置数据库事件监听器
   */
  private setupDatabaseEventListeners(): void {
    if (!this.eventPublisher) return

    // 监听数据库连接事件
    databaseManager.on('connected', () => {
      this.eventPublisher?.publishConnectionEvent('connected', {
        service: 'store',
        timestamp: new Date()
      })
    })

    databaseManager.on('disconnected', () => {
      this.eventPublisher?.publishConnectionEvent('disconnected', {
        service: 'store',
        timestamp: new Date()
      })
    })

    databaseManager.on('error', (error) => {
      this.eventPublisher?.publishConnectionEvent('error', {
        service: 'store',
        error: error.message,
        timestamp: new Date()
      })
    })
  }

  /**
   * 检查服务是否已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new DatabaseError('服务未初始化', 'SERVICE_NOT_INITIALIZED', {})
    }
  }

  /**
   * 获取用户仓库
   */
  get users(): UserRepository {
    this.ensureInitialized()
    return this.userRepo
  }

  /**
   * 获取项目仓库
   */
  get projects(): ProjectRepository {
    this.ensureInitialized()
    return this.projectRepo
  }

  /**
   * 获取节点仓库
   */
  get nodes(): NodeRepository {
    this.ensureInitialized()
    return this.nodeRepo
  }

  /**
   * 获取连接仓库
   */
  get connections(): ConnectionRepository {
    this.ensureInitialized()
    return this.connectionRepo
  }

  /**
   * 获取AI任务仓库
   */
  get aiTasks(): AITaskRepository {
    this.ensureInitialized()
    return this.aiTaskRepo
  }

  /**
   * 获取事件发布器
   */
  get events(): DataEventPublisher | undefined {
    this.ensureInitialized()
    return this.eventPublisher
  }

  /**
   * 获取数据库管理器
   */
  get database() {
    this.ensureInitialized()
    return databaseManager
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    database: any
    timestamp: Date
    uptime: number
  }> {
    try {
      const dbHealth = await databaseManager.healthCheck()
      const isHealthy = dbHealth.postgres.status === 'healthy' && dbHealth.redis.status === 'healthy'

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: dbHealth,
        timestamp: new Date(),
        uptime: process.uptime()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        database: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        uptime: process.uptime()
      }
    }
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    users: { total: number; active: number; new_7d: number }
    projects: { total: number; active: number }
    nodes: { total: number }
    connections: { total: number }
    aiTasks: { total: number; processing: number; completed_24h: number }
  }> {
    try {
      // 用户统计
      const totalUsers = await this.userRepo.count()
      const activeUsers = await this.userRepo.count({ is_active: true })
      const newUsers = await this.userRepo.getNewUsers(7)

      // 项目统计
      const totalProjects = await this.projectRepo.count()
      const activeProjects = await this.projectRepo.count({ is_archived: false })

      // 节点统计
      const totalNodes = await this.nodeRepo.count()

      // 连接统计
      const totalConnections = await this.connectionRepo.count()

      // AI任务统计
      const totalAITasks = await this.aiTaskRepo.count()
      const processingTasks = await this.aiTaskRepo.count({ status: 'processing' })
      const completed24h = await this.aiTaskRepo.query(
        `SELECT COUNT(*) as count FROM ai_tasks WHERE status = 'completed' AND completed_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`
      )

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          new_7d: newUsers.length
        },
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        nodes: {
          total: totalNodes
        },
        connections: {
          total: totalConnections
        },
        aiTasks: {
          total: totalAITasks,
          processing: processingTasks,
          completed_24h: parseInt(completed24h[0]?.count || '0')
        }
      }
    } catch (error) {
      throw new DatabaseError(
        `获取系统统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_SYSTEM_STATS_ERROR',
        {}
      )
    }
  }

  /**
   * 执行数据库迁移
   */
  async migrate(): Promise<void> {
    const { MigrationManager } = await import('../migrations/migrate')
    const migrationManager = new MigrationManager()
    await migrationManager.migrate()
  }

  /**
   * 获取迁移状态
   */
  async getMigrationStatus(): Promise<{
    executed: string[]
    pending: string[]
    current: string | null
  }> {
    const { MigrationManager } = await import('../migrations/migrate')
    const migrationManager = new MigrationManager()
    return migrationManager.getStatus()
  }

  /**
   * 创建数据库备份
   */
  async createBackup(): Promise<{
    filename: string
    size: number
    timestamp: Date
  }> {
    // TODO: 实现数据库备份功能
    throw new Error('备份功能尚未实现')
  }

  /**
   * 清理操作
   */
  async cleanup(options: {
    oldTasks?: number // 清理多少天前的任务
    oldLogs?: number  // 清理多少天前的日志
    oldArchived?: number // 清理多少天前的归档项目
  } = {}): Promise<{
    tasksRemoved: number
    logsRemoved: number
    projectsRemoved: number
  }> {
    try {
      const {
        oldTasks = 90,
        oldLogs = 180,
        oldArchived = 365
      } = options

      const results = {
        tasksRemoved: 0,
        logsRemoved: 0,
        projectsRemoved: 0
      }

      // 清理旧任务
      if (oldTasks > 0) {
        results.tasksRemoved = await this.aiTaskRepo.cleanupOldTasks(oldTasks)
      }

      // 清理旧日志
      if (oldLogs > 0) {
        const logQuery = `
          DELETE FROM activity_logs
          WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${oldLogs} days'
        `
        const logResult = await databaseManager.query(logQuery)
        results.logsRemoved = (logResult as any).rowCount || 0
      }

      // 清理旧归档项目（需要用户确认）
      // results.projectsRemoved = await this.projectRepo.cleanupOldArchived(userId, oldArchived)

      console.log('🧹 数据清理完成:', results)
      return results
    } catch (error) {
      throw new DatabaseError(
        `数据清理失败: ${error instanceof Error ? error.message : error}`,
        'CLEANUP_ERROR',
        options
      )
    }
  }

  /**
   * 缓存操作
   */
  async cache(key: string, value?: any, ttl?: number): Promise<any> {
    if (value !== undefined) {
      // 设置缓存
      const success = await databaseManager.setCache(
        key,
        JSON.stringify(value),
        ttl
      )
      return success
    } else {
      // 获取缓存
      const cached = await databaseManager.getCache(key)
      return cached ? JSON.parse(cached) : null
    }
  }

  /**
   * 删除缓存
   */
  async deleteCache(keyOrPattern: string, isPattern: boolean = false): Promise<boolean> {
    if (isPattern) {
      return databaseManager.deleteCachePattern(keyOrPattern)
    } else {
      return databaseManager.deleteCache(keyOrPattern)
    }
  }

  /**
   * 批量操作支持
   */
  async batch<T>(operations: (() => Promise<T>)[]): Promise<T[]> {
    return databaseManager.transaction(async (client) => {
      const results: T[] = []
      for (const operation of operations) {
        const result = await operation()
        results.push(result)
      }
      return results
    })
  }

  /**
   * 发布实体变更事件
   */
  async publishEntityChange(params: {
    entityType: string
    entityId: string
    operation: 'create' | 'update' | 'delete'
    data: any
    oldData?: any
    userId?: string
    projectId?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    if (!this.eventPublisher) return

    await this.eventPublisher.publishEntityChange(params)
  }

  /**
   * 发布批量变更事件
   */
  async publishBulkChange(params: {
    entityType: string
    operation: 'create' | 'update' | 'delete'
    affectedCount: number
    filter: Record<string, any>
    changes?: any
    userId?: string
    projectId?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    if (!this.eventPublisher) return

    await this.eventPublisher.publishBulkChange(params)
  }

  /**
   * 关闭服务
   */
  async close(): Promise<void> {
    try {
      // 清理事件发布器
      if (this.eventPublisher) {
        await this.eventPublisher.cleanup()
      }

      // 关闭消息代理
      if (this.messageBroker) {
        await this.messageBroker.disconnect()
      }

      await databaseManager.close()
      this.isInitialized = false
      console.log('👋 StoreService 已关闭')
    } catch (error) {
      console.error('❌ 关闭 StoreService 时出错:', error)
      throw error
    }
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity(): Promise<{
    orphanedNodes: number
    orphanedConnections: number
    inconsistentVersions: number
    issues: string[]
  }> {
    try {
      const issues: string[] = []

      // 检查孤立节点（项目不存在）
      const orphanedNodesQuery = `
        SELECT COUNT(*) as count
        FROM nodes n
        LEFT JOIN projects p ON n.project_id = p.id
        WHERE p.id IS NULL
      `
      const orphanedNodesResult = await databaseManager.query(orphanedNodesQuery)
      const orphanedNodes = parseInt(orphanedNodesResult[0]?.count || '0')
      if (orphanedNodes > 0) {
        issues.push(`发现 ${orphanedNodes} 个孤立节点`)
      }

      // 检查孤立连接（节点不存在）
      const orphanedConnectionsQuery = `
        SELECT COUNT(*) as count
        FROM connections c
        LEFT JOIN nodes n1 ON c.source_node_id = n1.id
        LEFT JOIN nodes n2 ON c.target_node_id = n2.id
        WHERE n1.id IS NULL OR n2.id IS NULL
      `
      const orphanedConnectionsResult = await databaseManager.query(orphanedConnectionsQuery)
      const orphanedConnections = parseInt(orphanedConnectionsResult[0]?.count || '0')
      if (orphanedConnections > 0) {
        issues.push(`发现 ${orphanedConnections} 个孤立连接`)
      }

      // 检查版本不一致
      const versionInconsistencyQuery = `
        SELECT COUNT(*) as count
        FROM nodes n
        WHERE n.version != (
          SELECT COUNT(*) FROM node_versions nv WHERE nv.node_id = n.id
        )
      `
      const versionResult = await databaseManager.query(versionInconsistencyQuery)
      const inconsistentVersions = parseInt(versionResult[0]?.count || '0')
      if (inconsistentVersions > 0) {
        issues.push(`发现 ${inconsistentVersions} 个版本不一致的节点`)
      }

      return {
        orphanedNodes,
        orphanedConnections,
        inconsistentVersions,
        issues
      }
    } catch (error) {
      throw new DatabaseError(
        `数据完整性验证失败: ${error instanceof Error ? error.message : error}`,
        'VALIDATE_INTEGRITY_ERROR',
        {}
      )
    }
  }

  /**
   * 修复数据完整性问题
   */
  async repairDataIntegrity(): Promise<{
    orphanedNodesRemoved: number
    orphanedConnectionsRemoved: number
    versionsFixed: number
  }> {
    return databaseManager.transaction(async (client) => {
      let orphanedNodesRemoved = 0
      let orphanedConnectionsRemoved = 0
      let versionsFixed = 0

      // 删除孤立节点
      const removeOrphanedNodesQuery = `
        DELETE FROM nodes
        WHERE project_id NOT IN (SELECT id FROM projects)
      `
      const orphanedNodesResult = await client.query(removeOrphanedNodesQuery)
      orphanedNodesRemoved = orphanedNodesResult.rowCount || 0

      // 删除孤立连接
      const removeOrphanedConnectionsQuery = `
        DELETE FROM connections
        WHERE source_node_id NOT IN (SELECT id FROM nodes)
           OR target_node_id NOT IN (SELECT id FROM nodes)
      `
      const orphanedConnectionsResult = await client.query(removeOrphanedConnectionsQuery)
      orphanedConnectionsRemoved = orphanedConnectionsResult.rowCount || 0

      // 修复版本计数（这里简化处理，实际可能需要更复杂的逻辑）
      const fixVersionsQuery = `
        UPDATE nodes
        SET version = (
          SELECT COUNT(*) FROM node_versions nv WHERE nv.node_id = nodes.id
        )
        WHERE version != (
          SELECT COUNT(*) FROM node_versions nv WHERE nv.node_id = nodes.id
        )
      `
      const versionsResult = await client.query(fixVersionsQuery)
      versionsFixed = versionsResult.rowCount || 0

      return {
        orphanedNodesRemoved,
        orphanedConnectionsRemoved,
        versionsFixed
      }
    })
  }
}

// 导出单例实例
export const storeService = new StoreService()