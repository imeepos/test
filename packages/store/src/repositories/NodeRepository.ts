import { BaseRepository } from './BaseRepository.js'
import { Node, QueryOptions, PaginatedResult, DatabaseError } from '../models/index.js'
import { databaseManager } from '../config/database.js'

/**
 * 节点仓库 - 处理节点相关的数据库操作
 */
export class NodeRepository extends BaseRepository<Node> {
  constructor() {
    super('nodes')
  }

  /**
   * 根据项目ID查找节点
   */
  async findByProject(projectId: string, options: QueryOptions = {}): Promise<Node[]> {
    const filters = { project_id: projectId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据项目ID分页查找节点
   */
  async findByProjectWithPagination(
    projectId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Node>> {
    const filters = { project_id: projectId, ...options.filters }
    return this.findWithPagination({ ...options, filters })
  }

  /**
   * 根据用户ID查找节点
   */
  async findByUser(userId: string, options: QueryOptions = {}): Promise<Node[]> {
    const filters = { user_id: userId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据标签查找节点
   */
  async findByTags(tags: string[], options: QueryOptions = {}): Promise<Node[]> {
    try {
      const { orderBy, orderDirection, limit, offset, filters = {} } = options

      // 构建其他过滤条件
      const { whereClause: baseWhere, values: baseValues } = this.buildWhereClause(filters)

      // 构建标签查询条件
      const tagConditions = tags.map((_, index) => `$${baseValues.length + index + 1} = ANY(tags)`).join(' OR ')

      const whereClause = baseWhere
        ? `${baseWhere} AND (${tagConditions})`
        : `WHERE (${tagConditions})`

      const orderClause = this.buildOrderClause(orderBy, orderDirection)
      const limitClause = this.buildLimitClause(limit, offset)

      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim()

      const result = await this.pool.query(query, [...baseValues, ...tags])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `根据标签查找节点失败: ${error instanceof Error ? error.message : error}`,
        'FIND_BY_TAGS_ERROR',
        { tags, options }
      )
    }
  }

  /**
   * 根据重要性等级查找节点
   */
  async findByImportance(
    importance: number | number[],
    options: QueryOptions = {}
  ): Promise<Node[]> {
    const importanceFilter = Array.isArray(importance) ? importance : [importance]
    const filters = { importance: importanceFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据状态查找节点
   */
  async findByStatus(status: string | string[], options: QueryOptions = {}): Promise<Node[]> {
    const statusFilter = Array.isArray(status) ? status : [status]
    const filters = { status: statusFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 查找子节点
   */
  async findChildren(parentId: string, options: QueryOptions = {}): Promise<Node[]> {
    const filters = { parent_id: parentId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 查找根节点（没有父节点的节点）
   */
  async findRootNodes(projectId: string, options: QueryOptions = {}): Promise<Node[]> {
    const filters = { project_id: projectId, parent_id: null, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 全文搜索节点内容
   */
  async searchContent(
    query: string,
    projectId?: string,
    options: QueryOptions = {}
  ): Promise<Node[]> {
    try {
      const { orderBy = 'updated_at', orderDirection = 'DESC', limit, offset, filters = {} } = options

      // 构建基础过滤条件
      let baseFilters = { ...filters }
      if (projectId) {
        baseFilters.project_id = projectId
      }

      const { whereClause: baseWhere, values: baseValues } = this.buildWhereClause(baseFilters)

      // 构建全文搜索条件
      const searchCondition = `(content ILIKE $${baseValues.length + 1} OR title ILIKE $${baseValues.length + 1})`
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
        `搜索节点内容失败: ${error instanceof Error ? error.message : error}`,
        'SEARCH_CONTENT_ERROR',
        { query, projectId, options }
      )
    }
  }

  /**
   * 获取节点统计信息
   */
  async getStatistics(projectId?: string): Promise<{
    total: number
    byStatus: Record<string, number>
    byImportance: Record<string, number>
    avgConfidence: number
    avgImportance: number
    aiGenerated: number
    userCreated: number
  }> {
    try {
      const baseFilter = projectId ? 'WHERE project_id = $1' : ''
      const params = projectId ? [projectId] : []

      // 总数统计
      const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${baseFilter}`
      const totalResult = await this.pool.query(totalQuery, params)
      const total = parseInt(totalResult.rows[0].total)

      // 按状态统计
      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM ${this.tableName} ${baseFilter}
        GROUP BY status
      `
      const statusResult = await this.pool.query(statusQuery, params)
      const byStatus: Record<string, number> = {}
      statusResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count)
      })

      // 按重要性统计
      const importanceQuery = `
        SELECT importance, COUNT(*) as count
        FROM ${this.tableName} ${baseFilter}
        GROUP BY importance
        ORDER BY importance
      `
      const importanceResult = await this.pool.query(importanceQuery, params)
      const byImportance: Record<string, number> = {}
      importanceResult.rows.forEach(row => {
        byImportance[row.importance] = parseInt(row.count)
      })

      // 平均值统计
      const avgQuery = `
        SELECT
          AVG(confidence) as avg_confidence,
          AVG(importance) as avg_importance,
          SUM(CASE WHEN ai_generated = true THEN 1 ELSE 0 END) as ai_generated,
          SUM(CASE WHEN ai_generated = false THEN 1 ELSE 0 END) as user_created
        FROM ${this.tableName} ${baseFilter}
      `
      const avgResult = await this.pool.query(avgQuery, params)
      const avgRow = avgResult.rows[0]

      return {
        total,
        byStatus,
        byImportance,
        avgConfidence: parseFloat(avgRow.avg_confidence) || 0,
        avgImportance: parseFloat(avgRow.avg_importance) || 0,
        aiGenerated: parseInt(avgRow.ai_generated) || 0,
        userCreated: parseInt(avgRow.user_created) || 0
      }
    } catch (error) {
      throw new DatabaseError(
        `获取节点统计失败: ${error instanceof Error ? error.message : error}`,
        'STATISTICS_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 批量更新节点状态
   */
  async updateStatusBatch(nodeIds: string[], status: string): Promise<Node[]> {
    if (nodeIds.length === 0) return []

    try {
      const placeholders = nodeIds.map((_, index) => `$${index + 2}`).join(', ')
      const query = `
        UPDATE ${this.tableName}
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
        RETURNING *
      `

      const result = await this.pool.query(query, [status, ...nodeIds])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `批量更新节点状态失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_STATUS_BATCH_ERROR',
        { nodeIds, status }
      )
    }
  }

  /**
   * 获取节点的邻居节点（通过连接关系）
   */
  async findNeighbors(nodeId: string): Promise<{
    incoming: Node[]
    outgoing: Node[]
    bidirectional: Node[]
  }> {
    try {
      // 获取入向连接的节点
      const incomingQuery = `
        SELECT n.*
        FROM ${this.tableName} n
        INNER JOIN connections c ON n.id = c.source_node_id
        WHERE c.target_node_id = $1 AND c.type IN ('output', 'bidirectional')
      `
      const incomingResult = await this.pool.query(incomingQuery, [nodeId])

      // 获取出向连接的节点
      const outgoingQuery = `
        SELECT n.*
        FROM ${this.tableName} n
        INNER JOIN connections c ON n.id = c.target_node_id
        WHERE c.source_node_id = $1 AND c.type IN ('input', 'bidirectional')
      `
      const outgoingResult = await this.pool.query(outgoingQuery, [nodeId])

      // 获取双向连接的节点
      const bidirectionalQuery = `
        SELECT DISTINCT n.*
        FROM ${this.tableName} n
        INNER JOIN connections c ON (n.id = c.source_node_id OR n.id = c.target_node_id)
        WHERE (c.source_node_id = $1 OR c.target_node_id = $1)
          AND c.type = 'bidirectional'
          AND n.id != $1
      `
      const bidirectionalResult = await this.pool.query(bidirectionalQuery, [nodeId])

      return {
        incoming: incomingResult.rows,
        outgoing: outgoingResult.rows,
        bidirectional: bidirectionalResult.rows
      }
    } catch (error) {
      throw new DatabaseError(
        `获取邻居节点失败: ${error instanceof Error ? error.message : error}`,
        'FIND_NEIGHBORS_ERROR',
        { nodeId }
      )
    }
  }

  /**
   * 获取节点路径（从根节点到当前节点）
   */
  async getNodePath(nodeId: string): Promise<Node[]> {
    try {
      // 使用递归CTE查询节点路径
      const query = `
        WITH RECURSIVE node_path AS (
          -- 起始节点
          SELECT id, parent_id, content, title, 1 as level
          FROM ${this.tableName}
          WHERE id = $1

          UNION ALL

          -- 递归查找父节点
          SELECT n.id, n.parent_id, n.content, n.title, np.level + 1
          FROM ${this.tableName} n
          INNER JOIN node_path np ON n.id = np.parent_id
        )
        SELECT n.*
        FROM node_path np
        INNER JOIN ${this.tableName} n ON n.id = np.id
        ORDER BY np.level DESC
      `

      const result = await this.pool.query(query, [nodeId])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取节点路径失败: ${error instanceof Error ? error.message : error}`,
        'GET_NODE_PATH_ERROR',
        { nodeId }
      )
    }
  }

  /**
   * 获取节点子树（包含所有子节点和孙子节点）
   */
  async getNodeSubtree(nodeId: string, maxDepth: number = 10): Promise<Node[]> {
    try {
      // 使用递归CTE查询子树
      const query = `
        WITH RECURSIVE node_subtree AS (
          -- 起始节点
          SELECT id, parent_id, content, title, 0 as depth
          FROM ${this.tableName}
          WHERE id = $1

          UNION ALL

          -- 递归查找子节点
          SELECT n.id, n.parent_id, n.content, n.title, ns.depth + 1
          FROM ${this.tableName} n
          INNER JOIN node_subtree ns ON n.parent_id = ns.id
          WHERE ns.depth < $2
        )
        SELECT n.*
        FROM node_subtree ns
        INNER JOIN ${this.tableName} n ON n.id = ns.id
        ORDER BY ns.depth, n.created_at
      `

      const result = await this.pool.query(query, [nodeId, maxDepth])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取节点子树失败: ${error instanceof Error ? error.message : error}`,
        'GET_NODE_SUBTREE_ERROR',
        { nodeId, maxDepth }
      )
    }
  }

  /**
   * 复制节点到另一个项目
   */
  async copyToProject(nodeId: string, targetProjectId: string, userId: string): Promise<Node> {
    return this.transaction(async (client) => {
      // 获取原节点信息
      const originalNode = await this.findById(nodeId)
      if (!originalNode) {
        throw new DatabaseError('源节点不存在', 'SOURCE_NODE_NOT_FOUND', { nodeId })
      }

      // 创建新节点（去除ID和项目相关字段）
      const newNodeData = {
        ...originalNode,
        id: undefined,
        project_id: targetProjectId,
        user_id: userId,
        parent_id: null, // 复制时重置父子关系
        created_at: new Date(),
        updated_at: new Date()
      }

      const query = `
        INSERT INTO ${this.tableName} (
          project_id, user_id, content, title, importance, confidence,
          status, tags, version, position, size, metadata, ai_generated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `

      const values = [
        targetProjectId,
        userId,
        originalNode.content,
        originalNode.title,
        originalNode.importance,
        originalNode.confidence,
        'idle', // 重置状态
        originalNode.tags,
        1, // 重置版本
        originalNode.position,
        originalNode.size,
        originalNode.metadata,
        originalNode.ai_generated
      ]

      const result = await client.query(query, values)
      return result.rows[0]
    })
  }

  /**
   * 软删除节点（标记为删除状态而不是物理删除）
   */
  async softDelete(nodeId: string): Promise<boolean> {
    try {
      const result = await this.update(nodeId, {
        status: 'deleted',
        updated_at: new Date()
      } as Partial<Node>)
      return result !== null
    } catch (error) {
      throw new DatabaseError(
        `软删除节点失败: ${error instanceof Error ? error.message : error}`,
        'SOFT_DELETE_ERROR',
        { nodeId }
      )
    }
  }

  /**
   * 恢复软删除的节点
   */
  async restore(nodeId: string): Promise<Node | null> {
    try {
      return this.update(nodeId, {
        status: 'idle',
        updated_at: new Date()
      } as Partial<Node>)
    } catch (error) {
      throw new DatabaseError(
        `恢复节点失败: ${error instanceof Error ? error.message : error}`,
        'RESTORE_ERROR',
        { nodeId }
      )
    }
  }

  /**
   * 获取最近活跃的节点
   */
  async getRecentlyActive(projectId: string, limit: number = 10): Promise<Node[]> {
    const filters = { project_id: projectId }
    return this.findMany({
      filters,
      orderBy: 'updated_at',
      orderDirection: 'DESC',
      limit
    })
  }

  /**
   * 获取高优先级节点
   */
  async getHighPriorityNodes(projectId: string): Promise<Node[]> {
    const filters = {
      project_id: projectId,
      importance: [4, 5], // 高重要性
      status: ['idle', 'processing'] // 活跃状态
    }
    return this.findMany({
      filters,
      orderBy: 'importance',
      orderDirection: 'DESC'
    })
  }
}