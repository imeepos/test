import type {
  AINode,
  Position,
  CreateNodeOptions,
  NodeEdit,
  AIGenerateRequest,
  AIGenerateResponse,
  SemanticType
} from '@/types'
import { NodeDataConverter } from '@/types/converter'
import { websocketService } from './websocketService'

interface NodeCreationOptions {
  position: Position
  content?: string
  title?: string
  importance?: 1 | 2 | 3 | 4 | 5
  useAI?: boolean
  nodeId?: string // ✅ 添加 nodeId 字段
  context?: string[]
  parentNodeIds?: string[]
}

interface NodeUpdateOptions {
  content?: string
  title?: string
  importance?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  confidence?: number
  useAI?: boolean
}

class NodeService {
  /**
   * 创建新节点
   */
  async createNode(options: NodeCreationOptions): Promise<AINode> {
    const {
      position,
      content = '',
      title,
      importance = 3,
      useAI = false,
      context = [],
      parentNodeIds = [],
      nodeId: externalNodeId // ✅ 接收外部传入的 nodeId
    } = options

    // 生成基础节点数据
    const nodeId = this.generateNodeId()
    const now = new Date()

    let nodeContent = content
    let nodeTitle = title
    let nodeTags: string[] = []
    let confidence = 0.5

    // 如果启用AI生成
    if (useAI && (content || context.length > 0)) {
      try {
        const aiRequest: AIGenerateRequest & { nodeId?: string } = {
          inputs: context.length > 0 ? context : [content],
          context: this.buildContext(parentNodeIds),
          type: context.length > 1 ? 'fusion' : 'generate',
          nodeId: externalNodeId // ✅ 传递 nodeId 给后端
        }

        const aiResponse = await this.generateContentWithAI(aiRequest)

        nodeContent = aiResponse.content || content
        nodeTitle = aiResponse.title || title
        nodeTags = aiResponse.tags || []
        confidence = aiResponse.confidence || 80 // 默认80%置信度

        // 如果没有标题，自动生成（在同一个 try 块内）
        if (!nodeTitle && nodeContent) {
          try {
            const titleResponse = await this.generateContentWithAI({
              inputs: [nodeContent],
              type: 'generate',
              instruction: '为以下内容生成一个简洁准确的标题（不超过20个字符）'
            })
            nodeTitle = titleResponse.title || titleResponse.content.slice(0, 20)
          } catch {
            nodeTitle = nodeContent.slice(0, 20) + (nodeContent.length > 20 ? '...' : '')
          }
        }

      } catch (error) {
        console.error('AI生成失败:', error)
        // AI失败时抛出错误，由调用方处理
        throw error
      }
    }

    // 自动检测语义类型
    let semantic_type: SemanticType | undefined
    if (nodeContent) {
      semantic_type = this.detectSemanticType(nodeContent)
    }

    const node: AINode = {
      id: nodeId,
      content: nodeContent,
      title: nodeTitle,
      importance,
      confidence,
      status: 'idle',
      tags: nodeTags,
      version: 1,
      position,
      connections: [],
      semantic_type,
      user_rating: undefined, // 初始无用户评分
      createdAt: now,
      updatedAt: now,
      metadata: {
        semantic: semantic_type ? [semantic_type] : [],
        editCount: 0,
        processingHistory: [],
        statistics: {
          viewCount: 0,
          editDurationTotal: 0,
          aiInteractions: useAI ? 1 : 0
        }
      }
    }

    return node
  }

  /**
   * 更新节点内容
   */
  async updateNode(nodeId: string, currentNode: AINode, options: NodeUpdateOptions): Promise<Partial<AINode>> {
    const updates: Partial<AINode> = {
      updatedAt: new Date(),
      version: currentNode.version + 1,
      metadata: {
        ...currentNode.metadata,
        editCount: (currentNode.metadata?.editCount || 0) + 1,
      }
    }

    // 直接更新的字段
    if (options.content !== undefined) updates.content = options.content
    if (options.title !== undefined) updates.title = options.title
    if (options.importance !== undefined) updates.importance = options.importance
    if (options.tags !== undefined) updates.tags = options.tags
    if (options.confidence !== undefined) updates.confidence = options.confidence

    // 如果启用AI优化
    if (options.useAI && options.content) {
      try {
        const aiResponse = await this.optimizeContentWithAI(options.content, currentNode)
        
        updates.content = aiResponse.content
        updates.confidence = aiResponse.confidence || 0.8
        updates.status = 'completed'
        
        if (aiResponse.title && aiResponse.title !== currentNode.title) {
          updates.title = aiResponse.title
        }
        
        if (aiResponse.tags && aiResponse.tags.length > 0) {
          updates.tags = aiResponse.tags
        }

      } catch (error) {
        console.error('AI优化失败:', error)
        updates.status = 'error'
      }
    }

    return updates
  }

  /**
   * 复制节点
   */
  duplicateNode(originalNode: AINode, newPosition: Position): AINode {
    const newId = this.generateNodeId()
    const now = new Date()

    return {
      ...originalNode,
      id: newId,
      position: newPosition,
      title: originalNode.title ? `${originalNode.title} (复制)` : undefined,
      connections: [], // 不复制连接关系
      version: 1,
      createdAt: now,
      updatedAt: now,
      metadata: {
        ...originalNode.metadata,
        editCount: 0,
      }
    }
  }

  /**
   * 创建连接
   */
  createConnection(sourceId: string, targetId: string): {
    id: string
    sourceId: string
    targetId: string
    type: 'input' | 'output'
  }[] {
    const connectionId = `edge-${sourceId}-${targetId}`
    
    return [
      {
        id: connectionId,
        sourceId,
        targetId,
        type: 'output',
      },
      {
        id: connectionId,
        sourceId,
        targetId,
        type: 'input',
      }
    ]
  }

  // Note: This method was removed to avoid duplication with the enhanced version below

  /**
   * 多输入融合生成
   */
  async fusionGenerate(
    inputNodes: AINode[],
    fusionType: 'summary' | 'synthesis' | 'comparison' = 'synthesis',
    position: Position
  ): Promise<AINode> {
    if (inputNodes.length < 2) {
      throw new Error('融合生成至少需要2个输入节点')
    }

    const nodeId = `node-${Date.now()}`
    const now = new Date()

    try {
      // 准备输入内容
      const inputs = inputNodes.map(node => {
        const title = node.title ? `[${node.title}] ` : ''
        return title + node.content
      })

      // 调用AI融合生成
      const aiResponse = await this.generateContentWithAI({
        inputs,
        type: 'fusion',
        instruction: this.getFusionInstruction(fusionType)
      })

      // 生成标题
      let nodeTitle = aiResponse.title || ''
      if (!nodeTitle) {
        try {
          const titleResponse = await this.generateContentWithAI({
            inputs: [aiResponse.content],
            type: 'generate',
            instruction: '为以下内容生成一个简洁准确的标题（不超过20个字符）'
          })
          nodeTitle = titleResponse.title || titleResponse.content.slice(0, 20)
        } catch {
          const typeMap = {
            summary: '总结',
            synthesis: '综合',
            comparison: '对比分析'
          }
          nodeTitle = `${typeMap[fusionType]}结果`
        }
      }

      // 融合标签
      const allTags = inputNodes.reduce((tags, node) => {
        node.tags.forEach(tag => {
          if (!tags.includes(tag)) {
            tags.push(tag)
          }
        })
        return tags
      }, [] as string[])

      // 添加融合类型标签
      allTags.push(`融合-${fusionType}`)

      const node: AINode = {
        id: nodeId,
        content: aiResponse.content,
        title: nodeTitle,
        importance: Math.max(...inputNodes.map(n => n.importance)) as 1 | 2 | 3 | 4 | 5,
        confidence: aiResponse.confidence,
        status: 'completed',
        tags: allTags,
        position,
        connections: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
        metadata: {
          semantic: ['fusion', fusionType],
          editCount: 0,
          fusionSource: inputNodes.map(n => n.id),
          fusionType,
        }
      }

      return node

    } catch (error) {
      console.error('融合生成失败:', error)

      // 创建失败时的空节点
      return {
        id: nodeId,
        content: '融合生成失败，请手动输入内容...',
        title: '融合节点',
        importance: 3,
        confidence: 0,
        status: 'error',
        tags: ['融合失败'],
        position,
        connections: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
        metadata: {
          semantic: ['fusion-error'],
          editCount: 0,
          fusionSource: inputNodes.map(n => n.id),
          fusionType,
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    }
  }

  /**
   * 拖拽扩展生成（异步版本）
   * 立即创建processing状态的节点，后台异步生成内容
   */
  async dragExpandGenerate(
    sourceNode: AINode,
    targetPosition: Position,
    options: { prompt?: string } = {}
  ): Promise<AINode> {
    const context = [sourceNode.content]
    const nodeId = this.generateNodeId()
    const now = new Date()

    const userPrompt = options.prompt?.trim()

    // 立即创建processing状态的节点
    const processingNode: AINode = {
      id: nodeId,
      content: '正在生成中...',
      title: `${sourceNode.title || '节点'}的扩展`,
      importance: sourceNode.importance,
      confidence: 0.5,
      status: 'processing',
      tags: ['AI生成中'],
      position: targetPosition,
      connections: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
      metadata: {
        semantic: [], // 语义类型将在AI生成后自动检测
        editCount: 0,
      }
    }

    // 后台异步发送AI请求（不等待结果）
    const defaultContext = `基于节点"${sourceNode.title || '未命名'}"的内容进行扩展`
    const defaultInstruction = '请基于提供的内容，生成相关的扩展内容或下一步思考'

    const aiRequest: AIGenerateRequest & { nodeId: string } = {
      inputs: context,
      context: userPrompt || defaultContext,
      type: 'expand',
      instruction: userPrompt || defaultInstruction,
      nodeId: nodeId,
      options: userPrompt ? { prompt: userPrompt } : undefined,
    }

    // 异步发送AI请求，不阻塞返回
    // AI结果会通过WebSocket监听器（aiStore）自动处理并更新节点状态
    this.generateContentWithAIAsync(aiRequest, nodeId)

    // 立即返回processing状态的节点
    return processingNode
  }

  /**
   * 验证节点数据
   */
  validateNodeData(node: Partial<AINode>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!node.content || node.content.trim().length === 0) {
      errors.push('节点内容不能为空')
    }

    if (node.content && node.content.length > 10000) {
      errors.push('节点内容过长（最大10000字符）')
    }

    if (node.importance && (node.importance < 1 || node.importance > 5)) {
      errors.push('重要性等级必须在1-5之间')
    }

    if (node.confidence && (node.confidence < 0 || node.confidence > 1)) {
      errors.push('置信度必须在0-1之间')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 准备AI请求上下文
   */
  private buildContext(parentNodeIds: string[]): string {
    // 这里应该从store获取父节点信息，暂时返回空字符串
    // 实际实现时需要注入nodeStore依赖
    return parentNodeIds.length > 0 ? `相关节点: ${parentNodeIds.join(', ')}` : ''
  }

  /**
   * 使用AI生成内容（通过WebSocket到Gateway）
   * 按照正确架构：WebSocket → Gateway → Broker → Engine
   */
  private async generateContentWithAI(request: AIGenerateRequest & { nodeId?: string }): Promise<AIGenerateResponse> {
    try {
      // 通过WebSocket发送到Gateway，由Gateway路由到消息队列
      const response = await websocketService.generateContent(request)
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('AI内容生成失败:', errorMessage)

      throw new Error(
        'AI内容生成失败: ' + errorMessage +
        '\n\n这通常是由于以下原因:\n' +
        '1. WebSocket连接不可用\n' +
        '2. Gateway服务异常\n' +
        '3. 后端消息队列或AI引擎服务异常\n\n' +
        '请检查网络连接和服务状态后重试'
      )
    }
  }

  /**
   * 异步发送AI请求（不等待响应，通过WebSocket监听器处理结果）
   */
  private async generateContentWithAIAsync(request: AIGenerateRequest & { nodeId: string }, nodeId: string): Promise<void> {
    try {
      console.log('🚀 异步发送AI请求:', { nodeId, request })
      // 发送请求，但不等待响应（Promise会在WebSocket发送后立即resolve）
      // 实际的AI结果会通过WebSocket的监听器（aiStore）处理
      websocketService.generateContent(request).catch((error) => {
        console.error('❌ AI请求发送失败:', error)
        // 错误会通过WebSocket监听器处理
      })
    } catch (error) {
      console.error('❌ 发送AI请求异常:', error)
      // 即使失败也不抛出错误，让监听器处理
    }
  }


  /**
   * 使用AI优化内容
   */
  private async optimizeContentWithAI(content: string, currentNode: AINode): Promise<AIGenerateResponse> {
    const context = `当前节点信息 - 标题: ${currentNode.title || '无'}, 重要性: ${currentNode.importance}, 标签: ${currentNode.tags.join(', ')}`

    return this.generateContentWithAI({
      inputs: [content],
      context,
      type: 'optimize',
      instruction: '请优化以下内容，使其更清晰、准确、有价值'
    })
  }

  /**
   * 获取融合生成的指令文本
   */
  private getFusionInstruction(fusionType: 'summary' | 'synthesis' | 'comparison'): string {
    const instructions = {
      summary: '请总结以下多个内容的核心要点',
      synthesis: '请综合以下多个内容，生成统一的整合内容',
      comparison: '请比较分析以下多个内容的异同点'
    }
    return instructions[fusionType]
  }

  /**
   * 生成节点ID
   */
  private generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 自动检测内容的语义类型
   */
  private detectSemanticType(content: string): SemanticType | undefined {
    const lowerContent = content.toLowerCase()

    // 关键词匹配规则
    const semanticRules: Record<SemanticType, string[]> = {
      'requirement': ['需求', '要求', '必须', 'requirement', 'need', 'should', 'must'],
      'solution': ['方案', '解决', '实现', 'solution', 'approach', 'implement'],
      'plan': ['计划', '安排', '步骤', 'plan', 'schedule', 'roadmap', 'timeline'],
      'analysis': ['分析', '评估', '研究', 'analysis', 'evaluate', 'research', 'study'],
      'idea': ['想法', '创意', '点子', 'idea', 'concept', 'brainstorm'],
      'question': ['问题', '疑问', '？', 'question', 'why', 'how', 'what'],
      'answer': ['答案', '回答', '解答', 'answer', 'response', 'reply'],
      'decision': ['决定', '选择', '确定', 'decision', 'choose', 'select', 'decide'],
      'fusion': ['融合', '合并', '整合', 'fusion', 'merge', 'integrate'],
      'summary': ['总结', '概述', '摘要', 'summary', 'overview', 'abstract'],
      'synthesis': ['综合', '合成', 'synthesis', 'combine', 'comprehensive'],
      'comparison': ['对比', '比较', '比较', 'comparison', 'compare', 'versus', 'vs'],
      'fusion-error': ['错误', '失败', 'error', 'failed', 'failure']
    }

    // 计算每种类型的匹配分数
    let maxScore = 0
    let bestType: SemanticType | undefined

    for (const [type, keywords] of Object.entries(semanticRules)) {
      let score = 0
      keywords.forEach(keyword => {
        // 转义正则表达式特殊字符
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const matches = (lowerContent.match(new RegExp(escapedKeyword, 'g')) || []).length
        score += matches
      })

      if (score > maxScore) {
        maxScore = score
        bestType = type as SemanticType
      }
    }

    // 如果没有明确匹配，返回undefined让系统或AI来决定
    return maxScore > 0 ? bestType : undefined
  }

  /**
   * 数据转换辅助方法：转换为后端格式
   */
  toBackendFormat(node: AINode) {
    return NodeDataConverter.toBackend(node)
  }

  /**
   * 数据转换辅助方法：从后端格式转换
   */
  fromBackendFormat(backendNode: any): AINode {
    return NodeDataConverter.fromBackend(backendNode)
  }
}

// 单例实例
export const nodeService = new NodeService()

// 导出类型和服务
export { NodeService }
export type { NodeCreationOptions, NodeUpdateOptions }
