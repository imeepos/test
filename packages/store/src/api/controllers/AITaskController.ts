import { Request, Response } from 'express'
import { BaseController } from '../BaseController'
import { AITaskRepository } from '../../repositories/AITaskRepository'

/**
 * AI任务管理API控制器
 */
export class AITaskController extends BaseController {
  private aiTaskRepo: AITaskRepository

  constructor() {
    super()
    this.aiTaskRepo = new AITaskRepository()
  }

  /**
   * 获取AI任务列表
   * GET /api/v1/ai-tasks
   */
  getAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const projectId = req.query.projectId as string
    const userId = req.query.userId as string
    const status = req.query.status as string
    const type = req.query.type as string

    let tasks
    if (projectId) {
      tasks = await this.aiTaskRepo.findByProject(projectId, { limit, offset })
    } else if (userId) {
      tasks = await this.aiTaskRepo.findByUser(userId, { limit, offset })
    } else if (status) {
      tasks = await this.aiTaskRepo.findByStatus(status, { limit, offset })
    } else if (type) {
      tasks = await this.aiTaskRepo.findByType(type, { limit, offset })
    } else {
      tasks = await this.aiTaskRepo.findMany({ limit, offset })
    }

    const total = tasks.length
    const pagination = this.createPagination(page, limit, total)
    this.success(res, tasks, pagination)
  })

  /**
   * 根据ID获取AI任务
   * GET /api/v1/ai-tasks/:id
   */
  getAITaskById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const task = await this.aiTaskRepo.findById(id)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 创建AI任务
   * POST /api/v1/ai-tasks
   */
  createAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = [
      'type', 'node_id', 'project_id', 'user_id',
      'input_data', 'priority', 'metadata'
    ]
    const taskData = this.sanitizeInput(req.body, allowedFields)

    const requiredErrors = this.validateRequired(taskData, [
      'type', 'project_id', 'user_id', 'input_data'
    ])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 设置默认值
    taskData.status = 'pending'
    taskData.priority = taskData.priority || 'normal'

    const task = await this.aiTaskRepo.create(taskData)
    this.created(res, task)
  })

  /**
   * 更新AI任务
   * PUT /api/v1/ai-tasks/:id
   */
  updateAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const allowedFields = [
      'status', 'output_data', 'error_data', 'priority',
      'processing_time', 'metadata'
    ]
    const updateData = this.sanitizeInput(req.body, allowedFields)

    const task = await this.aiTaskRepo.update(id, updateData)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 删除AI任务
   * DELETE /api/v1/ai-tasks/:id
   */
  deleteAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.aiTaskRepo.delete(id)
    if (!success) {
      return this.notFound(res, 'AI Task')
    }

    this.noContent(res)
  })

  /**
   * 获取项目的AI任务
   * GET /api/v1/ai-tasks/by-project/:projectId
   */
  getAITasksByProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const tasks = await this.aiTaskRepo.findByProject(projectId, { limit, offset })
    const total = tasks.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, tasks, pagination)
  })

  /**
   * 获取用户的AI任务
   * GET /api/v1/ai-tasks/by-user/:userId
   */
  getAITasksByUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const tasks = await this.aiTaskRepo.findByUser(userId, { limit, offset })
    const total = tasks.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, tasks, pagination)
  })

  /**
   * 根据状态获取AI任务
   * GET /api/v1/ai-tasks/by-status/:status
   */
  getAITasksByStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const tasks = await this.aiTaskRepo.findByStatus(status, { limit, offset })
    const total = tasks.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, tasks, pagination)
  })

  /**
   * 根据类型获取AI任务
   * GET /api/v1/ai-tasks/by-type/:type
   */
  getAITasksByType = this.asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const tasks = await this.aiTaskRepo.findByType(type, { limit, offset })
    const total = tasks.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, tasks, pagination)
  })

  /**
   * 启动AI任务
   * PUT /api/v1/ai-tasks/:id/start
   */
  startAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const task = await this.aiTaskRepo.startTask(id)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 完成AI任务
   * PUT /api/v1/ai-tasks/:id/complete
   */
  completeAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { result, processingTime } = req.body

    const requiredErrors = this.validateRequired(req.body, ['result'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const task = await this.aiTaskRepo.completeTask(id, result, processingTime)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 标记AI任务失败
   * PUT /api/v1/ai-tasks/:id/fail
   */
  failAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { error } = req.body

    const requiredErrors = this.validateRequired(req.body, ['error'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const task = await this.aiTaskRepo.failTask(id, error)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 取消AI任务
   * PUT /api/v1/ai-tasks/:id/cancel
   */
  cancelAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const task = await this.aiTaskRepo.cancelTask(id)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 重试AI任务
   * PUT /api/v1/ai-tasks/:id/retry
   */
  retryAITask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const maxRetries = parseInt(req.query.maxRetries as string) || 3

    const task = await this.aiTaskRepo.retryTask(id, maxRetries)
    if (!task) {
      return this.notFound(res, 'AI Task')
    }

    this.success(res, task)
  })

  /**
   * 获取队列中的任务
   * GET /api/v1/ai-tasks/queued
   */
  getQueuedAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10

    const tasks = await this.aiTaskRepo.getQueuedTasks(limit)
    this.success(res, tasks)
  })

  /**
   * 获取正在处理的任务
   * GET /api/v1/ai-tasks/processing
   */
  getProcessingAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const tasks = await this.aiTaskRepo.getProcessingTasks()
    this.success(res, tasks)
  })

  /**
   * 获取超时的任务
   * GET /api/v1/ai-tasks/timed-out
   */
  getTimedOutAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const timeoutMinutes = parseInt(req.query.timeoutMinutes as string) || 30

    const tasks = await this.aiTaskRepo.getTimedOutTasks(timeoutMinutes)
    this.success(res, tasks)
  })

  /**
   * 清理超时任务
   * POST /api/v1/ai-tasks/cleanup-timed-out
   */
  cleanupTimedOutAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const timeoutMinutes = parseInt(req.body.timeoutMinutes) || 30

    const count = await this.aiTaskRepo.cleanupTimedOutTasks(timeoutMinutes)
    this.success(res, { cleanedCount: count })
  })

  /**
   * 获取AI任务统计
   * GET /api/v1/ai-tasks/stats
   */
  getAITaskStats = this.asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string
    const userId = req.query.userId as string

    const stats = await this.aiTaskRepo.getStatistics(projectId, userId)
    this.success(res, stats)
  })

  /**
   * 获取性能分析
   * GET /api/v1/ai-tasks/performance-analysis
   */
  getPerformanceAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string
    const days = parseInt(req.query.days as string) || 30

    const analysis = await this.aiTaskRepo.getPerformanceAnalysis(projectId, days)
    this.success(res, analysis)
  })

  /**
   * 清理旧任务
   * POST /api/v1/ai-tasks/cleanup-old
   */
  cleanupOldAITasks = this.asyncHandler(async (req: Request, res: Response) => {
    const daysOld = parseInt(req.body.daysOld) || 90

    const count = await this.aiTaskRepo.cleanupOldTasks(daysOld)
    this.success(res, { deletedCount: count })
  })
}