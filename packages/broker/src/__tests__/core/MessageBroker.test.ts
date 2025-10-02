import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Connection, Channel, ConsumeMessage } from 'amqplib'

// Mock amqplib
vi.mock('amqplib', () => ({
  connect: vi.fn(),
}))

describe('@sker/broker - MessageBroker', () => {
  let mockConnection: Partial<Connection>
  let mockChannel: Partial<Channel>

  beforeEach(() => {
    // 模拟 RabbitMQ channel
    mockChannel = {
      assertExchange: vi.fn().mockResolvedValue(undefined),
      assertQueue: vi.fn().mockResolvedValue({ queue: 'test-queue' }),
      bindQueue: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockReturnValue(true),
      sendToQueue: vi.fn().mockReturnValue(true),
      consume: vi.fn().mockResolvedValue({ consumerTag: 'test-consumer' }),
      ack: vi.fn(),
      nack: vi.fn(),
      prefetch: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    }

    // 模拟 RabbitMQ connection
    mockConnection = {
      createChannel: vi.fn().mockResolvedValue(mockChannel),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Connection Management', () => {
    it('应该成功建立连接', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      // 动态导入 MessageBroker 以使用 mocked amqplib
      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({
        url: 'amqp://localhost',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      })

      await broker.connect()

      expect(connect).toHaveBeenCalledWith('amqp://localhost')
      expect(mockConnection.createChannel).toHaveBeenCalled()
    })

    it('应该在连接失败时抛出错误', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockRejectedValue(new Error('Connection failed'))

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({
        url: 'amqp://invalid',
        reconnectInterval: 100,
        maxReconnectAttempts: 1,
      })

      await expect(broker.connect()).rejects.toThrow('Connection failed')
    })

    it('应该正确断开连接', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })

      await broker.connect()
      await broker.disconnect()

      expect(mockChannel.close).toHaveBeenCalled()
      expect(mockConnection.close).toHaveBeenCalled()
    })
  })

  describe('Exchange and Queue Setup', () => {
    it('应该正确创建exchange', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      await broker.assertExchange('test.exchange', 'direct')

      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'test.exchange',
        'direct',
        expect.objectContaining({ durable: true })
      )
    })

    it('应该正确创建queue', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const result = await broker.assertQueue('test.queue')

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'test.queue',
        expect.objectContaining({ durable: true })
      )
      expect(result.queue).toBe('test-queue')
    })

    it('应该正确绑定queue到exchange', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      await broker.bindQueue('test.queue', 'test.exchange', 'routing.key')

      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'test.queue',
        'test.exchange',
        'routing.key'
      )
    })
  })

  describe('Message Publishing', () => {
    it('应该成功发布消息到exchange', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const message = { type: 'test', data: 'hello' }
      const result = broker.publish('test.exchange', 'routing.key', message)

      expect(result).toBe(true)
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'test.exchange',
        'routing.key',
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('应该成功发送消息到queue', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const message = { type: 'test', data: 'hello' }
      const result = broker.sendToQueue('test.queue', message)

      expect(result).toBe(true)
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test.queue',
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('应该正确序列化消息为JSON', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const message = { id: '123', content: 'test' }
      broker.sendToQueue('test.queue', message)

      const publishCall = vi.mocked(mockChannel.sendToQueue).mock.calls[0]
      const buffer = publishCall[1] as Buffer
      const parsedMessage = JSON.parse(buffer.toString())

      expect(parsedMessage).toEqual(message)
    })
  })

  describe('Message Consumption', () => {
    it('应该成功订阅queue消息', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const handler = vi.fn().mockResolvedValue(undefined)
      await broker.consume('test.queue', handler)

      expect(mockChannel.consume).toHaveBeenCalledWith(
        'test.queue',
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('应该正确处理接收到的消息', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const testMessage = { id: '123', content: 'test' }
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(testMessage)),
        fields: {
          deliveryTag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routingKey: 'test.key',
        } as any,
        properties: {} as any,
      }

      vi.mocked(mockChannel.consume).mockImplementation(async (queue, onMessage) => {
        if (onMessage) {
          // 模拟接收消息
          await onMessage(mockMsg as ConsumeMessage)
        }
        return { consumerTag: 'test-consumer' }
      })

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const handler = vi.fn().mockResolvedValue(undefined)
      await broker.consume('test.queue', handler)

      expect(handler).toHaveBeenCalledWith(testMessage, mockMsg)
    })

    it('应该在消息处理成功后ack', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const testMessage = { id: '123' }
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(testMessage)),
        fields: { deliveryTag: 1 } as any,
        properties: {} as any,
      }

      vi.mocked(mockChannel.consume).mockImplementation(async (queue, onMessage) => {
        if (onMessage) {
          await onMessage(mockMsg as ConsumeMessage)
        }
        return { consumerTag: 'test-consumer' }
      })

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const handler = vi.fn().mockResolvedValue(undefined)
      await broker.consume('test.queue', handler)

      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg)
    })

    it('应该在消息处理失败后nack', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const testMessage = { id: '123' }
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(testMessage)),
        fields: { deliveryTag: 1 } as any,
        properties: {} as any,
      }

      vi.mocked(mockChannel.consume).mockImplementation(async (queue, onMessage) => {
        if (onMessage) {
          await onMessage(mockMsg as ConsumeMessage)
        }
        return { consumerTag: 'test-consumer' }
      })

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const handler = vi.fn().mockRejectedValue(new Error('Processing failed'))
      await broker.consume('test.queue', handler)

      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, true)
    })
  })

  describe('Error Handling', () => {
    it('应该在未连接时抛出错误', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })

      expect(() => broker.publish('test', 'key', {})).toThrow()
    })

    it('应该正确处理无效的JSON消息', async () => {
      const { connect } = await import('amqplib')
      vi.mocked(connect).mockResolvedValue(mockConnection as Connection)

      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from('invalid json'),
        fields: { deliveryTag: 1 } as any,
        properties: {} as any,
      }

      vi.mocked(mockChannel.consume).mockImplementation(async (queue, onMessage) => {
        if (onMessage) {
          await onMessage(mockMsg as ConsumeMessage)
        }
        return { consumerTag: 'test-consumer' }
      })

      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })
      await broker.connect()

      const handler = vi.fn()
      await broker.consume('test.queue', handler)

      // 应该 nack 无效消息
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, false)
    })
  })

  describe('Configuration', () => {
    it('应该使用默认配置', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({ url: 'amqp://localhost' })

      expect(broker).toBeDefined()
    })

    it('应该接受自定义配置', async () => {
      const { MessageBroker } = await import('../../core/MessageBroker.js')
      const broker = new MessageBroker({
        url: 'amqp://custom',
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        prefetchCount: 5,
      })

      expect(broker).toBeDefined()
    })
  })
})
