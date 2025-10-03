// AI节点核心类型
export interface AINode {
  id: string
  content: string
  title?: string
  importance: ImportanceLevel
  confidence: number // 0-100 置信度百分比，与后端保持一致
  status: NodeStatus
  tags: string[]
  version: number
  position: Position
  size?: Size
  connections: Connection[]
  metadata: NodeMetadata
  createdAt: Date
  updatedAt: Date
  semantic_type?: SemanticType // 语义类型，与后端SemanticType对齐
  user_rating?: number // 0-5 用户评分
}

// 节点重要性等级
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5

// 节点状态枚举
export type NodeStatus = 'idle' | 'processing' | 'completed' | 'error'

// 节点位置
export interface Position {
  x: number
  y: number
}

// 节点尺寸
export interface Size {
  width: number
  height: number
}

// 节点连接关系
export interface Connection {
  id: string
  sourceId: string
  targetId: string
  type: ConnectionType
  style?: EdgeStyle
  metadata?: {
    remoteId?: string
    status?: 'pending' | 'synced' | 'error'
    type?: string
    weight?: number
    bidirectional?: boolean
    error?: string
  }
}

// 连接类型
export type ConnectionType = 'input' | 'output' | 'bidirectional'

// 连线样式配置
export interface EdgeStyle {
  stroke?: string // 连线颜色
  strokeWidth?: number // 连线粗细
  strokeDasharray?: string // 虚线样式，如 "5,5" 表示虚线
  animated?: boolean // 是否动画
  type?: EdgeType // 连线类型
}

// 连线类型
export type EdgeType = 'straight' | 'smoothstep' | 'step' | 'bezier'

// 连线样式预设
export const EdgeStylePresets = {
  solid: {
    stroke: '#6366f1',
    strokeWidth: 2,
    strokeDasharray: undefined,
    animated: false,
    type: 'smoothstep' as EdgeType
  },
  dashed: {
    stroke: '#6366f1',
    strokeWidth: 2,
    strokeDasharray: '8,4',
    animated: false,
    type: 'smoothstep' as EdgeType
  },
  dotted: {
    stroke: '#6366f1',
    strokeWidth: 2,
    strokeDasharray: '2,3',
    animated: false,
    type: 'smoothstep' as EdgeType
  },
  thick: {
    stroke: '#6366f1',
    strokeWidth: 4,
    strokeDasharray: undefined,
    animated: false,
    type: 'smoothstep' as EdgeType
  },
  thin: {
    stroke: '#6366f1',
    strokeWidth: 1,
    strokeDasharray: undefined,
    animated: false,
    type: 'smoothstep' as EdgeType
  }
} as const

// 连线样式预设名称
export type EdgeStylePresetName = keyof typeof EdgeStylePresets

// 节点元数据
export interface NodeMetadata {
  semantic: SemanticType[] // 保持兼容性，后续可能迁移到semantic_type字段
  editCount: number
  lastEditReason?: string
  lastModified?: Date
  autoSaved?: boolean
  userRating?: number
  fusionSource?: string[]
  fusionType?: 'summary' | 'synthesis' | 'comparison'
  error?: string
  // 处理历史记录
  processingHistory?: ProcessingRecord[]
  // 统计信息
  statistics?: {
    viewCount: number
    editDurationTotal: number
    aiInteractions: number
  }
}

// 语义类型
export type SemanticType =
  | 'requirement'
  | 'solution'
  | 'plan'
  | 'analysis'
  | 'idea'
  | 'question'
  | 'answer'
  | 'decision'
  | 'fusion'
  | 'summary'
  | 'synthesis'
  | 'comparison'
  | 'fusion-error'

// 处理记录类型
export interface ProcessingRecord {
  timestamp: Date
  operation: string
  modelUsed?: string
  tokenCount?: number
  processingTime: number
  confidenceBefore?: number
  confidenceAfter?: number
}

// 节点版本历史
export interface NodeVersion {
  id: string
  nodeId: string
  version: number
  content: string
  confidence: number // 0-100 置信度百分比
  changeReason?: string
  changeType: VersionChangeType
  createdAt: Date
  createdBy: string // user_id 或 'ai'
  metadata: {
    diffSummary?: string
    processingInfo?: any
    rollbackPoint: boolean
  }
}

// 版本变更类型
export type VersionChangeType =
  | 'create'
  | 'edit'
  | 'optimize'
  | 'ai_enhance'
  | 'merge'
  | 'rollback'

// 节点编辑操作
export interface NodeEdit {
  id: string
  type: 'create' | 'update' | 'delete' | 'optimize'
  data: Partial<AINode>
  timestamp: Date
}

// 置信度等级
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// 节点创建选项
export interface CreateNodeOptions {
  position: Position
  inputs?: string[]
  context?: string
  template?: NodeTemplate
}

// 节点模板
export interface NodeTemplate {
  name: string
  content: string
  importance: ImportanceLevel
  tags: string[]
}
