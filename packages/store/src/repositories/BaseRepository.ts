import { Pool, PoolClient } from 'pg'
import { databaseManager } from '../config/database'
import { QueryOptions, PaginatedResult, DatabaseError } from '../models'

/**
 * 基础仓库类 - 提供通用的数据库操作方法
 */
export abstract class BaseRepository<T> {
  protected tableName: string
  protected pool: Pool

  constructor(tableName: string) {
    this.tableName = tableName
    this.pool = databaseManager.getPostgresPool()
  }

  /**
   * 构建 WHERE 子句
   */
  protected buildWhereClause(filters: Record<string, any>): { whereClause: string; values: any[] } {
    if (!filters || Object.keys(filters).length === 0) {
      return { whereClause: '', values: [] }
    }

    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(filters)) {
      if (value === null) {
        conditions.push(`${key} IS NULL`)
      } else if (value === undefined) {
        continue
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
          conditions.push(`${key} IN (${placeholders})`)
          values.push(...value)
        }
      } else if (typeof value === 'object' && value.operator) {
        // 支持复杂查询条件 { operator: 'LIKE', value: '%test%' }
        conditions.push(`${key} ${value.operator} $${paramIndex++}`)
        values.push(value.value)
      } else {
        conditions.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return { whereClause, values }
  }

  /**
   * 构建 ORDER BY 子句
   */
  protected buildOrderClause(orderBy?: string, orderDirection: 'ASC' | 'DESC' = 'ASC'): string {
    if (!orderBy) return ''
    return `ORDER BY ${orderBy} ${orderDirection}`
  }

  /**
   * 构建 LIMIT 和 OFFSET 子句
   */
  protected buildLimitClause(limit?: number, offset?: number): string {
    const clauses: string[] = []
    if (limit) clauses.push(`LIMIT ${limit}`)
    if (offset) clauses.push(`OFFSET ${offset}`)
    return clauses.join(' ')
  }

  /**
   * 查找单个记录
   */
  async findOne(filters: Record<string, any>): Promise<T | null> {
    try {
      const { whereClause, values } = this.buildWhereClause(filters)
      const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`

      const result = await this.pool.query(query, values)
      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(
        `查找单个记录失败: ${error instanceof Error ? error.message : error}`,
        'FIND_ONE_ERROR',
        { tableName: this.tableName, filters }
      )
    }
  }

  /**
   * 根据 ID 查找记录
   */
  async findById(id: string): Promise<T | null> {
    return this.findOne({ id })
  }

  /**
   * 查找多个记录
   */
  async findMany(options: QueryOptions = {}): Promise<T[]> {
    try {
      const { filters = {}, orderBy, orderDirection, limit, offset } = options

      const { whereClause, values } = this.buildWhereClause(filters)
      const orderClause = this.buildOrderClause(orderBy, orderDirection)
      const limitClause = this.buildLimitClause(limit, offset)

      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim()

      const result = await this.pool.query(query, values)
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `查找多个记录失败: ${error instanceof Error ? error.message : error}`,
        'FIND_MANY_ERROR',
        { tableName: this.tableName, options }
      )
    }
  }

  /**
   * 分页查询
   */
  async findWithPagination(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const { filters = {}, orderBy, orderDirection, limit = 20, offset = 0 } = options
      const page = Math.floor(offset / limit) + 1

      // 查询总数
      const { whereClause, values } = this.buildWhereClause(filters)
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`
      const countResult = await this.pool.query(countQuery, values)
      const total = parseInt(countResult.rows[0].total)

      // 查询数据
      const data = await this.findMany(options)

      // 计算分页信息
      const totalPages = Math.ceil(total / limit)

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      throw new DatabaseError(
        `分页查询失败: ${error instanceof Error ? error.message : error}`,
        'PAGINATION_ERROR',
        { tableName: this.tableName, options }
      )
    }
  }

  /**
   * 创建记录
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined)
      const values = fields.map(key => data[key as keyof T])
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')

      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `

      const result = await this.pool.query(query, values)
      return result.rows[0]
    } catch (error) {
      throw new DatabaseError(
        `创建记录失败: ${error instanceof Error ? error.message : error}`,
        'CREATE_ERROR',
        { tableName: this.tableName, data }
      )
    }
  }

  /**
   * 批量创建记录
   */
  async createMany(items: Partial<T>[]): Promise<T[]> {
    if (items.length === 0) return []

    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      const results: T[] = []
      for (const item of items) {
        const fields = Object.keys(item).filter(key => item[key as keyof T] !== undefined)
        const values = fields.map(key => item[key as keyof T])
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')

        const query = `
          INSERT INTO ${this.tableName} (${fields.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `

        const result = await client.query(query, values)
        results.push(result.rows[0])
      }

      await client.query('COMMIT')
      return results
    } catch (error) {
      await client.query('ROLLBACK')
      throw new DatabaseError(
        `批量创建记录失败: ${error instanceof Error ? error.message : error}`,
        'CREATE_MANY_ERROR',
        { tableName: this.tableName, count: items.length }
      )
    } finally {
      client.release()
    }
  }

  /**
   * 更新记录
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined)
      if (fields.length === 0) {
        throw new Error('没有要更新的字段')
      }

      const values = fields.map(key => data[key as keyof T])
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `

      const result = await this.pool.query(query, [id, ...values])
      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(
        `更新记录失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_ERROR',
        { tableName: this.tableName, id, data }
      )
    }
  }

  /**
   * 批量更新记录
   */
  async updateMany(filters: Record<string, any>, data: Partial<T>): Promise<T[]> {
    try {
      const updateFields = Object.keys(data).filter(key => data[key as keyof T] !== undefined)
      if (updateFields.length === 0) {
        throw new Error('没有要更新的字段')
      }

      const { whereClause, values: whereValues } = this.buildWhereClause(filters)
      if (!whereClause) {
        throw new Error('批量更新必须提供过滤条件')
      }

      const updateValues = updateFields.map(key => data[key as keyof T])
      const setClause = updateFields.map(
        (field, index) => `${field} = $${index + 1}`
      ).join(', ')

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + updateFields.length}`)}
        RETURNING *
      `

      const result = await this.pool.query(query, [...updateValues, ...whereValues])
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `批量更新记录失败: ${error instanceof Error ? error.message : error}`,
        'UPDATE_MANY_ERROR',
        { tableName: this.tableName, filters, data }
      )
    }
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`
      const result = await this.pool.query(query, [id])
      return (result.rowCount || 0) > 0
    } catch (error) {
      throw new DatabaseError(
        `删除记录失败: ${error instanceof Error ? error.message : error}`,
        'DELETE_ERROR',
        { tableName: this.tableName, id }
      )
    }
  }

  /**
   * 批量删除记录
   */
  async deleteMany(filters: Record<string, any>): Promise<number> {
    try {
      const { whereClause, values } = this.buildWhereClause(filters)
      if (!whereClause) {
        throw new Error('批量删除必须提供过滤条件')
      }

      const query = `DELETE FROM ${this.tableName} ${whereClause}`
      const result = await this.pool.query(query, values)
      return result.rowCount || 0
    } catch (error) {
      throw new DatabaseError(
        `批量删除记录失败: ${error instanceof Error ? error.message : error}`,
        'DELETE_MANY_ERROR',
        { tableName: this.tableName, filters }
      )
    }
  }

  /**
   * 统计记录数量
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      const { whereClause, values } = this.buildWhereClause(filters)
      const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`

      const result = await this.pool.query(query, values)
      return parseInt(result.rows[0].total)
    } catch (error) {
      throw new DatabaseError(
        `统计记录失败: ${error instanceof Error ? error.message : error}`,
        'COUNT_ERROR',
        { tableName: this.tableName, filters }
      )
    }
  }

  /**
   * 检查记录是否存在
   */
  async exists(filters: Record<string, any>): Promise<boolean> {
    const count = await this.count(filters)
    return count > 0
  }

  /**
   * 执行自定义查询
   */
  async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
    try {
      const result = await this.pool.query(sql, params)
      return result.rows
    } catch (error) {
      throw new DatabaseError(
        `自定义查询失败: ${error instanceof Error ? error.message : error}`,
        'CUSTOM_QUERY_ERROR',
        { sql, params }
      )
    }
  }

  /**
   * 在事务中执行操作
   */
  async transaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 获取表信息
   */
  async getTableInfo(): Promise<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default: string | null
    }>
    indexes: string[]
    rowCount: number
  }> {
    try {
      // 获取列信息
      const columnsQuery = `
        SELECT
          column_name as name,
          data_type as type,
          is_nullable::boolean as nullable,
          column_default as default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `
      const columns = await this.query(columnsQuery, [this.tableName])

      // 获取索引信息
      const indexesQuery = `
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = $1
      `
      const indexResults = await this.query(indexesQuery, [this.tableName])
      const indexes = indexResults.map((row: any) => row.indexname)

      // 获取行数
      const rowCount = await this.count()

      return {
        name: this.tableName,
        columns,
        indexes,
        rowCount
      }
    } catch (error) {
      throw new DatabaseError(
        `获取表信息失败: ${error instanceof Error ? error.message : error}`,
        'TABLE_INFO_ERROR',
        { tableName: this.tableName }
      )
    }
  }
}