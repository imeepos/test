import type { AIGenerateRequest, AIGenerateResponse } from '@/types'
import { websocketService } from './websocketService'
import { aiService } from './aiService'

/**
 * 任务状态类型
 */
export type TaskStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed'

/**
 * 任务进度信息
 */
export interface TaskProgress {
  taskId: string
  status: TaskStatus
  progress?: number // 0-100 进度百分比
  message?: string
  startTime: Date
  endTime?: Date
  result?: AIGenerateResponse
  error?: string
}

/**
 * 队列任务配置
 */
export interface QueueTaskOptions {
  priority?: number // 任务优先级 1-10，数字越大优先级越高
  timeout?: number // 任务超时时间（毫秒）
  retryCount?: number // 重试次数
  callback?: (progress: TaskProgress) => void // 进度回调
}

/**
 * 队列服务 - WebSocket消息封装层
 * 提供统一的任务状态跟踪和WebSocket消息管理
 * 不直接处理队列操作，通过WebSocket与Gateway通信
 */
class QueueService {
  private tasks: Map<string, TaskProgress> = new Map()
  private callbacks: Map<string, (progress: TaskProgress) => void> = new Map()
  private isWebSocketConnected = false

  constructor() {
    // 监听WebSocket连接状态
    websocketService.onStatusChange((status) => {
      this.isWebSocketConnected = status === 'connected'
      console.log(`队列服务WebSocket状态: ${this.isWebSocketConnected ? '已连接' : '已断开'}`)

      if (!this.isWebSocketConnected) {
        console.warn('WebSocket断开，AI任务处理将暂停')
      }
    })

    // 订阅AI任务相关的WebSocket事件
    websocketService.subscribe('ai_task_queued', this.handleTaskQueued.bind(this))
    websocketService.subscribe('ai_task_result', this.handleTaskResult.bind(this))
    websocketService.subscribe('ai_task_error', this.handleTaskError.bind(this))
    websocketService.subscribe('AI_GENERATE_RESPONSE', this.handleAIResponse.bind(this))
    websocketService.subscribe('AI_GENERATE_ERROR', this.handleAIError.bind(this))
  }

  /**
   * 提交AI任务（通过WebSocket到Gateway）
   * 简化为WebSocket消息发送，不直接管理队列
   */
  async submitAITask(
    request: AIGenerateRequest,
    options: QueueTaskOptions = {}
  ): Promise<string> {
    if (!this.isWebSocketConnected) {
      throw new Error('WebSocket连接未建立，无法提交AI任务')
    }

    const taskId = this.generateTaskId()
    const { callback } = options

    const taskProgress: TaskProgress = {
      taskId,
      status: 'pending',
      startTime: new Date(),
      message: '正在发送任务到服务器...'
    }

    this.tasks.set(taskId, taskProgress)
    if (callback) {
      this.callbacks.set(taskId, callback)
    }

    try {
      // 通过WebSocket发送AI生成请求到Gateway
      const requestWithId = {
        ...request,
        requestId: taskId,
        priority: options.priority
      }

      // 使用WebSocket的AI生成功能
      await websocketService.sendMessage('AI_GENERATE_REQUEST', requestWithId)

      this.updateTaskProgress(taskId, {
        status: 'queued',
        message: '任务已发送到服务器'
      })

      return taskId
    } catch (error) {
      this.updateTaskProgress(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : '发送失败',
        endTime: new Date()
      })
      throw error
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskProgress | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId)
    if (!task) return false

    if (task.status === 'completed' || task.status === 'failed') {
      return false // 已完成或失败的任务无法取消
    }

    try {
      // 检查队列服务是否可用
      if (!this.isQueueHealthy) {
        throw new Error('无法取消任务: 消息队列服务不可用')
      }

      // 通过WebSocket发送取消请求
      await websocketService.sendMessage('CANCEL_TASK', { taskId })

      this.updateTaskProgress(taskId, {
        status: 'failed',
        error: '任务已取消',
        endTime: new Date()
      })

      return true
    } catch (error) {
      console.error('取消任务失败:', error)
      return false
    }
  }

  /**
   * 获取队列统计信息
   */
  getQueueStats() {
    const tasks = Array.from(this.tasks.values())
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      queued: tasks.filter(t => t.status === 'queued').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      isWebSocketConnected: this.isWebSocketConnected,
      websocketStatus: websocketService.getStatus()
    }
  }

  /**
   * 清理已完成的任务（释放内存）
   */
  cleanupCompletedTasks(maxAge = 300000): void { // 默认5分钟
    const cutoff = new Date(Date.now() - maxAge)

    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        task.endTime &&
        task.endTime < cutoff
      ) {
        this.tasks.delete(taskId)
        this.callbacks.delete(taskId)
      }
    }
  }

  // 私有方法

  /**
   * 处理任务入队确认
   */
  private handleTaskQueued(message: any): void {
    const { taskId, status, message: statusMessage } = message.payload

    this.updateTaskProgress(taskId, {
      status: status || 'queued',
      message: statusMessage || '任务已入队，等待处理'
    })
  }

  /**
   * 处理任务结果
   */
  private handleTaskResult(message: any): void {
    const { taskId, result, processingTime } = message.payload

    this.updateTaskProgress(taskId, {
      status: 'completed',
      result,
      message: '任务处理完成',
      endTime: new Date()
    })
  }

  /**
   * 处理任务错误
   */
  private handleTaskError(message: any): void {
    const { taskId, error } = message.payload

    this.updateTaskProgress(taskId, {
      status: 'failed',
      error: error?.message || error || '任务处理失败',
      endTime: new Date()
    })
  }

  /**
   * 处理任务状态更新（兼容旧消息格式）
   */
  private handleTaskStatusUpdate(message: any): void {
    const { taskId, status, progress, statusMessage } = message.payload

    this.updateTaskProgress(taskId, {
      status,
      progress,
      message: statusMessage
    })
  }

  /**
   * 处理AI响应
   */
  private handleAIResponse(message: any): void {
    const { taskId, result } = message.payload

    this.updateTaskProgress(taskId, {
      status: 'completed',
      result,
      endTime: new Date(),
      message: 'AI处理完成'
    })
  }

  /**
   * 处理AI错误
   */
  private handleAIError(message: any): void {
    const { taskId, error } = message.payload

    this.updateTaskProgress(taskId, {
      status: 'failed',
      error: error.message || '处理失败',
      endTime: new Date()
    })
  }

  /**
   * 更新任务进度
   */
  private updateTaskProgress(taskId: string, updates: Partial<TaskProgress>): void {
    const task = this.tasks.get(taskId)
    if (!task) return

    const updatedTask = { ...task, ...updates }
    this.tasks.set(taskId, updatedTask)

    // 调用进度回调
    const callback = this.callbacks.get(taskId)
    if (callback) {
      callback(updatedTask)
    }

    // 如果任务完成或失败，延迟清理回调
    if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
      setTimeout(() => {
        this.callbacks.delete(taskId)
      }, 5000) // 5秒后清理回调，给UI足够时间处理结果
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 单例实例
export const queueService = new QueueService()

// 定期清理已完成的任务
setInterval(() => {
  queueService.cleanupCompletedTasks()
}, 60000) // 每分钟清理一次

// 导出类型和服务
export { QueueService }
export type { TaskProgress, QueueTaskOptions }