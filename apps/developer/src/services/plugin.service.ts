/**
 * 插件服务
 * 处理插件相关的 API 调用
 */
import { request } from './api/client'
import { PLUGIN_ENDPOINTS } from './api/endpoints'
import type { Plugin, PluginVersion } from '@/types'

export interface SearchPluginParams {
  keyword?: string
  category?: string
  tags?: string[]
  sort?: 'popular' | 'newest' | 'rating' | 'downloads'
  page?: number
  pageSize?: number
}

export interface CreatePluginDTO {
  name: string
  description: string
  category: Plugin['category']
  tags: string[]
  price: number
  repository?: string
  homepage?: string
}

export interface UpdatePluginDTO {
  name?: string
  description?: string
  tags?: string[]
  price?: number
  repository?: string
  homepage?: string
}

export interface PublishPluginDTO {
  version: string
  changelog: string
  files: File | Blob
}

export interface PluginReview {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  createdAt: string
}

/**
 * 插件服务类
 */
export class PluginService {
  /**
   * 获取插件列表
   */
  static async getPlugins(params?: {
    category?: string
    featured?: boolean
    page?: number
    pageSize?: number
  }): Promise<{ data: Plugin[]; total: number }> {
    return request.get(PLUGIN_ENDPOINTS.LIST, { params })
  }

  /**
   * 搜索插件
   */
  static async searchPlugins(params: SearchPluginParams): Promise<{ data: Plugin[]; total: number }> {
    return request.get(PLUGIN_ENDPOINTS.SEARCH, { params })
  }

  /**
   * 获取单个插件
   */
  static async getPlugin(id: string): Promise<Plugin> {
    return request.get(PLUGIN_ENDPOINTS.GET(id))
  }

  /**
   * 创建插件
   */
  static async createPlugin(data: CreatePluginDTO): Promise<Plugin> {
    return request.post(PLUGIN_ENDPOINTS.CREATE, data)
  }

  /**
   * 更新插件
   */
  static async updatePlugin(id: string, data: UpdatePluginDTO): Promise<Plugin> {
    return request.put(PLUGIN_ENDPOINTS.UPDATE(id), data)
  }

  /**
   * 删除插件
   */
  static async deletePlugin(id: string): Promise<void> {
    return request.delete(PLUGIN_ENDPOINTS.DELETE(id))
  }

  /**
   * 发布插件
   */
  static async publishPlugin(id: string, data: PublishPluginDTO): Promise<Plugin> {
    const formData = new FormData()
    formData.append('version', data.version)
    formData.append('changelog', data.changelog)
    formData.append('files', data.files)

    return request.post(PLUGIN_ENDPOINTS.PUBLISH(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * 安装插件
   */
  static async installPlugin(id: string): Promise<{ success: boolean; message: string }> {
    return request.post(PLUGIN_ENDPOINTS.INSTALL(id))
  }

  /**
   * 卸载插件
   */
  static async uninstallPlugin(id: string): Promise<{ success: boolean; message: string }> {
    return request.post(PLUGIN_ENDPOINTS.UNINSTALL(id))
  }

  /**
   * 获取插件评论
   */
  static async getReviews(id: string, page = 1, pageSize = 10): Promise<{ data: PluginReview[]; total: number }> {
    return request.get(PLUGIN_ENDPOINTS.REVIEWS(id), {
      params: { page, pageSize },
    })
  }

  /**
   * 添加评论
   */
  static async addReview(id: string, rating: number, comment: string): Promise<PluginReview> {
    return request.post(PLUGIN_ENDPOINTS.REVIEWS(id), { rating, comment })
  }

  /**
   * 获取插件版本历史
   */
  static async getVersions(id: string): Promise<PluginVersion[]> {
    return request.get(PLUGIN_ENDPOINTS.VERSIONS(id))
  }
}

export default PluginService
