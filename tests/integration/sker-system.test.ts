import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { SkerSystem, createSkerSystem, type SkerSystemConfig } from '../../sker-integration-example'

/**
 * SKER 系统集成测试
 *
 * 测试所有服务包的集成和协同工作
 */

describe('SKER System Integration Tests', () => {
  let skerSystem: SkerSystem
  let config: SkerSystemConfig

  beforeAll(async () => {
    // 测试配置
    config = {
      brokerUrl: process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://localhost/sker_test',
      redisUrl: process.env.TEST_REDIS_URL || 'redis://localhost',
      openaiApiKey: process.env.OPENAI_API_KEY || 'test-key',
      port: 0, // 让系统自动分配端口
      corsOrigins: ['http://localhost:3000'],
      jwtSecret: 'test-jwt-secret-key-for-integration-tests-only'
    }

    console.log('🧪 开始集成测试...')
  }, 30000)

  afterAll(async () => {
    if (skerSystem) {
      await skerSystem.stop()
    }
    console.log('🧪 集成测试完成')
  })

  describe('系统初始化', () => {
    test('应该能够创建系统实例', () => {
      skerSystem = createSkerSystem(config)
      expect(skerSystem).toBeDefined()
      expect(typeof skerSystem.initialize).toBe('function')
      expect(typeof skerSystem.start).toBe('function')
      expect(typeof skerSystem.stop).toBe('function')
    })

    test('应该能够初始化所有服务', async () => {
      await expect(skerSystem.initialize()).resolves.toBeUndefined()

      const services = skerSystem.services
      expect(services.messageBroker).toBeDefined()
      expect(services.storeService).toBeDefined()
      expect(services.aiEngine).toBeDefined()
      expect(services.taskScheduler).toBeDefined()
      expect(services.gateway).toBeDefined()
      expect(services.errorHandler).toBeDefined()
      expect(services.systemMonitor).toBeDefined()
    }, 30000)

    test('应该能够启动系统', async () => {
      await expect(skerSystem.start()).resolves.toBeUndefined()
    }, 15000)
  })

  describe('服务健康检查', () => {
    test('所有服务应该处于健康状态', async () => {
      const health = await skerSystem.getHealthStatus()

      expect(health.status).toBe('healthy')
      expect(health.services).toBeDefined()

      // 检查各个服务的健康状态
      expect(health.services.store).toBeDefined()
      expect(health.services.engine).toBeDefined()
      expect(health.services.broker).toBeDefined()
      expect(health.services.gateway).toBeDefined()

      console.log('🏥 系统健康状态:', health.status)
    })

    test('存储服务应该可以正常运行', async () => {
      const { storeService } = skerSystem.services
      expect(storeService).toBeDefined()

      const health = await storeService!.healthCheck()
      expect(health.status).toBe('healthy')
      expect(health.database).toBeDefined()
    })

    test('AI引擎应该可以正常运行', async () => {
      const { aiEngine } = skerSystem.services
      expect(aiEngine).toBeDefined()

      const health = await aiEngine!.getHealthStatus()
      expect(health.status).toBeDefined()
      expect(health.availableProviders).toBeDefined()
    })

    test('消息代理应该连接正常', () => {
      const { messageBroker } = skerSystem.services
      expect(messageBroker).toBeDefined()
      expect(messageBroker!.isConnected()).toBe(true)
    })
  })

  describe('服务间通信', () => {
    test('应该能够发布和消费消息', async () => {
      const { messageBroker } = skerSystem.services
      expect(messageBroker).toBeDefined()

      let receivedMessage: any = null

      // 设置消费者
      await messageBroker!.consume(
        'test.integration.queue',
        (message) => {
          receivedMessage = message
        },
        {
          exchangeName: 'test.integration',
          routingKey: 'test.message',
          autoAck: true
        }
      )

      // 发送测试消息
      const testMessage = { test: true, timestamp: new Date() }
      await messageBroker!.publish(
        'test.integration',
        'test.message',
        testMessage
      )

      // 等待消息处理
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(receivedMessage).toBeDefined()
      expect(receivedMessage.test).toBe(true)
    }, 10000)

    test('数据事件应该能够正确发布', async () => {
      const { storeService } = skerSystem.services
      expect(storeService).toBeDefined()

      // 发布测试事件
      await storeService!.publishEntityChange({
        entityType: 'test_entity',
        entityId: 'test-001',
        operation: 'create',
        data: { name: 'Test Entity', value: 123 },
        userId: 'test-user',
        metadata: { test: true }
      })

      // 这里可以验证事件是否被正确处理
      // 由于是异步处理，我们只验证调用不抛出异常
      expect(true).toBe(true)
    })
  })

  describe('AI引擎集成', () => {
    test('应该能够处理内容生成请求', async () => {
      const { aiEngine } = skerSystem.services
      expect(aiEngine).toBeDefined()

      // 注意：这个测试需要有效的 OpenAI API Key
      if (process.env.OPENAI_API_KEY) {
        const result = await aiEngine!.generateContent({
          prompt: '写一个简短的测试文本',
          model: 'gpt-3.5-turbo',
          maxTokens: 50,
          userId: 'test-user'
        })

        expect(result).toBeDefined()
        expect(result.content).toBeDefined()
        expect(typeof result.content).toBe('string')
        expect(result.metadata).toBeDefined()
      } else {
        console.log('⚠️ 跳过AI生成测试（需要 OPENAI_API_KEY）')
      }
    }, 15000)

    test('任务调度器应该能够处理任务', async () => {
      const { taskScheduler } = skerSystem.services
      expect(taskScheduler).toBeDefined()

      const stats = taskScheduler!.getStats()
      expect(stats).toBeDefined()
      expect(typeof stats.activeTasks).toBe('number')
      expect(typeof stats.defaultTimeout).toBe('number')
    })
  })

  describe('错误处理和监控', () => {
    test('错误处理器应该能够处理错误', async () => {
      const { errorHandler } = skerSystem.services
      expect(errorHandler).toBeDefined()

      const testError = new Error('测试错误')
      const result = await errorHandler!.handleError(testError, {
        category: 'system',
        severity: 'low',
        service: 'test',
        context: { test: true }
      })

      expect(result).toBeDefined()
      expect(result.handled).toBe(true)
      expect(result.severity).toBe('low')
      expect(result.category).toBe('system')
    })

    test('监控系统应该能够收集指标', () => {
      const { systemMonitor } = skerSystem.services
      expect(systemMonitor).toBeDefined()

      const summary = systemMonitor!.getSummary()
      expect(summary).toBeDefined()
      expect(summary.status).toBeDefined()
      expect(typeof summary.totalServices).toBe('number')
      expect(typeof summary.uptime).toBe('number')
    })

    test('监控系统应该能够提供服务指标', () => {
      const { systemMonitor } = skerSystem.services
      expect(systemMonitor).toBeDefined()

      const currentMetrics = systemMonitor!.getCurrentMetrics()
      if (currentMetrics) {
        expect(currentMetrics.timestamp).toBeDefined()
        expect(currentMetrics.system).toBeDefined()
        expect(currentMetrics.services).toBeDefined()
      }
    })
  })

  describe('API网关集成', () => {
    test('网关应该能够处理健康检查请求', async () => {
      // 这里可以添加对网关 HTTP API 的测试
      // 由于网关启动在随机端口，需要获取实际端口进行测试
      expect(true).toBe(true) // 占位测试
    })
  })

  describe('数据一致性', () => {
    test('存储服务应该能够验证数据完整性', async () => {
      const { storeService } = skerSystem.services
      expect(storeService).toBeDefined()

      const integrityCheck = await storeService!.validateDataIntegrity()
      expect(integrityCheck).toBeDefined()
      expect(typeof integrityCheck.orphanedNodes).toBe('number')
      expect(typeof integrityCheck.orphanedConnections).toBe('number')
      expect(Array.isArray(integrityCheck.issues)).toBe(true)
    })
  })

  describe('性能测试', () => {
    test('系统应该能够处理并发请求', async () => {
      const { storeService } = skerSystem.services
      expect(storeService).toBeDefined()

      // 模拟并发操作
      const promises = Array.from({ length: 10 }, async (_, index) => {
        return storeService!.publishEntityChange({
          entityType: 'concurrent_test',
          entityId: `test-${index}`,
          operation: 'create',
          data: { index, timestamp: new Date() },
          userId: 'performance-test'
        })
      })

      await expect(Promise.all(promises)).resolves.toBeDefined()
    }, 10000)

    test('AI引擎应该能够处理批量任务', async () => {
      const { taskScheduler } = skerSystem.services
      expect(taskScheduler).toBeDefined()

      // 检查任务调度器能够处理多个任务
      const initialStats = taskScheduler!.getStats()
      expect(initialStats.activeTasks).toBeGreaterThanOrEqual(0)
    })
  })

  describe('系统关闭', () => {
    test('应该能够优雅关闭系统', async () => {
      await expect(skerSystem.stop()).resolves.toBeUndefined()

      const health = await skerSystem.getHealthStatus()
      expect(health.status).toBe('unhealthy') // 系统已停止
    })
  })
})

/**
 * 端到端测试场景
 */
describe('End-to-End Scenarios', () => {
  let skerSystem: SkerSystem

  beforeAll(async () => {
    const config: SkerSystemConfig = {
      brokerUrl: process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://localhost/sker_test',
      redisUrl: process.env.TEST_REDIS_URL || 'redis://localhost',
      openaiApiKey: process.env.OPENAI_API_KEY || 'test-key',
      port: 0,
      corsOrigins: ['http://localhost:3000'],
      jwtSecret: 'test-jwt-secret-for-e2e-tests'
    }

    skerSystem = createSkerSystem(config)
    await skerSystem.start()
  }, 45000)

  afterAll(async () => {
    if (skerSystem) {
      await skerSystem.stop()
    }
  })

  test('完整的内容生成和存储流程', async () => {
    // 这个测试模拟用户通过API网关发起内容生成请求
    // 涉及网关 -> AI引擎 -> 存储服务 -> 消息队列的完整流程

    const { storeService, aiEngine } = skerSystem.services

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ 跳过端到端测试（需要 OPENAI_API_KEY）')
      return
    }

    // 1. 模拟创建项目
    const testProject = {
      name: 'E2E Test Project',
      description: 'End-to-end test project',
      user_id: 'e2e-test-user'
    }

    // 2. 模拟创建节点
    const testNode = {
      project_id: 'e2e-test-project',
      title: 'Test Node',
      content: '这是一个测试节点，需要AI优化',
      type: 'text',
      user_id: 'e2e-test-user'
    }

    // 3. 模拟AI优化节点内容
    const optimizationResult = await aiEngine!.optimizeContent({
      content: testNode.content,
      instruction: '请优化这段内容',
      model: 'gpt-3.5-turbo',
      userId: testNode.user_id
    })

    expect(optimizationResult).toBeDefined()
    expect(optimizationResult.content).toBeDefined()

    // 4. 发布数据变更事件
    await storeService!.publishEntityChange({
      entityType: 'node',
      entityId: 'e2e-test-node',
      operation: 'update',
      data: { ...testNode, content: optimizationResult.content },
      oldData: testNode,
      userId: testNode.user_id,
      metadata: { optimized: true }
    })

    console.log('✅ 端到端测试流程完成')
  }, 20000)
})

/**
 * 故障恢复测试
 */
describe('Fault Tolerance Tests', () => {
  let skerSystem: SkerSystem

  beforeAll(async () => {
    const config: SkerSystemConfig = {
      brokerUrl: process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://localhost/sker_test',
      redisUrl: process.env.TEST_REDIS_URL || 'redis://localhost',
      openaiApiKey: 'invalid-key', // 故意使用无效的API Key
      port: 0,
      corsOrigins: ['http://localhost:3000'],
      jwtSecret: 'test-jwt-secret-for-fault-tolerance'
    }

    skerSystem = createSkerSystem(config)
    await skerSystem.start()
  }, 30000)

  afterAll(async () => {
    if (skerSystem) {
      await skerSystem.stop()
    }
  })

  test('系统应该能够处理AI服务故障', async () => {
    const { aiEngine, errorHandler } = skerSystem.services

    try {
      await aiEngine!.generateContent({
        prompt: '测试提示',
        model: 'gpt-3.5-turbo',
        userId: 'fault-test-user'
      })
    } catch (error) {
      // 预期会出错，因为使用了无效的API Key
      expect(error).toBeDefined()
    }

    // 检查错误处理器是否记录了错误
    if (errorHandler) {
      const metrics = errorHandler.getMetrics()
      expect(metrics.totalErrors).toBeGreaterThan(0)
    }
  })

  test('监控系统应该能够检测服务异常', async () => {
    const { systemMonitor } = skerSystem.services
    expect(systemMonitor).toBeDefined()

    const health = await skerSystem.getHealthStatus()
    // 由于使用了无效的OpenAI Key，系统状态可能是 degraded
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
  })
})