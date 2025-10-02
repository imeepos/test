/**
 * 事件系统测试
 */

import { describe, it, expect } from 'vitest'
import { createEventKey, getEventKeyString, type EventKey } from '../event-keys.js'
import { EventKeys } from '../event-registry.js'
import type {
  AITaskCompletedEvent,
  NodeCreatedEvent,
  SystemErrorEvent
} from '../event-types.js'

describe('Event System', () => {
  describe('createEventKey', () => {
    it('should create event key with type branding', () => {
      const key = createEventKey<AITaskCompletedEvent>('test.event')

      // 类型断言：key 应该是 string 类型
      expect(typeof key).toBe('string')
      expect(key).toBe('test.event')
    })

    it('should create different keys for different events', () => {
      const key1 = createEventKey<AITaskCompletedEvent>('event.1')
      const key2 = createEventKey<NodeCreatedEvent>('event.2')

      expect(key1).not.toBe(key2)
    })
  })

  describe('getEventKeyString', () => {
    it('should extract string from event key', () => {
      const key = createEventKey<AITaskCompletedEvent>('my.event')
      const str = getEventKeyString(key)

      expect(str).toBe('my.event')
      expect(typeof str).toBe('string')
    })
  })

  describe('EventKeys registry', () => {
    it('should have all AI task event keys', () => {
      expect(EventKeys.AI_TASK_QUEUED).toBe('ai.task.queued')
      expect(EventKeys.AI_TASK_PROCESSING).toBe('ai.task.processing')
      expect(EventKeys.AI_TASK_COMPLETED).toBe('ai.task.completed')
      expect(EventKeys.AI_TASK_FAILED).toBe('ai.task.failed')
    })

    it('should have all node event keys', () => {
      expect(EventKeys.NODE_CREATED).toBe('node.created')
      expect(EventKeys.NODE_UPDATED).toBe('node.updated')
      expect(EventKeys.NODE_DELETED).toBe('node.deleted')
      expect(EventKeys.NODE_STATUS_CHANGED).toBe('node.status.changed')
    })

    it('should have all connection event keys', () => {
      expect(EventKeys.CONNECTION_CREATED).toBe('connection.created')
      expect(EventKeys.CONNECTION_DELETED).toBe('connection.deleted')
    })

    it('should have all project event keys', () => {
      expect(EventKeys.PROJECT_CREATED).toBe('project.created')
      expect(EventKeys.PROJECT_UPDATED).toBe('project.updated')
      expect(EventKeys.PROJECT_DELETED).toBe('project.deleted')
    })

    it('should have all system event keys', () => {
      expect(EventKeys.SYSTEM_HEALTH_CHECK).toBe('system.health.check')
      expect(EventKeys.SYSTEM_ERROR).toBe('system.error')
    })
  })

  describe('Type Safety', () => {
    it('should ensure type safety at compile time', () => {
      // 这个测试主要验证 TypeScript 编译时类型检查
      // 如果类型不匹配，编译会失败

      const completedEvent: AITaskCompletedEvent = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        result: {
          content: 'Generated content',
          title: 'Generated title',
          confidence: 0.95
        },
        processingTime: 1500,
        timestamp: new Date()
      }

      // 模拟事件处理
      const handler = (event: AITaskCompletedEvent) => {
        expect(event.taskId).toBe(completedEvent.taskId)
        expect(event.result.content).toBe('Generated content')
      }

      handler(completedEvent)
    })

    it('should work with different event types', () => {
      const nodeEvent: NodeCreatedEvent = {
        nodeId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        position: { x: 100, y: 200 },
        aiGenerated: true,
        timestamp: new Date()
      }

      const errorEvent: SystemErrorEvent = {
        code: 'SYSTEM_ERROR',
        message: 'Something went wrong',
        timestamp: new Date()
      }

      expect(nodeEvent.nodeId).toBeDefined()
      expect(errorEvent.code).toBe('SYSTEM_ERROR')
    })
  })

  describe('Event Type Definitions', () => {
    it('should have correct AITaskCompletedEvent structure', () => {
      const event: AITaskCompletedEvent = {
        taskId: 'task-123',
        nodeId: 'node-456',
        result: {
          content: 'Content',
          title: 'Title',
          confidence: 0.9
        },
        processingTime: 1000,
        timestamp: new Date()
      }

      expect(event.taskId).toBe('task-123')
      expect(event.result.confidence).toBe(0.9)
    })

    it('should support optional fields in events', () => {
      const event: AITaskCompletedEvent = {
        taskId: 'task-123',
        nodeId: 'node-456',
        result: {
          content: 'Content',
          title: 'Title',
          confidence: 0.9,
          semanticType: 'requirement', // 可选字段
          importanceLevel: 4 // 可选字段
        },
        processingTime: 1000,
        timestamp: new Date()
      }

      expect(event.result.semanticType).toBe('requirement')
      expect(event.result.importanceLevel).toBe(4)
    })

    it('should have correct NodeCreatedEvent structure', () => {
      const event: NodeCreatedEvent = {
        nodeId: 'node-123',
        projectId: 'project-456',
        userId: 'user-789',
        position: { x: 10, y: 20 },
        aiGenerated: false,
        timestamp: new Date()
      }

      expect(event.position.x).toBe(10)
      expect(event.aiGenerated).toBe(false)
    })
  })
})
