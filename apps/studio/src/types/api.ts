// API相关类型定义

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp: Date
}

// API错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
  status: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// API请求配置
export interface ApiConfig {
  baseUrl: string
  timeout: number
  retries: number
  headers?: Record<string, string>
}

// 节点API端点
export interface NodeApiEndpoints {
  create: (data: CreateNodeRequest) => Promise<ApiResponse<AINode>>
  update: (id: string, data: UpdateNodeRequest) => Promise<ApiResponse<AINode>>
  delete: (id: string) => Promise<ApiResponse<void>>
  get: (id: string) => Promise<ApiResponse<AINode>>
  list: (params?: ListNodesParams) => Promise<ApiResponse<PaginatedResponse<AINode>>>
}

// 创建节点请求
export interface CreateNodeRequest {
  content: string
  position: Position
  importance?: ImportanceLevel
  tags?: string[]
  context?: string
}

// 更新节点请求
export interface UpdateNodeRequest {
  content?: string
  importance?: ImportanceLevel
  tags?: string[]
  position?: Position
}

// 节点列表查询参数
export interface ListNodesParams {
  search?: string
  tags?: string[]
  importance?: ImportanceLevel[]
  status?: NodeStatus[]
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'importance' | 'confidence'
  sortOrder?: 'asc' | 'desc'
}

// WebSocket连接状态
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected'

// WebSocket消息类型
export interface WebSocketMessage<T = any> {
  type: string
  payload: T
  id: string
  timestamp: Date
}

// 导出/导入相关类型
export interface ExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'png'
  includeMetadata: boolean
  includeConnections: boolean
}

export interface ImportOptions {
  format: 'json' | 'markdown'
  mergeStrategy: 'overwrite' | 'merge' | 'skip'
}

// 重新导入类型以避免循环依赖
import type { AINode, ImportanceLevel, NodeStatus, Position } from './node'