import { Request, Response } from 'express'
import { BaseController } from '../BaseController.js'
import { ProjectRepository } from '../../repositories/ProjectRepository.js'

/**
 * 项目管理API控制器
 */
export class ProjectController extends BaseController {
  private projectRepo: ProjectRepository

  constructor() {
    super()
    this.projectRepo = new ProjectRepository()
  }

  /**
   * 获取项目列表
   * GET /api/v1/projects
   */
  getProjects = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const userId = req.query.userId as string
    const status = req.query.status as string
    const search = req.query.search as string

    let filter: any = {}

    if (search) {
      filter.$or = [
        { name: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } }
      ]
    }

    if (status) {
      filter.status = status
    }

    let projects
    if (userId) {
      projects = await this.projectRepo.findByUser(userId, { limit, offset })
    } else {
      projects = await this.projectRepo.findMany({ ...filter, limit, offset })
    }

    const total = projects.length
    const pagination = this.createPagination(page, limit, total)
    this.success(res, projects, pagination)
  })

  /**
   * 根据ID获取项目
   * GET /api/v1/projects/:id
   */
  getProjectById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const project = await this.projectRepo.findById(id)
    if (!project) {
      return this.notFound(res, 'Project')
    }

    this.success(res, project)
  })

  /**
   * 创建项目
   * POST /api/v1/projects
   */
  createProject = this.asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = [
      'name', 'description', 'type', 'status', 'visibility',
      'owner_id', 'user_id', 'canvas_data', 'settings', 'metadata'
    ]
    const projectData = this.sanitizeInput(req.body, allowedFields)

    // 字段映射：owner_id -> user_id (兼容前端API命名)
    if (projectData.owner_id && !projectData.user_id) {
      projectData.user_id = projectData.owner_id
      delete projectData.owner_id
    }

    const requiredErrors = this.validateRequired(projectData, ['name', 'user_id'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 设置默认值
    projectData.status = projectData.status || 'active'

    // 移除数据库表中不存在的字段
    delete projectData.visibility
    delete projectData.type

    const project = await this.projectRepo.create(projectData)
    this.created(res, project)
  })

  /**
   * 更新项目
   * PUT /api/v1/projects/:id
   */
  updateProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const allowedFields = [
      'name', 'description', 'type', 'status', 'visibility',
      'canvas_data', 'settings', 'metadata'
    ]
    const updateData = this.sanitizeInput(req.body, allowedFields)

    const project = await this.projectRepo.update(id, updateData)
    if (!project) {
      return this.notFound(res, 'Project')
    }

    this.success(res, project)
  })

  /**
   * 删除项目
   * DELETE /api/v1/projects/:id
   */
  deleteProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.projectRepo.delete(id)
    if (!success) {
      return this.notFound(res, 'Project')
    }

    this.noContent(res)
  })

  /**
   * 获取用户的项目
   * GET /api/v1/projects/by-user/:userId
   */
  getProjectsByUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const projects = await this.projectRepo.findByUser(userId, { limit, offset })
    const total = projects.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, projects, pagination)
  })

  /**
   * 获取指定状态的项目
   * GET /api/v1/projects/by-status/:status
   */
  getProjectsByStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)
    const userId = req.query.userId as string

    const projects = await this.projectRepo.findByStatus(status, { limit, offset })
    const total = projects.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, projects, pagination)
  })

  /**
   * 获取活跃项目
   * GET /api/v1/projects/active
   */
  getActiveProjects = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const userId = req.query.userId as string

    const projects = await this.projectRepo.findActive(userId, { limit, offset })
    const total = projects.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, projects, pagination)
  })

  /**
   * 获取已归档项目
   * GET /api/v1/projects/archived
   */
  getArchivedProjects = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const userId = req.query.userId as string

    const projects = await this.projectRepo.findArchived(userId, { limit, offset })
    const total = projects.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, projects, pagination)
  })

  /**
   * 更新项目最后访问时间
   * PUT /api/v1/projects/:id/last-accessed
   */
  updateLastAccessed = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const project = await this.projectRepo.updateLastAccessed(id)
    if (!project) {
      return this.notFound(res, 'Project')
    }

    this.success(res, project)
  })

  /**
   * 归档项目
   * PUT /api/v1/projects/:id/archive
   */
  archiveProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const project = await this.projectRepo.archive(id)
    if (!project) {
      return this.notFound(res, 'Project')
    }

    this.success(res, project)
  })

  /**
   * 取消归档项目
   * PUT /api/v1/projects/:id/unarchive
   */
  unarchiveProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const project = await this.projectRepo.unarchive(id)
    if (!project) {
      return this.notFound(res, 'Project')
    }

    this.success(res, project)
  })

  /**
   * 获取项目统计信息
   * GET /api/v1/projects/:id/stats
   */
  getProjectStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const stats = await this.projectRepo.getStatistics(id)
    this.success(res, stats)
  })

  /**
   * 获取用户项目统计信息
   * GET /api/v1/projects/users/:userId/stats
   */
  getUserProjectStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    const stats = await this.projectRepo.getUserProjectStatistics(userId)
    this.success(res, stats)
  })

  /**
   * 获取最近访问的项目
   * GET /api/v1/projects/recent/:userId
   */
  getRecentProjects = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const limit = parseInt(req.query.limit as string) || 10

    const projects = await this.projectRepo.getRecentlyAccessed(userId, limit)
    this.success(res, projects)
  })

  /**
   * 获取热门项目
   * GET /api/v1/projects/popular/:userId
   */
  getPopularProjects = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const limit = parseInt(req.query.limit as string) || 10

    const projects = await this.projectRepo.getPopularProjects(userId, limit)
    this.success(res, projects)
  })

  /**
   * 检查用户是否有访问权限
   * GET /api/v1/projects/:id/access/:userId
   */
  checkAccess = this.asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params

    const hasAccess = await this.projectRepo.hasAccess(id, userId)
    this.success(res, { hasAccess })
  })

  /**
   * 获取协作者数量
   * GET /api/v1/projects/:id/collaborators/count
   */
  getCollaboratorCount = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const count = await this.projectRepo.getCollaboratorCount(id)
    this.success(res, { count })
  })

  /**
   * 导出项目数据
   * GET /api/v1/projects/:id/export
   */
  exportProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const exportData = await this.projectRepo.exportData(id)
    this.success(res, exportData)
  })

  /**
   * 清理旧的归档项目
   * DELETE /api/v1/projects/users/:userId/cleanup-archived
   */
  cleanupOldArchived = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const daysOld = parseInt(req.query.daysOld as string) || 365

    const count = await this.projectRepo.cleanupOldArchived(userId, daysOld)
    this.success(res, { deletedCount: count })
  })
}