import { Request, Response } from 'express'
import { BaseController } from '../BaseController.js'
import { ConnectionRepository } from '../../repositories/ConnectionRepository.js'

/**
 * 连接管理API控制器
 */
export class ConnectionController extends BaseController {
  private connectionRepo: ConnectionRepository

  constructor() {
    super()
    this.connectionRepo = new ConnectionRepository()
  }

  /**
   * 获取连接列表
   * GET /api/v1/connections
   */
  getConnections = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.parseQueryOptions(req)
    const projectId = req.query.projectId as string
    const sourceNodeId = req.query.sourceNodeId as string
    const targetNodeId = req.query.targetNodeId as string

    let connections
    if (projectId) {
      connections = await this.connectionRepo.findByProject(projectId, { limit, offset })
    } else if (sourceNodeId) {
      connections = await this.connectionRepo.findBySourceNode(sourceNodeId)
    } else if (targetNodeId) {
      connections = await this.connectionRepo.findByTargetNode(targetNodeId)
    } else {
      connections = await this.connectionRepo.findMany({ limit, offset })
    }

    const total = connections.length
    const pagination = this.createPagination(page, limit, total)
    this.success(res, connections, pagination)
  })

  /**
   * 根据ID获取连接
   * GET /api/v1/connections/:id
   */
  getConnectionById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const connection = await this.connectionRepo.findById(id)
    if (!connection) {
      return this.notFound(res, 'Connection')
    }

    this.success(res, connection)
  })

  /**
   * 创建连接
   * POST /api/v1/connections
   */
  createConnection = this.asyncHandler(async (req: Request, res: Response) => {
    const allowedFields = [
      'source_node_id', 'target_node_id', 'project_id',
      'type', 'weight', 'bidirectional', 'metadata'
    ]
    const connectionData = this.sanitizeInput(req.body, allowedFields)

    const requiredErrors = this.validateRequired(connectionData, [
      'source_node_id', 'target_node_id', 'project_id'
    ])
    if (requiredErrors.length > 0) {
      return this.validationError(res, requiredErrors)
    }

    // 设置默认值
    connectionData.type = connectionData.type || 'related'
    connectionData.weight = connectionData.weight || 1.0
    connectionData.bidirectional = connectionData.bidirectional !== undefined
      ? connectionData.bidirectional : false

    const connection = await this.connectionRepo.create(connectionData)
    this.created(res, connection)
  })

  /**
   * 更新连接
   * PUT /api/v1/connections/:id
   */
  updateConnection = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const allowedFields = [
      'type', 'weight', 'bidirectional', 'metadata'
    ]
    const updateData = this.sanitizeInput(req.body, allowedFields)

    const connection = await this.connectionRepo.update(id, updateData)
    if (!connection) {
      return this.notFound(res, 'Connection')
    }

    this.success(res, connection)
  })

  /**
   * 删除连接
   * DELETE /api/v1/connections/:id
   */
  deleteConnection = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const success = await this.connectionRepo.delete(id)
    if (!success) {
      return this.notFound(res, 'Connection')
    }

    this.noContent(res)
  })

  /**
   * 获取项目的连接
   * GET /api/v1/connections/by-project/:projectId
   */
  getConnectionsByProject = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params
    const { page, limit, offset } = this.parseQueryOptions(req)

    const connections = await this.connectionRepo.findByProject(projectId, { limit, offset })
    const total = connections.length
    const pagination = this.createPagination(page, limit, total)

    this.success(res, connections, pagination)
  })

  /**
   * 获取源节点的连接
   * GET /api/v1/connections/by-source/:sourceNodeId
   */
  getConnectionsBySourceNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { sourceNodeId } = req.params

    const connections = await this.connectionRepo.findBySourceNode(sourceNodeId)
    this.success(res, connections)
  })

  /**
   * 获取目标节点的连接
   * GET /api/v1/connections/by-target/:targetNodeId
   */
  getConnectionsByTargetNode = this.asyncHandler(async (req: Request, res: Response) => {
    const { targetNodeId } = req.params

    const connections = await this.connectionRepo.findByTargetNode(targetNodeId)
    this.success(res, connections)
  })

  /**
   * 获取两个节点之间的连接
   * GET /api/v1/connections/between/:sourceNodeId/:targetNodeId
   */
  getConnectionsBetweenNodes = this.asyncHandler(async (req: Request, res: Response) => {
    const { sourceNodeId, targetNodeId } = req.params

    const connections = await this.connectionRepo.findBetweenNodes(sourceNodeId, targetNodeId)
    this.success(res, connections)
  })

  /**
   * 获取连接统计信息
   * GET /api/v1/connections/stats/:projectId
   */
  getConnectionStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params

    const stats = await this.connectionRepo.getConnectionStatistics(projectId)
    this.success(res, stats)
  })

  /**
   * 获取网络分析
   * GET /api/v1/connections/network-analysis/:projectId
   */
  getNetworkAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params

    const analysis = await this.connectionRepo.getNetworkAnalysis(projectId)
    this.success(res, analysis)
  })
}