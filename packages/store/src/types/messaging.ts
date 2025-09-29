/**
 * Store 服务消息队列相关类型定义
 */

/**
 * 数据事件
 */
export interface DataEvent {
  id: string
  type: DataEventType
  entityType?: string
  entityId?: string
  operation: DataOperation
  data?: any
  oldData?: any
  metadata: DataEventMetadata
}

/**
 * 数据事件类型
 */
export type DataEventType =
  | 'entity_change'
  | 'bulk_change'
  | 'connection_event'
  | 'stats_update'
  | 'health_check'
  | 'aggregated_change'

/**
 * 数据操作类型
 */
export type DataOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'batch'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'check'

/**
 * 数据事件元数据
 */
export interface DataEventMetadata {
  userId?: string
  projectId?: string
  source: string
  timestamp: Date
  aggregated?: boolean
  originalEventIds?: string[]
  [key: string]: any
}

/**
 * 实体变更事件
 */
export interface EntityChangeEvent {
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  oldData?: any
  userId?: string
  projectId?: string
  metadata?: Record<string, any>
}

/**
 * 批量变更事件
 */
export interface BulkChangeEvent {
  entityType: string
  operation: 'create' | 'update' | 'delete'
  affectedCount: number
  filter: Record<string, any>
  changes?: any
  userId?: string
  projectId?: string
  metadata?: Record<string, any>
}

/**
 * 事件发布器配置
 */
export interface EventPublisherConfig {
  exchange: string
  persistent: boolean
  aggregation: EventAggregation
}

/**
 * 事件聚合配置
 */
export interface EventAggregation {
  enabled: boolean
  windowMs: number
  maxEvents: number
}

/**
 * 事件过滤器
 */
export interface EventFilter {
  name: string
  description?: string
  condition: (event: DataEvent) => boolean
  enabled: boolean
}

/**
 * 数据同步消息
 */
export interface DataSyncMessage {
  id: string
  type: DataSyncType
  sourceService: string
  targetService: string
  entityType: string
  entityId?: string
  operation: DataOperation
  data: any
  metadata: {
    timestamp: Date
    userId?: string
    projectId?: string
    syncId: string
    retryCount: number
  }
}

/**
 * 数据同步类型
 */
export type DataSyncType =
  | 'full_sync'
  | 'incremental_sync'
  | 'conflict_resolution'
  | 'rollback'

/**
 * 数据库备份事件
 */
export interface BackupEvent {
  id: string
  type: BackupEventType
  status: BackupStatus
  backupId: string
  startTime: Date
  endTime?: Date
  size?: number
  location?: string
  error?: string
  metadata: {
    trigger: 'manual' | 'scheduled' | 'system'
    userId?: string
    retentionDays: number
  }
}

/**
 * 备份事件类型
 */
export type BackupEventType = 'backup_started' | 'backup_completed' | 'backup_failed' | 'backup_restored'

/**
 * 备份状态
 */
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * 数据迁移事件
 */
export interface MigrationEvent {
  id: string
  type: MigrationEventType
  migrationName: string
  version: string
  status: MigrationStatus
  startTime: Date
  endTime?: Date
  error?: string
  metadata: {
    userId?: string
    rollbackEnabled: boolean
    affectedTables: string[]
  }
}

/**
 * 迁移事件类型
 */
export type MigrationEventType =
  | 'migration_started'
  | 'migration_completed'
  | 'migration_failed'
  | 'migration_rollback'

/**
 * 迁移状态
 */
export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back'

/**
 * 数据质量事件
 */
export interface DataQualityEvent {
  id: string
  type: DataQualityEventType
  entityType: string
  issues: DataQualityIssue[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  metadata: {
    checkId: string
    automated: boolean
    affectedRecords: number
  }
}

/**
 * 数据质量事件类型
 */
export type DataQualityEventType =
  | 'validation_failed'
  | 'integrity_violation'
  | 'orphaned_records'
  | 'duplicate_data'
  | 'missing_data'

/**
 * 数据质量问题
 */
export interface DataQualityIssue {
  type: string
  description: string
  field?: string
  value?: any
  recommendation?: string
}

/**
 * 缓存事件
 */
export interface CacheEvent {
  id: string
  type: CacheEventType
  key: string
  operation: 'get' | 'set' | 'delete' | 'clear' | 'expire'
  hit?: boolean
  size?: number
  ttl?: number
  timestamp: Date
  metadata: {
    userId?: string
    projectId?: string
    source: string
  }
}

/**
 * 缓存事件类型
 */
export type CacheEventType =
  | 'cache_hit'
  | 'cache_miss'
  | 'cache_set'
  | 'cache_delete'
  | 'cache_clear'
  | 'cache_expire'

/**
 * 性能监控事件
 */
export interface PerformanceEvent {
  id: string
  type: PerformanceEventType
  operation: string
  duration: number
  metadata: {
    userId?: string
    projectId?: string
    queryType?: string
    recordCount?: number
    cacheHit?: boolean
    timestamp: Date
  }
}

/**
 * 性能事件类型
 */
export type PerformanceEventType =
  | 'query_slow'
  | 'query_timeout'
  | 'connection_slow'
  | 'high_memory_usage'
  | 'high_cpu_usage'

/**
 * 安全事件
 */
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata: {
    action: string
    resource?: string
    result: 'success' | 'failure' | 'blocked'
    additionalInfo?: Record<string, any>
  }
}

/**
 * 安全事件类型
 */
export type SecurityEventType =
  | 'unauthorized_access'
  | 'failed_authentication'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'privilege_escalation'
  | 'sql_injection_attempt'

/**
 * 审计事件
 */
export interface AuditEvent {
  id: string
  type: AuditEventType
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValue?: any
  newValue?: any
  timestamp: Date
  metadata: {
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    requestId?: string
  }
}

/**
 * 审计事件类型
 */
export type AuditEventType =
  | 'data_access'
  | 'data_modification'
  | 'user_action'
  | 'admin_action'
  | 'system_action'

/**
 * 事件订阅配置
 */
export interface EventSubscriptionConfig {
  subscriberId: string
  eventTypes: DataEventType[]
  entityTypes?: string[]
  filters?: EventFilter[]
  handler: EventHandler
  options?: {
    autoAck?: boolean
    maxRetries?: number
    retryDelay?: number
  }
}

/**
 * 事件处理器
 */
export type EventHandler = (event: DataEvent) => Promise<void>

/**
 * 事件存储配置
 */
export interface EventStoreConfig {
  enabled: boolean
  retentionDays: number
  compressionEnabled: boolean
  indexing: {
    enabled: boolean
    fields: string[]
  }
  archiving: {
    enabled: boolean
    archiveAfterDays: number
    archiveLocation: string
  }
}

/**
 * 事件重放配置
 */
export interface EventReplayConfig {
  enabled: boolean
  maxEvents: number
  timeWindow: number
  filters?: EventFilter[]
  targetService?: string
}

/**
 * 数据一致性检查结果
 */
export interface ConsistencyCheckResult {
  id: string
  checkType: 'referential_integrity' | 'data_validation' | 'cross_service_sync'
  status: 'passed' | 'failed' | 'warning'
  issues: ConsistencyIssue[]
  timestamp: Date
  metadata: {
    tablesChecked: string[]
    recordsChecked: number
    duration: number
  }
}

/**
 * 一致性问题
 */
export interface ConsistencyIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  entityType: string
  entityId?: string
  recommendation: string
}

/**
 * 数据流监控
 */
export interface DataFlowMetrics {
  timestamp: Date
  throughput: {
    eventsPerSecond: number
    eventsPerMinute: number
    bytesPerSecond: number
  }
  latency: {
    p50: number
    p95: number
    p99: number
    avg: number
  }
  errors: {
    total: number
    rate: number
    byType: Record<string, number>
  }
  queues: {
    depth: number
    consumers: number
    messagesPerSecond: number
  }
}

/**
 * 事件路由规则
 */
export interface EventRoutingRule {
  id: string
  name: string
  condition: (event: DataEvent) => boolean
  actions: EventRoutingAction[]
  priority: number
  enabled: boolean
}

/**
 * 事件路由动作
 */
export interface EventRoutingAction {
  type: 'forward' | 'transform' | 'filter' | 'duplicate' | 'store'
  target?: string
  transformer?: (event: DataEvent) => DataEvent
  parameters?: Record<string, any>
}

/**
 * 默认事件过滤器
 */
export const defaultEventFilters: EventFilter[] = [
  {
    name: 'exclude_health_checks',
    description: '排除健康检查事件',
    condition: (event) => event.type !== 'health_check',
    enabled: true
  },
  {
    name: 'exclude_stats_updates',
    description: '排除统计更新事件',
    condition: (event) => event.type !== 'stats_update',
    enabled: false
  },
  {
    name: 'only_user_actions',
    description: '只包含用户操作',
    condition: (event) => !!event.metadata.userId,
    enabled: false
  }
]