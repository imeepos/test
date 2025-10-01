/**
 * 项目服务
 * 处理项目相关的 API 调用
 */
import { request } from './api/client'
import { PROJECT_ENDPOINTS } from './api/endpoints'
import type { Project, ProjectConfig, ProjectStats } from '@/types'

export interface CreateProjectDTO {
  name: string
  description: string
  type: 'component' | 'ai-processor' | 'exporter' | 'tool' | 'theme'
  template: string
}

export interface UpdateProjectDTO {
  name?: string
  description?: string
  status?: Project['status']
  config?: Partial<ProjectConfig>
}

export interface ProjectFile {
  path: string
  content: string
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'css'
  size: number
  lastModified: string
}

export interface BuildOptions {
  minify?: boolean
  sourcemap?: boolean
}

export interface BuildResult {
  success: boolean
  output: string
  errors: string[]
  warnings: string[]
  duration: number
  bundleSize: number
}

/**
 * 项目服务类
 */
export class ProjectService {
  /**
   * 获取项目列表
   */
  static async getProjects(params?: {
    status?: string
    type?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: Project[]; total: number }> {
    return request.get(PROJECT_ENDPOINTS.LIST, { params })
  }

  /**
   * 获取单个项目
   */
  static async getProject(id: string): Promise<Project> {
    return request.get(PROJECT_ENDPOINTS.GET(id))
  }

  /**
   * 创建项目
   */
  static async createProject(data: CreateProjectDTO): Promise<Project> {
    return request.post(PROJECT_ENDPOINTS.CREATE, data)
  }

  /**
   * 更新项目
   */
  static async updateProject(id: string, data: UpdateProjectDTO): Promise<Project> {
    return request.put(PROJECT_ENDPOINTS.UPDATE(id), data)
  }

  /**
   * 删除项目
   */
  static async deleteProject(id: string): Promise<void> {
    return request.delete(PROJECT_ENDPOINTS.DELETE(id))
  }

  /**
   * 获取项目文件列表
   */
  static async getProjectFiles(id: string): Promise<ProjectFile[]> {
    return request.get(PROJECT_ENDPOINTS.FILES(id))
  }

  /**
   * 获取单个文件内容
   */
  static async getFile(id: string, path: string): Promise<ProjectFile> {
    return request.get(PROJECT_ENDPOINTS.FILE(id, encodeURIComponent(path)))
  }

  /**
   * 保存文件
   */
  static async saveFile(id: string, path: string, content: string): Promise<void> {
    return request.put(PROJECT_ENDPOINTS.FILE(id, encodeURIComponent(path)), { content })
  }

  /**
   * 创建文件
   */
  static async createFile(id: string, path: string, content: string): Promise<ProjectFile> {
    return request.post(PROJECT_ENDPOINTS.FILES(id), { path, content })
  }

  /**
   * 删除文件
   */
  static async deleteFile(id: string, path: string): Promise<void> {
    return request.delete(PROJECT_ENDPOINTS.FILE(id, encodeURIComponent(path)))
  }

  /**
   * 构建项目
   */
  static async buildProject(id: string, options?: BuildOptions): Promise<BuildResult> {
    return request.post(PROJECT_ENDPOINTS.BUILD(id), options)
  }

  /**
   * 运行项目
   */
  static async runProject(id: string): Promise<{ success: boolean; url: string }> {
    return request.post(PROJECT_ENDPOINTS.RUN(id))
  }

  /**
   * 获取项目统计
   */
  static async getProjectStats(id: string): Promise<ProjectStats> {
    return request.get(PROJECT_ENDPOINTS.STATS(id))
  }
}

export default ProjectService
