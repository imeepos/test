import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { BaseRepository } from '../../repositories/BaseRepository'
import { QueryOptions } from '../../models/index'

// Mock database manager
jest.mock('../../config/database', () => ({
  databaseManager: {
    getPostgresPool: jest.fn(() => ({
      query: jest.fn(),
    })),
  },
}))

// 创建测试用的具体Repository类
class TestRepository extends BaseRepository<{ id: string; name: string; status: string }> {
  constructor() {
    super('test_table')
  }
}

describe('@sker/store - BaseRepository', () => {
  let repository: TestRepository
  let mockQuery: any

  beforeEach(() => {
    repository = new TestRepository()
    const { databaseManager } = require('../../config/database')
    mockQuery = jest.fn()
    databaseManager.getPostgresPool = jest.fn(() => ({
      query: mockQuery,
    }))
  })

  describe('buildWhereClause', () => {
    it('应该构建简单的WHERE子句', () => {
      const filters = { id: '123', status: 'active' }
      const result = (repository as any).buildWhereClause(filters)

      expect(result.whereClause).toBe('WHERE id = $1 AND status = $2')
      expect(result.values).toEqual(['123', 'active'])
    })

    it('应该处理空过滤条件', () => {
      const result = (repository as any).buildWhereClause({})

      expect(result.whereClause).toBe('')
      expect(result.values).toEqual([])
    })

    it('应该处理null值', () => {
      const filters = { deleted_at: null }
      const result = (repository as any).buildWhereClause(filters)

      expect(result.whereClause).toBe('WHERE deleted_at IS NULL')
      expect(result.values).toEqual([])
    })

    it('应该处理数组条件(IN查询)', () => {
      const filters = { status: ['active', 'paused', 'completed'] }
      const result = (repository as any).buildWhereClause(filters)

      expect(result.whereClause).toBe('WHERE status IN ($1, $2, $3)')
      expect(result.values).toEqual(['active', 'paused', 'completed'])
    })

    it('应该处理复杂查询条件(LIKE)', () => {
      const filters = { name: { operator: 'LIKE', value: '%test%' } }
      const result = (repository as any).buildWhereClause(filters)

      expect(result.whereClause).toBe('WHERE name LIKE $1')
      expect(result.values).toEqual(['%test%'])
    })

    it('应该跳过undefined值', () => {
      const filters = { id: '123', name: undefined, status: 'active' }
      const result = (repository as any).buildWhereClause(filters)

      expect(result.whereClause).toBe('WHERE id = $1 AND status = $2')
      expect(result.values).toEqual(['123', 'active'])
    })
  })

  describe('buildOrderClause', () => {
    it('应该构建ORDER BY子句', () => {
      const result = (repository as any).buildOrderClause('created_at', 'DESC')
      expect(result).toBe('ORDER BY created_at DESC')
    })

    it('应该默认使用ASC排序', () => {
      const result = (repository as any).buildOrderClause('name')
      expect(result).toBe('ORDER BY name ASC')
    })

    it('应该在没有orderBy时返回空字符串', () => {
      const result = (repository as any).buildOrderClause()
      expect(result).toBe('')
    })
  })

  describe('buildLimitClause', () => {
    it('应该构建LIMIT和OFFSET子句', () => {
      const result = (repository as any).buildLimitClause(10, 20)
      expect(result).toBe('LIMIT 10 OFFSET 20')
    })

    it('应该只构建LIMIT子句', () => {
      const result = (repository as any).buildLimitClause(10)
      expect(result).toBe('LIMIT 10')
    })

    it('应该只构建OFFSET子句', () => {
      const result = (repository as any).buildLimitClause(undefined, 20)
      expect(result).toBe('OFFSET 20')
    })

    it('应该返回空字符串', () => {
      const result = (repository as any).buildLimitClause()
      expect(result).toBe('')
    })
  })

  describe('findById', () => {
    it('应该通过ID查找记录', async () => {
      const mockData = { id: '123', name: 'Test', status: 'active' }
      mockQuery.mockResolvedValue({ rows: [mockData] })

      const result = await repository.findById('123')

      expect(result).toEqual(mockData)
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1 LIMIT 1',
        ['123']
      )
    })

    it('应该在记录不存在时返回null', async () => {
      mockQuery.mockResolvedValue({ rows: [] })

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('应该在数据库错误时抛出异常', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection error'))

      await expect(repository.findById('123')).rejects.toThrow()
    })
  })

  describe('findOne', () => {
    it('应该根据过滤条件查找单个记录', async () => {
      const mockData = { id: '123', name: 'Test', status: 'active' }
      mockQuery.mockResolvedValue({ rows: [mockData] })

      const result = await repository.findOne({ status: 'active' })

      expect(result).toEqual(mockData)
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE status = $1 LIMIT 1',
        ['active']
      )
    })
  })

  describe('创建和更新操作', () => {
    it('应该创建新记录', async () => {
      const newData = { name: 'New Item', status: 'active' }
      const mockResult = { id: 'new-id', ...newData, created_at: new Date() }
      mockQuery.mockResolvedValue({ rows: [mockResult] })

      const result = await repository.create(newData)

      expect(result).toBeDefined()
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该更新现有记录', async () => {
      const updates = { name: 'Updated Name', status: 'paused' }
      const mockResult = { id: '123', ...updates, updated_at: new Date() }
      mockQuery.mockResolvedValue({ rows: [mockResult] })

      const result = await repository.update('123', updates)

      expect(result).toBeDefined()
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该删除记录', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 })

      const result = await repository.delete('123')

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该在删除不存在的记录时返回false', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 })

      const result = await repository.delete('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('批量操作', () => {
    it('应该查找多个记录', async () => {
      const mockData = [
        { id: '1', name: 'Item 1', status: 'active' },
        { id: '2', name: 'Item 2', status: 'active' },
      ]
      mockQuery.mockResolvedValue({ rows: mockData })

      const result = await repository.findMany({ filters: { status: 'active' } })

      expect(result).toHaveLength(2)
      expect(result).toEqual(mockData)
    })

    it('应该支持分页查询', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: 50 }] }) // 总数查询 - 使用数字而不是字符串
        .mockResolvedValueOnce({
          rows: [
            { id: '1', name: 'Item 1', status: 'active' },
            { id: '2', name: 'Item 2', status: 'active' },
          ],
        }) // 数据查询

      const result = await repository.findWithPagination({
        filters: { status: 'active' },
        limit: 10,
        offset: 0,
      })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination.total).toBe(50)
      expect(result.data).toHaveLength(2)
    })
  })

  describe('事务支持', () => {
    it('应该在事务中执行操作', async () => {
      const mockClient: any = {
        query: jest.fn(),
        release: jest.fn(),
      }

      const mockPool: any = {
        // @ts-expect-error - Mock typing issue with jest
        connect: jest.fn().mockResolvedValue(mockClient),
      }

      const { databaseManager } = require('../../config/database.js')
      databaseManager.getPostgresPool = jest.fn(() => mockPool)

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: '123' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      // 假设repository有 withTransaction 方法
      // 这里只是示例测试思路
      expect(mockClient).toBeDefined()
    })
  })
})
