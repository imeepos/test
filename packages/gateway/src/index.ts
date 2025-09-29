// Gateway服务包的主要导出
export { GatewayServer } from './server/GatewayServer'
export { ApiRouter } from './router/ApiRouter'
export { WebSocketManager } from './websocket/WebSocketManager'
export { AuthMiddleware } from './middleware/AuthMiddleware'
export { ValidationMiddleware } from './middleware/ValidationMiddleware'
export { RateLimitMiddleware } from './middleware/RateLimitMiddleware'
export { ErrorHandler } from './middleware/ErrorHandler'

// 类型导出
export type { GatewayConfig } from './types/GatewayConfig'
export type { ApiRequest, ApiResponse } from './types/ApiTypes'
export type { WebSocketEvent } from './types/WebSocketTypes'

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
} from './factory/createGateway'

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
} from './factory/createGatewayWithStore'

// Store配置
export {
  createStoreClientForGateway,
  createAuthenticatedStoreClient,
  getStoreConfigForEnvironment
} from './config/store'

// 常量和配置
export { DEFAULT_CONFIG } from './config/defaults'