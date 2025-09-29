import { BaseRepository } from './BaseRepository'
import { Project, ProjectStats, QueryOptions, PaginatedResult, DatabaseError } from '../models'

/**
 * 项目仓库 - 处理项目相关的数据库操作
 */
export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects')
  }

  /**
   * 根据用户ID查找项目
   */
  async findByUser(userId: string, options: QueryOptions = {}): Promise<Project[]> {
    const filters = { user_id: userId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据用户ID分页查找项目
   */
  async findByUserWithPagination(
    userId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Project>> {
    const filters = { user_id: userId, ...options.filters }
    return this.findWithPagination({ ...options, filters })
  }

  /**
   * 根据状态查找项目
   */
  async findByStatus(status: string | string[], options: QueryOptions = {}): Promise<Project[]> {
    const statusFilter = Array.isArray(status) ? status : [status]
    const filters = { status: statusFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 查找活跃项目（非归档状态）
   */
  async findActive(userId?: string, options: QueryOptions = {}): Promise<Project[]> {
    const filters: any = {
      is_archived: false,
      status: ['active', 'paused'],
      ...options.filters
    }
    if (userId) {
      filters.user_id = userId
    }
    return this.findMany({ ...options, filters })
  }

  /**
   * 查找归档项目
   */
  async findArchived(userId?: string, options: QueryOptions = {}): Promise<Project[]> {
    const filters: any = {
      is_archived: true,
      ...options.filters
    }
    if (userId) {
      filters.user_id = userId
    }
    return this.findMany({ ...options, filters })
  }

  /**
   * 搜索项目
   */
  async search(
    query: string,
    userId?: string,
    options: QueryOptions = {}
  ): Promise<Project[]> {
    try {
      const { orderBy = 'updated_at', orderDirection = 'DESC', limit, offset, filters = {} } = options

      let baseFilters = { ...filters }
      if (userId) {
        baseFilters.user_id = userId
      }

      const { whereClause: baseWhere, values: baseValues } = this.buildWhereClause(baseFilters)

      const searchCondition = `(name ILIKE $${baseValues.length + 1} OR description ILIKE $${baseValues.length + 1})`
      const whereClause = baseWhere
        ? `${baseWhere} AND ${searchCondition}`
        : `WHERE ${searchCondition}`

      const orderClause = this.buildOrderClause(orderBy, orderDirection)
      const limitClause = this.buildLimitClause(limit, offset)

      const sql = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim()

      const searchValue = `%${query}%`
      const result = await this.pool.query(sql, [...baseValues, searchValue])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `搜索项目失败: ${error instanceof Error ? error.message : error}`,
        'SEARCH_ERROR',
        { query, userId, options }
      )
    }
  }

  /**
   * 更新项目最后访问时间
   */
  async updateLastAccessed(projectId: string): Promise<Project | null> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET last_accessed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `
      const result = await this.pool.query(query, [projectId])
      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(
        `更新项目访问时间失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_LAST_ACCESSED_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 归档项目
   */
  async archive(projectId: string): Promise<Project | null> {
    return this.update(projectId, {
      is_archived: true,
      status: 'archived',
      updated_at: new Date()
    } as Partial<Project>)
  }

  /**
   * 取消归档项目
   */
  async unarchive(projectId: string): Promise<Project | null> {
    return this.update(projectId, {
      is_archived: false,
      status: 'active',
      updated_at: new Date()
    } as Partial<Project>)
  }

  /**
   * 复制项目
   */
  async duplicate(
    projectId: string,
    newName: string,
    userId: string
  ): Promise<Project> {
    return this.transaction(async (client) => {
      // 获取原项目信息
      const originalProject = await this.findById(projectId)
      if (!originalProject) {
        throw new DatabaseError('源项目不存在', 'SOURCE_PROJECT_NOT_FOUND', { projectId })
      }

      // 创建新项目
      const newProjectData = {
        ...originalProject,
        id: undefined,
        name: newName,
        user_id: userId,
        status: 'active',
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_accessed_at: new Date()
      }

      const createQuery = `
        INSERT INTO ${this.tableName} (
          user_id, name, description, status, canvas_data, settings, is_archived
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `

      const values = [
        userId,
        newName,
        originalProject.description,
        'active',
        originalProject.canvas_data,
        originalProject.settings,
        false
      ]

      const result = await client.query(createQuery, values)
      const newProject = result.rows[0]

      // 复制节点（如果需要）
      // 这里可以添加复制节点的逻辑

      return newProject
    })
  }

  /**
   * 获取项目统计信息
   */
  async getStatistics(projectId: string): Promise<ProjectStats> {
    try {
      // 节点统计
      const nodeStatsQuery = `
        SELECT
          COUNT(*) as node_count,
          AVG(importance) as avg_importance,
          AVG(confidence) as avg_confidence
        FROM nodes
        WHERE project_id = $1 AND status != 'deleted'
      `
      const nodeStatsResult = await this.pool.query(nodeStatsQuery, [projectId])
      const nodeStats = nodeStatsResult.rows[0]

      // 连接统计
      const connectionStatsQuery = `
        SELECT COUNT(*) as connection_count
        FROM connections
        WHERE project_id = $1
      `
      const connectionStatsResult = await this.pool.query(connectionStatsQuery, [projectId])
      const connectionStats = connectionStatsResult.rows[0]

      // AI任务统计
      const aiStatsQuery = `
        SELECT
          COUNT(*) as ai_task_count,
          COALESCE(SUM(actual_cost), 0) as total_ai_cost
        FROM ai_tasks
        WHERE project_id = $1
      `
      const aiStatsResult = await this.pool.query(aiStatsQuery, [projectId])
      const aiStats = aiStatsResult.rows[0]

      // 活动统计（最近7天）
      const activityStatsQuery = `
        SELECT COUNT(*) as activity_count_7d
        FROM activity_logs
        WHERE project_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      `
      const activityStatsResult = await this.pool.query(activityStatsQuery, [projectId])
      const activityStats = activityStatsResult.rows[0]

      // 最后活动时间
      const lastActivityQuery = `
        SELECT MAX(created_at) as last_activity_at
        FROM activity_logs
        WHERE project_id = $1
      `
      const lastActivityResult = await this.pool.query(lastActivityQuery, [projectId])
      const lastActivity = lastActivityResult.rows[0]

      return {
        node_count: parseInt(nodeStats.node_count) || 0,
        connection_count: parseInt(connectionStats.connection_count) || 0,
        avg_importance: parseFloat(nodeStats.avg_importance) || 0,
        avg_confidence: parseFloat(nodeStats.avg_confidence) || 0,
        ai_task_count: parseInt(aiStats.ai_task_count) || 0,
        total_ai_cost: parseFloat(aiStats.total_ai_cost) || 0,
        activity_count_7d: parseInt(activityStats.activity_count_7d) || 0,
        last_activity_at: lastActivity.last_activity_at || new Date()
      }
    } catch (error) {
      throw new DatabaseError(
        `获取项目统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_STATISTICS_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 获取用户的项目统计信息
   */
  async getUserProjectStatistics(userId: string): Promise<{
    total: number
    active: number
    archived: number
    byStatus: Record<string, number>
    totalNodes: number
    totalConnections: number
    totalAICost: number
  }> {
    try {
      // 项目统计
      const projectStatsQuery = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_archived = false THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as archived
        FROM ${this.tableName}
        WHERE user_id = $1
      `
      const projectStatsResult = await this.pool.query(projectStatsQuery, [userId])
      const projectStats = projectStatsResult.rows[0]

      // 按状态统计
      const statusStatsQuery = `
        SELECT status, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1
        GROUP BY status
      `
      const statusStatsResult = await this.pool.query(statusStatsQuery, [userId])
      const byStatus: Record<string, number> = {}
      statusStatsResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count)
      })

      // 节点总数
      const nodeStatsQuery = `
        SELECT COUNT(*) as total_nodes
        FROM nodes n
        INNER JOIN ${this.tableName} p ON n.project_id = p.id
        WHERE p.user_id = $1 AND n.status != 'deleted'
      `
      const nodeStatsResult = await this.pool.query(nodeStatsQuery, [userId])
      const nodeStats = nodeStatsResult.rows[0]

      // 连接总数
      const connectionStatsQuery = `
        SELECT COUNT(*) as total_connections
        FROM connections c
        INNER JOIN ${this.tableName} p ON c.project_id = p.id
        WHERE p.user_id = $1
      `
      const connectionStatsResult = await this.pool.query(connectionStatsQuery, [userId])
      const connectionStats = connectionStatsResult.rows[0]

      // AI成本总计
      const aiCostQuery = `
        SELECT COALESCE(SUM(actual_cost), 0) as total_ai_cost
        FROM ai_tasks a
        INNER JOIN ${this.tableName} p ON a.project_id = p.id
        WHERE p.user_id = $1
      `
      const aiCostResult = await this.pool.query(aiCostQuery, [userId])
      const aiCost = aiCostResult.rows[0]

      return {
        total: parseInt(projectStats.total) || 0,
        active: parseInt(projectStats.active) || 0,
        archived: parseInt(projectStats.archived) || 0,
        byStatus,
        totalNodes: parseInt(nodeStats.total_nodes) || 0,
        totalConnections: parseInt(connectionStats.total_connections) || 0,
        totalAICost: parseFloat(aiCost.total_ai_cost) || 0
      }
    } catch (error) {
      throw new DatabaseError(
        `获取用户项目统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_USER_STATISTICS_ERROR',
        { userId }
      )
    }
  }

  /**
   * 获取最近访问的项目
   */
  async getRecentlyAccessed(userId: string, limit: number = 10): Promise<Project[]> {
    const filters = {
      user_id: userId,
      is_archived: false
    }
    return this.findMany({
      filters,
      orderBy: 'last_accessed_at',
      orderDirection: 'DESC',
      limit
    })
  }

  /**
   * 获取热门项目（基于活动频率）
   */
  async getPopularProjects(userId: string, limit: number = 10): Promise<Project[]> {
    try {
      const query = `
        SELECT p.*, COUNT(al.id) as activity_count
        FROM ${this.tableName} p
        LEFT JOIN activity_logs al ON p.id = al.project_id
          AND al.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        WHERE p.user_id = $1 AND p.is_archived = false
        GROUP BY p.id
        ORDER BY activity_count DESC, p.last_accessed_at DESC
        LIMIT $2
      `

      const result = await this.pool.query(query, [userId, limit])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取热门项目失败: ${error instanceof Error ? error.message : error}`,
        'GET_POPULAR_PROJECTS_ERROR',
        { userId, limit }
      )
    }
  }

  /**
   * 清理旧的归档项目
   */
  async cleanupOldArchived(userId: string, daysOld: number = 365): Promise<number> {
    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE user_id = $1
          AND is_archived = true
          AND updated_at < CURRENT_TIMESTAMP - INTERVAL '$2 days'
      `

      const result = await this.pool.query(query, [userId, daysOld])
      return result.rowCount || 0
    } catch (error) {
      throw new DatabaseError(
        `清理旧归档项目失败: ${error instanceof Error ? error.message : error}`,
        'CLEANUP_OLD_ARCHIVED_ERROR',
        { userId, daysOld }
      )
    }
  }

  /**
   * 获取项目协作者数量
   */
  async getCollaboratorCount(projectId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM project_collaborators
        WHERE project_id = $1 AND status = 'active'
      `

      const result = await this.pool.query(query, [projectId])
      return parseInt(result.rows[0].count) || 0
    } catch (error) {
      throw new DatabaseError(
        `获取协作者数量失败: ${error instanceof Error ? error.message : error}`,
        'GET_COLLABORATOR_COUNT_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 检查用户是否有项目访问权限
   */
  async hasAccess(projectId: string, userId: string): Promise<boolean> {
    try {
      // 检查是否是项目所有者
      const ownerQuery = `
        SELECT 1 FROM ${this.tableName}
        WHERE id = $1 AND user_id = $2
      `
      const ownerResult = await this.pool.query(ownerQuery, [projectId, userId])
      if (ownerResult.rows.length > 0) return true

      // 检查是否是协作者
      const collaboratorQuery = `
        SELECT 1 FROM project_collaborators
        WHERE project_id = $1 AND user_id = $2 AND status = 'active'
      `
      const collaboratorResult = await this.pool.query(collaboratorQuery, [projectId, userId])
      return collaboratorResult.rows.length > 0
    } catch (error) {
      throw new DatabaseError(
        `检查项目访问权限失败: ${error instanceof Error ? error.message : error}`,
        'CHECK_ACCESS_ERROR',
        { projectId, userId }
      )
    }
  }

  /**
   * 导出项目数据
   */
  async exportData(projectId: string): Promise<{
    project: Project
    nodes: any[]
    connections: any[]
    versions: any[]
  }> {
    try {
      // 获取项目信息
      const project = await this.findById(projectId)
      if (!project) {
        throw new DatabaseError('项目不存在', 'PROJECT_NOT_FOUND', { projectId })
      }

      // 获取节点
      const nodesQuery = `SELECT * FROM nodes WHERE project_id = $1 ORDER BY created_at`
      const nodesResult = await this.pool.query(nodesQuery, [projectId])

      // 获取连接
      const connectionsQuery = `SELECT * FROM connections WHERE project_id = $1 ORDER BY created_at`
      const connectionsResult = await this.pool.query(connectionsQuery, [projectId])

      // 获取版本历史
      const versionsQuery = `
        SELECT nv.*
        FROM node_versions nv
        INNER JOIN nodes n ON nv.node_id = n.id
        WHERE n.project_id = $1
        ORDER BY nv.created_at
      `
      const versionsResult = await this.pool.query(versionsQuery, [projectId])

      return {
        project,
        nodes: nodesResult.rows,
        connections: connectionsResult.rows,
        versions: versionsResult.rows
      }
    } catch (error) {
      throw new DatabaseError(
        `导出项目数据失败: ${error instanceof Error ? error.message : error}`,
        'EXPORT_DATA_ERROR',
        { projectId }
      )
    }
  }
}