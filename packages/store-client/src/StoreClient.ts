/**
 * Store HTTP 客户端
 * 提供与StoreService相同的接口，但通过HTTP调用Store微服务
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { DatabaseError } from './errors.js'
import type { ApiResponse, StoreClientConfig } from './types.js'

/**
 * Store HTTP客户端
 */
export class StoreClient {
  private http: AxiosInstance
  private config: StoreClientConfig
  private isInitialized: boolean = false

  constructor(config: StoreClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    }

    this.http = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && { Authorization: `Bearer ${this.config.authToken}` })
      }
    })

    this.setupInterceptors()
  }

  /**
   * 设置HTTP拦截器
   */
  private setupInterceptors(): void {
    // 响应拦截器 - 处理API响应格式
    this.http.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (!response.data.success) {
          throw new DatabaseError(
            response.data.error?.message || 'API request failed',
            response.data.error?.code || 'API_ERROR',
            response.data.error?.details || {}
          )
        }
        return response
      },
      (error) => {
        if (error.response?.data?.error) {
          throw new DatabaseError(
            error.response.data.error.message,
            error.response.data.error.code,
            error.response.data.error.details
          )
        }
        throw new DatabaseError(
          error.message || 'Network error',
          'NETWORK_ERROR',
          { originalError: error }
        )
      }
    )
  }

  /**
   * 初始化客户端（兼容StoreService接口）
   */
  async initialize(): Promise<void> {
    try {
      // 测试连接
      await this.healthCheck()
      this.isInitialized = true
      console.log('🎉 StoreClient 初始化成功')
    } catch (error) {
      console.error('❌ StoreClient 初始化失败:', error)
      throw error
    }
  }

  /**
   * 检查是否已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new DatabaseError('客户端未初始化', 'CLIENT_NOT_INITIALIZED', {})
    }
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.config.authToken = token
    this.http.defaults.headers.Authorization = `Bearer ${token}`
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken(): void {
    delete this.config.authToken
    delete this.http.defaults.headers.Authorization
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    database: any
    timestamp: Date
    uptime: number
  }> {
    const response = await this.http.get<ApiResponse>('/health')
    return response.data.data
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    users: { total: number; active: number; new_7d: number }
    projects: { total: number; active: number }
    nodes: { total: number }
    connections: { total: number }
    aiTasks: { total: number; processing: number; completed_24h: number }
  }> {
    this.ensureInitialized()
    const response = await this.http.get<ApiResponse>('/api/system/stats')
    return response.data.data
  }

  /**
   * 缓存操作
   */
  async cache(key: string, value?: any, ttl?: number): Promise<any> {
    this.ensureInitialized()
    if (value !== undefined) {
      // 设置缓存
      const response = await this.http.post<ApiResponse>('/api/system/cache', {
        key,
        value,
        ttl
      })
      return response.data.data
    } else {
      // 获取缓存
      const response = await this.http.get<ApiResponse>(`/api/system/cache/${encodeURIComponent(key)}`)
      return response.data.data
    }
  }

  /**
   * 删除缓存
   */
  async deleteCache(keyOrPattern: string, isPattern: boolean = false): Promise<boolean> {
    this.ensureInitialized()
    const response = await this.http.delete<ApiResponse>('/api/system/cache', {
      data: { key: keyOrPattern, isPattern }
    })
    return response.data.data
  }

  /**
   * 批量操作（模拟）
   */
  async batch<T>(operations: (() => Promise<T>)[]): Promise<T[]> {
    this.ensureInitialized()
    // 简单串行执行，实际应用中可以考虑真正的批量API
    const results: T[] = []
    for (const operation of operations) {
      const result = await operation()
      results.push(result)
    }
    return results
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity(): Promise<{
    orphanedNodes: number
    orphanedConnections: number
    inconsistentVersions: number
    issues: string[]
  }> {
    this.ensureInitialized()
    const response = await this.http.post<ApiResponse>('/api/system/validate-integrity')
    return response.data.data
  }

  /**
   * 修复数据完整性问题
   */
  async repairDataIntegrity(): Promise<{
    orphanedNodesRemoved: number
    orphanedConnectionsRemoved: number
    versionsFixed: number
  }> {
    this.ensureInitialized()
    const response = await this.http.post<ApiResponse>('/api/system/repair-integrity')
    return response.data.data
  }

  /**
   * 清理操作
   */
  async cleanup(options: {
    oldTasks?: number
    oldLogs?: number
    oldArchived?: number
  } = {}): Promise<{
    tasksRemoved: number
    logsRemoved: number
    projectsRemoved: number
  }> {
    this.ensureInitialized()
    const response = await this.http.post<ApiResponse>('/api/system/cleanup', options)
    return response.data.data
  }

  /**
   * 用户仓库代理
   */
  get users() {
    this.ensureInitialized()
    return new UserRepositoryClient(this.http)
  }

  /**
   * 项目仓库代理
   */
  get projects() {
    this.ensureInitialized()
    return new ProjectRepositoryClient(this.http)
  }

  /**
   * 节点仓库代理
   */
  get nodes() {
    this.ensureInitialized()
    return new NodeRepositoryClient(this.http)
  }

  /**
   * 连接仓库代理
   */
  get connections() {
    this.ensureInitialized()
    return new ConnectionRepositoryClient(this.http)
  }

  /**
   * AI任务仓库代理
   */
  get aiTasks() {
    this.ensureInitialized()
    return new AITaskRepositoryClient(this.http)
  }

  /**
   * 数据库管理器代理（仅提供基本操作）
   */
  get database() {
    this.ensureInitialized()
    return {
      healthCheck: () => this.healthCheck(),
      query: async (sql: string, params?: any[]) => {
        const response = await this.http.post<ApiResponse>('/api/system/query', {
          sql,
          params
        })
        return response.data.data
      },
      getConnectionStatus: async () => {
        const response = await this.http.get<ApiResponse>('/api/system/connection-status')
        return response.data.data
      }
    }
  }

  /**
   * 发布实体变更事件
   */
  async publishEntityChange(event: any): Promise<void> {
    try {
      await this.http.post<ApiResponse>('/api/v1/events/entity-change', event)
    } catch (error) {
      console.warn('发布实体变更事件失败:', error)
      // 不抛出错误，允许操作继续
    }
  }

  /**
   * 关闭客户端
   */
  async close(): Promise<void> {
    this.isInitialized = false
    console.log('👋 StoreClient 已关闭')
  }
}

/**
 * 用户仓库HTTP客户端
 */
class UserRepositoryClient {
  constructor(private http: AxiosInstance) {}

  async findById(id: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/users/${id}`)
    return response.data.data
  }

  async findByEmail(email: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/users/by-email/${email}`)
    return response.data.data
  }

  async findByUsername(username: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/users/by-username/${username}`)
    return response.data.data
  }

  async findMany(filter: any = {}, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/users', {
      params: { ...filter, ...options }
    })
    return response.data.data
  }

  async create(userData: any) {
    const response = await this.http.post<ApiResponse>('/api/v1/users', userData)
    return response.data.data
  }

  async update(id: string, updateData: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/users/${id}`, updateData)
    return response.data.data
  }

  async delete(id: string) {
    await this.http.delete(`/api/v1/users/${id}`)
    return true
  }

  async authenticate(email: string, password: string) {
    const response = await this.http.post<ApiResponse>('/api/v1/users/authenticate', {
      email,
      password
    })
    return response.data.data
  }

  async verifyPassword(id: string, password: string) {
    const response = await this.http.post<ApiResponse>(`/api/v1/users/${id}/verify-password`, {
      password
    })
    return response.data.data
  }

  async updatePassword(id: string, newPassword: string) {
    const response = await this.http.put<ApiResponse>(`/api/v1/users/${id}/password`, {
      password: newPassword
    })
    return response.data.data
  }

  async updateLastLogin(id: string) {
    const response = await this.http.put<ApiResponse>(`/api/v1/users/${id}/last-login`)
    return response.data.data
  }

  async count(filter: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/users/stats', {
      params: filter
    })
    return response.data.data.total
  }

  async getNewUsers(days: number) {
    const response = await this.http.get<ApiResponse>('/api/v1/users/active', {
      params: { days }
    })
    return response.data.data
  }
}

/**
 * 项目仓库HTTP客户端
 */
class ProjectRepositoryClient {
  constructor(private http: AxiosInstance) {}

  async findById(id: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/projects/${id}`)
    return response.data.data
  }

  async findMany(filter: any = {}, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/projects', {
      params: { ...filter, ...options }
    })
    return response.data.data
  }

  async create(projectData: any) {
    const response = await this.http.post<ApiResponse>('/api/v1/projects', projectData)
    return response.data.data
  }

  async update(id: string, updateData: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/projects/${id}`, updateData)
    return response.data.data
  }

  async delete(id: string) {
    await this.http.delete(`/api/v1/projects/${id}`)
    return true
  }

  async findByUser(userId: string, options: any = {}) {
    const response = await this.http.get<ApiResponse>(`/api/v1/projects/by-user/${userId}`, {
      params: options
    })
    return response.data.data
  }

  async count(filter: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/projects/stats', {
      params: filter
    })
    return response.data.data.total
  }

  async updateLastAccessed(id: string) {
    const response = await this.http.put<ApiResponse>(`/api/v1/projects/${id}/last-accessed`)
    return response.data.data
  }

  async archive(id: string) {
    const response = await this.http.put<ApiResponse>(`/api/v1/projects/${id}/archive`)
    return response.data.data
  }

  async search(query: any, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/projects/search', {
      params: { ...query, ...options }
    })
    return response.data.data
  }

  async findWithPagination(options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/projects/paginated', {
      params: options
    })
    return response.data.data
  }
}

/**
 * 节点仓库HTTP客户端
 */
class NodeRepositoryClient {
  constructor(private http: AxiosInstance) {}

  async findById(id: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/nodes/${id}`)
    return response.data.data
  }

  async findMany(filter: any = {}, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/nodes', {
      params: { ...filter, ...options }
    })
    return response.data.data
  }

  async create(nodeData: any) {
    const response = await this.http.post<ApiResponse>('/api/v1/nodes', nodeData)
    return response.data.data
  }

  async update(id: string, updateData: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/nodes/${id}`, updateData)
    return response.data.data
  }

  async delete(id: string) {
    await this.http.delete(`/api/v1/nodes/${id}`)
    return true
  }

  async findByProject(projectId: string, options: any = {}) {
    const response = await this.http.get<ApiResponse>(`/api/v1/nodes/by-project/${projectId}`, {
      params: options
    })
    return response.data.data
  }

  async count(filter: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/nodes/stats', {
      params: filter
    })
    return response.data.data.total
  }

  async findByTags(tags: string[], options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/nodes/by-tags', {
      params: { tags: tags.join(','), ...options }
    })
    return response.data.data
  }

  async findWithPagination(options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/nodes/paginated', {
      params: options
    })
    return response.data.data
  }
}

/**
 * 连接仓库HTTP客户端
 */
class ConnectionRepositoryClient {
  constructor(private http: AxiosInstance) {}

  async findById(id: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/connections/${id}`)
    return response.data.data
  }

  async findMany(filter: any = {}, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/connections', {
      params: { ...filter, ...options }
    })
    return response.data.data
  }

  async create(connectionData: any) {
    const response = await this.http.post<ApiResponse>('/api/v1/connections', connectionData)
    return response.data.data
  }

  async update(id: string, updateData: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/connections/${id}`, updateData)
    return response.data.data
  }

  async delete(id: string) {
    await this.http.delete(`/api/v1/connections/${id}`)
    return true
  }

  async findByProject(projectId: string, options: any = {}) {
    const response = await this.http.get<ApiResponse>(`/api/v1/connections/by-project/${projectId}`, {
      params: options
    })
    return response.data.data
  }

  async count(filter: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/connections/stats', {
      params: filter
    })
    return response.data.data.total
  }
}

/**
 * AI任务仓库HTTP客户端
 */
class AITaskRepositoryClient {
  constructor(private http: AxiosInstance) {}

  async findById(id: string) {
    const response = await this.http.get<ApiResponse>(`/api/v1/ai-tasks/${id}`)
    return response.data.data
  }

  async findMany(filter: any = {}, options: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/ai-tasks', {
      params: { ...filter, ...options }
    })
    return response.data.data
  }

  async create(taskData: any) {
    const response = await this.http.post<ApiResponse>('/api/v1/ai-tasks', taskData)
    return response.data.data
  }

  async update(id: string, updateData: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/ai-tasks/${id}`, updateData)
    return response.data.data
  }

  async delete(id: string) {
    await this.http.delete(`/api/v1/ai-tasks/${id}`)
    return true
  }

  async findByProject(projectId: string, options: any = {}) {
    const response = await this.http.get<ApiResponse>(`/api/v1/ai-tasks/by-project/${projectId}`, {
      params: options
    })
    return response.data.data
  }

  async count(filter: any = {}) {
    const response = await this.http.get<ApiResponse>('/api/v1/ai-tasks/stats', {
      params: filter
    })
    return response.data.data.total
  }

  async startTask(id: string) {
    const response = await this.http.put<ApiResponse>(`/api/v1/ai-tasks/${id}/start`)
    return response.data.data
  }

  async completeTask(id: string, result: any, processingTime?: number) {
    const response = await this.http.put<ApiResponse>(`/api/v1/ai-tasks/${id}/complete`, {
      result,
      processingTime
    })
    return response.data.data
  }

  async failTask(id: string, error: any) {
    const response = await this.http.put<ApiResponse>(`/api/v1/ai-tasks/${id}/fail`, {
      error
    })
    return response.data.data
  }

  async getQueuedTasks(limit: number = 10) {
    const response = await this.http.get<ApiResponse>('/api/v1/ai-tasks/queued', {
      params: { limit }
    })
    return response.data.data
  }

  async cleanupOldTasks(daysOld: number) {
    const response = await this.http.post<ApiResponse>('/api/v1/ai-tasks/cleanup-old', {
      daysOld
    })
    return response.data.data.deletedCount
  }
}

// 导出默认配置和工厂函数
export function createStoreClient(config: StoreClientConfig): StoreClient {
  return new StoreClient(config)
}

// 导出便利工厂函数
export function createStoreClientFromEnv(): StoreClient {
  const config: StoreClientConfig = {
    baseURL: process.env.STORE_SERVICE_URL || process.env.STORE_API_URL || 'http://localhost:3001',
    ...(process.env.STORE_AUTH_TOKEN && { authToken: process.env.STORE_AUTH_TOKEN }),
    timeout: parseInt(process.env.STORE_TIMEOUT || '30000'),
    retries: parseInt(process.env.STORE_RETRIES || '3'),
    retryDelay: parseInt(process.env.STORE_RETRY_DELAY || '1000')
  }

  return new StoreClient(config)
}
