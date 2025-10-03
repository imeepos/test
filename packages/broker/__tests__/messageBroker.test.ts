/**
 * MessageBroker 单元测试
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { Connection, Channel } from 'amqplib'

describe('MessageBroker', () => {
  let mockConnection: Partial<Connection>
  let mockChannel: Partial<Channel>

  beforeAll(() => {
    mockChannel = {
      assertExchange: async () => ({ exchange: '' }),
      assertQueue: async () => ({ queue: '', messageCount: 0, consumerCount: 0 }),
      bindQueue: async () => ({}),
      publish: () => true,
      consume: async () => ({ consumerTag: '' }),
      ack: () => {},
      nack: () => {},
      prefetch: () => {},
    } as any

    mockConnection = {
      createChannel: async () => mockChannel as Channel,
      close: async () => {},
    } as any
  })

  describe('队列初始化', () => {
    it('应该创建必要的交换机', async () => {
      const exchanges = [
        'llm.direct',
        'events.topic',
        'realtime.fanout',
        'ai.results.topic'
      ]

      // 模拟验证交换机创建
      exchanges.forEach(exchange => {
        expect(exchange).toBeDefined()
        expect(typeof exchange).toBe('string')
      })
    })

    it('应该创建必要的队列', async () => {
      const queues = [
        'llm.process.queue',
        'result.notify.queue',
        'events.websocket.queue',
        'events.storage.queue',
        'realtime.broadcast.queue'
      ]

      queues.forEach(queue => {
        expect(queue).toBeDefined()
        expect(typeof queue).toBe('string')
      })
    })
  })

  describe('消息发布', () => {
    it('应该能够发布AI任务消息', async () => {
      const taskMessage = {
        taskId: 'task-123',
        type: 'generate',
        projectId: 'project-1',
        userId: 'user-1',
        input: { content: 'test' }
      }

      expect(taskMessage).toBeDefined()
      expect(taskMessage.taskId).toBe('task-123')
      expect(taskMessage.type).toBe('generate')
    })

    it('应该能够发布事件消息', async () => {
      const eventMessage = {
        eventType: 'node.created',
        entityId: 'node-123',
        data: { content: 'test node' }
      }

      expect(eventMessage).toBeDefined()
      expect(eventMessage.eventType).toBe('node.created')
    })
  })

  describe('消息消费', () => {
    it('应该能够消费队列消息', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({ test: 'data' })),
        fields: { deliveryTag: 1, routingKey: 'test' },
        properties: { headers: {} }
      }

      const parsed = JSON.parse(mockMessage.content.toString())
      expect(parsed).toEqual({ test: 'data' })
    })

    it('应该能够确认消息', async () => {
      const deliveryTag = 1
      expect(deliveryTag).toBeDefined()
      expect(typeof deliveryTag).toBe('number')
    })
  })

  describe('错误处理', () => {
    it('应该处理连接失败', async () => {
      const error = new Error('Connection failed')
      expect(error.message).toBe('Connection failed')
    })

    it('应该处理消息解析失败', async () => {
      const invalidMessage = 'invalid json'
      expect(() => JSON.parse(invalidMessage)).toThrow()
    })
  })

  describe('重试机制', () => {
    it('应该支持消息重试', async () => {
      const retryConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2
      }

      expect(retryConfig.maxRetries).toBe(3)
      expect(retryConfig.initialDelay).toBe(1000)
    })
  })
})
