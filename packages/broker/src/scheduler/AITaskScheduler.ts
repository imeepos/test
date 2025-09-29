import { v4 as uuidv4 } from 'uuid'
import { EventEmitter } from 'events'
import type { MessageBroker } from '../core/MessageBroker'
import type {
  AITaskMessage,
  AIResultMessage,
  AITaskRequest,
  AITaskStatus,
  AITaskType,
  TaskPriority,
  AIBatchTaskMessage,
  AIBatchResultMessage
} from '../types/AITypes'
import {
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS
} from '@sker/models'

// 外部依赖接口
interface AIEngine {
  processTask(request: any): Promise<any>
  getHealthStatus(): Promise<any>
}

interface StoreService {
  aiTasks: {
    create(task: any): Promise<any>
    update(id: string, updates: any): Promise<any>
    findById(id: string): Promise<any>
  }
}

/**
 * AI任务调度器 - 管理AI处理任务的调度和协调
 */
export class AITaskScheduler extends EventEmitter {
  private broker: MessageBroker
  private aiEngine?: AIEngine
  private storeService?: StoreService
  private activeTasks: Map<string, AITaskStatus> = new Map()
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private defaultTimeout: number = 300000 // 5分钟默认超时
  private isInitialized = false

  constructor(config: {
    messageBroker: MessageBroker
    aiEngine?: AIEngine
    storeService?: StoreService
    defaultTimeout?: number
  }) {
    super()
    this.broker = config.messageBroker
    this.aiEngine = config.aiEngine
    this.storeService = config.storeService
    if (config.defaultTimeout) {
      this.defaultTimeout = config.defaultTimeout
    }
    this.setupEventHandlers()
  }

  /**
   * 初始化调度器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    await this.setupResultConsumer()
    this.isInitialized = true
    console.log('✅ AI任务调度器初始化完成')
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.broker.on('connected', () => {
      this.setupResultConsumer()
    })

    this.broker.on('reconnected', () => {
      this.setupResultConsumer()
    })
  }

  /**
   * 设置结果消费者
   */
  private async setupResultConsumer(): Promise<void> {
    try {
      // 消费AI处理结果
      await this.broker.consume(
        QUEUE_NAMES.AI_RESULTS,
        async (message) => {
          if (!message) return

          try {
            const result: AIResultMessage = JSON.parse(message.content.toString())
            await this.handleTaskResult(result)
            this.broker.ack(message)
          } catch (error) {
            console.error('Error processing AI result:', error)
            this.broker.nack(message, false) // 不重新入队
          }
        }
      )

      console.log('AI task result consumer set up')
    } catch (error) {
      console.error('Failed to setup result consumer:', error)
    }
  }

  /**
   * 调度生成任务
   */
  async scheduleGenerate(request: {
    inputs: string[]
    context?: string
    instruction?: string
    nodeId: string
    projectId: string
    userId: string
    priority?: TaskPriority
    timeout?: number
  }): Promise<string> {
    return this.scheduleTask({
      type: 'generate',
      ...request
    })
  }

  /**
   * 调度优化任务
   */
  async scheduleOptimize(request: {
    content: string
    instruction?: string
    nodeId: string
    projectId: string
    userId: string
    priority?: TaskPriority
    timeout?: number
  }): Promise<string> {
    return this.scheduleTask({
      type: 'optimize',
      inputs: [request.content],
      instruction: request.instruction,
      nodeId: request.nodeId,
      projectId: request.projectId,
      userId: request.userId,
      priority: request.priority,
      timeout: request.timeout
    })
  }

  /**
   * 调度融合任务
   */
  async scheduleFusion(request: {
    inputs: string[]
    instruction?: string
    nodeId: string
    projectId: string
    userId: string
    priority?: TaskPriority
    timeout?: number
  }): Promise<string> {
    return this.scheduleTask({
      type: 'fusion',
      ...request
    })
  }

  /**
   * 调度分析任务
   */
  async scheduleAnalyze(request: {
    content: string
    analysisType?: string
    nodeId: string
    projectId: string
    userId: string
    priority?: TaskPriority
    timeout?: number
  }): Promise<string> {
    return this.scheduleTask({
      type: 'analyze',
      inputs: [request.content],
      instruction: request.analysisType ? `进行${request.analysisType}分析` : undefined,
      nodeId: request.nodeId,
      projectId: request.projectId,
      userId: request.userId,
      priority: request.priority,
      timeout: request.timeout
    })
  }

  /**
   * 调度扩展任务
   */
  async scheduleExpand(request: {
    content: string
    direction?: string
    nodeId: string
    projectId: string
    userId: string
    priority?: TaskPriority
    timeout?: number
  }): Promise<string> {
    return this.scheduleTask({
      type: 'expand',
      inputs: [request.content],
      instruction: request.direction ? `向${request.direction}方向扩展` : undefined,
      nodeId: request.nodeId,
      projectId: request.projectId,
      userId: request.userId,
      priority: request.priority,
      timeout: request.timeout
    })
  }

  /**
   * 调度通用任务
   */
  async scheduleTask(request: AITaskRequest & {
    userId: string
    timeout?: number
  }): Promise<string> {
    const taskId = uuidv4()
    const timestamp = new Date()

    const taskMessage: AITaskMessage = {
      taskId,
      type: request.type,
      inputs: request.inputs,
      context: request.context,
      instruction: request.instruction,
      nodeId: request.nodeId,
      projectId: request.projectId,
      userId: request.userId,
      priority: request.priority || 'normal',
      timestamp,
      metadata: {
        timeout: request.timeout || this.defaultTimeout,
        originalRequestId: uuidv4(),
        retryCount: 0
      }
    }

    try {
      // 发布任务到处理队列
      await this.broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_PROCESS,
        taskMessage,
        {
          priority: this.getPriorityNumber(request.priority || 'normal'),
          persistent: true,
          correlationId: taskId,
          type: 'ai_task'
        }
      )

      // 跟踪任务状态
      this.trackTask(taskId, request.timeout || this.defaultTimeout)

      // 触发任务调度事件
      this.emit('taskScheduled', {
        taskId,
        type: request.type,
        nodeId: request.nodeId,
        priority: request.priority || 'normal'
      })

      console.log(`AI task scheduled: ${taskId} (type: ${request.type}, node: ${request.nodeId})`)
      return taskId

    } catch (error) {
      console.error('Failed to schedule AI task:', error)
      throw new Error(`Failed to schedule AI task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 批量调度任务
   */
  async scheduleBatch(requests: (AITaskRequest & { userId: string })[], options: {
    concurrency?: number
    failFast?: boolean
    collectResults?: boolean
  } = {}): Promise<string> {
    const batchId = uuidv4()
    const timestamp = new Date()

    const tasks: AITaskMessage[] = requests.map(request => ({
      taskId: uuidv4(),
      type: request.type,
      inputs: request.inputs,
      context: request.context,
      instruction: request.instruction,
      nodeId: request.nodeId,
      projectId: request.projectId,
      userId: request.userId,
      priority: request.priority || 'normal',
      timestamp,
      metadata: {
        batchId,
        timeout: this.defaultTimeout,
        retryCount: 0
      }
    }))

    const batchMessage: AIBatchTaskMessage = {
      batchId,
      tasks,
      batchOptions: {
        concurrency: options.concurrency || 3,
        failFast: options.failFast || false,
        collectResults: options.collectResults !== false
      },
      timestamp
    }

    try {
      await this.broker.publishWithConfirm(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.AI_BATCH,
        batchMessage,
        {
          priority: 5, // 批处理任务优先级较低
          persistent: true,
          correlationId: batchId,
          type: 'ai_batch_task'
        }
      )

      // 跟踪所有任务
      tasks.forEach(task => {
        this.trackTask(task.taskId, this.defaultTimeout)
      })

      this.emit('batchScheduled', {
        batchId,
        taskCount: tasks.length,
        options
      })

      console.log(`AI batch scheduled: ${batchId} (${tasks.length} tasks)`)
      return batchId

    } catch (error) {
      console.error('Failed to schedule AI batch:', error)
      throw new Error(`Failed to schedule AI batch: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (!task) {
      return false
    }

    try {
      // 发布取消消息
      await this.broker.publish(
        EXCHANGE_NAMES.LLM_DIRECT,
        ROUTING_KEYS.TASK_CANCEL,
        {
          taskId,
          timestamp: new Date(),
          reason: 'user_cancelled'
        },
        {
          correlationId: taskId,
          type: 'ai_cancel'
        }
      )

      // 更新任务状态
      this.updateTaskStatus(taskId, 'cancelled', 'Task cancelled by user')

      this.emit('taskCancelled', { taskId })
      return true

    } catch (error) {
      console.error('Failed to cancel task:', error)
      return false
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): AITaskStatus | undefined {
    return this.activeTasks.get(taskId)
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): AITaskStatus[] {
    return Array.from(this.activeTasks.values())
  }

  /**
   * 处理任务结果
   */
  private async handleTaskResult(result: AIResultMessage): Promise<void> {
    const task = this.activeTasks.get(result.taskId)
    if (!task) {
      console.warn(`Received result for unknown task: ${result.taskId}`)
      return
    }

    // 清理超时定时器
    const timeout = this.taskTimeouts.get(result.taskId)
    if (timeout) {
      clearTimeout(timeout)
      this.taskTimeouts.delete(result.taskId)
    }

    // 更新任务状态
    if (result.success) {
      this.updateTaskStatus(result.taskId, 'completed', 'Task completed successfully')
    } else {
      this.updateTaskStatus(result.taskId, 'failed', result.error?.message || 'Task failed')
    }

    // 触发结果事件
    this.emit('taskCompleted', {
      taskId: result.taskId,
      nodeId: result.nodeId,
      success: result.success,
      result: result.result,
      error: result.error,
      processingTime: result.processingTime
    })

    // 从活跃任务中移除
    this.activeTasks.delete(result.taskId)

    console.log(`AI task completed: ${result.taskId} (success: ${result.success})`)
  }

  /**
   * 跟踪任务
   */
  private trackTask(taskId: string, timeout: number): void {
    // 添加到活跃任务
    this.activeTasks.set(taskId, {
      taskId,
      status: 'queued',
      timestamp: new Date()
    })

    // 设置超时处理
    const timer = setTimeout(() => {
      this.handleTaskTimeout(taskId)
    }, timeout)

    this.taskTimeouts.set(taskId, timer)
  }

  /**
   * 处理任务超时
   */
  private handleTaskTimeout(taskId: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) {
      return
    }

    this.updateTaskStatus(taskId, 'timeout', 'Task timed out')

    this.emit('taskTimeout', { taskId })

    // 从活跃任务中移除
    this.activeTasks.delete(taskId)
    this.taskTimeouts.delete(taskId)

    console.log(`AI task timed out: ${taskId}`)
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(
    taskId: string,
    status: AITaskStatus['status'],
    message?: string,
    progress?: number
  ): void {
    const task = this.activeTasks.get(taskId)
    if (task) {
      task.status = status
      task.message = message
      task.progress = progress
      task.timestamp = new Date()

      this.emit('taskStatusUpdated', task)
    }
  }

  /**
   * 获取优先级数值
   */
  private getPriorityNumber(priority: TaskPriority): number {
    const priorityMap = {
      low: 1,
      normal: 5,
      high: 8,
      urgent: 10
    }
    return priorityMap[priority] || 5
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const tasks = Array.from(this.activeTasks.values())
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      activeTasks: tasks.length,
      statusBreakdown: statusCounts,
      pendingTimeouts: this.taskTimeouts.size,
      averageTaskAge: this.calculateAverageTaskAge(tasks),
      defaultTimeout: this.defaultTimeout
    }
  }

  /**
   * 计算平均任务年龄
   */
  private calculateAverageTaskAge(tasks: AITaskStatus[]): number {
    if (tasks.length === 0) return 0

    const now = Date.now()
    const totalAge = tasks.reduce((sum, task) => {
      return sum + (now - task.timestamp.getTime())
    }, 0)

    return totalAge / tasks.length
  }

  /**
   * 清理已完成的任务
   */
  cleanup(): void {
    // 清理所有超时定时器
    this.taskTimeouts.forEach(timer => clearTimeout(timer))
    this.taskTimeouts.clear()

    // 清理活跃任务
    this.activeTasks.clear()

    console.log('AI task scheduler cleaned up')
  }
}