import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes.js'
import { BaseRouter, RouterDependencies } from './BaseRouter.js'

/**
 * 连接管理路由器 - 处理节点连接的CRUD操作和查询
 */
export class ConnectionRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 获取连接列表
    this.router.get('/', this.getConnections.bind(this))

    // 创建连接
    this.router.post('/', this.createConnection.bind(this))

    // 获取项目的连接 - 支持两种URL格式
    this.router.get('/project/:projectId', this.getConnectionsByProject.bind(this))
    this.router.get('/by-project/:projectId', this.getConnectionsByProject.bind(this))

    // 获取源节点的连接
    this.router.get('/by-source/:sourceNodeId', this.getConnectionsBySourceNode.bind(this))

    // 获取目标节点的连接
    this.router.get('/by-target/:targetNodeId', this.getConnectionsByTargetNode.bind(this))

    // 获取两个节点之间的连接
    this.router.get('/between/:sourceNodeId/:targetNodeId', this.getConnectionsBetweenNodes.bind(this))

    // 连接统计
    this.router.get('/stats/:projectId', this.getConnectionStats.bind(this))

    // 网络分析
    this.router.get('/network-analysis/:projectId', this.getNetworkAnalysis.bind(this))

    // 获取单个连接
    this.router.get('/:id', this.getConnectionById.bind(this))

    // 更新连接
    this.router.put('/:id', this.updateConnection.bind(this))

    // 删除连接
    this.router.delete('/:id', this.deleteConnection.bind(this))
  }

  /**
   * 获取连接列表
   */
  private async getConnections(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { projectId, sourceNodeId, targetNodeId, page = 1, limit = 20 } = req.query

      const filter: any = {}
      if (projectId) filter.projectId = projectId
      if (sourceNodeId) filter.sourceNodeId = sourceNodeId
      if (targetNodeId) filter.targetNodeId = targetNodeId

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }

      const connections = await this.storeClient!.connections.findMany(filter, options)

      res.success(connections, 'Connections retrieved successfully')
    } catch (error) {
      console.error('获取连接列表失败:', error)
      res.error({
        code: 'GET_CONNECTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get connections',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取单个连接
   */
  private async getConnectionById(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_CONNECTION_ID',
          message: '缺少必需的连接ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const connection = await this.storeClient!.connections.findById(id)

      if (!connection) {
        res.error({
          code: 'CONNECTION_NOT_FOUND',
          message: '连接不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      res.success(connection)
    } catch (error) {
      console.error('获取连接失败:', error)
      res.error({
        code: 'GET_CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get connection',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 创建连接
   */
  private async createConnection(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const {
        source_node_id,
        target_node_id,
        project_id,
        type = 'related',
        weight = 1.0,
        bidirectional = false,
        metadata
      } = req.body

      // 验证必需字段
      if (!source_node_id || !target_node_id || !project_id) {
        res.error({
          code: 'MISSING_REQUIRED_FIELDS',
          message: '缺少必需的字段：source_node_id, target_node_id, project_id',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const connectionData = {
        source_node_id,
        target_node_id,
        project_id,
        type,
        weight,
        bidirectional,
        metadata: {
          ...metadata,
          source: 'gateway_api',
          requestId: req.requestId
        }
      }

      const connection = await this.storeClient!.connections.create(connectionData)

      // 发布连接创建事件
      await this.storeClient!.publishEntityChange({
        entityType: 'connection',
        entityId: connection.id,
        operation: 'create',
        data: connection,
        userId: req.user?.id,
        projectId: project_id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId
        }
      })

      res.success(connection, 'Connection created successfully')
    } catch (error) {
      console.error('创建连接失败:', error)
      res.error({
        code: 'CREATE_CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create connection',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 更新连接
   */
  private async updateConnection(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const { type, weight, bidirectional, metadata } = req.body

      if (!id) {
        res.error({
          code: 'MISSING_CONNECTION_ID',
          message: '缺少必需的连接ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const updateData: any = {}
      if (type !== undefined) updateData.type = type
      if (weight !== undefined) updateData.weight = weight
      if (bidirectional !== undefined) updateData.bidirectional = bidirectional
      if (metadata !== undefined) updateData.metadata = metadata

      const connection = await this.storeClient!.connections.update(id, updateData)

      if (!connection) {
        res.error({
          code: 'CONNECTION_NOT_FOUND',
          message: '连接不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 发布连接更新事件
      await this.storeClient!.publishEntityChange({
        entityType: 'connection',
        entityId: id,
        operation: 'update',
        data: connection,
        userId: req.user?.id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          changedFields: Object.keys(updateData)
        }
      })

      res.success(connection, 'Connection updated successfully')
    } catch (error) {
      console.error('更新连接失败:', error)
      res.error({
        code: 'UPDATE_CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update connection',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 删除连接
   */
  private async deleteConnection(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_CONNECTION_ID',
          message: '缺少必需的连接ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      await this.storeClient!.connections.delete(id)

      // 发布连接删除事件
      await this.storeClient!.publishEntityChange({
        entityType: 'connection',
        entityId: id,
        operation: 'delete',
        data: null,
        userId: req.user?.id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId
        }
      })

      res.success(null, 'Connection deleted successfully')
    } catch (error) {
      console.error('删除连接失败:', error)
      res.error({
        code: 'DELETE_CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete connection',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取项目的连接
   */
  private async getConnectionsByProject(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { projectId } = req.params
      const { page = 1, limit = 100 } = req.query

      if (!projectId) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }

      const connections = await this.storeClient!.connections.findByProject(projectId, options)

      res.success(connections, 'Project connections retrieved successfully')
    } catch (error) {
      console.error('获取项目连接失败:', error)
      res.error({
        code: 'GET_PROJECT_CONNECTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get project connections',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取源节点的连接
   */
  private async getConnectionsBySourceNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { sourceNodeId } = req.params

      if (!sourceNodeId) {
        res.error({
          code: 'MISSING_SOURCE_NODE_ID',
          message: '缺少必需的源节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const connections = await this.storeClient!.connections.findMany({ sourceNodeId })

      res.success(connections)
    } catch (error) {
      console.error('获取源节点连接失败:', error)
      res.error({
        code: 'GET_SOURCE_NODE_CONNECTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get source node connections',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取目标节点的连接
   */
  private async getConnectionsByTargetNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { targetNodeId } = req.params

      if (!targetNodeId) {
        res.error({
          code: 'MISSING_TARGET_NODE_ID',
          message: '缺少必需的目标节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const connections = await this.storeClient!.connections.findMany({ targetNodeId })

      res.success(connections)
    } catch (error) {
      console.error('获取目标节点连接失败:', error)
      res.error({
        code: 'GET_TARGET_NODE_CONNECTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get target node connections',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取两个节点之间的连接
   */
  private async getConnectionsBetweenNodes(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { sourceNodeId, targetNodeId } = req.params

      if (!sourceNodeId || !targetNodeId) {
        res.error({
          code: 'MISSING_NODE_IDS',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const connections = await this.storeClient!.connections.findMany({
        sourceNodeId,
        targetNodeId
      })

      res.success(connections)
    } catch (error) {
      console.error('获取节点间连接失败:', error)
      res.error({
        code: 'GET_CONNECTIONS_BETWEEN_NODES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get connections between nodes',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取连接统计信息
   */
  private async getConnectionStats(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { projectId } = req.params

      if (!projectId) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      const count = await this.storeClient!.connections.count({ projectId })

      res.success({ total: count, projectId })
    } catch (error) {
      console.error('获取连接统计失败:', error)
      res.error({
        code: 'GET_CONNECTION_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get connection stats',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取网络分析
   */
  private async getNetworkAnalysis(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { projectId } = req.params

      if (!projectId) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的项目ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 简单的网络分析：获取连接数量
      const connections = await this.storeClient!.connections.findByProject(projectId)
      const count = connections.length

      res.success({
        projectId,
        totalConnections: count,
        message: 'Basic network analysis'
      })
    } catch (error) {
      console.error('获取网络分析失败:', error)
      res.error({
        code: 'GET_NETWORK_ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get network analysis',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }
}
