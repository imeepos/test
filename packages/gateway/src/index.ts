// Gateway服务包的主要导出
export { GatewayServer } from './server/GatewayServer.js'
export { WebSocketManager } from './websocket/WebSocketManager.js'
export { AuthMiddleware } from './middleware/AuthMiddleware.js'
export { ValidationMiddleware } from './middleware/ValidationMiddleware.js'
export { RateLimitMiddleware } from './middleware/RateLimitMiddleware.js'
export { ErrorHandler } from './middleware/ErrorHandler.js'

// 路由器导出 - 新的模块化架构
export {
  ApiRouter,
  BaseRouter,
  NodeRouter,
  AIRouter,
  ProjectRouter,
  UserRouter
} from './router/index.js'

export type {
  RouterDependencies,
  RouteHandler,
  RouteMap
} from './router/index.js'

// 类型导出
export type { GatewayConfig } from './types/GatewayConfig.js'
export type { ApiRequest, ApiResponse } from './types/ApiTypes.js'
export type { WebSocketEvent } from './types/WebSocketTypes.js'

// 便捷创建函数
export {
  createGateway,
  createDevelopmentGateway,
  createProductionGateway,
  createTestGateway,
  startGateway,
  startDevelopmentGateway,
  startProductionGateway,
  type GatewayDependencies
} from './factory/createGateway.js'

// 集成Store微服务的Gateway工厂函数
export {
  createGatewayWithStore,
  createDevelopmentGatewayWithStore,
  createProductionGatewayWithStore,
  startGatewayWithStore,
  startDevelopmentGatewayWithStore,
  startProductionGatewayWithStore,
  startGatewayFromEnvironment,
  type ExtendedGatewayDependencies
} from './factory/createGatewayWithStore.js'

// Store配置
export {
  createStoreClientForGateway,
  createAuthenticatedStoreClient,
  getStoreConfigForEnvironment
} from './config/store.js'

// 常量和配置
export { DEFAULT_CONFIG } from './config/defaults.js'