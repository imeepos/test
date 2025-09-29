// 用户相关模型
export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  avatar_url?: string
  settings: UserSettings
  created_at: Date
  updated_at: Date
  last_login_at?: Date
  is_active: boolean
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: {
    email: boolean
    push: boolean
    task_completion: boolean
    collaboration: boolean
  }
  ai_preferences: {
    default_model: string
    temperature: number
    max_tokens: number
  }
}

// 项目相关模型
export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  status: ProjectStatus
  canvas_data: CanvasData
  settings: ProjectSettings
  created_at: Date
  updated_at: Date
  last_accessed_at: Date
  is_archived: boolean
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface CanvasData {
  viewport: {
    x: number
    y: number
    zoom: number
  }
  config: {
    maxZoom: number
    minZoom: number
    gridSize: number
    snapToGrid: boolean
    showGrid: boolean
  }
}

export interface ProjectSettings {
  collaboration: {
    enabled: boolean
    permissions: 'view' | 'edit' | 'admin'
  }
  ai_assistance: {
    enabled: boolean
    auto_optimize: boolean
    suggestion_level: 'minimal' | 'moderate' | 'aggressive'
  }
  version_control: {
    enabled: boolean
    auto_save_interval: number
  }
}

// 节点相关模型
export interface Node {
  id: string
  project_id: string
  user_id: string
  content: string
  title?: string
  importance: ImportanceLevel
  confidence: number
  status: NodeStatus
  tags: string[]
  version: number
  position: Position
  size?: Size
  metadata: NodeMetadata
  parent_id?: string // 用于层次结构
  created_at: Date
  updated_at: Date
  ai_generated: boolean
}

export type ImportanceLevel = 1 | 2 | 3 | 4 | 5
export type NodeStatus = 'idle' | 'processing' | 'completed' | 'error' | 'deleted'

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface NodeMetadata {
  semantic_types: SemanticType[]
  user_rating?: number
  ai_rating?: number
  edit_count: number
  last_edit_reason?: string
  processing_history: ProcessingRecord[]
  statistics: {
    view_count: number
    edit_duration_total: number
    ai_interactions: number
  }
}

export type SemanticType =
  | 'requirement'
  | 'solution'
  | 'plan'
  | 'analysis'
  | 'idea'
  | 'question'
  | 'answer'
  | 'decision'

export interface ProcessingRecord {
  timestamp: Date
  operation: string
  model_used?: string
  token_count?: number
  processing_time: number
  confidence_before?: number
  confidence_after?: number
}

// 连接关系模型
export interface Connection {
  id: string
  project_id: string
  source_node_id: string
  target_node_id: string
  type: ConnectionType
  label?: string
  weight: number // 连接强度 0-1
  metadata: ConnectionMetadata
  created_at: Date
  updated_at: Date
  created_by_user: boolean // 是否为用户手动创建
}

export type ConnectionType = 'input' | 'output' | 'bidirectional' | 'dependency' | 'reference'

export interface ConnectionMetadata {
  ai_suggested: boolean
  confidence: number
  reasoning?: string
  validation_status: 'pending' | 'accepted' | 'rejected'
}

// 节点版本历史
export interface NodeVersion {
  id: string
  node_id: string
  version_number: number
  content: string
  confidence: number
  change_reason?: string
  change_type: VersionChangeType
  created_at: Date
  created_by: string // user_id 或 'ai'
  metadata: {
    diff_summary?: string
    processing_info?: any
    rollback_point: boolean
  }
}

export type VersionChangeType = 'create' | 'edit' | 'optimize' | 'ai_enhance' | 'merge' | 'rollback'

// AI任务记录
export interface AITask {
  id: string
  project_id: string
  user_id: string
  type: AITaskType
  status: AITaskStatus
  input_data: any
  result_data?: any
  error_info?: any
  metadata: AITaskMetadata
  created_at: Date
  started_at?: Date
  completed_at?: Date
  estimated_cost: number
  actual_cost?: number
}

export type AITaskType =
  | 'content_generation'
  | 'content_optimization'
  | 'semantic_analysis'
  | 'content_fusion'
  | 'batch_processing'
  | 'node_enhancement'

export type AITaskStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface AITaskMetadata {
  model_used: string
  token_count_input: number
  token_count_output?: number
  processing_time?: number
  confidence?: number
  quality_score?: number
  retry_count: number
  priority: number
}

// 协作相关模型
export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: CollaboratorRole
  permissions: CollaboratorPermissions
  invited_by: string
  invited_at: Date
  joined_at?: Date
  last_activity_at?: Date
  status: CollaborationStatus
}

export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type CollaborationStatus = 'invited' | 'active' | 'inactive' | 'removed'

export interface CollaboratorPermissions {
  can_view: boolean
  can_edit_nodes: boolean
  can_create_nodes: boolean
  can_delete_nodes: boolean
  can_manage_connections: boolean
  can_use_ai: boolean
  can_invite_others: boolean
  can_modify_settings: boolean
}

// 活动日志
export interface ActivityLog {
  id: string
  project_id: string
  user_id: string
  action: ActivityAction
  target_type: ActivityTargetType
  target_id: string
  details: ActivityDetails
  ip_address?: string
  user_agent?: string
  created_at: Date
}

export type ActivityAction =
  | 'create' | 'update' | 'delete'
  | 'view' | 'export' | 'import'
  | 'collaborate' | 'ai_process'

export type ActivityTargetType =
  | 'project' | 'node' | 'connection'
  | 'user' | 'ai_task' | 'version'

export interface ActivityDetails {
  description: string
  changes?: Record<string, { from: any; to: any }>
  metadata?: any
}

// 数据库查询选项
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  filters?: Record<string, any>
  include?: string[] // 关联查询
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 统计信息
export interface ProjectStats {
  node_count: number
  connection_count: number
  avg_importance: number
  avg_confidence: number
  ai_task_count: number
  total_ai_cost: number
  activity_count_7d: number
  last_activity_at: Date
}

export interface UserStats {
  project_count: number
  node_count_total: number
  ai_task_count_total: number
  total_ai_cost: number
  collaboration_count: number
  account_age_days: number
}

// 错误类型
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(
    resource: string,
    id: string
  ) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(action: string, resource: string) {
    super(`Unauthorized to ${action} ${resource}`)
    this.name = 'UnauthorizedError'
  }
}