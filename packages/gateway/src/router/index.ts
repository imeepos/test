// 基础路由器
export { BaseRouter } from './BaseRouter.js'
export type { RouterDependencies } from './BaseRouter.js'

// 功能路由器
export { NodeRouter } from './NodeRouter.js'
export { AIRouter } from './AIRouter.js'
export { ProjectRouter } from './ProjectRouter.js'
export { UserRouter } from './UserRouter.js'

// 主路由器
export { ApiRouter } from './ApiRouter.js'

// 便捷的导出类型
export type {
  ApiRequest,
  ApiResponse
} from '../types/ApiTypes.js'

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
} from '../types/SpecificTypes.js'