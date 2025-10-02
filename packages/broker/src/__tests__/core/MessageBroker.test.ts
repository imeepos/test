import { describe, it, expect, vi } from 'vitest'
import type { BrokerConfig } from '../../types/BrokerConfig.js'

// Mock ConnectionManager
vi.mock('../../connection/ConnectionManager.js', () => {
  return {
    ConnectionManager: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getConnection: vi.fn().mockReturnValue({
        createChannel: vi.fn().mockResolvedValue({
          assertExchange: vi.fn().mockResolvedValue(undefined),
          assertQueue: vi.fn().mockResolvedValue({ queue: 'test.queue', messageCount: 0, consumerCount: 0 }),
          bindQueue: vi.fn().mockResolvedValue(undefined),
          publish: vi.fn().mockReturnValue(true),
          sendToQueue: vi.fn().mockReturnValue(true),
          consume: vi.fn().mockResolvedValue({ consumerTag: 'test-consumer' }),
          ack: vi.fn(),
          nack: vi.fn(),
          reject: vi.fn(),
          close: vi.fn().mockResolvedValue(undefined),
          prefetch: vi.fn().mockResolvedValue(undefined),
          on: vi.fn(),
          checkQueue: vi.fn().mockResolvedValue({ queue: 'test.queue', messageCount: 0, consumerCount: 0 }),
          purgeQueue: vi.fn().mockResolvedValue({ messageCount: 0 }),
          deleteQueue: vi.fn().mockResolvedValue({ messageCount: 0 }),
        }),
        createConfirmChannel: vi.fn().mockResolvedValue({
          assertExchange: vi.fn().mockResolvedValue(undefined),
          assertQueue: vi.fn().mockResolvedValue({ queue: 'test.queue', messageCount: 0, consumerCount: 0 }),
          publish: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
          prefetch: vi.fn().mockResolvedValue(undefined),
          on: vi.fn(),
          waitForConfirms: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      on: vi.fn(),
    })),
  }
})

// Mock QueueManager
vi.mock('../../queue/QueueManager.js', () => {
  return {
    QueueManager: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

describe('@sker/broker - MessageBroker', () => {
  const createMockConfig = (): BrokerConfig => ({
    connectionUrl: 'amqp://localhost',
    exchanges: {},
    queues: {},
    prefetch: 10,
  })

  describe('Connection Management', () => {
    it('应该成功启动消息代理', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const broker = new MessageBroker(createMockConfig())
      await broker.start()

      expect(broker.isConnected()).toBe(true)
      expect(broker.isReady()).toBe(true)

      await broker.stop()
    })

    it('应该在启动失败时抛出错误', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const { ConnectionManager } = await import('../../connection/ConnectionManager.js')

      // Mock connect to fail
      vi.mocked(ConnectionManager).mockImplementationOnce(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: vi.fn(),
        isConnected: vi.fn().mockReturnValue(false),
        getConnection: vi.fn().mockReturnValue(null),
        on: vi.fn(),
      }) as any)

      const broker = new MessageBroker(createMockConfig())

      await expect(broker.start()).rejects.toThrow()
    })

    it('应该正确停止消息代理', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const broker = new MessageBroker(createMockConfig())

      await broker.start()
      await broker.stop()

      expect(broker.isReady()).toBe(false)
    })
  })

  describe('Message Publishing', () => {
    it('应该成功发布消息', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const broker = new MessageBroker(createMockConfig())
      await broker.start()

      const message = { type: 'test', data: 'hello' }
      await broker.publish('test.exchange', 'test.key', message)

      await broker.stop()
    })

    it('应该在broker未就绪时抛出错误', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const broker = new MessageBroker(createMockConfig())
      // 不调用 start()

      await expect(
        broker.publish('test.exchange', 'test.key', { data: 'test' })
      ).rejects.toThrow('Broker not ready')
    })
  })

  describe('Message Consumption', () => {
    it('应该成功订阅queue消息', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const broker = new MessageBroker(createMockConfig())
      await broker.start()

      const handler = vi.fn().mockResolvedValue(undefined)
      const result = await broker.consume('test.queue', handler)

      expect(result).toBeDefined()
      expect(result.consumerTag).toBe('test-consumer')

      await broker.stop()
    })
  })

  describe('Configuration', () => {
    it('应该使用提供的配置', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')

      const config: BrokerConfig = {
        connectionUrl: 'amqp://custom-host',
        exchanges: {
          'test-exchange': {
            type: 'topic',
            durable: true,
          },
        },
        queues: {
          'test-queue': {
            durable: true,
          },
        },
        prefetch: 5,
      }

      const broker = new MessageBroker(config)
      const stats = broker.getStats()

      expect(stats.config.exchanges).toContain('test-exchange')
      expect(stats.config.queues).toContain('test-queue')
      expect(stats.config.prefetch).toBe(5)
    })
  })
})
