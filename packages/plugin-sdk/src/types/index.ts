// 核心类型定义

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件唯一标识符 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description: string
  /** 插件作者 */
  author: string
  /** 插件类型 */
  type: PluginType
  /** 所需权限 */
  permissions: PluginPermission[]
  /** 依赖的SDK版本 */
  sdkVersion: string
  /** 依赖的引擎版本 */
  engineVersion: string
  /** 插件入口文件 */
  entry: string
  /** 插件图标 */
  icon?: string
  /** 插件标签 */
  tags?: string[]
  /** 插件主页 */
  homepage?: string
  /** 插件仓库 */
  repository?: string
}

/**
 * 插件类型
 */
export type PluginType =
  | 'component'     // UI组件插件
  | 'ai-processor'  // AI处理器插件
  | 'exporter'      // 导出器插件
  | 'tool'          // 工具插件
  | 'theme'         // 主题插件

/**
 * 插件权限
 */
export type PluginPermission =
  | 'canvas.read'         // 读取画布内容
  | 'canvas.write'        // 修改画布内容
  | 'component.create'    // 创建组件
  | 'component.modify'    // 修改组件
  | 'component.delete'    // 删除组件
  | 'ai.request'          // 调用AI服务
  | 'storage.read'        // 读取存储
  | 'storage.write'       // 写入存储
  | 'network.request'     // 网络请求
  | 'file.read'           // 读取文件
  | 'file.write'          // 写入文件

/**
 * 节点数据结构
 */
export interface NodeData {
  /** 节点ID */
  id: string
  /** 节点类型 */
  type: string
  /** 节点标题 */
  title: string
  /** 节点内容 */
  content: string
  /** 节点位置 */
  position: Position
  /** 节点大小 */
  size?: Size
  /** 节点样式 */
  style?: NodeStyle
  /** 节点元数据 */
  metadata?: Record<string, any>
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 位置信息
 */
export interface Position {
  x: number
  y: number
}

/**
 * 尺寸信息
 */
export interface Size {
  width: number
  height: number
}

/**
 * 节点样式
 */
export interface NodeStyle {
  /** 背景颜色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框宽度 */
  borderWidth?: number
  /** 圆角大小 */
  borderRadius?: number
  /** 字体大小 */
  fontSize?: number
  /** 字体粗细 */
  fontWeight?: string
  /** 透明度 */
  opacity?: number
  /** 阴影 */
  boxShadow?: string
}

/**
 * 连接线数据结构
 */
export interface EdgeData {
  /** 连接线ID */
  id: string
  /** 源节点ID */
  sourceId: string
  /** 目标节点ID */
  targetId: string
  /** 连接线类型 */
  type: EdgeType
  /** 连接线样式 */
  style?: EdgeStyle
  /** 连接线标签 */
  label?: string
  /** 连接线数据 */
  data?: Record<string, any>
}

/**
 * 连接线类型
 */
export type EdgeType = 'straight' | 'bezier' | 'step'

/**
 * 连接线样式
 */
export interface EdgeStyle {
  /** 线条颜色 */
  stroke?: string
  /** 线条宽度 */
  strokeWidth?: number
  /** 线条类型 */
  strokeDasharray?: string
}

/**
 * 画布数据结构
 */
export interface CanvasData {
  /** 画布ID */
  id: string
  /** 画布名称 */
  name: string
  /** 节点列表 */
  nodes: NodeData[]
  /** 连接线列表 */
  edges: EdgeData[]
  /** 画布视图状态 */
  viewport: ViewportState
  /** 画布元数据 */
  metadata?: Record<string, any>
}

/**
 * 视图状态
 */
export interface ViewportState {
  /** 缩放比例 */
  zoom: number
  /** 偏移位置 */
  offset: Position
}

/**
 * AI请求参数
 */
export interface AIRequest {
  /** 请求类型 */
  type: AIRequestType
  /** 请求内容 */
  content: string
  /** 上下文信息 */
  context?: Record<string, any>
  /** 配置参数 */
  options?: AIOptions
}

/**
 * AI请求类型
 */
export type AIRequestType =
  | 'generate'      // 内容生成
  | 'analyze'       // 内容分析
  | 'optimize'      // 内容优化
  | 'translate'     // 内容翻译
  | 'summarize'     // 内容摘要

/**
 * AI配置选项
 */
export interface AIOptions {
  /** 模型名称 */
  model?: string
  /** 温度参数 */
  temperature?: number
  /** 最大输出长度 */
  maxTokens?: number
  /** 停止词 */
  stopSequences?: string[]
}

/**
 * AI响应结果
 */
export interface AIResponse {
  /** 响应内容 */
  content: string
  /** 置信度 */
  confidence: number
  /** 使用的token数量 */
  tokensUsed: number
  /** 响应时间 */
  responseTime: number
  /** 错误信息 */
  error?: string
}

/**
 * 存储键值对
 */
export interface StorageItem {
  key: string
  value: any
  expiresAt?: number
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件名 */
  name: string
  /** 文件大小 */
  size: number
  /** 文件类型 */
  type: string
  /** 最后修改时间 */
  lastModified: number
  /** 文件内容 */
  content?: string | ArrayBuffer
}

/**
 * 事件数据
 */
export interface EventData {
  /** 事件类型 */
  type: string
  /** 事件数据 */
  data: any
  /** 事件时间戳 */
  timestamp: number
  /** 事件来源 */
  source?: string
}

/**
 * 错误信息
 */
export interface PluginError {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
  /** 错误堆栈 */
  stack?: string
}