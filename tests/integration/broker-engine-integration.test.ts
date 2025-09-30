/**
 * Broker-Engine 集成测试
 * 测试消息队列在broker和engine之间的完整流转
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MessageBroker, createDevelopmentBroker } from '@sker/broker'
import { AIEngine, createAITaskQueueProcessor } from '@sker/engine'
import {
  UnifiedAITaskMessage,
  UnifiedAIResultMessage,
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS,
  UNIFIED_TASK_TYPE,
  TASK_PRIORITY,
  UNIFIED_TASK_STATUS
} from '@sker/models'
import { v4 as uuidv4 } from 'uuid'

describe('Broker-Engine 集成测试', () => {
  let broker: MessageBroker
  let aiEngine: AIEngine
  let queueProcessor: any
  let testResults: Map<string, any> = new Map()

  beforeAll(async () => {
    // 创建开发环境broker
    broker = createDevelopmentBroker({
      connectionUrl: process.env.RABBITMQ_TEST_URL || 'amqp://guest:guest@localhost:5672',
      prefetch: 1
    })

    // 创建AI引擎（测试模式）
    aiEngine = new AIEngine({
      provider: 'openai',
      apiKey: 'test-key', // 测试环境使用mock
      defaultModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    })

    // 创建队列处理器
    queueProcessor = createAITaskQueueProcessor(broker, aiEngine, {
      taskQueue: QUEUE_NAMES.AI_TASKS,
      batchQueue: QUEUE_NAMES.AI_BATCH,
      resultExchange: EXCHANGE_NAMES.AI_RESULTS,
      highPriorityWorkers: 1,
      normalPriorityWorkers: 1,
      lowPriorityWorkers: 1,
      maxRetries: 1,
      taskTimeout: 10000 // 10秒超时
    })

    // 启动服务
    await broker.start()
    await aiEngine.initialize()
    await queueProcessor.start()

    // 设置结果监听器
    await broker.consume(QUEUE_NAMES.AI_RESULTS, async (message) => {
      if (!message) return

      try {
        const result: UnifiedAIResultMessage = JSON.parse(message.content.toString())
        testResults.set(result.taskId, result)
        broker.ack(message)
      } catch (error) {
        console.error('Error processing result:', error)
        broker.nack(message, false, false)
      }
    })
  })

  afterAll(async () => {
    // 清理资源
    if (queueProcessor) {
      await queueProcessor.stop()
    }
    if (aiEngine) {
      await aiEngine.cleanup()
    }
    if (broker) {
      await broker.stop()
    }
  })

  beforeEach(() => {
    // 清理测试结果
    testResults.clear()
  })

  describe('基础任务处理流程', () => {
    it('应该成功处理生成任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.GENERATE,
        inputs: ['创建一个简单的待办事项应用'],
        context: '这是一个测试项目',
        instruction: '请生成详细的技术方案',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date(),
        metadata: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          timeout: 10000
        }
      }

      // 发布任务到队列
      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      // 等待结果
      await waitForResult(taskId, 15000) // 15秒超时

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.taskId).toBe(taskId)
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
      expect(result.result.content).toBeDefined()
      expect(typeof result.result.content).toBe('string')
      expect(result.result.confidence).toBeGreaterThan(0)
      expect(Array.isArray(result.result.tags)).toBe(true)
    }, 30000) // 30秒测试超时

    it('应该成功处理优化任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.OPTIMIZE,
        inputs: ['这个应用需要用户登录功能，但是代码写得不够好'],
        context: '代码优化',
        instruction: '请优化这段描述，使其更清晰专业',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.HIGH,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 8,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 15000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.result.content).toBeDefined()
      expect(result.result.content.length).toBeGreaterThan(0)
    }, 30000)

    it('应该成功处理融合任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.FUSION,
        inputs: [
          '用户需要能够创建账户',
          '用户需要能够登录系统',
          '用户需要能够管理个人信息'
        ],
        context: '用户管理系统',
        instruction: '将这些需求融合成一个完整的用户管理方案',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 15000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.result.content).toBeDefined()
    }, 30000)

    it('应该成功处理分析任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.ANALYZE,
        inputs: ['我们需要开发一个电商平台，包括商品管理、订单处理、支付集成等功能'],
        context: '项目需求分析',
        instruction: '请分析这个项目的技术复杂度和实现难点',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 15000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    }, 30000)

    it('应该成功处理扩展任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.EXPAND,
        inputs: ['实现用户认证'],
        context: '系统安全设计',
        instruction: '请详细扩展这个功能的实现方案',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 15000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    }, 30000)
  })

  describe('错误处理和重试机制', () => {
    it('应该正确处理无效任务类型', async () => {
      const taskId = uuidv4()
      const taskMessage = {
        taskId,
        type: 'invalid_type' as any,
        inputs: ['test'],
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 10000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Unsupported task type')
    }, 20000)

    it('应该处理空输入任务', async () => {
      const taskId = uuidv4()
      const taskMessage: UnifiedAITaskMessage = {
        taskId,
        type: UNIFIED_TASK_TYPE.OPTIMIZE,
        inputs: [], // 空输入
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.NORMAL,
        timestamp: new Date()
      }

      await broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: 5,
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      await waitForResult(taskId, 10000)

      const result = testResults.get(taskId)
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    }, 20000)
  })

  describe('性能和并发测试', () => {
    it('应该能够并发处理多个任务', async () => {
      const taskCount = 5
      const taskIds: string[] = []

      // 创建多个并发任务
      const tasks = Array.from({ length: taskCount }, (_, index) => {
        const taskId = uuidv4()
        taskIds.push(taskId)

        return {
          taskId,
          type: UNIFIED_TASK_TYPE.GENERATE,
          inputs: [`生成测试内容 ${index + 1}`],
          context: `测试场景 ${index + 1}`,
          instruction: '生成简短的测试响应',
          nodeId: uuidv4(),
          projectId: uuidv4(),
          userId: uuidv4(),
          priority: TASK_PRIORITY.NORMAL,
          timestamp: new Date()
        }
      })

      // 并发发布所有任务
      await Promise.all(
        tasks.map(task =>
          broker.publishWithConfirm(
            EXCHANGE_NAMES.LLM_DIRECT,
            ROUTING_KEYS.AI_PROCESS,
            task,
            {
              priority: 5,
              persistent: true,
              correlationId: task.taskId,
              type: 'ai_task'
            }
          )
        )
      )

      // 等待所有结果
      await waitForAllResults(taskIds, 30000)

      // 验证所有任务都有结果
      taskIds.forEach(taskId => {
        const result = testResults.get(taskId)
        expect(result).toBeDefined()
        expect(result.taskId).toBe(taskId)
      })

      // 检查成功率
      const successCount = taskIds.filter(taskId =>
        testResults.get(taskId)?.success === true
      ).length

      expect(successCount).toBeGreaterThan(0)
      console.log(`并发测试结果: ${successCount}/${taskCount} 任务成功完成`)
    }, 60000)
  })

  describe('消息格式兼容性测试', () => {
    it('应该正确序列化和反序列化消息', async () => {
      const originalTask: UnifiedAITaskMessage = {
        taskId: uuidv4(),
        type: UNIFIED_TASK_TYPE.GENERATE,
        inputs: ['测试输入'],
        context: '测试上下文',
        instruction: '测试指令',
        nodeId: uuidv4(),
        projectId: uuidv4(),
        userId: uuidv4(),
        priority: TASK_PRIORITY.HIGH,
        timestamp: new Date(),
        metadata: {
          model: 'gpt-3.5-turbo',
          temperature: 0.8,
          maxTokens: 1000,
          tags: ['test', 'integration']
        }
      }

      // 序列化
      const serialized = JSON.stringify(originalTask)

      // 反序列化
      const deserialized: UnifiedAITaskMessage = JSON.parse(serialized)

      // 验证数据完整性
      expect(deserialized.taskId).toBe(originalTask.taskId)
      expect(deserialized.type).toBe(originalTask.type)
      expect(deserialized.inputs).toEqual(originalTask.inputs)
      expect(deserialized.context).toBe(originalTask.context)
      expect(deserialized.instruction).toBe(originalTask.instruction)
      expect(deserialized.nodeId).toBe(originalTask.nodeId)
      expect(deserialized.projectId).toBe(originalTask.projectId)
      expect(deserialized.userId).toBe(originalTask.userId)
      expect(deserialized.priority).toBe(originalTask.priority)
      expect(deserialized.metadata).toEqual(originalTask.metadata)
    })
  })

  // 工具函数：等待特定任务结果
  async function waitForResult(taskId: string, timeout: number): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (testResults.has(taskId)) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`Timeout waiting for result of task ${taskId}`)
  }

  // 工具函数：等待所有任务结果
  async function waitForAllResults(taskIds: string[], timeout: number): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const allCompleted = taskIds.every(taskId => testResults.has(taskId))
      if (allCompleted) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.warn(`Timeout: Only ${testResults.size}/${taskIds.length} tasks completed`)
  }
})

// Mock AI Engine 用于测试
class MockAIEngine {
  async generateContent(request: any): Promise<any> {
    // 模拟AI生成内容
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    return {
      content: `Generated content for: ${request.inputs?.join(', ') || 'no input'}`,
      title: 'Test Generated Content',
      confidence: 0.85,
      tags: ['test', 'generated'],
      metadata: {
        model: 'test-model',
        tokenCount: 150,
        processingTime: 800,
        temperature: 0.7
      }
    }
  }

  async optimizeContent(request: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300))

    return {
      optimizedContent: `Optimized: ${request.content || 'no content'}`,
      improvementSummary: 'Content has been optimized for clarity',
      confidence: 0.9,
      changes: ['clarity', 'structure', 'grammar'],
      metadata: {
        model: 'test-model',
        tokenCount: 120,
        processingTime: 600,
        temperature: 0.7
      }
    }
  }

  async analyzeSemantics(content: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 200))

    return {
      confidence: 0.88,
      tags: ['analysis', 'semantic'],
      semanticType: 'requirement',
      importanceLevel: 3,
      metadata: {
        model: 'test-model',
        tokenCount: 80,
        processingTime: 400,
        temperature: 0.7
      }
    }
  }

  async fuseContent(request: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 800))

    return {
      fusedContent: `Fused content from ${request.inputs?.length || 0} sources`,
      confidence: 0.82,
      keyInsights: ['fusion', 'synthesis', 'integration'],
      metadata: {
        model: 'test-model',
        tokenCount: 200,
        processingTime: 1000,
        temperature: 0.7
      }
    }
  }

  async enhanceNode(request: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 900 + 400))

    return {
      expandedContent: `Enhanced content based on: ${request.baseContent || 'no base content'}`,
      confidence: 0.87,
      addedSections: ['details', 'examples', 'implementation'],
      metadata: {
        model: 'test-model',
        tokenCount: 180,
        processingTime: 700,
        temperature: 0.7
      }
    }
  }

  async batchProcess(request: any): Promise<any> {
    const results = await Promise.all(
      request.tasks.map(async (task: any) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
        return {
          taskId: task.taskId,
          success: Math.random() > 0.1, // 90% success rate
          result: `Batch result for ${task.taskId}`
        }
      })
    )

    return {
      results,
      summary: {
        total: request.tasks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        processingTime: 1500
      }
    }
  }

  async initialize(): Promise<void> {
    // Mock initialization
    console.log('Mock AI Engine initialized')
  }

  async cleanup(): Promise<void> {
    // Mock cleanup
    console.log('Mock AI Engine cleaned up')
  }
}