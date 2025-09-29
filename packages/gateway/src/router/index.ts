// 基础路由器
export { BaseRouter } from './BaseRouter'
export type { RouterDependencies } from './BaseRouter'

// 功能路由器
export { NodeRouter } from './NodeRouter'
export { AIRouter } from './AIRouter'
export { ProjectRouter } from './ProjectRouter'
export { UserRouter } from './UserRouter'

// 主路由器
export { ApiRouter } from './ApiRouter'

// 便捷的导出类型
export type {
  ApiRequest,
  ApiResponse
} from '../types/ApiTypes'

export type {
  RouteHandler,
  RouteMap,
  NodeSearchQuery,
  ProjectSearchQuery,
  NodeVersionQuery,
  NodeCreateData,
  NodeUpdateData,
  ProjectCreateData,
  ProjectUpdateData,
  LoginRequest,
  ProfileUpdateRequest,
  RefreshTokenRequest,
  NodeRollbackRequest,
  BatchGenerateRequest,
  QueryOptions
} from '../types/SpecificTypes'