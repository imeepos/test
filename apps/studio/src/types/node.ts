// AI节点核心类型
export interface AINode {
  id: string
  content: string
  title?: string
  importance: ImportanceLevel
  confidence: number
  status: NodeStatus
  tags: string[]
  version: number
  position: Position
  size?: Size
  connections: Connection[]
  metadata: NodeMetadata
  createdAt: Date
  updatedAt: Date
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
}

// 连接类型
export type ConnectionType = 'input' | 'output' | 'bidirectional'

// 节点元数据
export interface NodeMetadata {
  semantic: SemanticType[]
  userRating?: number
  aiRating?: number
  editCount: number
  lastEditReason?: string
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

// 节点版本历史
export interface NodeVersion {
  version: number
  content: string
  confidence: number
  createdAt: Date
  reason?: string
  type: 'experiment' | 'improvement' | 'detail'
}

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