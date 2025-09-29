import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes'
import {
  ProjectSearchQuery,
  ProjectCreateData,
  ProjectUpdateData,
  QueryOptions
} from '../types/SpecificTypes'
import { BaseRouter, RouterDependencies } from './BaseRouter'

/**
 * 项目管理路由器 - 处理项目的CRUD操作和画布状态管理
 */
export class ProjectRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 创建项目
    this.router.post('/', this.createProject.bind(this))

    // 获取项目
    this.router.get('/:id', this.getProject.bind(this))

    // 更新项目
    this.router.put('/:id', this.updateProject.bind(this))

    // 删除项目
    this.router.delete('/:id', this.deleteProject.bind(this))

    // 获取项目列表
    this.router.get('/', this.getProjects.bind(this))

    // 保存画布状态
    this.router.post('/:id/canvas-state', this.saveCanvasState.bind(this))

    // 获取画布状态
    this.router.get('/:id/canvas-state', this.getCanvasState.bind(this))
  }

  private async createProject(req: ApiRequest<ProjectCreateData>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const {
        name,
        description,
        canvas_data,
        settings,
        is_archived = false,
        status = 'active'
      } = req.body

      // 验证必需字段
      if (!name || name.trim().length === 0) {
        res.error({
          code: 'MISSING_PROJECT_NAME',
          message: '项目名称不能为空',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 创建项目数据
      const projectData = {
        name: name.trim(),
        description: description || '',
        user_id: req.user?.id || 'anonymous',
        status,
        canvas_data: canvas_data || {
          viewport: { x: 0, y: 0, zoom: 1 },
          displayMode: 'preview',
          filters: {}
        },
        settings: settings || {
          collaboration: { enabled: false },
          notifications: { enabled: true },
          autoSave: { enabled: true, interval: 30000 }
        },
        is_archived,
        last_accessed_at: new Date()
      }

      // 使用存储服务创建项目
      const createdProject = await this.storeClient!.projects.create(projectData)

      // 发布项目创建事件
      await this.storeClient!.publishEntityChange({
        entityType: 'project',
        entityId: createdProject.id,
        operation: 'create',
        data: createdProject,
        userId: req.user?.id,
        projectId: createdProject.id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId
        }
      })

      res.success({
        id: createdProject.id,
        name: createdProject.name,
        description: createdProject.description,
        status: createdProject.status,
        canvas_data: createdProject.canvas_data,
        settings: createdProject.settings,
        is_archived: createdProject.is_archived,
        user_id: createdProject.user_id,
        created_at: createdProject.created_at,
        updated_at: createdProject.updated_at,
        last_accessed_at: createdProject.last_accessed_at
      }, 'Project created successfully')

    } catch (error) {
      console.error('创建项目失败:', error)
      res.error({
        code: 'CREATE_PROJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create project',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getProject(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 从数据库获取项目
      const project = await this.storeClient!.projects.findById(id)

      if (!project) {
        res.error({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 更新最后访问时间
      try {
        await this.storeClient!.projects.updateLastAccessed(id)
      } catch (updateError) {
        console.warn('更新项目访问时间失败:', updateError)
      }

      res.success({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        canvas_data: project.canvas_data,
        settings: project.settings,
        is_archived: project.is_archived,
        user_id: project.user_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
        last_accessed_at: project.last_accessed_at
      })
    } catch (error) {
      console.error('获取项目失败:', error)
      res.error({
        code: 'GET_PROJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get project',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async updateProject(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查项目是否存在
      const existingProject = await this.storeClient!.projects.findById(id)
      if (!existingProject) {
        res.error({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 准备更新数据
      const updateData: Partial<ProjectUpdateData> = {}
      const {
        name,
        description,
        status,
        canvas_data,
        settings,
        is_archived
      } = req.body

      if (name !== undefined) updateData.name = name.trim()
      if (description !== undefined) updateData.description = description
      if (status !== undefined) updateData.status = status
      if (canvas_data !== undefined) updateData.canvas_data = canvas_data
      if (settings !== undefined) updateData.settings = settings
      if (is_archived !== undefined) updateData.is_archived = is_archived

      // 更新时间戳
      updateData.updated_at = new Date()

      // 执行更新
      const updatedProject = await this.storeClient!.projects.update(id, updateData)

      if (!updatedProject) {
        res.error({
          code: 'UPDATE_FAILED',
          message: '项目更新失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 发布项目更新事件
      await this.storeClient!.publishEntityChange({
        entityType: 'project',
        entityId: id,
        operation: 'update',
        data: updatedProject,
        oldData: existingProject,
        userId: req.user?.id,
        projectId: id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          changedFields: Object.keys(updateData)
        }
      })

      res.success({
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        canvas_data: updatedProject.canvas_data,
        settings: updatedProject.settings,
        is_archived: updatedProject.is_archived,
        user_id: updatedProject.user_id,
        created_at: updatedProject.created_at,
        updated_at: updatedProject.updated_at,
        last_accessed_at: updatedProject.last_accessed_at
      }, 'Project updated successfully')
    } catch (error) {
      console.error('更新项目失败:', error)
      res.error({
        code: 'UPDATE_PROJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update project',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async deleteProject(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const { permanent = false } = req.query

      if (!id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查项目是否存在
      const existingProject = await this.storeClient!.projects.findById(id)
      if (!existingProject) {
        res.error({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      let result: boolean
      let message: string

      if (permanent === 'true') {
        // 永久删除
        result = await this.storeClient!.projects.delete(id)
        message = 'Project permanently deleted successfully'

        // 发布项目删除事件
        if (result) {
          await this.storeClient!.publishEntityChange({
            entityType: 'project',
            entityId: id,
            operation: 'delete',
            data: null,
            oldData: existingProject,
            userId: req.user?.id,
            projectId: id,
            metadata: {
              source: 'gateway_api',
              requestId: req.requestId,
              permanent: true
            }
          })
        }
      } else {
        // 归档项目（软删除）
        const updatedProject = await this.storeClient!.projects.archive(id)
        result = !!updatedProject
        message = 'Project archived successfully'

        // 发布项目归档事件
        if (result) {
          await this.storeClient!.publishEntityChange({
            entityType: 'project',
            entityId: id,
            operation: 'archive',
            data: updatedProject,
            oldData: existingProject,
            userId: req.user?.id,
            projectId: id,
            metadata: {
              source: 'gateway_api',
              requestId: req.requestId,
              permanent: false
            }
          })
        }
      }

      if (!result) {
        res.error({
          code: 'DELETE_FAILED',
          message: '项目删除失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      res.success(null, message)
    } catch (error) {
      console.error('删除项目失败:', error)
      res.error({
        code: 'DELETE_PROJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete project',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getProjects(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const {
        user_id = req.user?.id,
        status,
        archived,
        search,
        page = 1,
        pageSize = 20,
        sortBy = 'updated_at',
        sortDirection = 'DESC'
      } = req.query as ProjectSearchQuery

      // 构建查询选项
      const options: QueryOptions = {
        limit: Math.min(parseInt(pageSize as string), 100),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: sortBy,
        orderDirection: (sortDirection as string).toUpperCase() as 'ASC' | 'DESC',
        filters: {}
      }

      // 添加过滤条件
      if (user_id) options.filters.user_id = user_id
      if (status) options.filters.status = status
      if (archived !== undefined) {
        options.filters.is_archived = archived === 'true'
      }

      let results, totalCount

      if (search && search.trim()) {
        // 搜索项目
        const allProjects = await this.storeClient!.projects.search(
          search.trim(),
          user_id,
          { filters: options.filters }
        )
        totalCount = allProjects.length
        results = allProjects.slice(options.offset, options.offset + options.limit)
      } else {
        // 分页查询
        const paginatedResult = await this.storeClient!.projects.findWithPagination(options)
        results = paginatedResult.items
        totalCount = paginatedResult.total
      }

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / options.limit)
      const currentPage = parseInt(page)
      const hasNext = currentPage < totalPages
      const hasPrev = currentPage > 1

      // 格式化响应数据
      const formattedResults = results.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        is_archived: project.is_archived,
        user_id: project.user_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
        last_accessed_at: project.last_accessed_at,
        // 不包含 canvas_data 和 settings 以减少响应大小
      }))

      res.success({
        items: formattedResults,
        pagination: {
          total: totalCount,
          page: currentPage,
          pageSize: options.limit,
          totalPages,
          hasNext,
          hasPrev
        },
        filters: {
          user_id,
          status,
          archived,
          search
        },
        sort: {
          by: options.orderBy,
          direction: options.orderDirection
        }
      })
    } catch (error) {
      console.error('获取项目列表失败:', error)
      res.error({
        code: 'GET_PROJECTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get projects',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async saveCanvasState(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const canvasData = req.body

      if (!id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!canvasData) {
        res.error({
          code: 'MISSING_CANVAS_DATA',
          message: '缺少画布数据',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查项目是否存在
      const existingProject = await this.storeClient!.projects.findById(id)
      if (!existingProject) {
        res.error({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 更新画布数据
      const updatedProject = await this.storeClient!.projects.update(id, {
        canvas_data: canvasData,
        updated_at: new Date()
      })

      if (!updatedProject) {
        res.error({
          code: 'SAVE_CANVAS_FAILED',
          message: '保存画布状态失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 发布画布状态更新事件
      await this.storeClient!.publishEntityChange({
        entityType: 'project',
        entityId: id,
        operation: 'canvas_update',
        data: { canvas_data: canvasData },
        oldData: { canvas_data: existingProject.canvas_data },
        userId: req.user?.id,
        projectId: id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          updateType: 'canvas_state'
        }
      })

      res.success({
        saved_at: updatedProject.updated_at,
        version: updatedProject.updated_at.getTime() // 简单版本号
      }, 'Canvas state saved successfully')

    } catch (error) {
      console.error('保存画布状态失败:', error)
      res.error({
        code: 'SAVE_CANVAS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save canvas state',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getCanvasState(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 获取项目信息
      const project = await this.storeClient!.projects.findById(id)
      if (!project) {
        res.error({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 返回画布数据
      const canvasData = project.canvas_data || {
        viewport: { x: 0, y: 0, zoom: 1 },
        displayMode: 'preview',
        filters: {},
        nodes: [],
        connections: []
      }

      res.success({
        ...canvasData,
        metadata: {
          project_id: id,
          last_updated: project.updated_at,
          version: project.updated_at.getTime()
        }
      })

    } catch (error) {
      console.error('获取画布状态失败:', error)
      res.error({
        code: 'GET_CANVAS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get canvas state',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }
}