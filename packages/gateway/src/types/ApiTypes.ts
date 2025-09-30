import type { Request, Response } from 'express'

// 扩展的API请求类型
export interface ApiRequest<T = any> extends Request {
  body: T
  user?: AuthUser
  timestamp: Date
  requestId: string
  sessionId?: string
}

// 扩展的API响应类型
export interface ApiResponse<T = any> extends Response {
  success(data?: T, message?: string): void
  error(error: ApiError, status?: number): void
}

// 认证用户信息
export interface AuthUser {
  id: string
  email?: string
  role: string
  permissions: string[]
}

// API错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
  requestId: string
}

// 统一API响应格式
export interface ApiResponseBody<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp: Date
  requestId: string
}

// 分页查询参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// 节点API相关类型
export interface CreateNodeRequest {
  content: string
  position: { x: number; y: number }
  importance?: number
  tags?: string[]
  context?: string
}

export interface UpdateNodeRequest {
  content?: string
  title?: string
  importance?: number
  tags?: string[]
  position?: { x: number; y: number }
}

export interface ListNodesParams extends PaginationParams {
  search?: string
  tags?: string[]
  importance?: number[]
  status?: string[]
}

// AI API相关类型
export interface AIGenerateRequest {
  inputs: string[]
  context?: string
  type: 'generate' | 'optimize' | 'fusion'
  instruction?: string
}

export interface AIGenerateResponse {
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  metadata: {
    requestId: string
    model: string
    processingTime: number
    tokenCount: number
    error?: string
  }
}