import type { 
  AINode, 
  Position, 
  CreateNodeOptions, 
  NodeEdit,
  AIGenerateRequest,
  AIGenerateResponse
} from '@/types'
import { aiService } from './aiService'
import { websocketService } from './websocketService'

interface NodeCreationOptions {
  position: Position
  content?: string
  title?: string
  importance?: 1 | 2 | 3 | 4 | 5
  useAI?: boolean
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
      parentNodeIds = []
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
        const aiRequest: AIGenerateRequest = {
          inputs: context.length > 0 ? context : [content],
          context: this.buildContext(parentNodeIds),
          type: context.length > 1 ? 'fusion' : 'generate'
        }

        const aiResponse = await this.generateContentWithAI(aiRequest)
        
        nodeContent = aiResponse.content || content
        nodeTitle = aiResponse.title || title
        nodeTags = aiResponse.tags || []
        confidence = aiResponse.confidence || 0.5

      } catch (error) {
        console.error('AI生成失败，使用默认内容:', error)
        // AI失败时使用原始内容
      }
    }

    // 如果没有标题，自动生成
    if (!nodeTitle && nodeContent) {
      try {
        nodeTitle = await aiService.generateTitle(nodeContent)
      } catch {
        nodeTitle = nodeContent.slice(0, 20) + (nodeContent.length > 20 ? '...' : '')
      }
    }

    const node: AINode = {
      id: nodeId,
      content: nodeContent,
      title: nodeTitle,
      importance,
      confidence,
      status: 'idle',
      tags: nodeTags,
      position,
      connections: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
      metadata: {
        semantic: [],
        editCount: 0,
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
      const aiResponse = await aiService.fusionGenerate(inputs, fusionType)

      // 生成标题
      let nodeTitle = aiResponse.title || ''
      if (!nodeTitle) {
        try {
          nodeTitle = await aiService.generateTitle(aiResponse.content)
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
   * 拖拽扩展生成
   */
  async dragExpandGenerate(sourceNode: AINode, targetPosition: Position): Promise<AINode> {
    const context = [sourceNode.content]
    
    try {
      const aiRequest: AIGenerateRequest = {
        inputs: context,
        context: `基于节点"${sourceNode.title || '未命名'}"的内容进行扩展`,
        type: 'expand',
        instruction: '请基于提供的内容，生成相关的扩展内容或下一步思考'
      }

      const aiResponse = await this.generateContentWithAI(aiRequest)
      
      return this.createNode({
        position: targetPosition,
        content: aiResponse.content,
        title: aiResponse.title,
        importance: sourceNode.importance,
        useAI: false, // 已经生成了
        context,
        parentNodeIds: [sourceNode.id],
      })

    } catch (error) {
      // AI扩展失败时创建空节点
      return this.createNode({
        position: targetPosition,
        content: '请输入内容...',
        title: `${sourceNode.title || '节点'}的扩展`,
        importance: sourceNode.importance,
        useAI: false,
        parentNodeIds: [sourceNode.id],
      })
    }
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
   * 使用AI生成内容
   */
  private async generateContentWithAI(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // 优先使用WebSocket，如果不可用则使用HTTP API
    if (websocketService.getStatus() === 'connected') {
      try {
        return await websocketService.generateContent(request)
      } catch (error) {
        console.warn('WebSocket AI生成失败，回退到HTTP API:', error)
      }
    }

    return await aiService.generateContent(request)
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
   * 生成节点ID
   */
  private generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 单例实例
export const nodeService = new NodeService()

// 导出类型和服务
export { NodeService }
export type { NodeCreationOptions, NodeUpdateOptions }