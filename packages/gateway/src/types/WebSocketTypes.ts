// WebSocket事件类型
export interface WebSocketEvent<T = any> {
  type: string
  payload: T
  id: string
  timestamp: Date
  clientId?: string
}

// WebSocket连接信息
export interface WebSocketConnection {
  id: string
  socket: any // Socket.IO Socket类型
  userId?: string
  connected: boolean
  connectedAt: Date
  lastActivity: Date
  subscriptions: Set<string>
}

// WebSocket消息类型枚举
export enum WebSocketEventType {
  // 连接管理
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',

  // AI处理相关
  AI_GENERATE_REQUEST = 'AI_GENERATE_REQUEST',
  AI_GENERATE_RESPONSE = 'AI_GENERATE_RESPONSE',
  AI_GENERATE_ERROR = 'AI_GENERATE_ERROR',
  AI_GENERATE_PROGRESS = 'AI_GENERATE_PROGRESS',

  // 节点操作相关
  NODE_CREATED = 'NODE_CREATED',
  NODE_UPDATED = 'NODE_UPDATED',
  NODE_DELETED = 'NODE_DELETED',
  NODE_OPTIMIZED = 'NODE_OPTIMIZED',

  // 连接线相关
  CONNECTION_CREATED = 'CONNECTION_CREATED',
  CONNECTION_DELETED = 'CONNECTION_DELETED',

  // 画布操作相关
  CANVAS_STATE_CHANGED = 'CANVAS_STATE_CHANGED',
  COLLABORATION_UPDATE = 'COLLABORATION_UPDATE',

  // 错误和状态
  ERROR = 'ERROR',
  STATUS_UPDATE = 'STATUS_UPDATE'
}

// AI处理进度事件
export interface AIProgressEvent {
  requestId: string
  stage: 'queued' | 'processing' | 'generating' | 'completed' | 'error'
  progress: number // 0-100
  message?: string
  estimatedTimeRemaining?: number
}

// 节点操作事件
export interface NodeOperationEvent {
  nodeId: string
  operation: 'create' | 'update' | 'delete' | 'optimize'
  data: any
  userId?: string
}

// 画布状态事件
export interface CanvasStateEvent {
  viewport: { x: number; y: number; zoom: number }
  selectedNodes: string[]
  displayMode: 'overview' | 'preview' | 'detail'
  userId?: string
}

// WebSocket认证载荷
export interface WebSocketAuthPayload {
  token: string
  userId: string
  sessionId?: string
}

// WebSocket订阅管理
export interface WebSocketSubscription {
  clientId: string
  channel: string
  filters?: Record<string, any>
}