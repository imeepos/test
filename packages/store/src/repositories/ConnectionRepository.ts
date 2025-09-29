import { BaseRepository } from './BaseRepository'
import { Connection, QueryOptions, DatabaseError } from '../models'

/**
 * 连接关系仓库 - 处理节点连接相关的数据库操作
 */
export class ConnectionRepository extends BaseRepository<Connection> {
  constructor() {
    super('connections')
  }

  /**
   * 根据项目ID查找连接
   */
  async findByProject(projectId: string, options: QueryOptions = {}): Promise<Connection[]> {
    const filters = { project_id: projectId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据源节点查找连接
   */
  async findBySourceNode(sourceNodeId: string, options: QueryOptions = {}): Promise<Connection[]> {
    const filters = { source_node_id: sourceNodeId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据目标节点查找连接
   */
  async findByTargetNode(targetNodeId: string, options: QueryOptions = {}): Promise<Connection[]> {
    const filters = { target_node_id: targetNodeId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据节点查找所有连接（作为源或目标）
   */
  async findByNode(nodeId: string, options: QueryOptions = {}): Promise<Connection[]> {
    try {
      const { orderBy = 'created_at', orderDirection = 'DESC', limit, offset, filters = {} } = options

      const { whereClause: baseWhere, values: baseValues } = this.buildWhereClause(filters)

      const nodeCondition = `(source_node_id = $${baseValues.length + 1} OR target_node_id = $${baseValues.length + 1})`
      const whereClause = baseWhere
        ? `${baseWhere} AND ${nodeCondition}`
        : `WHERE ${nodeCondition}`

      const orderClause = this.buildOrderClause(orderBy, orderDirection)
      const limitClause = this.buildLimitClause(limit, offset)

      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim()

      const result = await this.pool.query(query, [...baseValues, nodeId])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `根据节点查找连接失败: ${error instanceof Error ? error.message : error}`,
        'FIND_BY_NODE_ERROR',
        { nodeId, options }
      )
    }
  }

  /**
   * 根据连接类型查找连接
   */
  async findByType(
    type: string | string[],
    options: QueryOptions = {}
  ): Promise<Connection[]> {
    const typeFilter = Array.isArray(type) ? type : [type]
    const filters = { type: typeFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 查找两个节点之间的连接
   */
  async findBetweenNodes(
    sourceNodeId: string,
    targetNodeId: string,
    type?: string
  ): Promise<Connection[]> {
    try {
      let whereConditions = [
        '((source_node_id = $1 AND target_node_id = $2) OR (source_node_id = $2 AND target_node_id = $1))'
      ]
      let params = [sourceNodeId, targetNodeId]

      if (type) {
        whereConditions.push('type = $3')
        params.push(type)
      }

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
      `

      const result = await this.pool.query(query, params)
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `查找节点间连接失败: ${error instanceof Error ? error.message : error}`,
        'FIND_BETWEEN_NODES_ERROR',
        { sourceNodeId, targetNodeId, type }
      )
    }
  }

  /**
   * 检查连接是否存在
   */
  async connectionExists(
    sourceNodeId: string,
    targetNodeId: string,
    type: string
  ): Promise<boolean> {
    const connections = await this.findBetweenNodes(sourceNodeId, targetNodeId, type)
    return connections.length > 0
  }

  /**
   * 创建连接（带重复检查）
   */
  async createConnection(connectionData: {
    project_id: string
    source_node_id: string
    target_node_id: string
    type: string
    label?: string
    weight?: number
    metadata?: any
    created_by_user?: boolean
  }): Promise<Connection> {
    try {
      // 检查连接是否已存在
      const existing = await this.findBetweenNodes(
        connectionData.source_node_id,
        connectionData.target_node_id,
        connectionData.type
      )

      if (existing.length > 0) {
        throw new DatabaseError(
          '连接已存在',
          'CONNECTION_ALREADY_EXISTS',
          connectionData
        )
      }

      // 验证源节点和目标节点不相同
      if (connectionData.source_node_id === connectionData.target_node_id) {
        throw new DatabaseError(
          '不能连接节点到自身',
          'SELF_CONNECTION_NOT_ALLOWED',
          connectionData
        )
      }

      // 验证节点存在于同一项目
      const nodeCheckQuery = `
        SELECT COUNT(*) as count
        FROM nodes
        WHERE id IN ($1, $2) AND project_id = $3
      `
      const nodeCheckResult = await this.pool.query(nodeCheckQuery, [
        connectionData.source_node_id,
        connectionData.target_node_id,
        connectionData.project_id
      ])

      if (parseInt(nodeCheckResult.rows[0].count) !== 2) {
        throw new DatabaseError(
          '源节点或目标节点不存在或不属于同一项目',
          'INVALID_NODES',
          connectionData
        )
      }

      // 创建连接
      const defaultData = {
        weight: 0.5,
        metadata: {},
        created_by_user: true,
        ...connectionData
      }

      return this.create(defaultData as Partial<Connection>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `创建连接失败: ${error instanceof Error ? error.message : error}`,
        'CREATE_CONNECTION_ERROR',
        connectionData
      )
    }
  }

  /**
   * 批量创建连接
   */
  async createConnections(connectionsData: Array<{
    project_id: string
    source_node_id: string
    target_node_id: string
    type: string
    label?: string
    weight?: number
    metadata?: any
    created_by_user?: boolean
  }>): Promise<Connection[]> {
    if (connectionsData.length === 0) return []

    return this.transaction(async (client) => {
      const results: Connection[] = []

      for (const connectionData of connectionsData) {
        try {
          const connection = await this.createConnection(connectionData)
          results.push(connection)
        } catch (error) {
          // 如果是重复连接，跳过但不抛出错误
          if (error instanceof DatabaseError && error.code === 'CONNECTION_ALREADY_EXISTS') {
            continue
          }
          throw error
        }
      }

      return results
    })
  }

  /**
   * 更新连接权重
   */
  async updateWeight(connectionId: string, weight: number): Promise<Connection | null> {
    if (weight < 0 || weight > 1) {
      throw new DatabaseError(
        '连接权重必须在0-1之间',
        'INVALID_WEIGHT',
        { connectionId, weight }
      )
    }

    return this.update(connectionId, {
      weight,
      updated_at: new Date()
    } as Partial<Connection>)
  }

  /**
   * 批量更新连接权重
   */
  async updateWeightsBatch(updates: Array<{ id: string; weight: number }>): Promise<Connection[]> {
    if (updates.length === 0) return []

    return this.transaction(async (client) => {
      const results: Connection[] = []

      for (const update of updates) {
        if (update.weight < 0 || update.weight > 1) {
          throw new DatabaseError(
            '连接权重必须在0-1之间',
            'INVALID_WEIGHT',
            update
          )
        }

        const query = `
          UPDATE ${this.tableName}
          SET weight = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `

        const result = await client.query(query, [update.weight, update.id])
        if (result.rows[0]) {
          results.push(result.rows[0])
        }
      }

      return results
    })
  }

  /**
   * 删除节点相关的所有连接
   */
  async deleteByNode(nodeId: string): Promise<number> {
    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE source_node_id = $1 OR target_node_id = $1
      `

      const result = await this.pool.query(query, [nodeId])
      return result.rowCount || 0
    } catch (error) {
      throw new DatabaseError(
        `删除节点连接失败: ${error instanceof Error ? error.message : error}`,
        'DELETE_BY_NODE_ERROR',
        { nodeId }
      )
    }
  }

  /**
   * 获取连接统计信息
   */
  async getStatistics(projectId?: string): Promise<{
    total: number
    byType: Record<string, number>
    avgWeight: number
    userCreated: number
    aiGenerated: number
  }> {
    try {
      const baseFilter = projectId ? 'WHERE project_id = $1' : ''
      const params = projectId ? [projectId] : []

      // 总数统计
      const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${baseFilter}`
      const totalResult = await this.pool.query(totalQuery, params)
      const total = parseInt(totalResult.rows[0].total)

      // 按类型统计
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM ${this.tableName} ${baseFilter}
        GROUP BY type
      `
      const typeResult = await this.pool.query(typeQuery, params)
      const byType: Record<string, number> = {}
      typeResult.rows.forEach(row => {
        byType[row.type] = parseInt(row.count)
      })

      // 其他统计
      const statsQuery = `
        SELECT
          AVG(weight) as avg_weight,
          SUM(CASE WHEN created_by_user = true THEN 1 ELSE 0 END) as user_created,
          SUM(CASE WHEN created_by_user = false THEN 1 ELSE 0 END) as ai_generated
        FROM ${this.tableName} ${baseFilter}
      `
      const statsResult = await this.pool.query(statsQuery, params)
      const stats = statsResult.rows[0]

      return {
        total,
        byType,
        avgWeight: parseFloat(stats.avg_weight) || 0,
        userCreated: parseInt(stats.user_created) || 0,
        aiGenerated: parseInt(stats.ai_generated) || 0
      }
    } catch (error) {
      throw new DatabaseError(
        `获取连接统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_STATISTICS_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 获取连接网络分析数据
   */
  async getNetworkAnalysis(projectId: string): Promise<{
    nodes: Array<{ id: string; degree: number; betweenness?: number }>
    connections: Connection[]
    clusters?: Array<{ nodes: string[]; size: number }>
  }> {
    try {
      // 获取所有连接
      const connections = await this.findByProject(projectId)

      // 计算节点度数
      const nodeDegreeQuery = `
        SELECT
          node_id,
          COUNT(*) as degree
        FROM (
          SELECT source_node_id as node_id FROM ${this.tableName} WHERE project_id = $1
          UNION ALL
          SELECT target_node_id as node_id FROM ${this.tableName} WHERE project_id = $1
        ) node_connections
        GROUP BY node_id
        ORDER BY degree DESC
      `
      const nodeDegreeResult = await this.pool.query(nodeDegreeQuery, [projectId])

      const nodes = nodeDegreeResult.rows.map(row => ({
        id: row.node_id,
        degree: parseInt(row.degree)
      }))

      return {
        nodes,
        connections,
        // TODO: 实现聚类分析
        clusters: []
      }
    } catch (error) {
      throw new DatabaseError(
        `获取网络分析数据失败: ${error instanceof Error ? error.message : error}`,
        'GET_NETWORK_ANALYSIS_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 查找孤立节点（没有连接的节点）
   */
  async findOrphanNodes(projectId: string): Promise<Array<{ id: string; title?: string; content: string }>> {
    try {
      const query = `
        SELECT n.id, n.title, n.content
        FROM nodes n
        WHERE n.project_id = $1
          AND n.status != 'deleted'
          AND NOT EXISTS (
            SELECT 1 FROM ${this.tableName} c
            WHERE c.source_node_id = n.id OR c.target_node_id = n.id
          )
        ORDER BY n.created_at DESC
      `

      const result = await this.pool.query(query, [projectId])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `查找孤立节点失败: ${error instanceof Error ? error.message : error}`,
        'FIND_ORPHAN_NODES_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 查找强连接组件
   */
  async findStronglyConnectedNodes(projectId: string): Promise<Array<{
    nodes: string[]
    connectionCount: number
  }>> {
    try {
      // 简化的强连接组件查找（实际实现可能需要更复杂的图算法）
      const query = `
        WITH node_pairs AS (
          SELECT
            LEAST(source_node_id, target_node_id) as node1,
            GREATEST(source_node_id, target_node_id) as node2,
            COUNT(*) as connection_count
          FROM ${this.tableName}
          WHERE project_id = $1 AND type IN ('bidirectional', 'dependency')
          GROUP BY LEAST(source_node_id, target_node_id), GREATEST(source_node_id, target_node_id)
          HAVING COUNT(*) >= 2
        )
        SELECT
          ARRAY[node1, node2] as nodes,
          connection_count
        FROM node_pairs
        ORDER BY connection_count DESC
      `

      const result = await this.pool.query(query, [projectId])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `查找强连接组件失败: ${error instanceof Error ? error.message : error}`,
        'FIND_STRONGLY_CONNECTED_ERROR',
        { projectId }
      )
    }
  }

  /**
   * 获取连接路径（最短路径）
   */
  async findShortestPath(
    sourceNodeId: string,
    targetNodeId: string,
    maxDepth: number = 6
  ): Promise<Array<{ nodeId: string; connectionId?: string }> | null> {
    try {
      // 使用递归CTE查找最短路径
      const query = `
        WITH RECURSIVE path_search AS (
          -- 起始节点
          SELECT
            source_node_id as current_node,
            target_node_id as next_node,
            id as connection_id,
            1 as depth,
            ARRAY[source_node_id] as path,
            ARRAY[id] as connections
          FROM ${this.tableName}
          WHERE source_node_id = $1

          UNION ALL

          -- 递归查找路径
          SELECT
            c.source_node_id,
            c.target_node_id,
            c.id,
            ps.depth + 1,
            ps.path || c.source_node_id,
            ps.connections || c.id
          FROM ${this.tableName} c
          INNER JOIN path_search ps ON c.source_node_id = ps.next_node
          WHERE ps.depth < $3
            AND NOT (c.source_node_id = ANY(ps.path))
        )
        SELECT path || next_node as full_path, connections
        FROM path_search
        WHERE next_node = $2
        ORDER BY depth
        LIMIT 1
      `

      const result = await this.pool.query(query, [sourceNodeId, targetNodeId, maxDepth])

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      const path = row.full_path
      const connections = row.connections

      // 构建路径结果
      const pathResult: Array<{nodeId: any, connectionId: any}> = []
      for (let i = 0; i < path.length; i++) {
        pathResult.push({
          nodeId: path[i],
          connectionId: i < connections.length ? connections[i] : undefined
        })
      }

      return pathResult
    } catch (error) {
      throw new DatabaseError(
        `查找最短路径失败: ${error instanceof Error ? error.message : error}`,
        'FIND_SHORTEST_PATH_ERROR',
        { sourceNodeId, targetNodeId, maxDepth }
      )
    }
  }

  /**
   * 复制连接到另一个项目
   */
  async copyToProject(
    sourceProjectId: string,
    targetProjectId: string,
    nodeIdMapping: Record<string, string>
  ): Promise<Connection[]> {
    try {
      const sourceConnections = await this.findByProject(sourceProjectId)
      const newConnections: Connection[] = []

      for (const connection of sourceConnections) {
        const newSourceId = nodeIdMapping[connection.source_node_id]
        const newTargetId = nodeIdMapping[connection.target_node_id]

        if (newSourceId && newTargetId) {
          const newConnectionData = {
            project_id: targetProjectId,
            source_node_id: newSourceId,
            target_node_id: newTargetId,
            type: connection.type,
            label: connection.label,
            weight: connection.weight,
            metadata: connection.metadata,
            created_by_user: connection.created_by_user
          }

          try {
            const newConnection = await this.createConnection(newConnectionData)
            newConnections.push(newConnection)
          } catch (error) {
            // 跳过重复连接
            if (error instanceof DatabaseError && error.code === 'CONNECTION_ALREADY_EXISTS') {
              continue
            }
            throw error
          }
        }
      }

      return newConnections
    } catch (error) {
      throw new DatabaseError(
        `复制连接到项目失败: ${error instanceof Error ? error.message : error}`,
        'COPY_TO_PROJECT_ERROR',
        { sourceProjectId, targetProjectId }
      )
    }
  }

  /**
   * 获取连接统计信息
   */
  async getConnectionStatistics(projectId?: string): Promise<{
    totalConnections: number
    connectionsByType: Record<string, number>
    avgWeight: number
    mostConnectedNodes: Array<{ nodeId: string; connectionCount: number }>
  }> {
    try {
      let whereConditions: string[] = []
      let params: any[] = []

      if (projectId) {
        whereConditions.push('project_id = $' + (params.length + 1))
        params.push(projectId)
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      // 总连接数
      const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`
      const totalResult = await this.pool.query(totalQuery, params)
      const totalConnections = parseInt(totalResult.rows[0].total)

      // 按类型统计
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM ${this.tableName} ${whereClause}
        GROUP BY type
      `
      const typeResult = await this.pool.query(typeQuery, params)
      const connectionsByType: Record<string, number> = {}
      typeResult.rows.forEach(row => {
        connectionsByType[row.type] = parseInt(row.count)
      })

      // 平均权重
      const avgWeightQuery = `
        SELECT COALESCE(AVG(weight), 0) as avg_weight
        FROM ${this.tableName} ${whereClause}
      `
      const avgWeightResult = await this.pool.query(avgWeightQuery, params)
      const avgWeight = parseFloat(avgWeightResult.rows[0].avg_weight) || 0

      // 最连接的节点
      const mostConnectedQuery = `
        SELECT
          node_id,
          COUNT(*) as connection_count
        FROM (
          SELECT source_node_id as node_id FROM ${this.tableName} ${whereClause}
          UNION ALL
          SELECT target_node_id as node_id FROM ${this.tableName} ${whereClause}
        ) AS all_nodes
        GROUP BY node_id
        ORDER BY connection_count DESC
        LIMIT 10
      `
      const mostConnectedResult = await this.pool.query(mostConnectedQuery, params)
      const mostConnectedNodes = mostConnectedResult.rows.map(row => ({
        nodeId: row.node_id,
        connectionCount: parseInt(row.connection_count)
      }))

      return {
        totalConnections,
        connectionsByType,
        avgWeight,
        mostConnectedNodes
      }
    } catch (error) {
      throw new DatabaseError(
        `获取连接统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_CONNECTION_STATISTICS_ERROR',
        { projectId }
      )
    }
  }
}