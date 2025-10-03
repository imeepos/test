import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ProjectRepository } from '../../repositories/ProjectRepository'
import { Project } from '../../models/index'

// Mock database manager
jest.mock('../../config/database', () => ({
  databaseManager: {
    getPostgresPool: jest.fn(() => ({
      query: jest.fn(),
    })),
  },
}))

describe('@sker/store - ProjectRepository', () => {
  let repository: ProjectRepository
  let mockQuery: any

  beforeEach(() => {
    repository = new ProjectRepository()
    const { databaseManager } = require('../../config/database')
    mockQuery = jest.fn()
    databaseManager.getPostgresPool = jest.fn(() => ({
      query: mockQuery,
    }))
  })

  const createMockProject = (overrides?: Partial<Project>): Project => ({
    id: 'project-123',
    user_id: 'user-456',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    is_archived: false,
    canvas_data: {
      viewport: { x: 0, y: 0, zoom: 1 },
      config: {
        maxZoom: 2,
        minZoom: 0.1,
        gridSize: 20,
        snapToGrid: true,
        showGrid: true
      }
    },
    settings: {
      collaboration: { enabled: true, permissions: 'admin' },
      ai_assistance: { enabled: true, auto_optimize: true, suggestion_level: 'moderate' },
      version_control: { enabled: true, auto_save_interval: 300 }
    },
    created_at: new Date(),
    updated_at: new Date(),
    last_accessed_at: new Date(),
    ...overrides,
  })

  describe('findByUser', () => {
    it('应该查找用户的所有项目', async () => {
      const mockProjects = [
        createMockProject({ id: '1', name: 'Project 1' }),
        createMockProject({ id: '2', name: 'Project 2' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findByUser('user-456')

      expect(result).toHaveLength(2)
      expect(result).toEqual(mockProjects)
      expect(mockQuery).toHaveBeenCalled()
      const call = mockQuery.mock.calls[0]
      expect(call[0]).toContain('user_id = $1')
    })

    it('应该支持额外的过滤条件', async () => {
      const mockProjects = [createMockProject({ status: 'active' })]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findByUser('user-456', {
        filters: { status: 'active' },
      })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
    })
  })

  describe('findByUserWithPagination', () => {
    it('应该分页查找用户的项目', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 25 }] }) // 总数 - 使用 total 字段
        .mockResolvedValueOnce({
          rows: [
            createMockProject({ id: '1' }),
            createMockProject({ id: '2' }),
          ],
        }) // 数据

      const result = await repository.findByUserWithPagination('user-456', {
        limit: 10,
        offset: 0,
      })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(25)
      expect(result.pagination.page).toBeDefined()
      expect(result.pagination.totalPages).toBeDefined()
    })
  })

  describe('findByStatus', () => {
    it('应该根据单个状态查找项目', async () => {
      const mockProjects = [createMockProject({ status: 'active' })]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findByStatus('active')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('active')
    })

    it('应该根据多个状态查找项目', async () => {
      const mockProjects = [
        createMockProject({ id: '1', status: 'active' }),
        createMockProject({ id: '2', status: 'paused' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findByStatus(['active', 'paused'])

      expect(result).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalled()
      const call = mockQuery.mock.calls[0]
      expect(call[0]).toContain('IN')
    })
  })

  describe('findActive', () => {
    it('应该查找所有活跃项目', async () => {
      const mockProjects = [
        createMockProject({ id: '1', is_archived: false, status: 'active' }),
        createMockProject({ id: '2', is_archived: false, status: 'paused' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findActive()

      expect(result).toHaveLength(2)
      result.forEach(project => {
        expect(project.is_archived).toBe(false)
        expect(['active', 'paused']).toContain(project.status)
      })
    })

    it('应该查找指定用户的活跃项目', async () => {
      const mockProjects = [
        createMockProject({ user_id: 'user-456', is_archived: false, status: 'active' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findActive('user-456')

      expect(result).toHaveLength(1)
      expect(result[0].user_id).toBe('user-456')
      expect(result[0].is_archived).toBe(false)
    })
  })

  describe('findArchived', () => {
    it('应该查找所有归档项目', async () => {
      const mockProjects = [
        createMockProject({ id: '1', is_archived: true }),
        createMockProject({ id: '2', is_archived: true }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findArchived()

      expect(result).toHaveLength(2)
      result.forEach(project => {
        expect(project.is_archived).toBe(true)
      })
    })

    it('应该查找指定用户的归档项目', async () => {
      const mockProjects = [
        createMockProject({ user_id: 'user-456', is_archived: true }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.findArchived('user-456')

      expect(result).toHaveLength(1)
      expect(result[0].user_id).toBe('user-456')
      expect(result[0].is_archived).toBe(true)
    })
  })

  describe('search', () => {
    it('应该搜索项目', async () => {
      const mockProjects = [
        createMockProject({ name: 'Test Project 1' }),
        createMockProject({ name: 'Test Project 2' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.search('test')

      expect(result).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该在指定用户范围内搜索', async () => {
      const mockProjects = [
        createMockProject({ user_id: 'user-456', name: 'User Test Project' }),
      ]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.search('test', 'user-456')

      expect(result).toHaveLength(1)
      expect(result[0].user_id).toBe('user-456')
    })

    it('应该支持排序和分页', async () => {
      const mockProjects = [createMockProject()]
      mockQuery.mockResolvedValue({ rows: mockProjects })

      const result = await repository.search('test', undefined, {
        orderBy: 'created_at',
        orderDirection: 'DESC',
        limit: 10,
        offset: 0,
      })

      expect(result).toBeDefined()
      expect(mockQuery).toHaveBeenCalled()
      const call = mockQuery.mock.calls[0]
      expect(call[0]).toContain('ORDER BY')
      expect(call[0]).toContain('LIMIT')
    })
  })

  describe('CRUD 操作', () => {
    it('应该创建新项目', async () => {
      const newProject = {
        user_id: 'user-456',
        name: 'New Project',
        description: 'A new test project',
        status: 'active' as const,
      }
      const mockResult = createMockProject(newProject)
      mockQuery.mockResolvedValue({ rows: [mockResult] })

      const result = await repository.create(newProject)

      expect(result).toBeDefined()
      expect(result.name).toBe('New Project')
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该更新项目', async () => {
      const updates = {
        name: 'Updated Project Name',
        description: 'Updated description',
      }
      const mockResult = createMockProject(updates)
      mockQuery.mockResolvedValue({ rows: [mockResult] })

      const result = await repository.update('project-123', updates)

      expect(result).toBeDefined()
      expect(result?.name).toBe('Updated Project Name')
      expect(mockQuery).toHaveBeenCalled()
    })

    it('应该删除项目', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 })

      const result = await repository.delete('project-123')

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('应该在数据库错误时抛出异常', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection lost'))

      await expect(repository.findById('project-123')).rejects.toThrow()
    })

    it('应该在创建失败时抛出异常', async () => {
      mockQuery.mockRejectedValue(new Error('Unique constraint violation'))

      await expect(
        repository.create({
          user_id: 'user-456',
          name: 'Duplicate Project',
          status: 'active',
        })
      ).rejects.toThrow()
    })
  })
})
