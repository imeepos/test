import { EventEmitter } from 'events'
import type { AIEngine } from '../core/AIEngine.js'
import { PromptBuilder } from '../templates/PromptBuilder.js'
import type { ConnectionManager } from '../core/ConnectionManager.js'

/**
 * 插件消息类型
 */
export interface PluginMessage {
  id: string
  type: string
  payload: any
  from: string
  to?: string
  timestamp: number
  requestId?: string
}

/**
 * 插件API调用请求
 */
export interface PluginAPIRequest {
  method: string
  params: any[]
  requestId: string
  pluginId: string
}

/**
 * 插件API调用响应
 */
export interface PluginAPIResponse {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: any
  }
  requestId: string
}

/**
 * 插件权限
 */
export type PluginPermission =
  | 'canvas.read'
  | 'canvas.write'
  | 'canvas.node.create'
  | 'canvas.node.update'
  | 'canvas.node.delete'
  | 'canvas.edge.create'
  | 'canvas.edge.update'
  | 'canvas.edge.delete'
  | 'ai.request'
  | 'ai.analyze'
  | 'ai.generate'
  | 'ai.optimize'
  | 'storage.read'
  | 'storage.write'
  | 'network.request'
  | 'file.read'
  | 'file.write'
  | 'component.create'
  | 'component.modify'

/**
 * 插件上下文
 */
export interface PluginContextData {
  pluginId: string
  permissions: PluginPermission[]
  config: Record<string, any>
  state: Record<string, any>
}

/**
 * 插件桥接器
 * 负责插件与核心系统之间的通信
 */
export class PluginBridge extends EventEmitter {
  private aiEngine: AIEngine
  private connectionManager: ConnectionManager
  private registeredPlugins: Map<string, PluginContextData> = new Map()
  private activeConnections: Map<string, Set<string>> = new Map()
  private messageQueue: Map<string, PluginMessage[]> = new Map()
  private requestHandlers: Map<string, Function> = new Map()

  constructor(aiEngine: AIEngine, connectionManager: ConnectionManager) {
    super()
    this.aiEngine = aiEngine
    this.connectionManager = connectionManager
    this.setupDefaultHandlers()
  }

  /**
   * 设置默认的API处理器
   */
  private setupDefaultHandlers(): void {
    // AI服务处理器
    this.requestHandlers.set('ai.generate', this.handleAIGenerate.bind(this))
    this.requestHandlers.set('ai.optimize', this.handleAIOptimize.bind(this))
    this.requestHandlers.set('ai.analyze', this.handleAIAnalyze.bind(this))

    // Canvas处理器
    this.requestHandlers.set('canvas.getNode', this.handleCanvasGetNode.bind(this))
    this.requestHandlers.set('canvas.createNode', this.handleCanvasCreateNode.bind(this))
    this.requestHandlers.set('canvas.updateNode', this.handleCanvasUpdateNode.bind(this))
    this.requestHandlers.set('canvas.deleteNode', this.handleCanvasDeleteNode.bind(this))

    // 连线处理器
    this.requestHandlers.set('canvas.createEdge', this.handleCreateEdge.bind(this))
    this.requestHandlers.set('canvas.deleteEdge', this.handleDeleteEdge.bind(this))
    this.requestHandlers.set('canvas.suggestConnections', this.handleSuggestConnections.bind(this))

    // Storage处理器（简化实现）
    this.requestHandlers.set('storage.get', this.handleStorageGet.bind(this))
    this.requestHandlers.set('storage.set', this.handleStorageSet.bind(this))
    this.requestHandlers.set('storage.delete', this.handleStorageDelete.bind(this))
  }

  /**
   * 注册插件
   */
  registerPlugin(
    pluginId: string,
    permissions: PluginPermission[],
    config: Record<string, any> = {}
  ): void {
    const contextData: PluginContextData = {
      pluginId,
      permissions,
      config,
      state: {}
    }

    this.registeredPlugins.set(pluginId, contextData)
    this.messageQueue.set(pluginId, [])
    this.activeConnections.set(pluginId, new Set())

    this.emit('plugin_registered', { pluginId, permissions, config })
  }

  /**
   * 注销插件
   */
  unregisterPlugin(pluginId: string): void {
    const contextData = this.registeredPlugins.get(pluginId)
    if (!contextData) return

    // 清理资源
    this.registeredPlugins.delete(pluginId)
    this.messageQueue.delete(pluginId)
    this.activeConnections.delete(pluginId)

    this.emit('plugin_unregistered', { pluginId })
  }

  /**
   * 发送消息给插件
   */
  sendMessageToPlugin(pluginId: string, type: string, payload: any): void {
    const queue = this.messageQueue.get(pluginId)
    if (!queue) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    const message: PluginMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      from: 'system',
      to: pluginId,
      timestamp: Date.now()
    }

    queue.push(message)
    this.emit('message_sent', { message })
  }

  /**
   * 处理插件API请求
   */
  async handlePluginAPIRequest(request: PluginAPIRequest): Promise<PluginAPIResponse> {
    const { method, params, requestId, pluginId } = request

    try {
      // 验证插件权限
      const hasPermission = await this.validatePermission(pluginId, method)
      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Plugin ${pluginId} does not have permission to call ${method}`
          },
          requestId
        }
      }

      // 查找处理器
      const handler = this.requestHandlers.get(method)
      if (!handler) {
        return {
          success: false,
          error: {
            code: 'METHOD_NOT_FOUND',
            message: `Method ${method} not found`
          },
          requestId
        }
      }

      // 调用处理器
      const result = await handler(pluginId, ...params)

      return {
        success: true,
        data: result,
        requestId
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        requestId
      }
    }
  }

  /**
   * 验证插件权限
   */
  private async validatePermission(pluginId: string, method: string): Promise<boolean> {
    const contextData = this.registeredPlugins.get(pluginId)
    if (!contextData) return false

    const methodPermissionMap: Record<string, PluginPermission> = {
      'ai.generate': 'ai.generate',
      'ai.optimize': 'ai.optimize',
      'ai.analyze': 'ai.analyze',
      'canvas.getNode': 'canvas.read',
      'canvas.createNode': 'canvas.node.create',
      'canvas.updateNode': 'canvas.node.update',
      'canvas.deleteNode': 'canvas.node.delete',
      'canvas.createEdge': 'canvas.edge.create',
      'canvas.deleteEdge': 'canvas.edge.delete',
      'storage.get': 'storage.read',
      'storage.set': 'storage.write',
      'storage.delete': 'storage.write'
    }

    const requiredPermission = methodPermissionMap[method]
    if (!requiredPermission) return true // 不需要特殊权限的方法

    return contextData.permissions.includes(requiredPermission)
  }

  // ==================== API处理器 ====================

  /**
   * 处理AI生成请求
   */
  private async handleAIGenerate(pluginId: string, request: any): Promise<any> {
    const result = await this.aiEngine.generateContent({
      prompt: request.prompt,
      inputs: request.inputs || [],
      context: request.context,
      style: request.style,
      length: request.length,
      model: request.model,
      temperature: request.temperature
    })

    // 记录使用情况
    this.emit('plugin_api_usage', {
      pluginId,
      method: 'ai.generate',
      tokenCount: result.metadata.tokenCount,
      cost: result.metadata.cost
    })

    return result
  }

  /**
   * 处理AI优化请求
   */
  private async handleAIOptimize(pluginId: string, request: any): Promise<any> {
    const prompt = request.prompt || PromptBuilder.buildOptimize({
      content: request.content,
      instruction: request.instruction,
      targetStyle: request.targetStyle,
      targetLength: request.targetLength
    })

    const result = await this.aiEngine.optimizeContent({
      prompt,
      context: request.context,
      model: request.model
    })

    this.emit('plugin_api_usage', {
      pluginId,
      method: 'ai.optimize',
      tokenCount: result.metadata.tokenCount,
      cost: result.metadata.cost
    })

    return result
  }

  /**
   * 处理AI分析请求
   */
  private async handleAIAnalyze(pluginId: string, content: string, options: any = {}): Promise<any> {
    const result = await this.aiEngine.analyzeContent(content, options)

    this.emit('plugin_api_usage', {
      pluginId,
      method: 'ai.analyze',
      tokenCount: result.metadata.tokenCount,
      cost: result.metadata.cost
    })

    return result
  }

  /**
   * 处理获取节点请求
   */
  private async handleCanvasGetNode(pluginId: string, nodeId: string): Promise<any> {
    // 这里应该连接到实际的Canvas服务
    // 暂时返回模拟数据
    this.emit('plugin_api_usage', { pluginId, method: 'canvas.getNode' })

    return {
      id: nodeId,
      type: 'text',
      title: '示例节点',
      content: '这是一个示例节点内容',
      position: { x: 100, y: 100 },
      style: {}
    }
  }

  /**
   * 处理创建节点请求
   */
  private async handleCanvasCreateNode(pluginId: string, nodeData: any): Promise<any> {
    const nodeId = this.generateId()

    // 添加到连线管理器
    this.connectionManager.addNode({
      id: nodeId,
      type: nodeData.type || 'text',
      title: nodeData.title,
      content: nodeData.content || '',
      tags: nodeData.tags || []
    })

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.createNode' })
    this.emit('node_created', { nodeId, nodeData, pluginId })

    return { ...nodeData, id: nodeId }
  }

  /**
   * 处理更新节点请求
   */
  private async handleCanvasUpdateNode(pluginId: string, nodeId: string, updates: any): Promise<any> {
    this.connectionManager.updateNode(nodeId, updates)

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.updateNode' })
    this.emit('node_updated', { nodeId, updates, pluginId })

    return { success: true }
  }

  /**
   * 处理删除节点请求
   */
  private async handleCanvasDeleteNode(pluginId: string, nodeId: string): Promise<any> {
    this.connectionManager.removeNode(nodeId)

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.deleteNode' })
    this.emit('node_deleted', { nodeId, pluginId })

    return { success: true }
  }

  /**
   * 处理创建连线请求
   */
  private async handleCreateEdge(
    pluginId: string,
    sourceId: string,
    targetId: string,
    options: any = {}
  ): Promise<any> {
    const connection = await this.connectionManager.createConnection(
      sourceId,
      targetId,
      options.type || 'semantic',
      {
        strength: options.strength,
        direction: options.direction,
        label: options.label,
        description: options.description,
        properties: options.properties,
        createdBy: 'ai' // 来自插件的创建标记为AI创建
      }
    )

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.createEdge' })
    this.emit('edge_created', { connection, pluginId })

    return connection
  }

  /**
   * 处理删除连线请求
   */
  private async handleDeleteEdge(pluginId: string, edgeId: string): Promise<any> {
    const success = this.connectionManager.removeConnection(edgeId)

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.deleteEdge' })
    this.emit('edge_deleted', { edgeId, success, pluginId })

    return { success }
  }

  /**
   * 处理连线建议请求
   */
  private async handleSuggestConnections(pluginId: string, nodeId: string, options: any = {}): Promise<any> {
    const suggestions = await this.connectionManager.analyzeAndSuggestConnections(nodeId, options)

    this.emit('plugin_api_usage', { pluginId, method: 'canvas.suggestConnections' })

    return suggestions
  }

  /**
   * 处理存储获取请求
   */
  private async handleStorageGet(pluginId: string, key: string): Promise<any> {
    // 简化的存储实现
    const contextData = this.registeredPlugins.get(pluginId)
    if (!contextData) throw new Error('Plugin not found')

    this.emit('plugin_api_usage', { pluginId, method: 'storage.get' })

    return contextData.state[key]
  }

  /**
   * 处理存储设置请求
   */
  private async handleStorageSet(pluginId: string, key: string, value: any): Promise<any> {
    const contextData = this.registeredPlugins.get(pluginId)
    if (!contextData) throw new Error('Plugin not found')

    contextData.state[key] = value

    this.emit('plugin_api_usage', { pluginId, method: 'storage.set' })

    return { success: true }
  }

  /**
   * 处理存储删除请求
   */
  private async handleStorageDelete(pluginId: string, key: string): Promise<any> {
    const contextData = this.registeredPlugins.get(pluginId)
    if (!contextData) throw new Error('Plugin not found')

    delete contextData.state[key]

    this.emit('plugin_api_usage', { pluginId, method: 'storage.delete' })

    return { success: true }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成通用ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取插件消息队列
   */
  getPluginMessages(pluginId: string): PluginMessage[] {
    const queue = this.messageQueue.get(pluginId)
    if (!queue) return []

    const messages = [...queue]
    queue.length = 0 // 清空队列
    return messages
  }

  /**
   * 广播消息给所有插件
   */
  broadcastMessage(type: string, payload: any, excludePlugin?: string): void {
    for (const [pluginId] of this.registeredPlugins) {
      if (pluginId !== excludePlugin) {
        this.sendMessageToPlugin(pluginId, type, payload)
      }
    }
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats(): {
    totalPlugins: number
    activePlugins: number
    totalAPIRequests: number
    totalMessages: number
  } {
    const totalPlugins = this.registeredPlugins.size
    const activePlugins = Array.from(this.activeConnections.values())
      .filter(connections => connections.size > 0).length

    return {
      totalPlugins,
      activePlugins,
      totalAPIRequests: 0, // 这里应该从实际统计中获取
      totalMessages: Array.from(this.messageQueue.values())
        .reduce((total, queue) => total + queue.length, 0)
    }
  }

  /**
   * 清理插件桥接器
   */
  cleanup(): void {
    this.registeredPlugins.clear()
    this.messageQueue.clear()
    this.activeConnections.clear()
    this.requestHandlers.clear()
    this.removeAllListeners()
  }
}