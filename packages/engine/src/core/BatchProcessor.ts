import { EventEmitter } from 'events'
import type {
  AIProvider,
  BatchRequest,
  BatchResult,
  BatchOptions,
  BatchProgress,
  BatchSummary,
  AITaskRequest,
  AITaskResult
} from '../types/index.js'
import { AIEngine } from './AIEngine.js'

/**
 * 批处理器类
 * 支持并发处理多个AI任务
 */
export class BatchProcessor extends EventEmitter {
  private engine: AIEngine

  constructor(engine: AIEngine) {
    super()
    this.engine = engine
  }

  /**
   * 批量处理任务
   */
  async processBatch(request: BatchRequest): Promise<BatchResult>
  async processBatch(
    tasks: AITaskRequest[],
    options?: BatchOptions
  ): Promise<BatchResult>
  async processBatch(
    requestOrTasks: BatchRequest | AITaskRequest[],
    optionsOrUndefined?: BatchOptions
  ): Promise<BatchResult> {
    // 标准化参数
    let tasks: AITaskRequest[]
    let options: BatchOptions

    if (Array.isArray(requestOrTasks)) {
      tasks = requestOrTasks
      options = optionsOrUndefined || {}
    } else {
      tasks = requestOrTasks.tasks
      options = requestOrTasks.options || {}
    }

    // 设置默认选项
    const processOptions: Required<BatchOptions> = {
      concurrency: options.concurrency || 3,
      failFast: options.failFast || false,
      retryFailedTasks: options.retryFailedTasks || false,
      progressCallback: options.progressCallback || (() => {})
    }

    const startTime = Date.now()
    const results: Array<AITaskResult | null> = new Array(tasks.length).fill(null)
    const errors: Array<{ index: number; error: any }> = []

    // 初始化进度
    const progress: BatchProgress = {
      total: tasks.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      percentage: 0
    }

    this.emit('batch_started', { tasks: tasks.length, options: processOptions })

    try {
      // 创建任务队列
      const taskQueue = tasks.map((task, index) => ({ task, index }))
      const processingTasks = new Set<number>()

      // 并发处理任务
      await this.processTasksConcurrently(
        taskQueue,
        results,
        errors,
        progress,
        processOptions,
        processingTasks
      )

      // 重试失败的任务（如果启用）
      if (processOptions.retryFailedTasks && errors.length > 0) {
        await this.retryFailedTasks(
          tasks,
          results,
          errors,
          progress,
          processOptions
        )
      }

    } catch (error) {
      this.emit('batch_error', { error })
      if (processOptions.failFast) {
        throw error
      }
    }

    // 生成批处理摘要
    const summary = this.generateBatchSummary(
      tasks.length,
      results,
      errors,
      startTime
    )

    const batchResult: BatchResult = {
      results,
      summary,
      errors: errors.map(({ index, error }) => ({
        index,
        error: {
          code: error.code || 'BATCH_PROCESSING_ERROR',
          message: error.message || 'Unknown batch processing error',
          details: error,
          timestamp: new Date()
        }
      }))
    }

    this.emit('batch_completed', { result: batchResult })

    return batchResult
  }

  /**
   * 并发处理任务
   */
  private async processTasksConcurrently(
    taskQueue: Array<{ task: AITaskRequest; index: number }>,
    results: Array<AITaskResult | null>,
    errors: Array<{ index: number; error: any }>,
    progress: BatchProgress,
    options: Required<BatchOptions>,
    processingTasks: Set<number>
  ): Promise<void> {
    const workers: Promise<void>[] = []

    // 创建工作器
    for (let i = 0; i < options.concurrency; i++) {
      workers.push(
        this.createWorker(
          taskQueue,
          results,
          errors,
          progress,
          options,
          processingTasks
        )
      )
    }

    // 等待所有工作器完成
    await Promise.all(workers)
  }

  /**
   * 创建工作器
   */
  private async createWorker(
    taskQueue: Array<{ task: AITaskRequest; index: number }>,
    results: Array<AITaskResult | null>,
    errors: Array<{ index: number; error: any }>,
    progress: BatchProgress,
    options: Required<BatchOptions>,
    processingTasks: Set<number>
  ): Promise<void> {
    while (taskQueue.length > 0) {
      const taskItem = taskQueue.shift()
      if (!taskItem) break

      const { task, index } = taskItem

      try {
        // 更新进度
        processingTasks.add(index)
        progress.inProgress = processingTasks.size
        this.updateProgress(progress, options.progressCallback)

        this.emit('task_started', { task, index })

        // 处理任务
        const result = await this.engine.processTask(task)
        results[index] = result

        // 更新进度
        processingTasks.delete(index)
        if (result.success) {
          progress.completed++
        } else {
          progress.failed++
          errors.push({ index, error: result.error })
        }

        progress.inProgress = processingTasks.size
        this.updateProgress(progress, options.progressCallback)

        this.emit('task_completed', { task, index, result })

        // 如果启用快速失败且任务失败
        if (options.failFast && !result.success) {
          throw new Error(`任务 ${index} 失败: ${result.error?.message}`)
        }

      } catch (error) {
        // 处理错误
        processingTasks.delete(index)
        progress.failed++
        progress.inProgress = processingTasks.size
        errors.push({ index, error })

        this.updateProgress(progress, options.progressCallback)
        this.emit('task_failed', { task, index, error })

        if (options.failFast) {
          throw error
        }
      }
    }
  }

  /**
   * 重试失败的任务
   */
  private async retryFailedTasks(
    originalTasks: AITaskRequest[],
    results: Array<AITaskResult | null>,
    errors: Array<{ index: number; error: any }>,
    progress: BatchProgress,
    options: Required<BatchOptions>
  ): Promise<void> {
    const failedTasks = errors.map(({ index }) => ({
      task: originalTasks[index],
      index
    }))

    if (failedTasks.length === 0) return

    this.emit('retry_started', { failedTasks: failedTasks.length })

    // 清除之前的错误
    errors.length = 0

    // 重置失败计数
    const previousFailed = progress.failed
    progress.failed = 0

    // 重试失败的任务
    const retryQueue = [...failedTasks]
    const processingTasks = new Set<number>()

    await this.processTasksConcurrently(
      retryQueue,
      results,
      errors,
      progress,
      { ...options, failFast: false }, // 重试时不快速失败
      processingTasks
    )

    this.emit('retry_completed', {
      originalFailed: previousFailed,
      retryFailed: errors.length,
      recovered: previousFailed - errors.length
    })
  }

  /**
   * 更新进度
   */
  private updateProgress(
    progress: BatchProgress,
    callback: (progress: BatchProgress) => void
  ): void {
    const totalProcessed = progress.completed + progress.failed
    progress.percentage = progress.total > 0 ? (totalProcessed / progress.total) * 100 : 0

    callback({ ...progress })
    this.emit('progress_updated', { ...progress })
  }

  /**
   * 生成批处理摘要
   */
  private generateBatchSummary(
    totalTasks: number,
    results: Array<AITaskResult | null>,
    errors: Array<{ index: number; error: any }>,
    startTime: number
  ): BatchSummary {
    const successful = results.filter(result => result?.success).length
    const failed = errors.length
    const totalProcessingTime = Date.now() - startTime

    // 计算总token数和成本
    let totalTokens = 0
    let totalCost = 0

    results.forEach(result => {
      if (result?.success) {
        totalTokens += result.metadata.tokenCount
        totalCost += result.metadata.cost || 0
      }
    })

    return {
      totalTasks,
      successful,
      failed,
      totalProcessingTime,
      totalTokens,
      ...(totalCost > 0 ? { totalCost } : {})
    }
  }

  /**
   * 估算批处理时间
   */
  estimateProcessingTime(
    tasks: AITaskRequest[],
    options?: BatchOptions
  ): {
    estimatedTimeMs: number
    estimatedTokens: number
    estimatedCost?: number
  } {
    const concurrency = options?.concurrency || 3
    const avgProcessingTimePerTask = 5000 // 5秒平均处理时间
    const avgTokensPerTask = 500 // 平均token数

    // 计算预估时间（考虑并发）
    const totalTasks = tasks.length
    const serialTime = totalTasks * avgProcessingTimePerTask
    const estimatedTimeMs = Math.ceil(serialTime / concurrency)

    // 计算预估token数
    const estimatedTokens = totalTasks * avgTokensPerTask

    // 计算预估成本（使用GPT-3.5的价格作为默认）
    const costPerToken = 0.0000015
    const estimatedCost = estimatedTokens * costPerToken

    return {
      estimatedTimeMs,
      estimatedTokens,
      estimatedCost
    }
  }

  /**
   * 创建任务模板
   */
  createTaskTemplate(
    type: AITaskRequest['type'],
    instruction: string,
    baseOptions?: Partial<AITaskRequest>
  ): (inputs: string[], customOptions?: Partial<AITaskRequest>) => AITaskRequest {
    return (inputs: string[], customOptions?: Partial<AITaskRequest>): AITaskRequest => ({
      type,
      inputs,
      instruction,
      ...baseOptions,
      ...customOptions
    })
  }

  /**
   * 从CSV数据创建批量任务
   */
  createTasksFromCSV(
    csvData: Array<Record<string, string>>,
    taskTemplate: (row: Record<string, string>) => AITaskRequest
  ): AITaskRequest[] {
    return csvData.map(row => taskTemplate(row))
  }

  /**
   * 导出批处理结果为CSV
   */
  exportResultsToCSV(result: BatchResult): string {
    const headers = [
      'Index',
      'Success',
      'Content',
      'Confidence',
      'Tags',
      'Processing Time (ms)',
      'Token Count',
      'Cost',
      'Error'
    ]

    const rows = result.results.map((taskResult, index) => {
      if (taskResult) {
        return [
          index.toString(),
          taskResult.success.toString(),
          taskResult.content.replace(/"/g, '""'),
          taskResult.confidence.toString(),
          taskResult.tags.join(';'),
          taskResult.metadata.processingTime.toString(),
          taskResult.metadata.tokenCount.toString(),
          (taskResult.metadata.cost || 0).toString(),
          taskResult.error?.message || ''
        ]
      } else {
        const error = result.errors.find(e => e.index === index)
        return [
          index.toString(),
          'false',
          '',
          '0',
          '',
          '0',
          '0',
          '0',
          error?.error.message || 'Unknown error'
        ]
      }
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  /**
   * 获取批处理统计
   */
  getProcessingStats(): {
    averageProcessingTime: number
    averageTokenCount: number
    averageConfidence: number
    successRate: number
  } {
    // 这里可以实现基于历史数据的统计
    return {
      averageProcessingTime: 5000,
      averageTokenCount: 500,
      averageConfidence: 0.85,
      successRate: 0.95
    }
  }
}