import { MessageBroker } from '@sker/broker'
import { AIEngine } from '../core/AIEngine.js'
import { EventEmitter } from 'events'
import type {
  AITaskMessage,
  TaskProcessingResult,
  QueueProcessorConfig,
  TaskQueueStats
} from '../types/messaging.js'
import {
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS,
  getPriorityQueueName
} from '@sker/models'

/**
 * AI 任务队列处理器 - 处理来自消息队列的 AI 任务
 */
export class AITaskQueueProcessor extends EventEmitter {
  private broker: MessageBroker
  private aiEngine: AIEngine
  private config: QueueProcessorConfig
  private isProcessing: boolean = false
  private processingTasks: Map<string, AITaskMessage> = new Map()
  private taskStats: TaskQueueStats
  private processingWorkers: number = 0

  constructor(
    broker: MessageBroker,
    aiEngine: AIEngine,
    config: QueueProcessorConfig
  ) {
    super()
    this.broker = broker
    this.aiEngine = aiEngine
    this.config = config
    this.taskStats = this.initializeStats()
    this.setupBrokerEventHandlers()
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): TaskQueueStats {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageProcessingTime: 0,
      tasksPerMinute: 0,
      activeWorkers: 0,
      queuedTasks: 0,
      lastProcessedAt: new Date(),
      errorRate: 0
    }
  }

  /**
   * 设置消息代理事件处理器
   */
  private setupBrokerEventHandlers(): void {
    this.broker.on('connected', () => {
      console.log('AI任务处理器: 消息代理已连接')
      this.emit('brokerConnected')
    })

    this.broker.on('disconnected', () => {
      console.log('AI任务处理器: 消息代理已断开')
      this.emit('brokerDisconnected')
    })

    this.broker.on('error', (error) => {
      console.error('AI任务处理器: 消息代理错误:', error)
      this.emit('brokerError', error)
    })
  }

  /**
   * 启动任务处理器
   */
  async start(): Promise<void> {
    try {
      if (this.isProcessing) {
        console.log('AI任务处理器已经在运行')
        return
      }

      // 确保消息代理已连接
      if (!this.broker.isConnected()) {
        await this.broker.start()
      }

      // 确保 AI 引擎已初始化
      await this.aiEngine.initialize()

      // 启动任务消费者
      await this.startTaskConsumers()

      this.isProcessing = true
      console.log('AI任务队列处理器启动成功')

      this.emit('started')
    } catch (error) {
      console.error('启动AI任务处理器失败:', error)
      throw error
    }
  }

  /**
   * 停止任务处理器
   */
  async stop(): Promise<void> {
    try {
      if (!this.isProcessing) {
        console.log('AI任务处理器未运行')
        return
      }

      this.isProcessing = false

      // 等待当前任务完成
      await this.waitForTasksToComplete()

      console.log('AI任务队列处理器已停止')
      this.emit('stopped')
    } catch (error) {
      console.error('停止AI任务处理器失败:', error)
      throw error
    }
  }

  /**
   * 启动任务消费者
   */
  private async startTaskConsumers(): Promise<void> {
    // 启动基础队列消费者（兼容旧版路由）
    await this.startBaseQueueConsumer()

    // 为不同优先级的任务启动不同的消费者

    // 高优先级任务消费者
    await this.startPriorityConsumer('high', this.config.highPriorityWorkers)

    // 普通优先级任务消费者
    await this.startPriorityConsumer('normal', this.config.normalPriorityWorkers)

    // 低优先级任务消费者
    await this.startPriorityConsumer('low', this.config.lowPriorityWorkers)

    // 批处理任务消费者
    await this.startBatchConsumer()
  }

  /**
   * 启动基础队列消费者
   */
  private async startBaseQueueConsumer(): Promise<void> {
    const queueName = QUEUE_NAMES.AI_TASKS
    const workerCount = this.config.normalPriorityWorkers

    for (let i = 0; i < workerCount; i++) {
      await this.broker.consume(
        queueName,
        async (message) => {
          if (!message) return

          const workerId = `base-worker-${i}`
          await this.processTaskMessage(message, workerId)
        },
        {
          noAck: false // 手动确认
        }
      )
    }

    console.log(`开始监听AI任务队列: ${queueName}`)
  }

  /**
   * 启动优先级消费者
   */
  private async startPriorityConsumer(priority: string, workerCount: number): Promise<void> {
    // 使用正确的优先级队列名
    const queueName = getPriorityQueueName(priority as 'low' | 'normal' | 'high')

    for (let i = 0; i < workerCount; i++) {
      await this.broker.consume(
        queueName,
        async (message) => {
          if (!message) return

          const workerId = `${priority}-worker-${i}`
          await this.processTaskMessage(message, workerId)
        },
        {
          noAck: false // 手动确认
        }
      )
    }

    console.log(`启动 ${workerCount} 个 ${priority} 优先级工作者，监听队列: ${queueName}`)
  }

  /**
   * 启动批处理消费者
   */
  private async startBatchConsumer(): Promise<void> {
    await this.broker.consume(
      this.config.batchQueue,
      async (message) => {
        if (!message) return

        await this.processBatchMessage(message)
      },
      {
        noAck: false
      }
    )

    console.log('启动批处理任务消费者')
  }

  /**
   * 处理任务消息
   */
  private async processTaskMessage(message: any, workerId: string): Promise<void> {
    const startTime = Date.now()
    let taskData: AITaskMessage | null = null

    try {
      // 解析任务数据
      taskData = JSON.parse(message.content.toString())

      if (!taskData) {
        throw new Error('Invalid task message format')
      }

      console.log(`[${workerId}] 开始处理任务: ${taskData.taskId}, 类型: ${taskData.type}`)

      // 记录正在处理的任务
      this.processingTasks.set(taskData.taskId, taskData)
      this.processingWorkers++
      this.taskStats.activeWorkers = this.processingWorkers

      // 发送任务开始通知
      await this.publishTaskUpdate(taskData, 'processing', {
        workerId,
        startedAt: new Date()
      })

      // 处理任务
      const result = await this.processAITask(taskData)

      // 发送任务完成通知
      await this.publishTaskUpdate(taskData, 'completed', {
        result,
        completedAt: new Date(),
        processingTime: Date.now() - startTime
      })

      // 确认消息
      this.broker.ack(message)

      // 更新统计
      this.updateStats(true, Date.now() - startTime)

      console.log(`[${workerId}] 任务完成: ${taskData.taskId}`)

    } catch (error) {
      console.error(`[${workerId}] 任务处理失败:`, error)

      // 发送任务失败通知
      if (taskData) {
        await this.publishTaskUpdate(taskData, 'failed', {
          error: {
            code: error instanceof Error ? error.constructor.name : 'UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : String(error),
            details: error instanceof Error ? error.stack : undefined,
            severity: 'high',
            retryable: this.isRetryableError(error)
          },
          failedAt: new Date(),
          processingTime: Date.now() - startTime
        })
      }

      // 更新统计
      this.updateStats(false, Date.now() - startTime)

      // 根据错误类型决定是否重新入队
      if (this.shouldRetry(error, taskData)) {
        console.log(`重新入队任务: ${taskData?.taskId}`)
        this.broker.nack(message, true) // 重新入队
      } else {
        console.log(`拒绝任务: ${taskData?.taskId}`)
        this.broker.nack(message, false) // 不重新入队
      }

    } finally {
      // 清理处理记录
      if (taskData) {
        this.processingTasks.delete(taskData.taskId)
      }
      this.processingWorkers = Math.max(0, this.processingWorkers - 1)
      this.taskStats.activeWorkers = this.processingWorkers
    }
  }

  /**
   * 处理批处理消息
   */
  private async processBatchMessage(message: any): Promise<void> {
    try {
      const batchData = JSON.parse(message.content.toString())

      console.log(`开始处理批处理任务，包含 ${batchData.tasks.length} 个子任务`)

      // 使用 AI 引擎的批处理功能
      const batchResult = await this.aiEngine.batchProcess({
        tasks: batchData.tasks,
        concurrency: this.config.batchConcurrency,
        failFast: batchData.options?.failFast || false
      })

      // 发送批处理结果
      await this.publishBatchResult(batchData.batchId, batchResult)

      this.broker.ack(message)
      console.log(`批处理任务完成: ${batchData.batchId}`)

    } catch (error) {
      console.error('批处理任务失败:', error)
      this.broker.nack(message, false)
    }
  }

  /**
   * 处理 AI 任务 - 使用统一的任务类型
   */
  private async processAITask(taskData: AITaskMessage): Promise<any> {
    // 使用统一的任务类型处理
    switch (taskData.type) {
      case 'generate':
        return await this.aiEngine.generateContent({
          inputs: taskData.inputs,
          context: taskData.context,
          instruction: taskData.instruction,
          model: taskData.metadata?.model
        })

      case 'optimize':
        return await this.aiEngine.optimizeContent({
          content: taskData.inputs[0],
          instruction: taskData.instruction || '',
          context: taskData.context,
          model: taskData.metadata?.model
        })

      case 'analyze':
        return await this.aiEngine.analyzeSemantics(
          taskData.inputs[0],
          {
            extractTags: true,
            assessImportance: true,
            calculateConfidence: true
          }
        )

      case 'fusion':
        return await this.aiEngine.fuseContent({
          inputs: taskData.inputs,
          instruction: taskData.instruction || '',
          context: taskData.context,
          fusionType: 'synthesis',
          model: taskData.metadata?.model
        })

      case 'expand':
        return await this.aiEngine.enhanceNode({
          baseContent: taskData.inputs[0],
          instruction: taskData.instruction || '',
          context: taskData.context,
          expansionType: 'detail',
          model: taskData.metadata?.model
        })

      default:
        throw new Error(`Unsupported task type: ${taskData.type}`)
    }
  }

  /**
   * 发布任务更新
   */
  private async publishTaskUpdate(
    taskData: AITaskMessage,
    status: string,
    additionalData: any = {}
  ): Promise<void> {
    try {
      const updateMessage: AITaskMessage = {
        ...taskData,
        status: status as any,
        ...additionalData,
        timestamp: new Date()
      }

      const routingKey = `task.result.${taskData.userId}.${taskData.projectId}`

      await this.broker.publishWithConfirm(
        this.config.resultExchange,
        routingKey,
        updateMessage,
        {
          persistent: true,
          correlationId: taskData.taskId,
          headers: {
            taskType: taskData.type,
            taskStatus: status,
            userId: taskData.userId,
            projectId: taskData.projectId
          }
        }
      )

    } catch (error) {
      console.error('发布任务更新失败:', error)
      // 不抛出错误，避免影响主任务处理流程
    }
  }

  /**
   * 发布批处理结果
   */
  private async publishBatchResult(batchId: string, result: any): Promise<void> {
    try {
      await this.broker.publishWithConfirm(
        this.config.resultExchange,
        'batch.result',
        {
          batchId,
          result,
          timestamp: new Date()
        },
        {
          persistent: true,
          correlationId: batchId
        }
      )
    } catch (error) {
      console.error('发布批处理结果失败:', error)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(success: boolean, processingTime: number): void {
    this.taskStats.totalTasks++

    if (success) {
      this.taskStats.completedTasks++
    } else {
      this.taskStats.failedTasks++
    }

    // 更新平均处理时间
    const totalProcessingTime = this.taskStats.averageProcessingTime * (this.taskStats.totalTasks - 1) + processingTime
    this.taskStats.averageProcessingTime = totalProcessingTime / this.taskStats.totalTasks

    // 更新错误率
    this.taskStats.errorRate = this.taskStats.failedTasks / this.taskStats.totalTasks

    this.taskStats.lastProcessedAt = new Date()

    // 计算每分钟任务数（简化计算）
    const minutesRunning = (Date.now() - this.taskStats.lastProcessedAt.getTime()) / 60000 || 1
    this.taskStats.tasksPerMinute = this.taskStats.totalTasks / minutesRunning
  }

  /**
   * 判断是否为可重试错误
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const retryableErrors = [
        'ECONNRESET',
        'ENOTFOUND',
        'TIMEOUT',
        'RATE_LIMITED',
        'SERVICE_UNAVAILABLE'
      ]

      return retryableErrors.some(errorType =>
        error.message.includes(errorType) ||
        error.constructor.name.includes(errorType)
      )
    }

    return false
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any, taskData: AITaskMessage | null): boolean {
    if (!taskData) return false

    const maxRetries = this.config.maxRetries
    const currentRetries = taskData.metadata?.retryCount || 0

    return this.isRetryableError(error) && currentRetries < maxRetries
  }

  /**
   * 等待当前任务完成
   */
  private async waitForTasksToComplete(timeout: number = 30000): Promise<void> {
    const startTime = Date.now()

    while (this.processingTasks.size > 0 && (Date.now() - startTime) < timeout) {
      console.log(`等待 ${this.processingTasks.size} 个任务完成...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (this.processingTasks.size > 0) {
      console.warn(`超时，仍有 ${this.processingTasks.size} 个任务未完成`)
    }
  }

  /**
   * 获取处理器状态
   */
  getStatus(): {
    isProcessing: boolean
    processingTasks: number
    taskStats: TaskQueueStats
    brokerConnected: boolean
  } {
    return {
      isProcessing: this.isProcessing,
      processingTasks: this.processingTasks.size,
      taskStats: { ...this.taskStats },
      brokerConnected: this.broker.isConnected()
    }
  }

  /**
   * 获取正在处理的任务列表
   */
  getProcessingTasks(): AITaskMessage[] {
    return Array.from(this.processingTasks.values())
  }

  /**
   * 手动处理任务（用于测试）
   */
  async processTaskManually(taskData: AITaskMessage): Promise<TaskProcessingResult> {
    const startTime = Date.now()

    try {
      const result = await this.processAITask(taskData)

      return {
        success: true,
        result,
        processingTime: Date.now() - startTime,
        taskId: taskData.taskId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processingTime: Date.now() - startTime,
        taskId: taskData.taskId
      }
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.taskStats = this.initializeStats()
    console.log('任务统计信息已重置')
  }
}

/**
 * 创建 AI 任务队列处理器的工厂函数
 */
export function createAITaskQueueProcessor(
  broker: MessageBroker,
  aiEngine: AIEngine,
  config?: Partial<QueueProcessorConfig>
): AITaskQueueProcessor {
  const defaultConfig: QueueProcessorConfig = {
    taskQueue: QUEUE_NAMES.AI_TASKS,
    batchQueue: QUEUE_NAMES.AI_BATCH,
    resultExchange: EXCHANGE_NAMES.AI_RESULTS,
    highPriorityWorkers: 2,
    normalPriorityWorkers: 3,
    lowPriorityWorkers: 1,
    batchConcurrency: 5,
    maxRetries: 3,
    retryDelay: 5000,
    taskTimeout: 300000 // 5分钟
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new AITaskQueueProcessor(broker, aiEngine, finalConfig)
}