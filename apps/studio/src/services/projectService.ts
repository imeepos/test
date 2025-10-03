/**
 * 项目管理服务
 * 封装项目相关的后端API调用
 */

import { apiClient } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import type { Viewport } from '@/types'

/**
 * 项目数据结构
 */
export interface Project {
  id: string
  name: string
  description?: string
  user_id: string
  status: 'active' | 'archived' | 'deleted'
  canvas_data: {
    viewport: Viewport
    displayMode: 'preview' | 'overview' | 'detail'
    filters: {
      importance?: number[]
      tags?: string[]
      status?: string[]
    }
  }
  settings: {
    collaboration: { enabled: boolean }
    notifications: { enabled: boolean }
    autoSave: { enabled: boolean; interval: number }
  }
  is_archived: boolean
  last_accessed_at: Date
  created_at: Date
  updated_at: Date
}

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  name: string
  description?: string
  canvas_data?: Project['canvas_data']
  settings?: Project['settings']
}

/**
 * 更新项目参数
 */
export interface UpdateProjectParams {
  name?: string
  description?: string
  canvas_data?: Project['canvas_data']
  settings?: Project['settings']
  status?: Project['status']
  is_archived?: boolean
}

/**
 * 画布状态数据
 */
export interface CanvasState {
  viewport: Viewport
  displayMode: 'preview' | 'overview' | 'detail'
  filters: {
    importance?: number[]
    tags?: string[]
    status?: string[]
  }
  selectedNodeIds?: string[]
  timestamp: Date
}

/**
 * 项目管理服务类
 */
class ProjectService {
  /**
   * 获取项目列表
   * 注意：user_id 从 JWT token 中获取，不需要传递
   */
  async getProjects(params?: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<Project[]> {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

    const url = `${API_ENDPOINTS.projects.list}?${queryParams.toString()}`
    const response = await apiClient.get<{ items: Project[], pagination: any }>(url)

    // Gateway 返回的是 { items: [...], pagination: {...} } 格式
    // 提取 items 数组并确保是数组类型
    return Array.isArray(response?.items) ? response.items : []
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: string): Promise<Project> {
    return apiClient.get<Project>(API_ENDPOINTS.projects.detail(projectId))
  }

  /**
   * 创建项目
   */
  async createProject(params: CreateProjectParams): Promise<Project> {
    // 从认证 store 获取当前用户 ID
    const { useAuthStore } = await import('@/stores')
    const user = useAuthStore.getState().user
    if (!user?.id) {
      throw new Error('用户未登录，无法创建项目')
    }

    const projectData = {
      name: params.name,
      description: params.description || '',
      owner_id: user.id, // 添加 owner_id 字段
      canvas_data: params.canvas_data || {
        viewport: { x: 0, y: 0, zoom: 1 },
        displayMode: 'preview' as const,
        filters: {},
      },
      settings: params.settings || {
        collaboration: { enabled: false },
        notifications: { enabled: true },
        autoSave: { enabled: true, interval: 30000 },
      },
    }

    return apiClient.post<Project>(API_ENDPOINTS.projects.create, projectData)
  }

  /**
   * 更新项目
   */
  async updateProject(projectId: string, params: UpdateProjectParams): Promise<Project> {
    return apiClient.put<Project>(API_ENDPOINTS.projects.update(projectId), params)
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.projects.delete(projectId))
  }

  /**
   * 归档项目
   */
  async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, {
      is_archived: true,
      status: 'archived',
    })
  }

  /**
   * 取消归档项目
   */
  async unarchiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, {
      is_archived: false,
      status: 'active',
    })
  }

  /**
   * 保存画布状态
   */
  async saveCanvasState(projectId: string, canvasState: CanvasState): Promise<void> {
    await apiClient.post(API_ENDPOINTS.projects.canvasState(projectId), {
      canvas_data: {
        viewport: canvasState.viewport,
        displayMode: canvasState.displayMode,
        filters: canvasState.filters,
      },
    })
  }

  /**
   * 获取画布状态
   */
  async getCanvasState(projectId: string): Promise<CanvasState> {
    const response = await apiClient.get<{ canvas_data: CanvasState }>(
      API_ENDPOINTS.projects.canvasState(projectId)
    )
    return response.canvas_data
  }

  /**
   * 获取最近访问的项目
   * 注意：user_id 从 JWT token 中获取，不需要传递
   */
  async getRecentProjects(limit: number = 10): Promise<Project[]> {
    const url = `${API_ENDPOINTS.projects.list}?limit=${limit}&sortBy=last_accessed_at&sortDirection=DESC`
    const response = await apiClient.get<{ items: Project[] }>(url)
    return Array.isArray(response?.items) ? response.items : []
  }

  /**
   * 更新项目最后访问时间
   */
  async updateLastAccessed(projectId: string): Promise<void> {
    await apiClient.put(`${API_ENDPOINTS.projects.detail(projectId)}/last-accessed`, {
      last_accessed_at: new Date(),
    })
  }

  /**
   * 导出项目数据
   */
  async exportProject(projectId: string): Promise<any> {
    return apiClient.get(`${API_ENDPOINTS.projects.detail(projectId)}/export`)
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(projectId: string): Promise<{
    totalNodes: number
    totalConnections: number
    averageImportance: number
    averageConfidence: number
    nodesByStatus: Record<string, number>
    lastModified: Date
  }> {
    return apiClient.get(`${API_ENDPOINTS.projects.detail(projectId)}/stats`)
  }
}

/**
 * 导出单例实例
 */
export const projectService = new ProjectService()
