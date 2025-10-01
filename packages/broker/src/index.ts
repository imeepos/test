// Broker服务包的主要导出
export { MessageBroker } from './core/MessageBroker.js'
export { AITaskScheduler } from './scheduler/AITaskScheduler.js'
export { EventPublisher } from './events/EventPublisher.js'
export { EventSubscriber } from './events/EventSubscriber.js'
export { QueueManager } from './queue/QueueManager.js'
export { ConnectionManager } from './connection/ConnectionManager.js'

// 类型导出
export type { BrokerConfig } from './types/BrokerConfig.js'
export type { AITaskMessage, AIResultMessage } from './types/AITypes.js'
export type { EventMessage } from './types/EventTypes.js'
export type { BrokerQueueConfig, BrokerExchangeConfig } from './types/QueueTypes.js'

// 便捷创建函数
export { createBroker } from './factory/createBroker.js'

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
} from './factory/createBrokerWithStore.js'

// Store适配器
export { StoreAdapter, createStoreAdapter } from './adapters/StoreAdapter.js'
export {
  createStoreAdapterForBroker,
  createAuthenticatedStoreAdapterForBroker,
  createStoreAdapterFromEnv
} from './config/store.js'

// 常量和配置
export { DEFAULT_BROKER_CONFIG } from './config/defaults.js'