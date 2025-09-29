import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes'
import {
  NodeSearchQuery,
  ProjectSearchQuery,
  NodeVersionQuery,
  DeleteQuery,
  NodeCreateData,
  NodeUpdateData,
  ProjectCreateData,
  ProjectUpdateData,
  LoginRequest,
  ProfileUpdateRequest,
  RefreshTokenRequest,
  JWTPayload,
  RefreshTokenPayload,
  BatchGenerateRequest,
  NodeRollbackRequest,
  QueryOptions,
  RouteHandler,
  RouteMap,
  AIConfig
} from '../types/SpecificTypes'
import { ResponseMapper } from '../adapters/ResponseMapper'
import { QueueManager } from '../messaging/QueueManager'
import { AIEngine } from '@sker/engine'
import { StoreService } from '@sker/store'
import type { ImportanceLevel } from '@sker/models'

/**
 * API路由器 - 管理所有API端点的路由
 */
export class ApiRouter {
  private router: Router
  private routes: RouteMap = new Map()
  private aiEngine?: AIEngine
  private storeService?: StoreService
  private queueManager?: QueueManager

  constructor(dependencies?: {
    aiEngine?: AIEngine
    storeService?: StoreService
    queueManager?: QueueManager
  }) {
    this.router = Router()
    this.aiEngine = dependencies?.aiEngine
    this.storeService = dependencies?.storeService
    this.queueManager = dependencies?.queueManager
    this.setupRoutes()
  }

  /**
   * 设置基础路由
   */
  private setupRoutes(): void {
    // 节点管理路由
    this.setupNodeRoutes()

    // AI服务路由
    this.setupAIRoutes()

    // 项目管理路由
    this.setupProjectRoutes()

    // 用户管理路由
    this.setupUserRoutes()
  }

  /**
   * 设置节点管理路由
   */
  private setupNodeRoutes(): void {
    const nodeRouter = Router()

    // 创建节点
    nodeRouter.post('/', this.createNode.bind(this))

    // 获取节点
    nodeRouter.get('/:id', this.getNode.bind(this))

    // 更新节点
    nodeRouter.put('/:id', this.updateNode.bind(this))

    // 删除节点
    nodeRouter.delete('/:id', this.deleteNode.bind(this))

    // 搜索节点
    nodeRouter.get('/', this.searchNodes.bind(this))

    // 优化节点内容
    nodeRouter.post('/:id/optimize', this.optimizeNode.bind(this))

    // 节点版本管理
    nodeRouter.get('/:id/versions', this.getNodeVersions.bind(this))
    nodeRouter.post('/:id/rollback', this.rollbackNode.bind(this))

    this.router.use('/nodes', nodeRouter)
  }

  /**
   * 设置AI服务路由
   */
  private setupAIRoutes(): void {
    const aiRouter = Router()

    // 生成内容
    aiRouter.post('/generate', this.generateContent.bind(this))

    // 优化内容
    aiRouter.post('/optimize', this.optimizeContent.bind(this))

    // 融合内容
    aiRouter.post('/fusion', this.fusionContent.bind(this))

    // 健康检查
    aiRouter.get('/health', this.checkAIHealth.bind(this))

    // 获取可用模型
    aiRouter.get('/models', this.getAvailableModels.bind(this))

    // 批量处理
    aiRouter.post('/batch-generate', this.batchGenerate.bind(this))

    this.router.use('/ai', aiRouter)
  }

  /**
   * 设置项目管理路由
   */
  private setupProjectRoutes(): void {
    const projectRouter = Router()

    // 创建项目
    projectRouter.post('/', this.createProject.bind(this))

    // 获取项目
    projectRouter.get('/:id', this.getProject.bind(this))

    // 更新项目
    projectRouter.put('/:id', this.updateProject.bind(this))

    // 删除项目
    projectRouter.delete('/:id', this.deleteProject.bind(this))

    // 获取项目列表
    projectRouter.get('/', this.getProjects.bind(this))

    // 保存画布状态
    projectRouter.post('/:id/canvas-state', this.saveCanvasState.bind(this))

    // 获取画布状态
    projectRouter.get('/:id/canvas-state', this.getCanvasState.bind(this))

    this.router.use('/projects', projectRouter)
  }

  /**
   * 设置用户管理路由
   */
  private setupUserRoutes(): void {
    const userRouter = Router()

    // 用户认证
    userRouter.post('/auth/login', this.login.bind(this))
    userRouter.post('/auth/logout', this.logout.bind(this))
    userRouter.post('/auth/refresh', this.refreshToken.bind(this))

    // 用户资料
    userRouter.get('/profile', this.getProfile.bind(this))
    userRouter.put('/profile', this.updateProfile.bind(this))

    this.router.use('/users', userRouter)
  }

  // =================
  // 节点管理处理器
  // =================

  private async createNode(req: ApiRequest<NodeCreateData>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const {
        title,
        content,
        project_id,
        parent_id,
        type = 'text',
        position,
        importance = 50,
        tags,
        metadata
      } = req.body

      // 验证必需字段
      if (!title && !content) {
        res.error({
          code: 'MISSING_REQUIRED_FIELDS',
          message: '标题和内容至少需要提供一个',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!project_id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的 project_id 参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 创建节点数据
      const nodeData = {
        title: title || content?.substring(0, 50) + '...',
        content: content || '',
        project_id,
        user_id: req.user?.id || 'anonymous',
        parent_id: parent_id || null,
        type,
        position: position || { x: 0, y: 0 },
        importance: Math.max(1, Math.min(5, Math.round(importance / 20))) as ImportanceLevel,
        tags: tags || [],
        status: 'active',
        confidence: 100,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          ...metadata
        }
      }

      // 使用存储服务创建节点
      const createdNode = await this.storeService.nodes.create(nodeData)

      // 发布节点创建事件
      await this.storeService.publishEntityChange({
        entityType: 'node',
        entityId: createdNode.id,
        operation: 'create',
        data: createdNode,
        userId: req.user?.id,
        projectId: project_id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId
        }
      })

      res.success({
        id: createdNode.id,
        title: createdNode.title,
        content: createdNode.content,
        type: createdNode.type,
        position: createdNode.position,
        importance: createdNode.importance,
        tags: createdNode.tags,
        confidence: createdNode.confidence,
        status: createdNode.status,
        project_id: createdNode.project_id,
        parent_id: createdNode.parent_id,
        created_at: createdNode.created_at,
        updated_at: createdNode.updated_at
      }, 'Node created successfully')
    } catch (error) {
      console.error('创建节点失败:', error)
      res.error({
        code: 'CREATE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 从数据库获取节点
      const node = await this.storeService.nodes.findById(id)

      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查用户访问权限（如果有用户信息）
      if (req.user?.id && node.user_id !== req.user.id) {
        // 可以在这里添加更复杂的权限检查逻辑
        // 比如检查项目协作者权限等
      }

      res.success({
        id: node.id,
        title: node.title,
        content: node.content,
        type: node.type,
        position: node.position,
        importance: node.importance,
        tags: node.tags,
        confidence: node.confidence,
        status: node.status,
        project_id: node.project_id,
        parent_id: node.parent_id,
        user_id: node.user_id,
        created_at: node.created_at,
        updated_at: node.updated_at,
        metadata: node.metadata
      })
    } catch (error) {
      console.error('获取节点失败:', error)
      res.error({
        code: 'GET_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async updateNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const existingNode = await this.storeService.nodes.findById(id)
      if (!existingNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 准备更新数据
      const updateData: Partial<NodeUpdateData> = {}
      const {
        title,
        content,
        type,
        position,
        importance,
        tags,
        status,
        metadata
      } = req.body

      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
      if (type !== undefined) updateData.type = type
      if (position !== undefined) updateData.position = position
      if (importance !== undefined) {
        updateData.importance = Math.max(0, Math.min(100, importance))
      }
      if (tags !== undefined) updateData.tags = tags
      if (status !== undefined) updateData.status = status
      if (metadata !== undefined) {
        updateData.metadata = {
          ...existingNode.metadata,
          ...metadata,
          lastModified: {
            source: 'gateway_api',
            requestId: req.requestId,
            timestamp: new Date()
          }
        }
      }

      // 更新时间戳
      updateData.updated_at = new Date()

      // 执行更新
      const updatedNode = await this.storeService.nodes.update(id, updateData)

      if (!updatedNode) {
        res.error({
          code: 'UPDATE_FAILED',
          message: '节点更新失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 发布节点更新事件
      await this.storeService.publishEntityChange({
        entityType: 'node',
        entityId: id,
        operation: 'update',
        data: updatedNode,
        oldData: existingNode,
        userId: req.user?.id,
        projectId: updatedNode.project_id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          changedFields: Object.keys(updateData)
        }
      })

      res.success({
        id: updatedNode.id,
        title: updatedNode.title,
        content: updatedNode.content,
        type: updatedNode.type,
        position: updatedNode.position,
        importance: updatedNode.importance,
        tags: updatedNode.tags,
        confidence: updatedNode.confidence,
        status: updatedNode.status,
        project_id: updatedNode.project_id,
        parent_id: updatedNode.parent_id,
        user_id: updatedNode.user_id,
        created_at: updatedNode.created_at,
        updated_at: updatedNode.updated_at,
        metadata: updatedNode.metadata
      }, 'Node updated successfully')
    } catch (error) {
      console.error('更新节点失败:', error)
      res.error({
        code: 'UPDATE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async deleteNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { id } = req.params
      const { permanent = false } = req.query

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const existingNode = await this.storeService.nodes.findById(id)
      if (!existingNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      let result: boolean
      let message: string

      if (permanent === 'true') {
        // 永久删除
        result = await this.storeService.nodes.delete(id)
        message = 'Node permanently deleted successfully'

        // 发布节点删除事件
        if (result) {
          await this.storeService.publishEntityChange({
            entityType: 'node',
            entityId: id,
            operation: 'delete',
            data: null,
            oldData: existingNode,
            userId: req.user?.id,
            projectId: existingNode.project_id,
            metadata: {
              source: 'gateway_api',
              requestId: req.requestId,
              permanent: true
            }
          })
        }
      } else {
        // 软删除（标记为删除状态）
        const updatedNode = await this.storeService.nodes.update(id, {
          status: 'deleted',
          updated_at: new Date(),
          metadata: {
            ...existingNode.metadata,
            deletedAt: new Date(),
            deletedBy: req.user?.id,
            deletedFrom: 'gateway_api',
            requestId: req.requestId
          }
        })

        result = !!updatedNode
        message = 'Node moved to trash successfully'

        // 发布节点软删除事件
        if (result) {
          await this.storeService.publishEntityChange({
            entityType: 'node',
            entityId: id,
            operation: 'soft_delete',
            data: updatedNode,
            oldData: existingNode,
            userId: req.user?.id,
            projectId: existingNode.project_id,
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
          message: '节点删除失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      res.success(null, message)
    } catch (error) {
      console.error('删除节点失败:', error)
      res.error({
        code: 'DELETE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async searchNodes(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const {
        q: query = '',
        project_id,
        user_id,
        type,
        status,
        tags,
        importance_min,
        importance_max,
        page = 1,
        pageSize = 20,
        sortBy = 'updated_at',
        sortDirection = 'DESC'
      } = req.query as NodeSearchQuery

      // 构建查询选项
      const options: QueryOptions = {
        limit: Math.min(parseInt(pageSize as string), 100), // 限制最大页面大小
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: sortBy,
        orderDirection: (sortDirection as string).toUpperCase() as 'ASC' | 'DESC',
        filters: {}
      }

      // 添加过滤条件
      if (project_id) options.filters.project_id = project_id
      if (user_id) options.filters.user_id = user_id
      if (type) options.filters.type = type
      if (status) {
        options.filters.status = status
      } else {
        // 默认排除已删除的节点
        options.filters.status = ['active', 'draft', 'archived']
      }
      if (importance_min) options.filters.importance_min = parseInt(importance_min)
      if (importance_max) options.filters.importance_max = parseInt(importance_max)

      let results, totalCount

      if (query && query.trim()) {
        // 如果有搜索查询，使用搜索方法
        if (tags) {
          // 如果指定了标签，使用标签搜索
          const tagArray = Array.isArray(tags) ? tags : [tags]
          results = await this.storeService.nodes.findByTags(tagArray, options)
          // 对于标签搜索，需要单独查询总数
          const allResults = await this.storeService.nodes.findByTags(tagArray, {
            ...options,
            limit: undefined,
            offset: undefined
          })
          totalCount = allResults.length
        } else {
          // 全文搜索（需要实现搜索方法）
          // 这里使用通用查询，然后在应用层过滤
          const allNodes = await this.storeService.nodes.findMany({
            filters: options.filters,
            orderBy: options.orderBy,
            orderDirection: options.orderDirection
          })

          // 在应用层进行文本搜索
          const filteredNodes = allNodes.filter(node => {
            const searchText = query.toLowerCase()
            return (
              node.title?.toLowerCase().includes(searchText) ||
              node.content?.toLowerCase().includes(searchText) ||
              node.tags?.some(tag => tag.toLowerCase().includes(searchText))
            )
          })

          totalCount = filteredNodes.length
          results = filteredNodes.slice(options.offset, options.offset + options.limit)
        }
      } else {
        // 无搜索查询，使用分页查询
        if (tags) {
          const tagArray = Array.isArray(tags) ? tags : [tags]
          results = await this.storeService.nodes.findByTags(tagArray, options)
          const allResults = await this.storeService.nodes.findByTags(tagArray, {
            ...options,
            limit: undefined,
            offset: undefined
          })
          totalCount = allResults.length
        } else {
          const paginatedResult = await this.storeService.nodes.findWithPagination(options)
          results = paginatedResult.items
          totalCount = paginatedResult.total
        }
      }

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / options.limit)
      const currentPage = parseInt(page)
      const hasNext = currentPage < totalPages
      const hasPrev = currentPage > 1

      // 格式化响应数据
      const formattedResults = results.map((node: {
        id: string;
        title: string;
        content: string;
        type: string;
        position: { x: number; y: number };
        importance: number;
        tags: string[];
        confidence: number;
        status: string;
        project_id: string;
        parent_id?: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
      }) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        type: node.type,
        position: node.position,
        importance: node.importance,
        tags: node.tags,
        confidence: node.confidence,
        status: node.status,
        project_id: node.project_id,
        parent_id: node.parent_id,
        user_id: node.user_id,
        created_at: node.created_at,
        updated_at: node.updated_at
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
          query,
          project_id,
          user_id,
          type,
          status,
          tags,
          importance_range: importance_min || importance_max ? {
            min: importance_min,
            max: importance_max
          } : null
        },
        sort: {
          by: options.orderBy,
          direction: options.orderDirection
        }
      })
    } catch (error) {
      console.error('搜索节点失败:', error)
      res.error({
        code: 'SEARCH_NODES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search nodes',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async optimizeNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const { id } = req.params
      const { instruction, model } = req.body

      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!this.aiEngine) {
        res.error({
          code: 'AI_ENGINE_UNAVAILABLE',
          message: 'AI 引擎服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 获取节点数据
      const node = await this.storeService.nodes.findById(id)
      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 使用AI引擎优化节点内容
      const result = await this.aiEngine.optimizeContent({
        content: node.content,
        instruction: instruction || '请优化这个节点的内容，使其更清晰、准确和有条理',
        model: model || 'gpt-4',
        userId: req.user?.id,
        projectId: node.project_id,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api',
          nodeId: id
        }
      })

      // 更新节点内容
      const updatedNode = await this.storeService.nodes.update(id, {
        content: result.content,
        title: result.title || node.title,
        updated_at: new Date()
      })

      // 发布节点变更事件
      await this.storeService.publishEntityChange({
        entityType: 'node',
        entityId: id,
        operation: 'update',
        data: updatedNode,
        oldData: node,
        userId: req.user?.id,
        projectId: node.project_id,
        metadata: {
          optimized: true,
          aiModel: result.metadata.model,
          improvements: result.improvements
        }
      })

      res.success({
        id,
        content: result.content,
        title: result.title,
        confidence: result.confidence,
        improvements: result.improvements,
        metadata: {
          requestId: req.requestId,
          model: result.metadata.model,
          processingTime: result.metadata.processingTime,
          tokenCount: result.metadata.tokenCount
        }
      }, 'Node optimized successfully')
    } catch (error) {
      res.error({
        code: 'OPTIMIZE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to optimize node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getNodeVersions(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { id } = req.params
      const { limit = 10, offset = 0, include_content = false } = req.query as NodeVersionQuery

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const node = await this.storeService.nodes.findById(id)
      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 获取节点版本历史
      // 由于 NodeRepository 可能没有版本管理方法，我们需要通过数据库查询
      const versionsQuery = `
        SELECT
          id,
          version_number,
          title,
          ${include_content === 'true' ? 'content,' : ''}
          change_description,
          created_by,
          created_at,
          metadata
        FROM node_versions
        WHERE node_id = $1
        ORDER BY version_number DESC
        LIMIT $2 OFFSET $3
      `

      const totalQuery = `
        SELECT COUNT(*) as total
        FROM node_versions
        WHERE node_id = $1
      `

      try {
        // 通过存储服务的数据库连接执行查询
        const pool = (this.storeService as { nodeRepo?: { pool?: unknown } }).nodeRepo?.pool
        if (!pool) {
          throw new Error('Database connection not available')
        }

        const [versionsResult, totalResult] = await Promise.all([
          pool.query(versionsQuery, [id, parseInt(limit), parseInt(offset)]),
          pool.query(totalQuery, [id])
        ])

        const versions = versionsResult.rows
        const total = parseInt(totalResult.rows[0]?.total || '0')

        // 格式化版本数据
        const formattedVersions = versions.map((version: {
          id: string;
          version_number: number;
          title: string;
          content?: string;
          change_description: string;
          created_by: string;
          created_at: Date;
          metadata: Record<string, unknown>;
        }) => ({
          id: version.id,
          version_number: version.version_number,
          title: version.title,
          content: version.content || undefined,
          change_description: version.change_description,
          created_by: version.created_by,
          created_at: version.created_at,
          metadata: version.metadata,
          is_current: version.version_number === 1 // 最新版本
        }))

        res.success({
          node_id: id,
          versions: formattedVersions,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: total > parseInt(offset) + formattedVersions.length
          },
          current_version: formattedVersions.find(v => v.is_current)?.version_number || 1
        })

      } catch (dbError) {
        // 如果版本表不存在或查询失败，返回空结果
        console.warn('Node versions table may not exist:', dbError)
        res.success({
          node_id: id,
          versions: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: false
          },
          current_version: 1,
          note: '版本管理功能暂未完全启用，当前显示基础信息'
        })
      }

    } catch (error) {
      console.error('获取节点版本失败:', error)
      res.error({
        code: 'GET_VERSIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get node versions',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async rollbackNode(req: ApiRequest<NodeRollbackRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { id } = req.params
      const { version_number, change_description } = req.body

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!version_number) {
        res.error({
          code: 'MISSING_VERSION_NUMBER',
          message: '缺少必需的版本号参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const currentNode = await this.storeService.nodes.findById(id)
      if (!currentNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 获取指定版本的数据
        const pool = (this.storeService as { nodeRepo?: { pool?: unknown } }).nodeRepo?.pool
        if (!pool) {
          throw new Error('Database connection not available')
        }

        const versionQuery = `
          SELECT
            title,
            content,
            type,
            position,
            importance,
            tags,
            metadata
          FROM node_versions
          WHERE node_id = $1 AND version_number = $2
        `

        const versionResult = await pool.query(versionQuery, [id, version_number])

        if (versionResult.rows.length === 0) {
          res.error({
            code: 'VERSION_NOT_FOUND',
            message: `版本 ${version_number} 不存在`,
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        const versionData = versionResult.rows[0]

        // 创建新版本记录（保存当前状态）
        const createVersionQuery = `
          INSERT INTO node_versions (
            node_id, version_number, title, content, type, position,
            importance, tags, change_description, created_by, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `

        // 获取下一个版本号
        const maxVersionQuery = `
          SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
          FROM node_versions
          WHERE node_id = $1
        `
        const maxVersionResult = await pool.query(maxVersionQuery, [id])
        const nextVersion = maxVersionResult.rows[0].next_version

        // 保存当前状态作为新版本
        await pool.query(createVersionQuery, [
          id,
          nextVersion,
          currentNode.title,
          currentNode.content,
          currentNode.type,
          JSON.stringify(currentNode.position),
          currentNode.importance,
          JSON.stringify(currentNode.tags),
          `Backup before rollback to version ${version_number}`,
          req.user?.id || 'system',
          JSON.stringify({
            ...currentNode.metadata,
            rollback_backup: true,
            rollback_target_version: version_number
          })
        ])

        // 更新节点为指定版本的数据
        const updateData = {
          title: versionData.title,
          content: versionData.content,
          type: versionData.type,
          position: JSON.parse(versionData.position || '{}'),
          importance: versionData.importance,
          tags: JSON.parse(versionData.tags || '[]'),
          updated_at: new Date(),
          metadata: {
            ...JSON.parse(versionData.metadata || '{}'),
            rollback: {
              from_version: nextVersion,
              to_version: version_number,
              rollback_date: new Date(),
              rollback_by: req.user?.id,
              change_description: change_description || `Rolled back to version ${version_number}`,
              requestId: req.requestId
            }
          }
        }

        const updatedNode = await this.storeService.nodes.update(id, updateData)

        if (!updatedNode) {
          res.error({
            code: 'ROLLBACK_FAILED',
            message: '节点回滚失败',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 发布节点回滚事件
        await this.storeService.publishEntityChange({
          entityType: 'node',
          entityId: id,
          operation: 'rollback',
          data: updatedNode,
          oldData: currentNode,
          userId: req.user?.id,
          projectId: updatedNode.project_id,
          metadata: {
            source: 'gateway_api',
            requestId: req.requestId,
            rollback_from_version: nextVersion,
            rollback_to_version: version_number,
            change_description: change_description
          }
        })

        res.success({
          id: updatedNode.id,
          title: updatedNode.title,
          content: updatedNode.content,
          type: updatedNode.type,
          position: updatedNode.position,
          importance: updatedNode.importance,
          tags: updatedNode.tags,
          updated_at: updatedNode.updated_at,
          rollback_info: {
            from_version: nextVersion,
            to_version: version_number,
            backup_version: nextVersion,
            change_description: change_description || `Rolled back to version ${version_number}`
          }
        }, `Node successfully rolled back to version ${version_number}`)

      } catch (dbError) {
        console.error('数据库操作失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '版本管理功能暂不可用，请稍后再试',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('节点回滚失败:', error)
      res.error({
        code: 'ROLLBACK_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to rollback node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  // =================
  // AI服务处理器
  // =================

  private async generateContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.generateContentDirect(req, res)
      }

      const { inputs, context, instruction, type = 'generate' } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的inputs参数' },
          req.requestId
        ))
        return
      }

      // 创建AI任务
      const taskId = this.generateTaskId()
      const aiTask = {
        taskId,
        type,
        priority: 'normal',
        userId,
        projectId,
        data: {
          inputs,
          context,
          instruction,
          type
        },
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api'
        },
        timestamp: new Date()
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID，客户端通过WebSocket接收结果
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued',
          message: '任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('生成内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async optimizeContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.optimizeContentDirect(req, res)
      }

      const { content, instruction } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!content) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的content参数' },
          req.requestId
        ))
        return
      }

      // 创建AI优化任务
      const taskId = this.generateTaskId()
      const aiTask = {
        taskId,
        type: 'optimize',
        priority: 'normal',
        userId,
        projectId,
        data: {
          inputs: [content],
          instruction: instruction || '请优化这段内容，使其更清晰、准确和有条理',
          type: 'optimize'
        },
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api'
        },
        timestamp: new Date()
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued',
          message: '优化任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI优化任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('优化内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async fusionContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.fusionContentDirect(req, res)
      }

      const { inputs, instruction } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        res.error(ResponseMapper.toAPIError(
          { message: '融合功能需要至少2个输入内容' },
          req.requestId
        ))
        return
      }

      // 创建AI融合任务
      const taskId = this.generateTaskId()
      const aiTask = {
        taskId,
        type: 'fusion',
        priority: 'high', // 融合任务优先级较高
        userId,
        projectId,
        data: {
          inputs,
          instruction: instruction || '请将这些内容融合成一个统一、连贯的内容',
          type: 'fusion'
        },
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api',
          inputCount: inputs.length
        },
        timestamp: new Date()
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued',
          inputCount: inputs.length,
          message: '融合任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI融合任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('融合内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async checkAIHealth(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.success({
          status: 'unavailable',
          message: 'AI 引擎服务未初始化',
          uptime: process.uptime()
        })
        return
      }

      const health = await this.aiEngine.getHealthStatus()
      res.success({
        status: health.status,
        models: health.availableProviders,
        statistics: health.statistics,
        uptime: process.uptime(),
        lastCheck: health.timestamp
      })
    } catch (error) {
      res.error({
        code: 'AI_HEALTH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check AI health',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getAvailableModels(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.success([])
        return
      }

      const config = this.aiEngine.getConfiguration()
      const providers = config.providers || {}
      const models: string[] = []

      // 从配置中提取可用模型
      Object.values(providers).forEach((provider: Record<string, unknown>) => {
        if (provider.models && Array.isArray(provider.models)) {
          models.push(...(provider.models as string[]))
        }
      })

      res.success(models.length > 0 ? models : ['gpt-4', 'gpt-3.5-turbo'])
    } catch (error) {
      res.error({
        code: 'GET_MODELS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get available models',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async batchGenerate(req: ApiRequest<BatchGenerateRequest>, res: ApiResponse): Promise<void> {
    try {
      const { requests, options = {} } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      // 验证批量请求数据
      if (!requests || !Array.isArray(requests) || requests.length === 0) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的requests参数或requests为空数组' },
          req.requestId
        ))
        return
      }

      // 限制批量请求数量
      const maxBatchSize = options.maxBatchSize || 10
      if (requests.length > maxBatchSize) {
        res.error(ResponseMapper.toAPIError(
          { message: `批量请求数量不能超过${maxBatchSize}个` },
          req.requestId
        ))
        return
      }

      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.batchGenerateDirect(req, res)
      }

      // 创建批量任务
      const batchTaskId = this.generateTaskId()
      const batchTask = {
        taskId: batchTaskId,
        type: 'batch_processing',
        priority: options.priority || 'normal',
        userId,
        projectId,
        data: {
          requests,
          options: {
            parallel: options.parallel !== false, // 默认并行处理
            failFast: options.failFast === true, // 默认不快速失败
            maxConcurrency: Math.min(options.maxConcurrency || 3, requests.length)
          }
        },
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_batch',
          batchSize: requests.length
        },
        timestamp: new Date()
      }

      // 发布批量任务到队列
      await this.queueManager.publishAITask(batchTask)

      // 返回批量任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          batchTaskId,
          status: 'queued',
          batchSize: requests.length,
          estimatedTime: requests.length * 2, // 估算处理时间（秒）
          message: '批量任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI批量任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('批量生成内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  // =================
  // 项目管理处理器
  // =================

  private async createProject(req: ApiRequest<ProjectCreateData>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const createdProject = await this.storeService.projects.create(projectData)

      // 发布项目创建事件
      await this.storeService.publishEntityChange({
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const project = await this.storeService.projects.findById(id)

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
        await this.storeService.projects.updateLastAccessed(id)
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const existingProject = await this.storeService.projects.findById(id)
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
      const updatedProject = await this.storeService.projects.update(id, updateData)

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
      await this.storeService.publishEntityChange({
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const existingProject = await this.storeService.projects.findById(id)
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
        result = await this.storeService.projects.delete(id)
        message = 'Project permanently deleted successfully'

        // 发布项目删除事件
        if (result) {
          await this.storeService.publishEntityChange({
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
        const updatedProject = await this.storeService.projects.archive(id)
        result = !!updatedProject
        message = 'Project archived successfully'

        // 发布项目归档事件
        if (result) {
          await this.storeService.publishEntityChange({
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
        const allProjects = await this.storeService.projects.search(
          search.trim(),
          user_id,
          { filters: options.filters }
        )
        totalCount = allProjects.length
        results = allProjects.slice(options.offset, options.offset + options.limit)
      } else {
        // 分页查询
        const paginatedResult = await this.storeService.projects.findWithPagination(options)
        results = paginatedResult.items
        totalCount = paginatedResult.total
      }

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / options.limit)
      const currentPage = parseInt(page)
      const hasNext = currentPage < totalPages
      const hasPrev = currentPage > 1

      // 格式化响应数据
      const formattedResults = results.map((project: {
        id: string;
        name: string;
        description: string;
        status: string;
        is_archived: boolean;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        last_accessed_at: Date;
      }) => ({
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const existingProject = await this.storeService.projects.findById(id)
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
      const updatedProject = await this.storeService.projects.update(id, {
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
      await this.storeService.publishEntityChange({
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
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

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
      const project = await this.storeService.projects.findById(id)
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

  // =================
  // 用户管理处理器
  // =================

  private async login(req: ApiRequest<LoginRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { email, password } = req.body

      // 验证输入
      if (!email || !password) {
        res.error({
          code: 'MISSING_CREDENTIALS',
          message: '缺少邮箱或密码',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 查找用户
        const user = await this.storeService.users.findByEmail(email.toLowerCase().trim())
        if (!user) {
          res.error({
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 验证密码（简化版，实际应使用 bcrypt）
        const isPasswordValid = await this.verifyPassword(password, user.password_hash)
        if (!isPasswordValid) {
          res.error({
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 检查用户状态
        if (user.status !== 'active') {
          res.error({
            code: 'ACCOUNT_DISABLED',
            message: '账户已禁用，请联系管理员',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成JWT Token（简化版）
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }

        const token = this.generateJWTToken(tokenPayload)
        const refreshToken = this.generateRefreshToken(user.id)

        // 更新用户最后登录时间
        await this.storeService.users.update(user.id, {
          last_login_at: new Date(),
          login_count: (user.login_count || 0) + 1
        })

        // 记录登录日志
        console.log(`User login successful: ${user.email} (${user.id})`)

        res.success({
          token,
          refresh_token: refreshToken,
          expires_in: 86400, // 24小时（秒）
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            created_at: user.created_at,
            last_login_at: new Date()
          }
        }, 'Login successful')

      } catch (dbError) {
        console.error('数据库查询失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '登录服务暂时不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('登录失败:', error)
      res.error({
        code: 'LOGIN_ERROR',
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async logout(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const userId = req.user?.id

      // 记录登出日志
      if (userId) {
        console.log(`User logout: ${req.user?.email} (${userId})`)

        // 可以在这里添加token黑名单逻辑
        // 或者更新用户最后活动时间
        if (this.storeService) {
          try {
            await this.storeService.users.update(userId, {
              last_logout_at: new Date()
            })
          } catch (updateError) {
            console.warn('更新用户登出时间失败:', updateError)
          }
        }
      }

      res.success({
        message: '登出成功',
        logout_at: new Date()
      }, 'Logout successful')
    } catch (error) {
      console.error('登出失败:', error)
      res.error({
        code: 'LOGOUT_ERROR',
        message: error instanceof Error ? error.message : 'Logout failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async refreshToken(req: ApiRequest<RefreshTokenRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const { refresh_token } = req.body

      if (!refresh_token) {
        res.error({
          code: 'MISSING_REFRESH_TOKEN',
          message: '缺少刷新令牌',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 验证刷新令牌（简化版）
        const tokenData = this.verifyRefreshToken(refresh_token)
        if (!tokenData || !tokenData.userId) {
          res.error({
            code: 'INVALID_REFRESH_TOKEN',
            message: '刷新令牌无效',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 获取用户信息
        const user = await this.storeService.users.findById(tokenData.userId)
        if (!user || user.status !== 'active') {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在或已禁用',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 生成新的JWT Token
        const newTokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        }

        const newToken = this.generateJWTToken(newTokenPayload)
        const newRefreshToken = this.generateRefreshToken(user.id)

        res.success({
          token: newToken,
          refresh_token: newRefreshToken,
          expires_in: 86400, // 24小时（秒）
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, 'Token refreshed successfully')

      } catch (tokenError) {
        console.error('令牌刷新失败:', tokenError)
        res.error({
          code: 'TOKEN_VERIFICATION_FAILED',
          message: '令牌验证失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('刷新令牌失败:', error)
      res.error({
        code: 'REFRESH_TOKEN_ERROR',
        message: error instanceof Error ? error.message : 'Token refresh failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getProfile(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const userId = req.user?.id
      if (!userId) {
        res.error({
          code: 'USER_NOT_AUTHENTICATED',
          message: '用户未认证',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 从数据库获取完整的用户信息
        const user = await this.storeService.users.findById(userId)
        if (!user) {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        res.success({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          preferences: user.preferences,
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at,
          login_count: user.login_count,
          // 不返回敏感信息如密码哈希
        })
      } catch (dbError) {
        console.error('获取用户信息失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '获取用户信息失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      res.error({
        code: 'GET_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get profile',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async updateProfile(req: ApiRequest<ProfileUpdateRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.storeService) {
        res.error({
          code: 'STORE_SERVICE_UNAVAILABLE',
          message: '存储服务不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const userId = req.user?.id
      if (!userId) {
        res.error({
          code: 'USER_NOT_AUTHENTICATED',
          message: '用户未认证',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 检查用户是否存在
        const existingUser = await this.storeService.users.findById(userId)
        if (!existingUser) {
          res.error({
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 准备更新数据（只允许更新某些字段）
        const updateData: Record<string, unknown> = {}
        const {
          name,
          bio,
          avatar,
          preferences,
          current_password,
          new_password
        } = req.body

        if (name !== undefined) updateData.name = name.trim()
        if (bio !== undefined) updateData.bio = bio
        if (avatar !== undefined) updateData.avatar = avatar
        if (preferences !== undefined) updateData.preferences = preferences

        // 密码更新逻辑
        if (current_password && new_password) {
          const isCurrentPasswordValid = await this.verifyPassword(
            current_password,
            existingUser.password_hash
          )

          if (!isCurrentPasswordValid) {
            res.error({
              code: 'INVALID_CURRENT_PASSWORD',
              message: '当前密码不正确',
              timestamp: new Date(),
              requestId: req.requestId
            })
            return
          }

          // 简化实现：实际应使用bcrypt哈希
          updateData.password_hash = new_password // 应该哈希处理
        }

        // 更新时间戳
        updateData.updated_at = new Date()

        // 执行更新
        const updatedUser = await this.storeService.users.update(userId, updateData)

        if (!updatedUser) {
          res.error({
            code: 'UPDATE_FAILED',
            message: '用户资料更新失败',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 发布用户更新事件
        await this.storeService.publishEntityChange({
          entityType: 'user',
          entityId: userId,
          operation: 'update',
          data: {
            // 不记录敏感信息
            id: updatedUser.id,
            name: updatedUser.name,
            bio: updatedUser.bio,
            avatar: updatedUser.avatar
          },
          oldData: {
            name: existingUser.name,
            bio: existingUser.bio,
            avatar: existingUser.avatar
          },
          userId,
          metadata: {
            source: 'gateway_api',
            requestId: req.requestId,
            changedFields: Object.keys(updateData)
          }
        })

        // 返回更新后的用户信息（不包含密码）
        res.success({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          preferences: updatedUser.preferences,
          updated_at: updatedUser.updated_at
        }, 'Profile updated successfully')

      } catch (dbError) {
        console.error('更新用户资料失败:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '更新用户资料失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      res.error({
        code: 'UPDATE_PROFILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update profile',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取Express路由器实例
   */
  getRouter(): Router {
    return this.router
  }

  /**
   * 添加自定义路由
   */
  addRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler)
    this.router.use(path, handler)
  }

  /**
   * 获取已注册的路由
   */
  getRoutes(): RouteMap {
    return this.routes
  }

  /**
   * 直接调用AI引擎生成内容（回退方案）
   */
  private async generateContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.error(ResponseMapper.toAPIError(
          { message: 'AI引擎和队列管理器都不可用' },
          req.requestId
        ))
        return
      }

      const { prompt, model, maxTokens, temperature, userId, projectId } = req.body

      const result = await this.aiEngine.generateContent({
        prompt,
        model: model || 'gpt-4',
        maxTokens: maxTokens || 2000,
        temperature: temperature || 0.7,
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        mappedResult,
        'AI内容生成成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证密码（简化版，实际应使用bcrypt）
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // 这里是简化实现，实际生产环境应使用bcrypt
      // const bcrypt = require('bcrypt')
      // return await bcrypt.compare(plainPassword, hashedPassword)

      // 临时简化实现：假设密码就是明文存储（仅用于演示）
      return plainPassword === hashedPassword
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  /**
   * 生成JWT Token（简化版）
   */
  private generateJWTToken(payload: JWTPayload): string {
    try {
      // 这里是简化实现，实际应使用jsonwebtoken库
      // const jwt = require('jsonwebtoken')
      // return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' })

      // 临时简化实现：Base64编码
      const header = { alg: 'HS256', typ: 'JWT' }
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.secret`).toString('base64url')

      return `${encodedHeader}.${encodedPayload}.${signature}`
    } catch (error) {
      console.error('JWT生成失败:', error)
      return 'invalid-token'
    }
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(userId: string): string {
    try {
      // 简化实现：生成随机刷新令牌
      const payload = {
        userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30天过期
      }

      const tokenData = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = Buffer.from(`${tokenData}.refresh.secret`).toString('base64url')

      return `${tokenData}.${signature}`
    } catch (error) {
      console.error('刷新令牌生成失败:', error)
      return 'invalid-refresh-token'
    }
  }

  /**
   * 验证刷新令牌
   */
  private verifyRefreshToken(refreshToken: string): RefreshTokenPayload | null {
    try {
      // 简化实现：解析刷新令牌
      const parts = refreshToken.split('.')
      if (parts.length !== 2) {
        return null
      }

      const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString())

      // 检查是否过期
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }

      return payload
    } catch (error) {
      console.error('刷新令牌验证失败:', error)
      return null
    }
  }

  /**
   * 直接调用AI引擎优化内容（回退方案）
   */
  private async optimizeContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.error(ResponseMapper.toAPIError(
          { message: 'AI引擎和队列管理器都不可用' },
          req.requestId
        ))
        return
      }

      const { content, instruction, model, userId, projectId } = req.body

      const result = await this.aiEngine.optimizeContent({
        content,
        instruction: instruction || '请优化这段内容，使其更清晰、准确和有条理',
        model: model || 'gpt-4',
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        mappedResult,
        'AI内容优化成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  /**
   * 直接调用AI引擎融合内容（回退方案）
   */
  private async fusionContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.error(ResponseMapper.toAPIError(
          { message: 'AI引擎和队列管理器都不可用' },
          req.requestId
        ))
        return
      }

      const { inputs, instruction, model, userId, projectId } = req.body

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        res.error(ResponseMapper.toAPIError(
          { message: '融合功能需要至少2个输入内容' },
          req.requestId
        ))
        return
      }

      const result = await this.aiEngine.fusionContent({
        inputs,
        instruction: instruction || '请将这些内容融合成一个统一、连贯的内容',
        model: model || 'gpt-4',
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        {
          ...mappedResult,
          sources: inputs.length
        },
        'AI内容融合成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  /**
   * 直接调用AI引擎批量生成内容（回退方案）
   */
  private async batchGenerateDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.error(ResponseMapper.toAPIError(
          { message: 'AI引擎和队列管理器都不可用' },
          req.requestId
        ))
        return
      }

      const { requests, options = {} } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      // 配置批量处理选项
      const batchOptions = {
        parallel: options.parallel !== false,
        failFast: options.failFast === true,
        maxConcurrency: Math.min(options.maxConcurrency || 3, requests.length)
      }

      const results = []
      const startTime = Date.now()

      if (batchOptions.parallel) {
        // 并行处理（使用Promise.allSettled控制并发）
        const chunks = []
        for (let i = 0; i < requests.length; i += batchOptions.maxConcurrency) {
          chunks.push(requests.slice(i, i + batchOptions.maxConcurrency))
        }

        for (const chunk of chunks) {
          const chunkResults = await Promise.allSettled(
            chunk.map(request => this.aiEngine!.generateContent({
              prompt: request.prompt || request.inputs?.join('\n'),
              model: request.model || 'gpt-4',
              maxTokens: request.maxTokens || 2000,
              temperature: request.temperature || 0.7,
              userId: userId,
              projectId,
              metadata: {
                requestId: req.requestId,
                source: 'gateway_api_batch_direct',
                batchIndex: results.length + chunk.indexOf(request)
              }
            }))
          )

          // 处理块结果
          for (let i = 0; i < chunkResults.length; i++) {
            const result = chunkResults[i]
            if (result.status === 'fulfilled') {
              results.push(ResponseMapper.toAIGenerateResponse(result.value))
            } else {
              results.push({
                content: `批量处理失败: ${result.reason}`,
                confidence: 0,
                tags: [],
                metadata: {
                  requestId: req.requestId,
                  model: 'gpt-4',
                  processingTime: 0,
                  tokenCount: 0,
                  error: result.reason,
                  batchIndex: results.length
                }
              })

              // 如果启用快速失败，遇到错误就立即返回
              if (batchOptions.failFast) {
                break
              }
            }
          }

          if (batchOptions.failFast && results.some(r => r.metadata?.error)) {
            break
          }
        }
      } else {
        // 顺序处理
        for (let i = 0; i < requests.length; i++) {
          try {
            const request = requests[i]
            const result = await this.aiEngine.generateContent({
              prompt: request.prompt || request.inputs?.join('\n'),
              model: request.model || 'gpt-4',
              maxTokens: request.maxTokens || 2000,
              temperature: request.temperature || 0.7,
              userId: userId,
              projectId,
              metadata: {
                requestId: req.requestId,
                source: 'gateway_api_batch_direct',
                batchIndex: i
              }
            })

            results.push(ResponseMapper.toAIGenerateResponse(result))
          } catch (error) {
            results.push({
              content: `批量处理失败: ${error}`,
              confidence: 0,
              tags: [],
              metadata: {
                requestId: req.requestId,
                model: 'gpt-4',
                processingTime: 0,
                tokenCount: 0,
                error: error,
                batchIndex: i
              }
            })

            if (batchOptions.failFast) {
              break
            }
          }
        }
      }

      const totalTime = Date.now() - startTime
      const successCount = results.filter(r => !r.metadata?.error).length
      const failureCount = results.length - successCount

      res.success(ResponseMapper.toAPISuccess(
        {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            processingTime: totalTime,
            successRate: (successCount / results.length * 100).toFixed(1) + '%'
          }
        },
        'AI批量内容生成完成',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }
}