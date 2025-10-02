import { EventEmitter } from 'events'
import { MessageBroker } from '@sker/broker'
import { StoreClient } from '@sker/store-client'
import {
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS,
  MESSAGE_PROPERTIES
} from '@sker/models'
import type { UnifiedAITaskMessage, UnifiedAIResultMessage } from '@sker/models'
import { AIEngine } from '../core/AIEngine.js'

export interface AITaskQueueConsumerConfig {
  batchSize?: number
  concurrency?: number
  retryAttempts?: number
  retryDelay?: number
  prefetchCount?: number
}

/**
 * AI任务队列消费者 - 从消息队列接收AI任务并处理
 */
export class AITaskQueueConsumer extends EventEmitter {
  private broker: MessageBroker
  private aiEngine: AIEngine
  private storeClient: StoreClient
  private config: Required<AITaskQueueConsumerConfig>
  private isRunning: boolean = false
  private processingTasks: Set<string> = new Set()

  constructor(
    broker: MessageBroker,
    aiEngine: AIEngine,
    storeClient: StoreClient,
    config: AITaskQueueConsumerConfig = {}
  ) {
    super()
    this.broker = broker
    this.aiEngine = aiEngine
    this.storeClient = storeClient
    this.config = {
      batchSize: 10,
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 1000,
      prefetchCount: 10,
      ...config
    }

    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.broker.on('connected', () => {
      console.log('AI任务消费者: 消息代理已连接')
      this.emit('brokerConnected')
    })

    this.broker.on('disconnected', () => {
      console.log('AI任务消费者: 消息代理已断开')
      this.emit('brokerDisconnected')
    })

    this.broker.on('error', (error) => {
      console.error('AI任务消费者: 消息代理错误:', error)
      this.emit('brokerError', error)
    })
  }

  /**
   * 启动AI任务消费者
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('AI任务消费者已在运行')
      return
    }

    try {
      // 确保消息代理已连接
      if (!this.broker.isConnected()) {
        await this.broker.start()
      }

      // 设置队列消费者
      await this.setupTaskConsumer()

      this.isRunning = true
      console.log('✅ AI任务队列消费者启动成功')
      this.emit('started')

    } catch (error) {
      console.error('❌ AI任务消费者启动失败:', error)
      throw error
    }
  }

  /**
   * 停止AI任务消费者
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    try {
      // 等待所有正在处理的任务完成
      await this.waitForTasksToComplete()

      // 停止消息代理
      await this.broker.stop()

      this.isRunning = false
      console.log('✅ AI任务队列消费者已停止')
      this.emit('stopped')

    } catch (error) {
      console.error('❌ 停止AI任务消费者失败:', error)
      throw error
    }
  }

  /**
   * 设置任务消费者
   */
  private async setupTaskConsumer(): Promise<void> {
    console.log(`开始监听AI任务队列: ${QUEUE_NAMES.AI_TASKS}`)

    await this.broker.consume(
      QUEUE_NAMES.AI_TASKS,
      async (message) => {
        if (!message) return

        try {
          const taskMessage: UnifiedAITaskMessage = JSON.parse(message.content.toString())
          console.log(`收到AI任务: ${taskMessage.taskId}, 类型: ${taskMessage.type}`)

          // 处理AI任务
          await this.processAITask(taskMessage, message)

          // 确认消息
          this.broker.ack(message)

        } catch (error) {
          console.error('处理AI任务消息失败:', error)
          
          // 获取重试次数
          const retryCount = this.getRetryCount(message)
          
          if (retryCount < this.config.retryAttempts) {
            // 重试
            console.log(`重试AI任务处理, 尝试 ${retryCount + 1}/${this.config.retryAttempts}`)
            await this.retryTask(message, retryCount + 1)
            this.broker.ack(message)
          } else {
            // 达到最大重试次数，拒绝消息
            console.error('AI任务处理失败，已达到最大重试次数')
            this.broker.nack(message, false) // 不重新入队
          }
        }
      },
      {
        noAck: false // 手动确认
      }
    )
  }

  /**
   * 处理AI任务
   */
  private async processAITask(taskMessage: UnifiedAITaskMessage, originalMessage: any): Promise<void> {
    const { taskId } = taskMessage

    // 防止重复处理
    if (this.processingTasks.has(taskId)) {
      console.warn(`任务 ${taskId} 正在处理中，跳过`)
      return
    }

    this.processingTasks.add(taskId)

    try {
      // 发布任务开始事件
      await this.publishTaskResult({
        taskId,
        type: taskMessage.type,
        status: 'processing',
        userId: taskMessage.userId,
        projectId: taskMessage.projectId,
        progress: 0,
        message: '开始处理AI任务'
      })

      // 执行AI处理
      const aiResult = await this.executeAITask(taskMessage)

      // 保存结果到Store
      const savedResult = await this.saveTaskResult(taskMessage, aiResult)

      // 发布任务完成事件
      await this.publishTaskResult({
        taskId,
        type: taskMessage.type,
        status: 'completed',
        userId: taskMessage.userId,
        projectId: taskMessage.projectId,
        result: aiResult,
        savedData: savedResult,
        progress: 100,
        message: 'AI任务处理完成'
      })

      console.log(`✅ AI任务处理完成: ${taskId}`)

    } catch (error) {
      console.error(`❌ AI任务处理失败: ${taskId}`, error)

      // 发布任务失败事件
      await this.publishTaskResult({
        taskId,
        type: taskMessage.type,
        status: 'failed',
        userId: taskMessage.userId,
        projectId: taskMessage.projectId,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : '未知错误',
          retryable: true,
          severity: 'medium' as const,
          timestamp: new Date()
        },
        message: 'AI任务处理失败'
      })

      throw error
    } finally {
      this.processingTasks.delete(taskId)
    }
  }

  /**
   * 执行AI任务
   */
  private async executeAITask(taskMessage: UnifiedAITaskMessage): Promise<any> {
    const { type, inputs, context, instruction, parameters } = taskMessage

    // 根据任务类型调用不同的AI处理方法
    switch (type) {
      case 'generate':
        return await this.aiEngine.generateContent({
          inputs,
          context,
          instruction,
          ...parameters
        })

      case 'optimize':
        return await this.aiEngine.optimizeContent({
          content: inputs[0],
          instruction: instruction || '',
          context,
          targetStyle: parameters?.targetStyle,
          ...parameters
        })

      case 'fusion':
        return await this.aiEngine.fusionGenerate({
          inputs,
          instruction: instruction || '',
          fusionType: parameters?.fusionType || 'synthesis',
          context,
          ...parameters
        })

      case 'analyze':
        return await this.aiEngine.analyzeContent(inputs[0], {
          ...parameters
        })

      case 'expand':
        return await this.aiEngine.expandContent({
          baseContent: inputs[0],
          instruction: instruction || '',
          expansionType: parameters?.expansionType || 'detail',
          context,
          ...parameters
        })

      default:
        throw new Error(`不支持的AI任务类型: ${type}`)
    }
  }

  /**
   * 保存任务结果到Store
   */
  private async saveTaskResult(taskMessage: UnifiedAITaskMessage, aiResult: any): Promise<any> {
    try {
      // 构造Store API调用数据 - 使用下划线命名以匹配数据库schema
      const storeData = {
        task_id: taskMessage.taskId,
        project_id: taskMessage.projectId,
        user_id: taskMessage.userId,
        type: taskMessage.type,
        status: 'completed',
        input_data: {
          inputs: taskMessage.inputs,
          context: taskMessage.context,
          instruction: taskMessage.instruction,
          parameters: taskMessage.parameters
        },
        output_data: aiResult,
        estimated_cost: this.calculateCost(taskMessage, aiResult),
        processing_time: Date.now() - new Date(taskMessage.timestamp).getTime(),
        completed_at: new Date()
      }

      // 调用Store服务保存结果
      const savedResult = await this.storeClient.aiTasks.create(storeData)
      
      console.log(`AI任务结果已保存到Store: ${taskMessage.taskId}`)
      return savedResult

    } catch (error) {
      console.error('保存AI任务结果失败:', error)
      throw error
    }
  }

  /**
   * 发布任务结果事件
   */
  private async publishTaskResult(resultData: Partial<UnifiedAIResultMessage>): Promise<void> {
    try {
      const routingKey = `${ROUTING_KEYS.AI_RESULT}.${resultData.userId}.${resultData.projectId}`
      
      await this.broker.publish(
        EXCHANGE_NAMES.AI_RESULTS,
        routingKey,
        resultData,
        {
          persistent: true,
          priority: MESSAGE_PROPERTIES.PRIORITY.NORMAL,
          correlationId: resultData.taskId,
          messageId: `result-${resultData.taskId}`,
          timestamp: new Date(),
          headers: {
            taskType: resultData.type,
            taskStatus: resultData.status,
            userId: resultData.userId,
            projectId: resultData.projectId
          }
        }
      )

      console.log(`AI任务结果事件已发布: ${resultData.taskId}, 状态: ${resultData.status}`)

    } catch (error) {
      console.error('发布AI任务结果事件失败:', error)
      throw error
    }
  }

  /**
   * 重试任务
   */
  private async retryTask(originalMessage: any, retryCount: number): Promise<void> {
    const delay = this.config.retryDelay * Math.pow(2, retryCount - 1) // 指数退避

    setTimeout(async () => {
      try {
        const taskMessage = JSON.parse(originalMessage.content.toString())
        
        await this.broker.publish(
          EXCHANGE_NAMES.LLM_DIRECT,
          originalMessage.fields.routingKey,
          taskMessage,
          {
            ...originalMessage.properties,
            headers: {
              ...originalMessage.properties.headers,
              retryCount
            }
          }
        )

        console.log(`AI任务重试已发布: ${taskMessage.taskId}, 重试次数: ${retryCount}`)

      } catch (error) {
        console.error('重试AI任务失败:', error)
      }
    }, delay)
  }

  /**
   * 获取重试次数
   */
  private getRetryCount(message: any): number {
    return (message.properties.headers?.retryCount as number) || 0
  }

  /**
   * 计算处理成本
   */
  private calculateCost(taskMessage: UnifiedAITaskMessage, aiResult: any): number {
    // 简单的成本计算逻辑，实际应该根据模型和token数量计算
    const baseCost = 0.01 // 基础成本
    const inputTokens = taskMessage.inputs.join('').length / 4 // 估算token数
    const outputTokens = (aiResult.content || '').length / 4 // 估算token数
    
    return baseCost * (inputTokens + outputTokens) / 1000
  }

  /**
   * 等待所有任务完成
   */
  private async waitForTasksToComplete(timeout: number = 30000): Promise<void> {
    const startTime = Date.now()
    
    while (this.processingTasks.size > 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (this.processingTasks.size > 0) {
      console.warn(`仍有 ${this.processingTasks.size} 个任务未完成，强制停止`)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processingTasksCount: this.processingTasks.size,
      brokerConnected: this.broker.isConnected(),
      config: this.config
    }
  }
}