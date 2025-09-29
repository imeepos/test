/**
 * 专用类型定义 - 避免使用any类型
 */

// 节点查询参数
export interface NodeSearchQuery {
  q?: string
  project_id?: string
  user_id?: string
  type?: string
  status?: string | string[]
  tags?: string | string[]
  importance_min?: string | number
  importance_max?: string | number
  page?: string | number
  pageSize?: string | number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

// 项目查询参数
export interface ProjectSearchQuery {
  user_id?: string
  status?: string
  archived?: string
  search?: string
  page?: string | number
  pageSize?: string | number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

// 节点版本查询参数
export interface NodeVersionQuery {
  limit?: string | number
  offset?: string | number
  include_content?: string | boolean
}

// 删除查询参数
export interface DeleteQuery {
  permanent?: string | boolean
}

// 节点创建数据
export interface NodeCreateData {
  title?: string
  content?: string
  project_id: string
  parent_id?: string
  type?: string
  position?: { x: number; y: number }
  importance?: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

// 节点更新数据
export interface NodeUpdateData {
  title?: string
  content?: string
  type?: string
  position?: { x: number; y: number }
  importance?: number
  tags?: string[]
  status?: string
  metadata?: Record<string, unknown>
  updated_at?: Date
}

// 项目创建数据
export interface ProjectCreateData {
  name: string
  description?: string
  canvas_data?: Record<string, unknown>
  settings?: Record<string, unknown>
  is_archived?: boolean
  status?: string
}

// 项目更新数据
export interface ProjectUpdateData {
  name?: string
  description?: string
  status?: string
  canvas_data?: Record<string, unknown>
  settings?: Record<string, unknown>
  is_archived?: boolean
  updated_at?: Date
}

// 用户登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 用户资料更新请求
export interface ProfileUpdateRequest {
  name?: string
  bio?: string
  avatar?: string
  preferences?: Record<string, unknown>
  current_password?: string
  new_password?: string
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refresh_token: string
}

// JWT载荷
export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

// 刷新令牌载荷
export interface RefreshTokenPayload {
  userId: string
  type: 'refresh'
  iat: number
  exp: number
}

// 批量生成请求
export interface BatchGenerateRequest {
  requests: Array<{
    prompt?: string
    inputs?: string[]
    model?: string
    maxTokens?: number
    temperature?: number
  }>
  options?: {
    parallel?: boolean
    failFast?: boolean
    maxConcurrency?: number
    priority?: string
    maxBatchSize?: number
  }
  projectId?: string
}

// 节点回滚请求
export interface NodeRollbackRequest {
  version_number: number
  change_description?: string
}

// 数据库查询选项
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  filters?: Record<string, unknown>
}

// 路由处理器类型
export type RouteHandler = (req: Request, res: Response) => void | Promise<void>

// 路由映射类型
export type RouteMap = Map<string, RouteHandler>

// AI引擎提供者配置
export interface AIProvider {
  models?: string[]
  enabled?: boolean
  config?: Record<string, unknown>
}

// AI配置类型
export interface AIConfig {
  providers?: Record<string, AIProvider>
}