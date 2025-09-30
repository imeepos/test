// Broker服务包的主要导出
export { MessageBroker } from './core/MessageBroker'
export { AITaskScheduler } from './scheduler/AITaskScheduler'
export { EventPublisher } from './events/EventPublisher'
export { EventSubscriber } from './events/EventSubscriber'
export { QueueManager } from './queue/QueueManager'
export { ConnectionManager } from './connection/ConnectionManager'

// 类型导出
export type { BrokerConfig } from './types/BrokerConfig'
export type { AITaskMessage, AIResultMessage } from './types/AITypes'
export type { EventMessage } from './types/EventTypes'
export type { BrokerQueueConfig, BrokerExchangeConfig } from './types/QueueTypes'

// 便捷创建函数
export { createBroker } from './factory/createBroker'

// 集成Store微服务的Broker工厂函数
export {
  createBrokerWithStore,
  createDevelopmentBrokerWithStore,
  createProductionBrokerWithStore,
  startBrokerWithStore,
  startDevelopmentBrokerWithStore,
  startProductionBrokerWithStore,
  startBrokerFromEnvironment,
  type BrokerFactoryConfig as ExtendedBrokerConfig,
  type BrokerDependencies
} from './factory/createBrokerWithStore'

// Store适配器
export { StoreAdapter, createStoreAdapter } from './adapters/StoreAdapter'
export {
  createStoreAdapterForBroker,
  createAuthenticatedStoreAdapterForBroker,
  createStoreAdapterFromEnv
} from './config/store'

// 常量和配置
export { DEFAULT_BROKER_CONFIG } from './config/defaults'