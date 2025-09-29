// 核心服务
export { StoreService, storeService } from './services/StoreService'

// 数据库配置和管理
export { DatabaseManager, databaseManager, defaultDatabaseConfig } from './config/database'
export type { DatabaseConfig } from './config/database'

// 仓库类
export { BaseRepository } from './repositories/BaseRepository'
export { UserRepository } from './repositories/UserRepository'
export { ProjectRepository } from './repositories/ProjectRepository'
export { NodeRepository } from './repositories/NodeRepository'
export { ConnectionRepository } from './repositories/ConnectionRepository'
export { AITaskRepository } from './repositories/AITaskRepository'

// 模型和类型
export type {
  // 用户相关
  User,
  UserSettings,
  UserStats,

  // 项目相关
  Project,
  ProjectStatus,
  CanvasData,
  ProjectSettings,
  ProjectStats,

  // 节点相关
  Node,
  ImportanceLevel,
  NodeStatus,
  Position,
  Size,
  NodeMetadata,
  SemanticType,
  ProcessingRecord,

  // 连接相关
  Connection,
  ConnectionType,
  ConnectionMetadata,

  // 版本历史
  NodeVersion,
  VersionChangeType,

  // AI任务
  AITask,
  AITaskType,
  AITaskStatus,
  AITaskMetadata,

  // 协作
  ProjectCollaborator,
  CollaboratorRole,
  CollaborationStatus,
  CollaboratorPermissions,

  // 活动日志
  ActivityLog,
  ActivityAction,
  ActivityTargetType,
  ActivityDetails,

  // 查询和分页
  QueryOptions,
  PaginatedResult,

  // 错误类型
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError
} from './models'

// 迁移工具
export { MigrationManager } from './migrations/migrate'

// 消息和事件
export { DataEventPublisher, createDataEventPublisher } from './messaging/DataEventPublisher'
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
} from './types/messaging'

// 工具函数
export const createStoreService = async (config?: {
  brokerUrl?: string
  databaseConfig?: any
}) => {
  const { StoreService } = await import('./services/StoreService')
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

// 常量
export const NODE_STATUS = {
  IDLE: 'idle' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  ERROR: 'error' as const,
  DELETED: 'deleted' as const
}

export const PROJECT_STATUS = {
  ACTIVE: 'active' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
  ARCHIVED: 'archived' as const
}

export const CONNECTION_TYPE = {
  INPUT: 'input' as const,
  OUTPUT: 'output' as const,
  BIDIRECTIONAL: 'bidirectional' as const,
  DEPENDENCY: 'dependency' as const,
  REFERENCE: 'reference' as const
}

export const AI_TASK_STATUS = {
  PENDING: 'pending' as const,
  QUEUED: 'queued' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const
}

export const AI_TASK_TYPE = {
  CONTENT_GENERATION: 'content_generation' as const,
  CONTENT_OPTIMIZATION: 'content_optimization' as const,
  SEMANTIC_ANALYSIS: 'semantic_analysis' as const,
  CONTENT_FUSION: 'content_fusion' as const,
  BATCH_PROCESSING: 'batch_processing' as const,
  NODE_ENHANCEMENT: 'node_enhancement' as const
}

export const SEMANTIC_TYPE = {
  REQUIREMENT: 'requirement' as const,
  SOLUTION: 'solution' as const,
  PLAN: 'plan' as const,
  ANALYSIS: 'analysis' as const,
  IDEA: 'idea' as const,
  QUESTION: 'question' as const,
  ANSWER: 'answer' as const,
  DECISION: 'decision' as const
}

export const IMPORTANCE_LEVEL = {
  VERY_LOW: 1 as const,
  LOW: 2 as const,
  MEDIUM: 3 as const,
  HIGH: 4 as const,
  VERY_HIGH: 5 as const
}

// 默认导出
export default {
  createStoreService,
  NODE_STATUS,
  PROJECT_STATUS,
  CONNECTION_TYPE,
  AI_TASK_STATUS,
  AI_TASK_TYPE,
  SEMANTIC_TYPE,
  IMPORTANCE_LEVEL
}