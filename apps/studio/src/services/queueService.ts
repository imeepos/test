import type { AIGenerateRequest, AIGenerateResponse } from '@/types'
import { websocketService } from './websocketService'

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

    // 订阅AI任务相关的WebSocket事件（统一使用 AI_GENERATE_* 事件）
    websocketService.subscribe('AI_GENERATE_PROGRESS', this.handleAIProgress.bind(this))
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
    // 移除连接检查，利用websocketService的内置队列机制
    // websocketService会自动缓存离线消息并在重连后发送

    const taskId = this.generateTaskId()
    const { callback } = options

    const taskProgress: TaskProgress = {
      taskId,
      status: 'pending',
      startTime: new Date(),
      message: this.isWebSocketConnected
        ? '正在发送任务到服务器...'
        : '连接中断，任务将在重连后自动发送...'
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
      // TODO: 实现队列健康检查

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
   * 处理AI进度更新（包括queued状态）
   */
  private handleAIProgress(message: any): void {
    const { requestId, taskId, stage, progress, message: statusMessage } = message.payload
    const id = requestId || taskId

    if (!id) return

    // 将stage映射到TaskStatus
    let status: TaskStatus = 'processing'
    if (stage === 'queued') {
      status = 'queued'
    } else if (stage === 'completed') {
      status = 'completed'
    } else if (stage === 'error') {
      status = 'failed'
    }

    this.updateTaskProgress(id, {
      status,
      progress,
      message: statusMessage || `任务${stage === 'queued' ? '已入队' : '处理中'}...`
    })
  }

  /**
   * 处理AI响应
   */
  private handleAIResponse(message: any): void {
    const { requestId, taskId, ...result } = message.payload
    const id = requestId || taskId

    if (!id) return

    this.updateTaskProgress(id, {
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
    const { requestId, taskId, error } = message.payload
    const id = requestId || taskId

    if (!id) return

    this.updateTaskProgress(id, {
      status: 'failed',
      error: error?.message || error || '处理失败',
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
// export type { TaskProgress, QueueTaskOptions }