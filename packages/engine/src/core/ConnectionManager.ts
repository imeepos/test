import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import type { AIEngine } from './AIEngine.js'

/**
 * 连线类型
 */
export type ConnectionType =
  | 'semantic'      // 语义连接
  | 'causal'        // 因果连接
  | 'temporal'      // 时序连接
  | 'hierarchical'  // 层次连接
  | 'reference'     // 引用连接
  | 'similarity'    // 相似性连接
  | 'custom'        // 自定义连接

/**
 * 连线强度
 */
export type ConnectionStrength = 'weak' | 'medium' | 'strong'

/**
 * 连线方向
 */
export type ConnectionDirection = 'bidirectional' | 'source_to_target' | 'target_to_source'

/**
 * 连线数据结构
 */
export interface Connection {
  /** 连线ID */
  id: string
  /** 源节点ID */
  sourceId: string
  /** 目标节点ID */
  targetId: string
  /** 连线类型 */
  type: ConnectionType
  /** 连线强度 */
  strength: ConnectionStrength
  /** 连线方向 */
  direction: ConnectionDirection
  /** 连线标签 */
  label?: string
  /** 连线描述 */
  description?: string
  /** 连线属性 */
  properties: Record<string, any>
  /** 置信度 (0-1) */
  confidence: number
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 创建者 */
  createdBy: 'user' | 'ai' | 'system'
  /** AI生成的理由 */
  reasoning?: string
  /** 是否已验证 */
  verified: boolean
}

/**
 * 节点数据（简化版）
 */
export interface NodeData {
  id: string
  type: string
  title?: string
  content: string
  tags: string[]
  semanticProfile?: SemanticProfile
}

/**
 * 语义档案
 */
export interface SemanticProfile {
  /** 主要主题 */
  topics: Array<{ name: string; relevance: number }>
  /** 关键实体 */
  entities: Array<{ text: string; type: string; confidence: number }>
  /** 语义向量（简化为关键词权重） */
  vector: Record<string, number>
  /** 复杂度级别 */
  complexity: 'low' | 'medium' | 'high'
  /** 情感倾向 */
  sentiment: 'positive' | 'neutral' | 'negative'
}

/**
 * 连线建议
 */
export interface ConnectionSuggestion {
  /** 建议ID */
  id: string
  /** 源节点ID */
  sourceId: string
  /** 目标节点ID */
  targetId: string
  /** 建议的连线类型 */
  suggestedType: ConnectionType
  /** 建议强度 */
  suggestedStrength: ConnectionStrength
  /** 置信度 */
  confidence: number
  /** 建议理由 */
  reasoning: string
  /** 相关性得分 */
  relevanceScore: number
}

/**
 * 连线分析选项
 */
export interface ConnectionAnalysisOptions {
  /** 是否启用语义分析 */
  enableSemantic?: boolean
  /** 是否启用时序分析 */
  enableTemporal?: boolean
  /** 是否启用相似性分析 */
  enableSimilarity?: boolean
  /** 最小置信度阈值 */
  minConfidence?: number
  /** 最大建议数量 */
  maxSuggestions?: number
  /** 是否包含弱连接 */
  includeWeakConnections?: boolean
}

/**
 * 智能连线管理器
 * 负责自动分析节点间关系并创建智能连线
 */
export class ConnectionManager extends EventEmitter {
  private connections: Map<string, Connection> = new Map()
  private nodes: Map<string, NodeData> = new Map()
  private aiEngine?: AIEngine
  private analysisCache: Map<string, ConnectionSuggestion[]> = new Map()

  constructor(aiEngine?: AIEngine) {
    super()
    this.aiEngine = aiEngine
  }

  /**
   * 设置AI引擎
   */
  setAIEngine(aiEngine: AIEngine): void {
    this.aiEngine = aiEngine
  }

  /**
   * 添加节点
   */
  addNode(node: NodeData): void {
    this.nodes.set(node.id, node)
    this.emit('node_added', { node })

    // 清理相关缓存
    this.clearCacheForNode(node.id)
  }

  /**
   * 更新节点
   */
  updateNode(nodeId: string, updates: Partial<NodeData>): void {
    const existingNode = this.nodes.get(nodeId)
    if (!existingNode) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    const updatedNode = { ...existingNode, ...updates }
    this.nodes.set(nodeId, updatedNode)
    this.emit('node_updated', { nodeId, node: updatedNode })

    // 清理相关缓存
    this.clearCacheForNode(nodeId)
  }

  /**
   * 移除节点
   */
  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (!node) return

    this.nodes.delete(nodeId)

    // 移除相关连线
    const relatedConnections = this.getConnectionsForNode(nodeId)
    relatedConnections.forEach(conn => this.removeConnection(conn.id))

    this.emit('node_removed', { nodeId, node })
    this.clearCacheForNode(nodeId)
  }

  /**
   * 创建连线
   */
  async createConnection(
    sourceId: string,
    targetId: string,
    type: ConnectionType,
    options?: {
      strength?: ConnectionStrength
      direction?: ConnectionDirection
      label?: string
      description?: string
      properties?: Record<string, any>
      createdBy?: 'user' | 'ai' | 'system'
      reasoning?: string
    }
  ): Promise<Connection> {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error('Source or target node not found')
    }

    // 检查是否已存在相同连线
    const existing = this.findExistingConnection(sourceId, targetId, type)
    if (existing) {
      throw new Error('Connection already exists')
    }

    const connection: Connection = {
      id: uuidv4(),
      sourceId,
      targetId,
      type,
      strength: options?.strength || 'medium',
      direction: options?.direction || 'bidirectional',
      label: options?.label,
      description: options?.description,
      properties: options?.properties || {},
      confidence: await this.calculateConnectionConfidence(sourceId, targetId, type),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options?.createdBy || 'user',
      reasoning: options?.reasoning,
      verified: options?.createdBy === 'user'
    }

    this.connections.set(connection.id, connection)
    this.emit('connection_created', { connection })

    return connection
  }

  /**
   * 更新连线
   */
  updateConnection(connectionId: string, updates: Partial<Omit<Connection, 'id' | 'createdAt'>>): Connection {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`)
    }

    const updatedConnection: Connection = {
      ...connection,
      ...updates,
      updatedAt: new Date()
    }

    this.connections.set(connectionId, updatedConnection)
    this.emit('connection_updated', { connection: updatedConnection })

    return updatedConnection
  }

  /**
   * 移除连线
   */
  removeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    this.connections.delete(connectionId)
    this.emit('connection_removed', { connection })

    return true
  }

  /**
   * 获取连线
   */
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId)
  }

  /**
   * 获取所有连线
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values())
  }

  /**
   * 获取节点的所有连线
   */
  getConnectionsForNode(nodeId: string): Connection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.sourceId === nodeId || conn.targetId === nodeId)
  }

  /**
   * 分析并建议连线
   */
  async analyzeAndSuggestConnections(
    nodeId: string,
    options: ConnectionAnalysisOptions = {}
  ): Promise<ConnectionSuggestion[]> {
    const cacheKey = `${nodeId}_${JSON.stringify(options)}`
    const cached = this.analysisCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const sourceNode = this.nodes.get(nodeId)
    if (!sourceNode) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    const suggestions: ConnectionSuggestion[] = []
    const allNodes = Array.from(this.nodes.values()).filter(n => n.id !== nodeId)

    for (const targetNode of allNodes) {
      // 跳过已有连线的节点
      if (this.findExistingConnection(nodeId, targetNode.id)) {
        continue
      }

      const nodeSuggestions = await this.analyzeNodePair(sourceNode, targetNode, options)
      suggestions.push(...nodeSuggestions)
    }

    // 排序并过滤
    const filteredSuggestions = suggestions
      .filter(s => s.confidence >= (options.minConfidence || 0.3))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxSuggestions || 10)

    // 缓存结果
    this.analysisCache.set(cacheKey, filteredSuggestions)

    this.emit('suggestions_generated', { nodeId, suggestions: filteredSuggestions })

    return filteredSuggestions
  }

  /**
   * 分析两个节点之间的关系
   */
  private async analyzeNodePair(
    sourceNode: NodeData,
    targetNode: NodeData,
    options: ConnectionAnalysisOptions
  ): Promise<ConnectionSuggestion[]> {
    const suggestions: ConnectionSuggestion[] = []

    // 语义分析
    if (options.enableSemantic !== false) {
      const semanticSuggestions = await this.performSemanticAnalysis(sourceNode, targetNode)
      suggestions.push(...semanticSuggestions)
    }

    // 相似性分析
    if (options.enableSimilarity !== false) {
      const similaritySuggestions = this.performSimilarityAnalysis(sourceNode, targetNode)
      suggestions.push(...similaritySuggestions)
    }

    // 时序分析
    if (options.enableTemporal !== false) {
      const temporalSuggestions = this.performTemporalAnalysis(sourceNode, targetNode)
      suggestions.push(...temporalSuggestions)
    }

    return suggestions
  }

  /**
   * 执行语义分析
   */
  private async performSemanticAnalysis(
    sourceNode: NodeData,
    targetNode: NodeData
  ): Promise<ConnectionSuggestion[]> {
    if (!this.aiEngine) {
      return []
    }

    try {
      const prompt = `分析以下两个内容节点之间的语义关系：

节点A:
标题: ${sourceNode.title || '无标题'}
内容: ${sourceNode.content}
标签: ${sourceNode.tags.join(', ')}

节点B:
标题: ${targetNode.title || '无标题'}
内容: ${targetNode.content}
标签: ${targetNode.tags.join(', ')}

请分析这两个节点之间可能存在的语义关系，并按以下JSON格式返回：
{
  "connections": [
    {
      "type": "semantic|causal|hierarchical|reference",
      "strength": "weak|medium|strong",
      "confidence": 0.85,
      "reasoning": "具体的关系分析理由",
      "relevanceScore": 0.75
    }
  ]
}`

      const result = await this.aiEngine.generateContent({
        prompt,
        inputs: [sourceNode.content, targetNode.content],
        temperature: 0.2
      })

      return this.parseAIConnectionAnalysis(sourceNode.id, targetNode.id, result.content)

    } catch (error) {
      console.warn('语义分析失败:', error)
      return []
    }
  }

  /**
   * 执行相似性分析
   */
  private performSimilarityAnalysis(
    sourceNode: NodeData,
    targetNode: NodeData
  ): ConnectionSuggestion[] {
    const suggestions: ConnectionSuggestion[] = []

    // 标签相似性
    const commonTags = sourceNode.tags.filter(tag => targetNode.tags.includes(tag))
    const tagSimilarity = commonTags.length / Math.max(sourceNode.tags.length, targetNode.tags.length)

    if (tagSimilarity > 0.3) {
      suggestions.push({
        id: uuidv4(),
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        suggestedType: 'similarity',
        suggestedStrength: tagSimilarity > 0.6 ? 'strong' : tagSimilarity > 0.4 ? 'medium' : 'weak',
        confidence: tagSimilarity,
        reasoning: `节点共享${commonTags.length}个标签: ${commonTags.join(', ')}`,
        relevanceScore: tagSimilarity * 0.8
      })
    }

    // 内容相似性（简单的关键词匹配）
    const sourceWords = this.extractKeywords(sourceNode.content)
    const targetWords = this.extractKeywords(targetNode.content)
    const commonWords = sourceWords.filter(word => targetWords.includes(word))
    const contentSimilarity = commonWords.length / Math.max(sourceWords.length, targetWords.length)

    if (contentSimilarity > 0.2) {
      suggestions.push({
        id: uuidv4(),
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        suggestedType: 'similarity',
        suggestedStrength: contentSimilarity > 0.5 ? 'strong' : contentSimilarity > 0.3 ? 'medium' : 'weak',
        confidence: contentSimilarity,
        reasoning: `内容包含${commonWords.length}个相同关键词`,
        relevanceScore: contentSimilarity * 0.7
      })
    }

    return suggestions
  }

  /**
   * 执行时序分析
   */
  private performTemporalAnalysis(
    sourceNode: NodeData,
    targetNode: NodeData
  ): ConnectionSuggestion[] {
    // 简化的时序分析，基于节点ID或创建时间
    // 在实际应用中，应该基于节点的时间戳属性
    const suggestions: ConnectionSuggestion[] = []

    // 这里可以添加基于时间的分析逻辑
    // 例如：节点创建时间、内容中的时间引用等

    return suggestions
  }

  /**
   * 解析AI连线分析结果
   */
  private parseAIConnectionAnalysis(
    sourceId: string,
    targetId: string,
    aiResult: string
  ): ConnectionSuggestion[] {
    try {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      const suggestions: ConnectionSuggestion[] = []

      if (parsed.connections && Array.isArray(parsed.connections)) {
        parsed.connections.forEach((conn: any) => {
          suggestions.push({
            id: uuidv4(),
            sourceId,
            targetId,
            suggestedType: conn.type || 'semantic',
            suggestedStrength: conn.strength || 'medium',
            confidence: Math.min(1, Math.max(0, conn.confidence || 0.5)),
            reasoning: conn.reasoning || 'AI分析结果',
            relevanceScore: Math.min(1, Math.max(0, conn.relevanceScore || conn.confidence || 0.5))
          })
        })
      }

      return suggestions
    } catch (error) {
      console.warn('AI连线分析结果解析失败:', error)
      return []
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(content: string): string[] {
    return content.toLowerCase()
      .replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 20) // 只取前20个词
  }

  /**
   * 计算连线置信度
   */
  private async calculateConnectionConfidence(
    sourceId: string,
    targetId: string,
    type: ConnectionType
  ): Promise<number> {
    // 简化的置信度计算
    // 在实际应用中，应该基于更复杂的算法
    const sourceNode = this.nodes.get(sourceId)
    const targetNode = this.nodes.get(targetId)

    if (!sourceNode || !targetNode) return 0.5

    // 基于节点内容长度和标签数量的简单计算
    const contentRelevance = Math.min(sourceNode.content.length, targetNode.content.length) / 1000
    const tagRelevance = Math.min(sourceNode.tags.length, targetNode.tags.length) / 10

    return Math.min(0.95, Math.max(0.3, (contentRelevance + tagRelevance) / 2))
  }

  /**
   * 查找现有连线
   */
  private findExistingConnection(
    sourceId: string,
    targetId: string,
    type?: ConnectionType
  ): Connection | undefined {
    return Array.from(this.connections.values())
      .find(conn =>
        ((conn.sourceId === sourceId && conn.targetId === targetId) ||
         (conn.sourceId === targetId && conn.targetId === sourceId && conn.direction === 'bidirectional')) &&
        (!type || conn.type === type)
      )
  }

  /**
   * 清理节点相关缓存
   */
  private clearCacheForNode(nodeId: string): void {
    const keysToDelete = Array.from(this.analysisCache.keys())
      .filter(key => key.startsWith(nodeId))

    keysToDelete.forEach(key => this.analysisCache.delete(key))
  }

  /**
   * 批量创建建议连线
   */
  async createSuggestedConnections(suggestions: ConnectionSuggestion[]): Promise<Connection[]> {
    const createdConnections: Connection[] = []

    for (const suggestion of suggestions) {
      try {
        const connection = await this.createConnection(
          suggestion.sourceId,
          suggestion.targetId,
          suggestion.suggestedType,
          {
            strength: suggestion.suggestedStrength,
            createdBy: 'ai',
            reasoning: suggestion.reasoning
          }
        )
        createdConnections.push(connection)
      } catch (error) {
        console.warn(`创建建议连线失败:`, error)
      }
    }

    return createdConnections
  }

  /**
   * 获取连线统计信息
   */
  getConnectionStats(): {
    totalConnections: number
    connectionsByType: Record<ConnectionType, number>
    connectionsByStrength: Record<ConnectionStrength, number>
    averageConfidence: number
    userCreated: number
    aiCreated: number
  } {
    const connections = Array.from(this.connections.values())
    const stats = {
      totalConnections: connections.length,
      connectionsByType: {} as Record<ConnectionType, number>,
      connectionsByStrength: {} as Record<ConnectionStrength, number>,
      averageConfidence: 0,
      userCreated: 0,
      aiCreated: 0
    }

    connections.forEach(conn => {
      // 按类型统计
      stats.connectionsByType[conn.type] = (stats.connectionsByType[conn.type] || 0) + 1

      // 按强度统计
      stats.connectionsByStrength[conn.strength] = (stats.connectionsByStrength[conn.strength] || 0) + 1

      // 按创建者统计
      if (conn.createdBy === 'user') {
        stats.userCreated++
      } else if (conn.createdBy === 'ai') {
        stats.aiCreated++
      }
    })

    // 计算平均置信度
    if (connections.length > 0) {
      stats.averageConfidence = connections.reduce((sum, conn) => sum + conn.confidence, 0) / connections.length
    }

    return stats
  }

  /**
   * 清理所有数据
   */
  clear(): void {
    this.connections.clear()
    this.nodes.clear()
    this.analysisCache.clear()
    this.emit('cleared')
  }
}