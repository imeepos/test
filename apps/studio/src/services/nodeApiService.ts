/**
 * 节点API服务
 * 封装节点相关的后端API调用
 */

import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { NodeDataConverter } from '@/types/converter'
import type { AINode, Position } from '@/types'

/**
 * 后端节点数据格式
 */
export interface BackendNode {
  id: string
  project_id: string
  user_id: string
  content: string
  title?: string
  importance: 1 | 2 | 3 | 4 | 5
  confidence: number
  status: 'idle' | 'processing' | 'completed' | 'error'
  tags: string[]
  version: number
  position: Position
  size?: { width: number; height: number }
  metadata: any
  parent_id?: string
  created_at: Date
  updated_at: Date
  ai_generated?: boolean
}

/**
 * 创建节点参数
 */
export interface CreateNodeParams {
  project_id: string
  content: string
  title?: string
  importance?: 1 | 2 | 3 | 4 | 5
  position: Position
  tags?: string[]
  parent_id?: string
  metadata?: any
}

/**
 * 更新节点参数
 */
export interface UpdateNodeParams {
  content?: string
  title?: string
  importance?: 1 | 2 | 3 | 4 | 5
  position?: Position
  tags?: string[]
  status?: 'idle' | 'processing' | 'completed' | 'error'
  confidence?: number
  metadata?: any
  user_rating?: number
}

/**
 * 连接关系数据
 */
export interface ConnectionData {
  id: string
  source_node_id: string
  target_node_id: string
  project_id: string
  type?: string
  style?: any
  weight?: number
  bidirectional?: boolean
  metadata?: Record<string, any>
  created_at?: string | Date
  updated_at?: string | Date
}

/**
 * 节点API服务类
 */
class NodeAPIService {
  /**
   * 获取项目的所有节点
   */
  async getNodesByProject(projectId: string): Promise<AINode[]> {
    const params = new URLSearchParams({ project_id: projectId })
    const url = `${API_ENDPOINTS.nodes.list}?${params.toString()}`

    const response = await apiClient.get<{ items: BackendNode[], pagination: any }>(url)
    // Gateway 返回的是 { items: [...], pagination: {...} } 格式
    const backendNodes = response?.items || []
    return backendNodes.map((node) => NodeDataConverter.fromBackend(node))
  }

  /**
   * 获取单个节点
   */
  async getNode(nodeId: string): Promise<AINode> {
    const backendNode = await apiClient.get<BackendNode>(API_ENDPOINTS.nodes.detail(nodeId))
    return NodeDataConverter.fromBackend(backendNode)
  }

  /**
   * 创建节点
   */
  async createNode(params: CreateNodeParams): Promise<AINode> {
    const nodeData = {
      project_id: params.project_id,
      content: params.content,
      title: params.title || params.content.substring(0, 50),
      importance: params.importance || 3,
      position: params.position,
      tags: params.tags || [],
      parent_id: params.parent_id,
      status: 'idle' as const,
      confidence: 100,
      metadata: params.metadata || {},
    }

    const backendNode = await apiClient.post<BackendNode>(API_ENDPOINTS.nodes.create, nodeData)
    return NodeDataConverter.fromBackend(backendNode)
  }

  /**
   * 更新节点
   */
  async updateNode(nodeId: string, params: UpdateNodeParams): Promise<AINode> {
    const backendNode = await apiClient.put<BackendNode>(API_ENDPOINTS.nodes.update(nodeId), params)
    return NodeDataConverter.fromBackend(backendNode)
  }

  /**
   * 删除节点
   */
  async deleteNode(nodeId: string, permanent: boolean = false): Promise<void> {
    const url = permanent
      ? `${API_ENDPOINTS.nodes.delete(nodeId)}?permanent=true`
      : API_ENDPOINTS.nodes.delete(nodeId)

    await apiClient.delete(url)
  }

  /**
   * 批量删除节点
   */
  async deleteNodes(nodeIds: string[]): Promise<void> {
    // 并行删除所有节点
    await Promise.all(nodeIds.map((id) => this.deleteNode(id)))
  }

  /**
   * 搜索节点
   */
  async searchNodes(params: {
    projectId: string
    query?: string
    tags?: string[]
    importance?: number[]
    status?: string[]
  }): Promise<AINode[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('project_id', params.projectId)

    if (params.query) queryParams.append('q', params.query)
    if (params.tags) queryParams.append('tags', params.tags.join(','))
    if (params.importance) {
      queryParams.append('importance_min', Math.min(...params.importance).toString())
      queryParams.append('importance_max', Math.max(...params.importance).toString())
    }
    if (params.status) queryParams.append('status', params.status.join(','))

    const url = `${API_ENDPOINTS.nodes.search}?${queryParams.toString()}`
    const response = await apiClient.getFullResponse<{ items: BackendNode[] }>(url)

    return response.data!.items.map((node) => NodeDataConverter.fromBackend(node))
  }

  /**
   * 获取节点连接关系
   */
  async getNodeConnections(nodeId: string): Promise<ConnectionData[]> {
    return apiClient.get<ConnectionData[]>(API_ENDPOINTS.connections.byNode(nodeId))
  }

  /**
   * 获取项目的所有连接
   */
  async getProjectConnections(projectId: string): Promise<ConnectionData[]> {
    return apiClient.get<ConnectionData[]>(API_ENDPOINTS.connections.byProject(projectId))
  }

  /**
   * 创建连接
   */
  async createConnection(params: {
    project_id: string
    source_node_id: string
    target_node_id: string
    type?: string
    style?: any
    weight?: number
    bidirectional?: boolean
    metadata?: Record<string, any>
  }): Promise<ConnectionData> {
    return apiClient.post<ConnectionData>(API_ENDPOINTS.connections.create, params)
  }

  /**
   * 删除连接
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.connections.delete(connectionId))
  }

  /**
   * AI优化节点内容
   */
  async optimizeNode(nodeId: string, instruction?: string): Promise<AINode> {
    const result = await apiClient.post<{
      id: string
      content: string
      title?: string
      confidence: number
    }>(API_ENDPOINTS.nodes.optimize(nodeId), {
      instruction: instruction || '请优化这个节点的内容',
    })

    // 获取完整的更新后节点数据
    return this.getNode(nodeId)
  }

  /**
   * 获取节点版本历史
   */
  async getNodeVersions(nodeId: string, limit: number = 10): Promise<any[]> {
    const url = `${API_ENDPOINTS.nodes.versions(nodeId)}?limit=${limit}&include_content=true`
    const response = await apiClient.get<{ versions: any[] }>(url)
    return response.versions
  }

  /**
   * 回滚节点到指定版本
   */
  async rollbackNode(nodeId: string, versionNumber: number, reason?: string): Promise<AINode> {
    await apiClient.post(API_ENDPOINTS.nodes.rollback(nodeId), {
      version_number: versionNumber,
      change_description: reason || `回滚到版本 ${versionNumber}`,
    })

    // 获取回滚后的节点数据
    return this.getNode(nodeId)
  }
}

/**
 * 导出单例实例
 */
export const nodeAPIService = new NodeAPIService()
