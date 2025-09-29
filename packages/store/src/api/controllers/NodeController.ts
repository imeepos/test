import { Request, Response } from 'express'
import { BaseController } from '../BaseController'
import { NodeRepository } from '../../repositories/NodeRepository'

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
    const projectId = req.query.projectId as string
    const userId = req.query.userId as string
    const status = req.query.status as string
    const search = req.query.search as string

    let filter: any = {}

    if (search) {
      filter.$or = [
        { title: { $ilike: `%${search}%` } },
        { content: { $ilike: `%${search}%` } }
      ]
    }

    if (status) {
      filter.status = status
    }

    let nodes
    if (projectId) {
      nodes = await this.nodeRepo.findByProject(projectId, { limit, offset })
    } else if (userId) {
      nodes = await this.nodeRepo.findByUser(userId, { limit, offset })
    } else {
      nodes = await this.nodeRepo.findMany(filter, { limit, offset })
    }

    const total = nodes.length
    const pagination = this.createPagination(page, limit, total)
    this.success(res, nodes, pagination)
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