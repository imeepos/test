// 核心服务
export { StoreService, storeService } from './services/StoreService.js'

// 注意：StoreClient 已迁移到 @sker/store-client 包
// 如需使用 HTTP 客户端，请导入 @sker/store-client

// 向后兼容性
export {
  LegacyStoreFactory,
  createStore,
  createMicroserviceStore,
  createLegacyStore,
  isMicroserviceStore,
  isLegacyStore,
  type StoreCreationOptions
} from './compatibility/LegacyStoreFactory.js'

// 数据库配置和管理
export { DatabaseManager, databaseManager, defaultDatabaseConfig } from './config/database.js'
export type { DatabaseConfig } from './config/database.js'

// 仓库类
export { BaseRepository } from './repositories/BaseRepository.js'
export { UserRepository } from './repositories/UserRepository.js'
export { ProjectRepository } from './repositories/ProjectRepository.js'
export { NodeRepository } from './repositories/NodeRepository.js'
export { ConnectionRepository } from './repositories/ConnectionRepository.js'
export { AITaskRepository } from './repositories/AITaskRepository.js'

// 迁移工具
export { MigrationManager } from './migrations/migrate.js'

// 消息和事件
export { DataEventPublisher, createDataEventPublisher } from './messaging/DataEventPublisher.js'
export type {
  DataEvent,
  DataEventType,
  DataOperation,
  DataEventMetadata,
  EntityChangeEvent,
  BulkChangeEvent,
  EventPublisherConfig,
  EventFilter,
  EventAggregation
} from './types/messaging.js'

// 工具函数
export const createStoreService = async (config?: {
  brokerUrl?: string
  databaseConfig?: any
}) => {
  const { StoreService } = await import('./services/StoreService.js')
  const service = new StoreService()
  await service.initialize(config?.brokerUrl)
  return service
}

// 验证函数
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

export const validatePassword = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
