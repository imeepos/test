/**
 * NodeRepository 单元测试
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { NodeRepository } from '../src/repositories/NodeRepository'
import type { Pool } from 'pg'

describe('NodeRepository', () => {
  let repository: NodeRepository
  let mockPool: Partial<Pool>
  let mockClient: any

  beforeAll(() => {
    // Mock PostgreSQL client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    }

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
    } as any

    repository = new NodeRepository(mockPool as Pool)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('应该能够根据ID查找节点', async () => {
      const mockNode = {
        id: 'test-node-id',
        project_id: 'test-project-id',
        user_id: 'test-user-id',
        content: 'Test content',
        title: 'Test Node',
        importance: 3,
        confidence: 0.85,
        status: 'completed',
        tags: ['test'],
        version: 1,
        position: { x: 100, y: 200 },
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockClient.query.mockResolvedValueOnce({ rows: [mockNode] })

      const result = await repository.findById('test-node-id')

      expect(result).toBeDefined()
      expect(result?.id).toBe('test-node-id')
      expect(result?.content).toBe('Test content')
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test-node-id']
      )
    })

    it('节点不存在时应该返回null', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] })

      const result = await repository.findById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('findByProjectId', () => {
    it('应该能够查找项目的所有节点', async () => {
      const mockNodes = [
        { id: 'node-1', project_id: 'project-1', content: 'Node 1' },
        { id: 'node-2', project_id: 'project-1', content: 'Node 2' },
      ]

      mockClient.query.mockResolvedValueOnce({ rows: mockNodes })

      const result = await repository.findByProjectId('project-1')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('node-1')
      expect(result[1].id).toBe('node-2')
    })
  })

  describe('create', () => {
    it('应该能够创建新节点', async () => {
      const nodeData = {
        id: 'new-node-id',
        project_id: 'test-project',
        user_id: 'test-user',
        content: 'New node content',
        title: 'New Node',
        importance: 4,
        confidence: 0.9,
        status: 'idle' as const,
        tags: ['new'],
        version: 1,
        position: { x: 0, y: 0 },
      }

      mockClient.query.mockResolvedValueOnce({ rows: [{ ...nodeData, created_at: new Date(), updated_at: new Date() }] })

      const result = await repository.create(nodeData)

      expect(result).toBeDefined()
      expect(result.id).toBe('new-node-id')
      expect(mockClient.query).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应该能够更新节点', async () => {
      const updates = {
        content: 'Updated content',
        confidence: 0.95,
        status: 'completed' as const,
      }

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 'test-id', ...updates, updated_at: new Date() }]
      })

      const result = await repository.update('test-id', updates)

      expect(result).toBeDefined()
      expect(result?.content).toBe('Updated content')
      expect(result?.confidence).toBe(0.95)
    })
  })

  describe('delete', () => {
    it('应该能够删除节点', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 })

      const result = await repository.delete('test-id')

      expect(result).toBe(true)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['test-id']
      )
    })

    it('删除不存在的节点应返回false', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 })

      const result = await repository.delete('non-existent-id')

      expect(result).toBe(false)
    })
  })

  describe('findByStatus', () => {
    it('应该能够根据状态查找节点', async () => {
      const errorNodes = [
        { id: 'error-1', status: 'error', content: 'Error node 1' },
        { id: 'error-2', status: 'error', content: 'Error node 2' },
      ]

      mockClient.query.mockResolvedValueOnce({ rows: errorNodes })

      const result = await repository.findByStatus('test-project', 'error')

      expect(result).toHaveLength(2)
      expect(result.every(n => n.status === 'error')).toBe(true)
    })
  })
})
