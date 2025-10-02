/**
 * 领域事件类型定义
 *
 * 所有事件的类型定义，用于类型安全的事件总线
 */

// ========================================
// AI 任务事件
// ========================================

/**
 * AI 任务已排队事件
 */
export interface AITaskQueuedEvent {
  /** 任务ID */
  taskId: string
  /** 节点ID */
  nodeId: string
  /** 项目ID */
  projectId: string
  /** 用户ID */
  userId: string
  /** 优先级 */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * AI 任务处理中事件
 */
export interface AITaskProcessingEvent {
  /** 任务ID */
  taskId: string
  /** 节点ID */
  nodeId: string
  /** 处理进度 (0-100) */
  progress: number
  /** 进度消息 */
  message?: string
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * AI 任务已完成事件
 */
export interface AITaskCompletedEvent {
  /** 任务ID */
  taskId: string
  /** 节点ID */
  nodeId: string
  /** 处理结果 */
  result: {
    /** 生成的内容 */
    content: string
    /** 生成的标题 */
    title: string
    /** 语义类型（可选） */
    semanticType?: string
    /** 重要性级别（可选） */
    importanceLevel?: number
    /** 置信度 (0-1) */
    confidence: number
  }
  /** 处理耗时（毫秒） */
  processingTime: number
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * AI 任务失败事件
 */
export interface AITaskFailedEvent {
  /** 任务ID */
  taskId: string
  /** 节点ID */
  nodeId: string
  /** 错误信息 */
  error: {
    /** 错误代码 */
    code: string
    /** 错误消息 */
    message: string
    /** 是否可重试 */
    retryable: boolean
    /** 详细信息（可选） */
    details?: unknown
  }
  /** 事件时间戳 */
  timestamp: Date
}

// ========================================
// 节点事件
// ========================================

/**
 * 节点已创建事件
 */
export interface NodeCreatedEvent {
  /** 节点ID */
  nodeId: string
  /** 项目ID */
  projectId: string
  /** 用户ID */
  userId: string
  /** 节点位置 */
  position: {
    x: number
    y: number
  }
  /** 是否由AI生成 */
  aiGenerated: boolean
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 节点已更新事件
 */
export interface NodeUpdatedEvent {
  /** 节点ID */
  nodeId: string
  /** 项目ID */
  projectId: string
  /** 变更字段 */
  changes: Record<string, unknown>
  /** 更新前版本号 */
  previousVersion: number
  /** 更新后版本号 */
  newVersion: number
  /** 更新原因（可选） */
  reason?: string
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 节点已删除事件
 */
export interface NodeDeletedEvent {
  /** 节点ID */
  nodeId: string
  /** 项目ID */
  projectId: string
  /** 删除原因（可选） */
  reason?: string
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 节点状态变更事件
 */
export interface NodeStatusChangedEvent {
  /** 节点ID */
  nodeId: string
  /** 项目ID */
  projectId: string
  /** 旧状态 */
  oldStatus: 'idle' | 'processing' | 'completed' | 'error' | 'deleted'
  /** 新状态 */
  newStatus: 'idle' | 'processing' | 'completed' | 'error' | 'deleted'
  /** 变更原因（可选） */
  reason?: string
  /** 事件时间戳 */
  timestamp: Date
}

// ========================================
// 连接事件
// ========================================

/**
 * 连接已创建事件
 */
export interface ConnectionCreatedEvent {
  /** 连接ID */
  connectionId: string
  /** 源节点ID */
  sourceNodeId: string
  /** 目标节点ID */
  targetNodeId: string
  /** 项目ID */
  projectId: string
  /** 连接类型（可选） */
  type?: 'flow' | 'reference' | 'dependency'
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 连接已删除事件
 */
export interface ConnectionDeletedEvent {
  /** 连接ID */
  connectionId: string
  /** 源节点ID */
  sourceNodeId: string
  /** 目标节点ID */
  targetNodeId: string
  /** 项目ID */
  projectId: string
  /** 事件时间戳 */
  timestamp: Date
}

// ========================================
// 项目事件
// ========================================

/**
 * 项目已创建事件
 */
export interface ProjectCreatedEvent {
  /** 项目ID */
  projectId: string
  /** 用户ID */
  userId: string
  /** 项目名称 */
  name: string
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 项目已更新事件
 */
export interface ProjectUpdatedEvent {
  /** 项目ID */
  projectId: string
  /** 变更字段 */
  changes: Record<string, unknown>
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 项目已删除事件
 */
export interface ProjectDeletedEvent {
  /** 项目ID */
  projectId: string
  /** 用户ID */
  userId: string
  /** 事件时间戳 */
  timestamp: Date
}

// ========================================
// 系统事件
// ========================================

/**
 * 系统健康检查事件
 */
export interface SystemHealthCheckEvent {
  /** 服务名称 */
  service: string
  /** 健康状态 */
  status: 'healthy' | 'degraded' | 'unhealthy'
  /** 检查详情 */
  details?: Record<string, unknown>
  /** 事件时间戳 */
  timestamp: Date
}

/**
 * 系统错误事件
 */
export interface SystemErrorEvent {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误堆栈（可选） */
  stack?: string
  /** 错误上下文 */
  context?: Record<string, unknown>
  /** 事件时间戳 */
  timestamp: Date
}
