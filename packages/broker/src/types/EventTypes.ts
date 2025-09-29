// 事件相关的类型定义

// 基础事件消息
export interface EventMessage {
  eventId: string
  type: string
  source: string
  payload: any
  timestamp: Date
  correlation?: EventCorrelation
}

// 事件关联信息
export interface EventCorrelation {
  traceId?: string
  userId?: string
  sessionId?: string
  requestId?: string
  parentEventId?: string
}

// 节点事件
export interface NodeEvent extends EventMessage {
  type: 'node.created' | 'node.updated' | 'node.deleted' | 'node.optimized'
  payload: NodeEventPayload
}

export interface NodeEventPayload {
  nodeId: string
  projectId: string
  userId: string
  content?: string
  title?: string
  importance?: number
  confidence?: number
  tags?: string[]
  version?: number
  previousVersion?: number
  changes?: string[]
}

// 项目事件
export interface ProjectEvent extends EventMessage {
  type: 'project.created' | 'project.updated' | 'project.deleted' | 'project.shared'
  payload: ProjectEventPayload
}

export interface ProjectEventPayload {
  projectId: string
  userId: string
  title?: string
  description?: string
  nodeCount?: number
  collaborators?: string[]
  visibility?: 'private' | 'shared' | 'public'
}

// 用户事件
export interface UserEvent extends EventMessage {
  type: 'user.login' | 'user.logout' | 'user.register' | 'user.profile_updated'
  payload: UserEventPayload
}

export interface UserEventPayload {
  userId: string
  email?: string
  role?: string
  lastLoginAt?: Date
  profile?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// AI事件
export interface AIEvent extends EventMessage {
  type: 'ai.task_started' | 'ai.task_completed' | 'ai.task_failed' | 'ai.model_changed'
  payload: AIEventPayload
}

export interface AIEventPayload {
  taskId?: string
  nodeId?: string
  userId?: string
  taskType?: string
  model?: string
  processingTime?: number
  tokenCount?: number
  confidence?: number
  error?: {
    code: string
    message: string
    details?: any
  }
  result?: {
    content: string
    title?: string
    tags?: string[]
  }
}

// 系统事件
export interface SystemEvent extends EventMessage {
  type: 'system.health_check' | 'system.service_started' | 'system.service_stopped' | 'system.error_occurred'
  payload: SystemEventPayload
}

export interface SystemEventPayload {
  service?: string
  status?: 'healthy' | 'unhealthy' | 'starting' | 'stopping' | 'error'
  metrics?: {
    cpuUsage?: number
    memoryUsage?: number
    diskUsage?: number
    connectionCount?: number
    queueLength?: number
  }
  error?: {
    code: string
    message: string
    stack?: string
  }
  uptime?: number
  version?: string
}

// 连接事件
export interface ConnectionEvent extends EventMessage {
  type: 'connection.created' | 'connection.deleted'
  payload: ConnectionEventPayload
}

export interface ConnectionEventPayload {
  connectionId: string
  sourceNodeId: string
  targetNodeId: string
  projectId: string
  userId: string
  connectionType?: string
}

// 画布事件
export interface CanvasEvent extends EventMessage {
  type: 'canvas.state_changed' | 'canvas.view_changed' | 'canvas.zoom_changed'
  payload: CanvasEventPayload
}

export interface CanvasEventPayload {
  projectId: string
  userId: string
  viewport?: {
    x: number
    y: number
    zoom: number
  }
  displayMode?: 'overview' | 'preview' | 'detail'
  selectedNodes?: string[]
  filters?: Record<string, any>
}

// 协作事件
export interface CollaborationEvent extends EventMessage {
  type: 'collaboration.user_joined' | 'collaboration.user_left' | 'collaboration.cursor_moved'
  payload: CollaborationEventPayload
}

export interface CollaborationEventPayload {
  projectId: string
  userId: string
  userName?: string
  cursor?: {
    x: number
    y: number
  }
  activeNodeId?: string
  action?: string
}

// 事件过滤器
export interface EventFilter {
  eventTypes?: string[]
  sources?: string[]
  userId?: string
  projectId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  correlation?: Partial<EventCorrelation>
}

// 事件订阅选项
export interface EventSubscriptionOptions {
  queue?: string
  exchange?: string
  routingKey?: string
  filter?: EventFilter
  durableQueue?: boolean
  exclusiveQueue?: boolean
  autoDeleteQueue?: boolean
  deadLetterExchange?: string
  ttl?: number
  maxRetries?: number
}

// 事件发布选项
export interface EventPublishOptions {
  exchange?: string
  routingKey?: string
  priority?: number
  persistent?: boolean
  expiration?: number
  mandatory?: boolean
  immediate?: boolean
  headers?: Record<string, any>
  correlation?: EventCorrelation
}

// 事件统计
export interface EventStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySource: Record<string, number>
  averageProcessingTime: number
  errorRate: number
  lastEventAt?: Date
}

// 事件批处理
export interface EventBatch {
  batchId: string
  events: EventMessage[]
  createdAt: Date
  processedAt?: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errors?: Array<{
    eventId: string
    error: string
  }>
}