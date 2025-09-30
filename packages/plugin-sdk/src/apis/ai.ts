import { AIRequest, AIResponse, AIOptions } from '../types'

/**
 * AI服务API
 * 提供AI相关功能的接口
 */
export interface AIServiceAPI {
  // ============ 内容生成 ============

  /**
   * 生成文本内容
   * @param prompt 提示词
   * @param options 生成选项
   * @returns 生成的内容
   */
  generateText(prompt: string, options?: AIOptions): Promise<string>

  /**
   * 生成代码
   * @param description 代码描述
   * @param language 编程语言
   * @param options 生成选项
   * @returns 生成的代码
   */
  generateCode(description: string, language: string, options?: AIOptions): Promise<string>

  /**
   * 生成组件
   * @param description 组件描述
   * @param framework 框架类型
   * @param options 生成选项
   * @returns 组件代码
   */
  generateComponent(description: string, framework: string, options?: AIOptions): Promise<{
    code: string
    props: Record<string, any>
    styles: Record<string, any>
  }>

  // ============ 内容分析 ============

  /**
   * 分析文本内容
   * @param text 文本内容
   * @param analysisType 分析类型
   * @returns 分析结果
   */
  analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResult>

  /**
   * 分析代码
   * @param code 代码内容
   * @param language 编程语言
   * @returns 代码分析结果
   */
  analyzeCode(code: string, language: string): Promise<CodeAnalysisResult>

  /**
   * 分析布局
   * @param canvasData 画布数据
   * @returns 布局分析结果
   */
  analyzeLayout(canvasData: any): Promise<LayoutAnalysisResult>

  // ============ 内容优化 ============

  /**
   * 优化文本
   * @param text 原始文本
   * @param optimizationType 优化类型
   * @param options 优化选项
   * @returns 优化后的文本
   */
  optimizeText(text: string, optimizationType: OptimizationType, options?: AIOptions): Promise<string>

  /**
   * 优化代码
   * @param code 原始代码
   * @param language 编程语言
   * @param options 优化选项
   * @returns 优化后的代码
   */
  optimizeCode(code: string, language: string, options?: AIOptions): Promise<{
    code: string
    improvements: string[]
    warnings: string[]
  }>

  /**
   * 优化布局
   * @param canvasData 画布数据
   * @param criteria 优化标准
   * @returns 优化建议
   */
  optimizeLayout(canvasData: any, criteria: LayoutCriteria): Promise<LayoutOptimization>

  // ============ 内容翻译 ============

  /**
   * 翻译文本
   * @param text 原始文本
   * @param targetLanguage 目标语言
   * @param sourceLanguage 源语言（可选）
   * @returns 翻译结果
   */
  translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string>

  /**
   * 检测语言
   * @param text 文本内容
   * @returns 检测到的语言
   */
  detectLanguage(text: string): Promise<{
    language: string
    confidence: number
  }>

  // ============ 内容摘要 ============

  /**
   * 生成摘要
   * @param text 原始文本
   * @param maxLength 最大长度
   * @returns 摘要内容
   */
  summarizeText(text: string, maxLength?: number): Promise<string>

  /**
   * 提取关键词
   * @param text 文本内容
   * @param count 关键词数量
   * @returns 关键词列表
   */
  extractKeywords(text: string, count?: number): Promise<string[]>

  /**
   * 生成标题
   * @param text 文本内容
   * @param count 标题数量
   * @returns 标题列表
   */
  generateTitles(text: string, count?: number): Promise<string[]>

  // ============ 智能建议 ============

  /**
   * 获取内容建议
   * @param context 上下文信息
   * @param suggestionType 建议类型
   * @returns 建议列表
   */
  getSuggestions(context: any, suggestionType: SuggestionType): Promise<Suggestion[]>

  /**
   * 获取下一步操作建议
   * @param canvasData 画布数据
   * @param userIntent 用户意图
   * @returns 操作建议
   */
  getNextActions(canvasData: any, userIntent?: string): Promise<ActionSuggestion[]>

  /**
   * 智能补全
   * @param partialText 部分文本
   * @param context 上下文
   * @returns 补全建议
   */
  autoComplete(partialText: string, context?: any): Promise<string[]>

  // ============ 自定义AI请求 ============

  /**
   * 发送自定义AI请求
   * @param request AI请求
   * @returns AI响应
   */
  request(request: AIRequest): Promise<AIResponse>

  /**
   * 批量处理AI请求
   * @param requests 请求列表
   * @returns 响应列表
   */
  batchRequest(requests: AIRequest[]): Promise<AIResponse[]>

  // ============ 模型管理 ============

  /**
   * 获取可用模型
   * @returns 模型列表
   */
  getAvailableModels(): Promise<AIModel[]>

  /**
   * 设置默认模型
   * @param modelId 模型ID
   */
  setDefaultModel(modelId: string): Promise<void>

  /**
   * 获取模型信息
   * @param modelId 模型ID
   * @returns 模型信息
   */
  getModelInfo(modelId: string): Promise<AIModel>
}

/**
 * 分析类型
 */
export type AnalysisType =
  | 'sentiment'      // 情感分析
  | 'topic'          // 主题分析
  | 'structure'      // 结构分析
  | 'readability'    // 可读性分析
  | 'complexity'     // 复杂度分析

/**
 * 分析结果
 */
export interface AnalysisResult {
  /** 分析类型 */
  type: AnalysisType
  /** 分析得分 */
  score: number
  /** 分析详情 */
  details: Record<string, any>
  /** 建议 */
  suggestions?: string[]
}

/**
 * 代码分析结果
 */
export interface CodeAnalysisResult {
  /** 代码质量得分 */
  quality: number
  /** 复杂度 */
  complexity: number
  /** 问题列表 */
  issues: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    line?: number
    column?: number
  }>
  /** 改进建议 */
  suggestions: string[]
  /** 代码统计 */
  stats: {
    lines: number
    functions: number
    variables: number
    comments: number
  }
}

/**
 * 布局分析结果
 */
export interface LayoutAnalysisResult {
  /** 布局得分 */
  score: number
  /** 可读性 */
  readability: number
  /** 对称性 */
  symmetry: number
  /** 空间利用率 */
  spaceUtilization: number
  /** 问题列表 */
  issues: Array<{
    type: 'overlap' | 'spacing' | 'alignment' | 'hierarchy'
    message: string
    nodeIds: string[]
  }>
  /** 改进建议 */
  suggestions: string[]
}

/**
 * 优化类型
 */
export type OptimizationType =
  | 'clarity'        // 清晰度
  | 'conciseness'    // 简洁性
  | 'grammar'        // 语法
  | 'style'          // 风格
  | 'tone'           // 语调

/**
 * 布局标准
 */
export interface LayoutCriteria {
  /** 优化目标 */
  objective: 'readability' | 'aesthetics' | 'efficiency' | 'hierarchy'
  /** 约束条件 */
  constraints?: {
    preservePositions?: string[]  // 保持位置的节点
    minSpacing?: number          // 最小间距
    maxWidth?: number           // 最大宽度
    maxHeight?: number          // 最大高度
  }
  /** 权重设置 */
  weights?: {
    alignment?: number          // 对齐权重
    spacing?: number           // 间距权重
    symmetry?: number          // 对称权重
    hierarchy?: number         // 层次权重
  }
}

/**
 * 布局优化结果
 */
export interface LayoutOptimization {
  /** 优化得分 */
  score: number
  /** 节点位置调整 */
  nodeAdjustments: Array<{
    nodeId: string
    oldPosition: { x: number; y: number }
    newPosition: { x: number; y: number }
    reason: string
  }>
  /** 连接线调整 */
  edgeAdjustments: Array<{
    edgeId: string
    adjustments: any
    reason: string
  }>
  /** 改进说明 */
  improvements: string[]
}

/**
 * 建议类型
 */
export type SuggestionType =
  | 'content'        // 内容建议
  | 'structure'      // 结构建议
  | 'style'          // 样式建议
  | 'component'      // 组件建议
  | 'connection'     // 连接建议

/**
 * 建议
 */
export interface Suggestion {
  /** 建议ID */
  id: string
  /** 建议类型 */
  type: SuggestionType
  /** 建议标题 */
  title: string
  /** 建议描述 */
  description: string
  /** 置信度 */
  confidence: number
  /** 应用建议的操作 */
  action?: {
    type: string
    data: any
  }
}

/**
 * 操作建议
 */
export interface ActionSuggestion {
  /** 建议ID */
  id: string
  /** 建议标题 */
  title: string
  /** 建议描述 */
  description: string
  /** 操作类型 */
  actionType: 'create' | 'modify' | 'delete' | 'connect' | 'organize'
  /** 目标对象 */
  target?: {
    type: 'node' | 'edge' | 'canvas'
    id?: string
  }
  /** 预期效果 */
  expectedOutcome: string
  /** 置信度 */
  confidence: number
}

/**
 * AI模型信息
 */
export interface AIModel {
  /** 模型ID */
  id: string
  /** 模型名称 */
  name: string
  /** 模型描述 */
  description: string
  /** 模型类型 */
  type: 'text' | 'code' | 'image' | 'multimodal'
  /** 模型能力 */
  capabilities: string[]
  /** 上下文长度 */
  contextLength: number
  /** 费用信息 */
  pricing?: {
    inputTokens: number   // 每千输入token价格
    outputTokens: number  // 每千输出token价格
  }
  /** 是否可用 */
  available: boolean
}

/**
 * AI事件类型
 */
export interface AIEvents {
  // 请求事件
  'ai.request.start': { requestId: string; request: AIRequest }
  'ai.request.progress': { requestId: string; progress: number }
  'ai.request.complete': { requestId: string; response: AIResponse }
  'ai.request.error': { requestId: string; error: string }

  // 模型事件
  'ai.model.changed': { oldModel: string; newModel: string }
  'ai.model.loaded': { modelId: string }

  // 分析事件
  'ai.analysis.complete': { type: AnalysisType; result: AnalysisResult }
  'ai.optimization.complete': { type: string; result: any }
}