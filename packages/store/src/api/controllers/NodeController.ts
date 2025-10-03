import { Request, Response } from 'express'
import { BaseController } from '../BaseController.js'
import { NodeRepository } from '../../repositories/NodeRepository.js'

/**
 * 节点管理API控制器
 */
export class NodeController extends BaseController {
  private nodeRepo: NodeRepository

  constructor() {
    super()
    this.nodeRepo = new NodeRepository()
  }

  /**
   * 获取节点列表
   * GET /api/v1/nodes
   */
  getNodes = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    // 支持两种参数名称格式
    const projectId = (req.query.projectId || req.query.project_id) as string
    const userId = (req.query.userId || req.query.user_id) as string
    const status = req.query.status as string
    const search = req.query.search as string

    console.log('🎯 NodeController.getNodes - projectId:', projectId)
    console.log('🎯 NodeController.getNodes - query:', req.query)

    let filter: any = {}

    if (search) {
      filter.$or = [
        { title: { $ilike: `%${search}%` } },
        { content: { $ilike: `%${search}%` } }
      ]
    }

    if (status) {
      filter.status = status
    } else {
      // 默认排除已删除的节点 - 使用 NOT LIKE 操作符
      filter.status = { operator: '<>', value: 'deleted' }
    }

    console.log('🎯 NodeController.getNodes - filter:', JSON.stringify(filter))

    let nodes
    if (projectId) {
      nodes = await this.nodeRepo.findByProject(projectId, { limit, offset, filters: filter })
    } else if (userId) {
      nodes = await this.nodeRepo.findByUser(userId, { limit, offset, filters: filter })
    } else {
      nodes = await this.nodeRepo.findMany({ filters: filter, limit, offset })
    }

    console.log('🎯 NodeController.getNodes - returned nodes count:', nodes.length)

    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)
    this.success(res, nodes, pagination)
  })

  /**
   * 获取节点分页列表
   * GET /api/v1/nodes/paginated
   */
  getNodesPaginated = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset, sort, order } = this.parseQueryOptions(req)
    const filters: any = {}

    // 解析过滤条件
    if (req.query.filters) {
      const queryFilters = req.query.filters as any
      if (queryFilters.project_id) filters.project_id = queryFilters.project_id
      if (queryFilters.user_id) filters.user_id = queryFilters.user_id
      if (queryFilters.type) filters.type = queryFilters.type
      if (queryFilters.status) filters.status = queryFilters.status
    }

    // 构建查询选项
    const options = {
      limit,
      offset,
      orderBy: sort || 'updated_at',
      orderDirection: order || 'DESC',
      filters
    }

    // 使用 findWithPagination 方法
    const result = await this.nodeRepo.findWithPagination(options)

    this.success(res, result.data, result.pagination)
  })

  /**
   * 根据ID获取节点
   * GET /api/v1/nodes/:id
   */
  getNodeById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const node = await this.nodeRepo.findById(id)
    if (!node) {
      return this.notFound(res, 'Node')
    }

    this.success(res, node)
  })

  /**
   * 创建节点
   * POST /api/v1/nodes
   */
  createNode = this.asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = [
      'title', 'content', 'project_id', 'user_id', 'parent_id',
      'semantic_type', 'importance_level', 'confidence_score',
      'status', 'position', 'size', 'metadata', 'tags'
    ]
    const nodeData = this.sanitizeInput(req.body, allowedFields)

    const requiredErrors = this.validateRequired(nodeData, ['project_id', 'user_id'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 设置默认值
    nodeData.status = nodeData.status || 'idle'
    nodeData.semantic_type = nodeData.semantic_type || 'text'
    nodeData.importance_level = nodeData.importance_level || 3
    nodeData.confidence_score = nodeData.confidence_score || 0

    const node = await this.nodeRepo.create(nodeData)
    this.created(res, node)
  })

  /**
   * 更新节点
   * PUT /api/v1/nodes/:id
   */
  updateNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const allowedFields = [
      'title', 'content', 'parent_id', 'semantic_type',
      'importance_level', 'confidence_score', 'status',
      'position', 'size', 'metadata', 'tags'
    ]
    const updateData = this.sanitizeInput(req.body, allowedFields)

    const node = await this.nodeRepo.update(id, updateData)
    if (!node) {
      return this.notFound(res, 'Node')
    }

    this.success(res, node)
  })

  /**
   * 删除节点
   * DELETE /api/v1/nodes/:id
   */
  deleteNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.nodeRepo.delete(id)
    if (!success) {
      return this.notFound(res, 'Node')
    }

    this.noContent(res)
  })

  /**
   * 获取项目的节点
   * GET /api/v1/nodes/by-project/:projectId
   */
  getNodesByProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const nodes = await this.nodeRepo.findByProject(projectId, { limit, offset })
    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, nodes, pagination)
  })

  /**
   * 获取用户的节点
   * GET /api/v1/nodes/by-user/:userId
   */
  getNodesByUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const nodes = await this.nodeRepo.findByUser(userId, { limit, offset })
    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, nodes, pagination)
  })

  /**
   * 根据标签查找节点
   * GET /api/v1/nodes/by-tags
   */
  getNodesByTags = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const tags = req.query.tags as string

    if (!tags) {
      return this.validationError(res, ['Tags parameter is required'])
    }

    const tagArray = tags.split(',').map(tag => tag.trim())
    const nodes = await this.nodeRepo.findByTags(tagArray, { limit, offset })
    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, nodes, pagination)
  })

  /**
   * 根据状态查找节点
   * GET /api/v1/nodes/by-status/:status
   */
  getNodesByStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const nodes = await this.nodeRepo.findByStatus(status, { limit, offset })
    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, nodes, pagination)
  })

  /**
   * 获取子节点
   * GET /api/v1/nodes/:id/children
   */
  getNodeChildren = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const children = await this.nodeRepo.findChildren(id, { limit, offset })
    const total = children.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, children, pagination)
  })

  /**
   * 获取根节点
   * GET /api/v1/nodes/roots/:projectId
   */
  getRootNodes = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const roots = await this.nodeRepo.findRootNodes(projectId, { limit, offset })
    const total = roots.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, roots, pagination)
  })

  /**
   * 获取节点统计信息
   * GET /api/v1/nodes/stats
   */
  getNodeStats = this.asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string

    const stats = await this.nodeRepo.getStatistics(projectId)
    this.success(res, stats)
  })

  /**
   * 批量更新节点状态
   * PUT /api/v1/nodes/batch/status
   */
  updateNodeStatusBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const { nodeIds, status } = req.body

    const requiredErrors = this.validateRequired(req.body, ['nodeIds', 'status'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return this.validationError(res, ['nodeIds must be a non-empty array'])
    }

    const nodes = await this.nodeRepo.updateStatusBatch(nodeIds, status)
    this.success(res, nodes)
  })

  /**
   * 获取节点邻居
   * GET /api/v1/nodes/:id/neighbors
   */
  getNodeNeighbors = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const neighbors = await this.nodeRepo.findNeighbors(id)
    this.success(res, neighbors)
  })

  /**
   * 获取节点路径
   * GET /api/v1/nodes/:id/path
   */
  getNodePath = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const path = await this.nodeRepo.getNodePath(id)
    this.success(res, path)
  })

  /**
   * 获取节点子树
   * GET /api/v1/nodes/:id/subtree
   */
  getNodeSubtree = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const maxDepth = parseInt(req.query.maxDepth as string) || 10

    const subtree = await this.nodeRepo.getNodeSubtree(id, maxDepth)
    this.success(res, subtree)
  })

  /**
   * 复制节点到项目
   * POST /api/v1/nodes/:id/copy
   */
  copyNodeToProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { targetProjectId, userId } = req.body

    const requiredErrors = this.validateRequired(req.body, ['targetProjectId', 'userId'])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    const newNode = await this.nodeRepo.copyToProject(id, targetProjectId, userId)
    this.created(res, newNode)
  })

  /**
   * 软删除节点
   * PUT /api/v1/nodes/:id/soft-delete
   */
  softDeleteNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.nodeRepo.softDelete(id)
    if (!success) {
      return this.notFound(res, 'Node')
    }

    this.success(res, { message: 'Node soft deleted successfully' })
  })

  /**
   * 恢复节点
   * PUT /api/v1/nodes/:id/restore
   */
  restoreNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const node = await this.nodeRepo.restore(id)
    if (!node) {
      return this.notFound(res, 'Node')
    }

    this.success(res, node)
  })

  /**
   * 获取最近活跃的节点
   * GET /api/v1/nodes/recent-active/:projectId
   */
  getRecentlyActiveNodes = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params
    const limit = parseInt(req.query.limit as string) || 10

    const nodes = await this.nodeRepo.getRecentlyActive(projectId, limit)
    this.success(res, nodes)
  })

  /**
   * 获取高优先级节点
   * GET /api/v1/nodes/high-priority/:projectId
   */
  getHighPriorityNodes = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params

    const nodes = await this.nodeRepo.getHighPriorityNodes(projectId)
    this.success(res, nodes)
  })
}