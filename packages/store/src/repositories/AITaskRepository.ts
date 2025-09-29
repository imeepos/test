import { BaseRepository } from './BaseRepository'
import { AITask, QueryOptions, PaginatedResult, DatabaseError } from '../models'

/**
 * AI任务仓库 - 处理AI任务相关的数据库操作
 */
export class AITaskRepository extends BaseRepository<AITask> {
  constructor() {
    super('ai_tasks')
  }

  /**
   * 根据项目ID查找AI任务
   */
  async findByProject(projectId: string, options: QueryOptions = {}): Promise<AITask[]> {
    const filters = { project_id: projectId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据项目ID分页查找AI任务
   */
  async findByProjectWithPagination(
    projectId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<AITask>> {
    const filters = { project_id: projectId, ...options.filters }
    return this.findWithPagination({ ...options, filters })
  }

  /**
   * 根据用户ID查找AI任务
   */
  async findByUser(userId: string, options: QueryOptions = {}): Promise<AITask[]> {
    const filters = { user_id: userId, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据状态查找AI任务
   */
  async findByStatus(
    status: string | string[],
    options: QueryOptions = {}
  ): Promise<AITask[]> {
    const statusFilter = Array.isArray(status) ? status : [status]
    const filters = { status: statusFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 根据任务类型查找AI任务
   */
  async findByType(
    type: string | string[],
    options: QueryOptions = {}
  ): Promise<AITask[]> {
    const typeFilter = Array.isArray(type) ? type : [type]
    const filters = { type: typeFilter, ...options.filters }
    return this.findMany({ ...options, filters })
  }

  /**
   * 创建AI任务
   */
  async createTask(taskData: {
    project_id: string
    user_id: string
    type: string
    input_data: any
    estimated_cost?: number
    metadata?: any
  }): Promise<AITask> {
    try {
      const defaultData = {
        status: 'pending',
        estimated_cost: 0,
        metadata: {},
        ...taskData
      }

      return this.create(defaultData as Partial<AITask>)
    } catch (error) {
      throw new DatabaseError(
        `创建AI任务失败: ${error instanceof Error ? error.message : error}`,
        'CREATE_TASK_ERROR',
        taskData
      )
    }
  }

  /**
   * 开始任务处理
   */
  async startTask(taskId: string): Promise<AITask | null> {
    try {
      const task = await this.findById(taskId)
      if (!task) {
        throw new DatabaseError('任务不存在', 'TASK_NOT_FOUND', { taskId })
      }

      if (task.status !== 'pending' && task.status !== 'queued') {
        throw new DatabaseError(
          `任务状态不正确，当前状态: ${task.status}`,
          'INVALID_TASK_STATUS',
          { taskId, currentStatus: task.status }
        )
      }

      return this.update(taskId, {
        status: 'processing',
        started_at: new Date(),
        updated_at: new Date()
      } as Partial<AITask>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `开始任务失败: ${error instanceof Error ? error.message : error}`,
        'START_TASK_ERROR',
        { taskId }
      )
    }
  }

  /**
   * 完成任务
   */
  async completeTask(
    taskId: string,
    resultData: any,
    actualCost?: number
  ): Promise<AITask | null> {
    try {
      const task = await this.findById(taskId)
      if (!task) {
        throw new DatabaseError('任务不存在', 'TASK_NOT_FOUND', { taskId })
      }

      if (task.status !== 'processing') {
        throw new DatabaseError(
          `任务状态不正确，当前状态: ${task.status}`,
          'INVALID_TASK_STATUS',
          { taskId, currentStatus: task.status }
        )
      }

      return this.update(taskId, {
        status: 'completed',
        result_data: resultData,
        actual_cost: actualCost,
        completed_at: new Date(),
        updated_at: new Date()
      } as Partial<AITask>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `完成任务失败: ${error instanceof Error ? error.message : error}`,
        'COMPLETE_TASK_ERROR',
        { taskId, resultData, actualCost }
      )
    }
  }

  /**
   * 任务失败
   */
  async failTask(
    taskId: string,
    errorInfo: any,
    retryCount?: number
  ): Promise<AITask | null> {
    try {
      const task = await this.findById(taskId)
      if (!task) {
        throw new DatabaseError('任务不存在', 'TASK_NOT_FOUND', { taskId })
      }

      const currentRetryCount = task.metadata?.retry_count || 0
      const newRetryCount = retryCount !== undefined ? retryCount : currentRetryCount + 1

      const updatedMetadata = {
        ...task.metadata,
        retry_count: newRetryCount
      }

      return this.update(taskId, {
        status: 'failed',
        error_info: errorInfo,
        metadata: updatedMetadata,
        updated_at: new Date()
      } as Partial<AITask>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `任务失败处理失败: ${error instanceof Error ? error.message : error}`,
        'FAIL_TASK_ERROR',
        { taskId, errorInfo }
      )
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<AITask | null> {
    try {
      const task = await this.findById(taskId)
      if (!task) {
        throw new DatabaseError('任务不存在', 'TASK_NOT_FOUND', { taskId })
      }

      if (task.status === 'completed' || task.status === 'failed') {
        throw new DatabaseError(
          `不能取消已完成的任务，当前状态: ${task.status}`,
          'CANNOT_CANCEL_COMPLETED_TASK',
          { taskId, currentStatus: task.status }
        )
      }

      return this.update(taskId, {
        status: 'cancelled',
        updated_at: new Date()
      } as Partial<AITask>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `取消任务失败: ${error instanceof Error ? error.message : error}`,
        'CANCEL_TASK_ERROR',
        { taskId }
      )
    }
  }

  /**
   * 重试失败的任务
   */
  async retryTask(taskId: string, maxRetries: number = 3): Promise<AITask | null> {
    try {
      const task = await this.findById(taskId)
      if (!task) {
        throw new DatabaseError('任务不存在', 'TASK_NOT_FOUND', { taskId })
      }

      if (task.status !== 'failed') {
        throw new DatabaseError(
          `只能重试失败的任务，当前状态: ${task.status}`,
          'CANNOT_RETRY_NON_FAILED_TASK',
          { taskId, currentStatus: task.status }
        )
      }

      const currentRetryCount = task.metadata?.retry_count || 0
      if (currentRetryCount >= maxRetries) {
        throw new DatabaseError(
          `任务重试次数超过限制: ${currentRetryCount}/${maxRetries}`,
          'MAX_RETRIES_EXCEEDED',
          { taskId, retryCount: currentRetryCount, maxRetries }
        )
      }

      return this.update(taskId, {
        status: 'pending',
        error_info: undefined,
        started_at: undefined,
        completed_at: undefined,
        updated_at: new Date()
      } as Partial<AITask>)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `重试任务失败: ${error instanceof Error ? error.message : error}`,
        'RETRY_TASK_ERROR',
        { taskId }
      )
    }
  }

  /**
   * 获取队列中的任务
   */
  async getQueuedTasks(limit: number = 10): Promise<AITask[]> {
    return this.findMany({
      filters: { status: ['pending', 'queued'] },
      orderBy: 'created_at',
      orderDirection: 'ASC',
      limit
    })
  }

  /**
   * 获取正在处理的任务
   */
  async getProcessingTasks(): Promise<AITask[]> {
    return this.findByStatus('processing')
  }

  /**
   * 获取超时的任务
   */
  async getTimedOutTasks(timeoutMinutes: number = 30): Promise<AITask[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE status = 'processing'
          AND started_at < CURRENT_TIMESTAMP - INTERVAL '${timeoutMinutes} minutes'
        ORDER BY started_at ASC
      `

      const result = await this.pool.query(query)
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `获取超时任务失败: ${error instanceof Error ? error.message : error}`,
        'GET_TIMED_OUT_TASKS_ERROR',
        { timeoutMinutes }
      )
    }
  }

  /**
   * 清理超时任务
   */
  async cleanupTimedOutTasks(timeoutMinutes: number = 30): Promise<number> {
    try {
      const timedOutTasks = await this.getTimedOutTasks(timeoutMinutes)

      let cleanedCount = 0
      for (const task of timedOutTasks) {
        await this.failTask(task.id, {
          error: 'Task timed out',
          timeout_minutes: timeoutMinutes,
          cleaned_at: new Date()
        })
        cleanedCount++
      }

      return cleanedCount
    } catch (error) {
      throw new DatabaseError(
        `清理超时任务失败: ${error instanceof Error ? error.message : error}`,
        'CLEANUP_TIMED_OUT_TASKS_ERROR',
        { timeoutMinutes }
      )
    }
  }

  /**
   * 获取任务统计信息
   */
  async getStatistics(projectId?: string, userId?: string): Promise<{
    total: number
    byStatus: Record<string, number>
    byType: Record<string, number>
    totalCost: number
    avgCost: number
    avgProcessingTime: number
    successRate: number
  }> {
    try {
      let whereConditions: string[] = []
      let params: any[] = []

      if (projectId) {
        whereConditions.push('project_id = $' + (params.length + 1))
        params.push(projectId)
      }
      if (userId) {
        whereConditions.push('user_id = $' + (params.length + 1))
        params.push(userId)
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : ''

      // 总数统计
      const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`
      const totalResult = await this.pool.query(totalQuery, params)
      const total = parseInt(totalResult.rows[0].total)

      // 按状态统计
      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM ${this.tableName} ${whereClause}
        GROUP BY status
      `
      const statusResult = await this.pool.query(statusQuery, params)
      const byStatus: Record<string, number> = {}
      statusResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count)
      })

      // 按类型统计
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM ${this.tableName} ${whereClause}
        GROUP BY type
      `
      const typeResult = await this.pool.query(typeQuery, params)
      const byType: Record<string, number> = {}
      typeResult.rows.forEach(row => {
        byType[row.type] = parseInt(row.count)
      })

      // 成本和性能统计
      const statsQuery = `
        SELECT
          COALESCE(SUM(actual_cost), 0) as total_cost,
          COALESCE(AVG(actual_cost), 0) as avg_cost,
          COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0) as avg_processing_time,
          (SELECT COUNT(*) FROM ${this.tableName} ${whereClause} AND status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) as success_rate
        FROM ${this.tableName} ${whereClause}
      `
      const statsResult = await this.pool.query(statsQuery, params)
      const stats = statsResult.rows[0]

      return {
        total,
        byStatus,
        byType,
        totalCost: parseFloat(stats.total_cost) || 0,
        avgCost: parseFloat(stats.avg_cost) || 0,
        avgProcessingTime: parseFloat(stats.avg_processing_time) || 0,
        successRate: parseFloat(stats.success_rate) || 0
      }
    } catch (error) {
      throw new DatabaseError(
        `获取任务统计失败: ${error instanceof Error ? error.message : error}`,
        'GET_STATISTICS_ERROR',
        { projectId, userId }
      )
    }
  }

  /**
   * 获取成本分析
   */
  async getCostAnalysis(
    projectId?: string,
    userId?: string,
    days?: number
  ): Promise<{
    totalCost: number
    dailyCosts: Array<{ date: string; cost: number; taskCount: number }>
    costByType: Record<string, number>
    topExpensiveTasks: Array<{ id: string; type: string; cost: number; created_at: Date }>
  }> {
    try {
      let whereConditions = ['actual_cost IS NOT NULL']
      let params: any[] = []

      if (projectId) {
        whereConditions.push('project_id = $' + (params.length + 1))
        params.push(projectId)
      }
      if (userId) {
        whereConditions.push('user_id = $' + (params.length + 1))
        params.push(userId)
      }
      if (days) {
        whereConditions.push('created_at >= CURRENT_TIMESTAMP - INTERVAL \'' + days + ' days\'')
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`

      // 总成本
      const totalCostQuery = `
        SELECT COALESCE(SUM(actual_cost), 0) as total_cost
        FROM ${this.tableName} ${whereClause}
      `
      const totalCostResult = await this.pool.query(totalCostQuery, params)
      const totalCost = parseFloat(totalCostResult.rows[0].total_cost) || 0

      // 每日成本
      const dailyCostsQuery = `
        SELECT
          DATE(created_at) as date,
          COALESCE(SUM(actual_cost), 0) as cost,
          COUNT(*) as task_count
        FROM ${this.tableName} ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `
      const dailyCostsResult = await this.pool.query(dailyCostsQuery, params)
      const dailyCosts = dailyCostsResult.rows.map(row => ({
        date: row.date,
        cost: parseFloat(row.cost),
        taskCount: parseInt(row.task_count)
      }))

      // 按类型的成本分布
      const costByTypeQuery = `
        SELECT type, COALESCE(SUM(actual_cost), 0) as cost
        FROM ${this.tableName} ${whereClause}
        GROUP BY type
        ORDER BY cost DESC
      `
      const costByTypeResult = await this.pool.query(costByTypeQuery, params)
      const costByType: Record<string, number> = {}
      costByTypeResult.rows.forEach(row => {
        costByType[row.type] = parseFloat(row.cost)
      })

      // 最昂贵的任务
      const topExpensiveQuery = `
        SELECT id, type, actual_cost as cost, created_at
        FROM ${this.tableName} ${whereClause}
        ORDER BY actual_cost DESC
        LIMIT 10
      `
      const topExpensiveResult = await this.pool.query(topExpensiveQuery, params)
      const topExpensiveTasks = topExpensiveResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        cost: parseFloat(row.cost),
        created_at: row.created_at
      }))

      return {
        totalCost,
        dailyCosts,
        costByType,
        topExpensiveTasks
      }
    } catch (error) {
      throw new DatabaseError(
        `获取成本分析失败: ${error instanceof Error ? error.message : error}`,
        'GET_COST_ANALYSIS_ERROR',
        { projectId, userId, days }
      )
    }
  }

  /**
   * 获取性能分析
   */
  async getPerformanceAnalysis(projectId?: string, days: number = 30): Promise<{
    avgProcessingTime: number
    processingTimeByType: Record<string, number>
    taskThroughput: Array<{ date: string; completed: number; failed: number }>
    errorAnalysis: Record<string, number>
  }> {
    try {
      let whereConditions = ['completed_at IS NOT NULL', 'started_at IS NOT NULL']
      let params: any[] = []

      if (projectId) {
        whereConditions.push('project_id = $' + (params.length + 1))
        params.push(projectId)
      }

      whereConditions.push('created_at >= CURRENT_TIMESTAMP - INTERVAL \'' + days + ' days\'')
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`

      // 平均处理时间
      const avgTimeQuery = `
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0) as avg_time
        FROM ${this.tableName} ${whereClause}
      `
      const avgTimeResult = await this.pool.query(avgTimeQuery, params)
      const avgProcessingTime = parseFloat(avgTimeResult.rows[0].avg_time) || 0

      // 按类型的处理时间
      const timeByTypeQuery = `
        SELECT
          type,
          COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0) as avg_time
        FROM ${this.tableName} ${whereClause}
        GROUP BY type
      `
      const timeByTypeResult = await this.pool.query(timeByTypeQuery, params)
      const processingTimeByType: Record<string, number> = {}
      timeByTypeResult.rows.forEach(row => {
        processingTimeByType[row.type] = parseFloat(row.avg_time)
      })

      // 任务吞吐量
      const throughputQuery = `
        SELECT
          DATE(completed_at) as date,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM ${this.tableName}
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
          ${projectId ? 'AND project_id = $' + (params.length + 1) : ''}
          AND (status = 'completed' OR status = 'failed')
        GROUP BY DATE(completed_at)
        ORDER BY date DESC
      `
      const throughputParams = projectId ? [...params, projectId] : params
      const throughputResult = await this.pool.query(throughputQuery, throughputParams)
      const taskThroughput = throughputResult.rows.map(row => ({
        date: row.date,
        completed: parseInt(row.completed),
        failed: parseInt(row.failed)
      }))

      // 错误分析
      const errorQuery = `
        SELECT
          COALESCE(error_info->>'error', 'Unknown') as error_type,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE status = 'failed'
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
          ${projectId ? 'AND project_id = $' + (params.length + 1) : ''}
        GROUP BY error_info->>'error'
        ORDER BY count DESC
        LIMIT 10
      `
      const errorParams = projectId ? [...params, projectId] : params
      const errorResult = await this.pool.query(errorQuery, errorParams)
      const errorAnalysis: Record<string, number> = {}
      errorResult.rows.forEach(row => {
        errorAnalysis[row.error_type] = parseInt(row.count)
      })

      return {
        avgProcessingTime,
        processingTimeByType,
        taskThroughput,
        errorAnalysis
      }
    } catch (error) {
      throw new DatabaseError(
        `获取性能分析失败: ${error instanceof Error ? error.message : error}`,
        'GET_PERFORMANCE_ANALYSIS_ERROR',
        { projectId, days }
      )
    }
  }

  /**
   * 清理旧任务记录
   */
  async cleanupOldTasks(daysOld: number = 90): Promise<number> {
    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
          AND status IN ('completed', 'failed', 'cancelled')
      `

      const result = await this.pool.query(query)
      return result.rowCount || 0
    } catch (error) {
      throw new DatabaseError(
        `清理旧任务记录失败: ${error instanceof Error ? error.message : error}`,
        'CLEANUP_OLD_TASKS_ERROR',
        { daysOld }
      )
    }
  }

  /**
   * 获取用户任务配额使用情况
   */
  async getUserQuotaUsage(
    userId: string,
    period: 'daily' | 'monthly' = 'daily'
  ): Promise<{
    taskCount: number
    totalCost: number
    quotaLimit: number
    costLimit: number
    usagePercentage: number
  }> {
    try {
      const interval = period === 'daily' ? '1 day' : '1 month'

      const query = `
        SELECT
          COUNT(*) as task_count,
          COALESCE(SUM(actual_cost), 0) as total_cost
        FROM ${this.tableName}
        WHERE user_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      `

      const result = await this.pool.query(query, [userId])
      const stats = result.rows[0]

      // 这里应该从配置或用户设置中获取配额限制
      const quotaLimit = period === 'daily' ? 100 : 3000 // 示例值
      const costLimit = period === 'daily' ? 10.0 : 300.0 // 示例值

      const taskCount = parseInt(stats.task_count) || 0
      const totalCost = parseFloat(stats.total_cost) || 0
      const usagePercentage = Math.max(
        (taskCount / quotaLimit) * 100,
        (totalCost / costLimit) * 100
      )

      return {
        taskCount,
        totalCost,
        quotaLimit,
        costLimit,
        usagePercentage
      }
    } catch (error) {
      throw new DatabaseError(
        `获取用户配额使用情况失败: ${error instanceof Error ? error.message : error}`,
        'GET_USER_QUOTA_USAGE_ERROR',
        { userId, period }
      )
    }
  }
}