import { Node, Edge } from 'reactflow'

// 画布位置和视图状态
export interface Viewport {
  x: number
  y: number
  zoom: number
}

// 画布显示模式
export type ViewMode = 'preview' | 'detail'

// 画布控制状态
export interface CanvasControls {
  zoomLevel: number
  viewMode: ViewMode
  isFullscreen: boolean
}

// 画布统计数据
export interface CanvasStats {
  nodeCount: number
  averageImportance: number
  averageConfidence: number
}

// 画布配置选项
export interface CanvasConfig {
  maxZoom: number
  minZoom: number
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
}

// React Flow 节点位置
export interface Position {
  x: number
  y: number
}

// 扩展的 React Flow 类型
export type CanvasNode = Node<AINodeData>
export type CanvasEdge = Edge

// AI节点数据类型
export interface AINodeData {
  id: string
  content: string
  title?: string
  importance: 1 | 2 | 3 | 4 | 5
  confidence: number
  status: 'idle' | 'processing' | 'completed' | 'error'
  tags: string[]
  version: number
  createdAt: Date
  updatedAt: Date
}