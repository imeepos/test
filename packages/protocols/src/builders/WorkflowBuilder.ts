/**
 * 工作流构建器 - 流式API
 *
 * 提供声明式的工作流构建能力，类似LangGraph的易用性
 */

import type { Graph, GraphExecutionPlan } from '../structures/graph.js'
import type { Edge, EdgeType, EdgeCondition } from '../structures/edge.js'
import type { EnhancedNode } from '../structures/node-enhanced.js'
import { GraphExecutor, type NodeExecutor, type GraphExecutionOptions } from '../execution/graph-executor.js'

// ============================================================================
// 条件路由函数
// ============================================================================

export type RoutingFunction<TState = any> = (state: TState) => string | Promise<string>

export interface ConditionalRouteMap {
  [key: string]: string  // 路由结果 -> 目标节点ID
}

// ============================================================================
// 节点定义
// ============================================================================

export interface WorkflowNodeConfig {
  id: string
  handler: NodeExecutor
  retryPolicy?: {
    maxRetries: number
    backoff: 'linear' | 'exponential'
  }
  timeout?: number
  metadata?: Record<string, unknown>
}

// ============================================================================
// 边定义
// ============================================================================

export interface WorkflowEdgeConfig {
  from: string
  to: string
  type?: EdgeType
  weight?: number
  condition?: EdgeCondition
  metadata?: Record<string, unknown>
}

// ============================================================================
// 工作流构建器
// ============================================================================

export class WorkflowBuilder {
  private projectId: string
  private userId: string
  private name: string
  private description?: string

  private nodes: Map<string, WorkflowNodeConfig> = new Map()
  private edges: WorkflowEdgeConfig[] = []
  private conditionalRoutes: Map<string, {
    routingFn: RoutingFunction
    routes: ConditionalRouteMap
  }> = new Map()

  private startNodeId?: string
  private endNodeIds: Set<string> = new Set()

  private executionOptions: GraphExecutionOptions = {}

  constructor(options: {
    projectId: string
    userId: string
    name: string
    description?: string
  }) {
    this.projectId = options.projectId
    this.userId = options.userId
    this.name = options.name
    this.description = options.description
  }

  /**
   * 添加节点
   */
  addNode(id: string, handler: NodeExecutor, config?: {
    retryPolicy?: WorkflowNodeConfig['retryPolicy']
    timeout?: number
    metadata?: Record<string, unknown>
  }): this {
    this.nodes.set(id, {
      id,
      handler,
      ...config
    })
    return this
  }

  /**
   * 添加边
   */
  addEdge(from: string, to: string, config?: {
    type?: EdgeType
    weight?: number
    condition?: EdgeCondition
    metadata?: Record<string, unknown>
  }): this {
    this.edges.push({
      from,
      to,
      ...config
    })
    return this
  }

  /**
   * 添加条件边
   */
  addConditionalEdge(
    sourceNode: string,
    routingFn: RoutingFunction,
    routes: ConditionalRouteMap
  ): this {
    this.conditionalRoutes.set(sourceNode, {
      routingFn,
      routes
    })
    return this
  }

  /**
   * 设置起始节点
   */
  setEntryPoint(nodeId: string): this {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node ${nodeId} not found`)
    }
    this.startNodeId = nodeId
    return this
  }

  /**
   * 添加结束节点
   */
  addEndNode(nodeId: string): this {
    this.endNodeIds.add(nodeId)
    return this
  }

  /**
   * 配置执行选项
   */
  withExecutionOptions(options: GraphExecutionOptions): this {
    this.executionOptions = { ...this.executionOptions, ...options }
    return this
  }

  /**
   * 启用并行执行
   */
  enableParallel(maxConcurrency: number = 5): this {
    this.executionOptions.enableParallelExecution = true
    this.executionOptions.maxParallelNodes = maxConcurrency
    return this
  }

  /**
   * 设置失败策略
   */
  failFast(enabled: boolean = true): this {
    this.executionOptions.failFast = enabled
    return this
  }

  /**
   * 添加进度回调
   */
  onProgress(callback: (completed: number, total: number) => void | Promise<void>): this {
    this.executionOptions.onProgress = callback
    return this
  }

  /**
   * 添加节点开始回调
   */
  onNodeStart(callback: (nodeId: string) => void | Promise<void>): this {
    this.executionOptions.onNodeStart = callback
    return this
  }

  /**
   * 添加节点完成回调
   */
  onNodeComplete(callback: (nodeId: string, result: unknown) => void | Promise<void>): this {
    this.executionOptions.onNodeComplete = callback
    return this
  }

  /**
   * 添加节点错误回调
   */
  onNodeError(callback: (nodeId: string, error: Error) => void | Promise<void>): this {
    this.executionOptions.onNodeError = callback
    return this
  }

  /**
   * 编译工作流
   */
  async compile(): Promise<CompiledWorkflow> {
    // 验证
    this.validate()

    // 构建Graph对象
    const nodeIds = Array.from(this.nodes.keys())

    const edges: Edge[] = this.edges.map((edgeConfig, index) => ({
      id: crypto.randomUUID(),
      projectId: this.projectId,
      sourceNodeId: edgeConfig.from,
      targetNodeId: edgeConfig.to,
      type: edgeConfig.type || 'dataflow',
      direction: 'directed' as const,
      weight: edgeConfig.weight ?? 1,
      priority: index,
      isActive: true,
      isValidated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      condition: edgeConfig.condition,
      metadata: edgeConfig.metadata
    }))

    // 添加条件路由生成的边
    for (const [sourceNode, { routes }] of this.conditionalRoutes) {
      for (const targetNode of Object.values(routes)) {
        if (!edges.some(e => e.sourceNodeId === sourceNode && e.targetNodeId === targetNode)) {
          edges.push({
            id: crypto.randomUUID(),
            projectId: this.projectId,
            sourceNodeId: sourceNode,
            targetNodeId: targetNode,
            type: 'controlflow',
            direction: 'directed',
            weight: 1,
            priority: edges.length,
            isActive: true,
            isValidated: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    }

    const graph: Graph = {
      id: crypto.randomUUID(),
      projectId: this.projectId,
      userId: this.userId,
      name: this.name,
      description: this.description,
      type: 'dag',
      nodeIds,
      edges,
      stats: {
        nodeCount: nodeIds.length,
        edgeCount: edges.length,
        maxDepth: 0,
        avgDegree: edges.length / nodeIds.length
      },
      executionStatus: 'idle',
      config: {
        maxParallelNodes: this.executionOptions.maxParallelNodes || 5,
        enableParallelExecution: this.executionOptions.enableParallelExecution ?? true,
        failFast: this.executionOptions.failFast ?? false,
        retryFailedNodes: this.executionOptions.retryFailedNodes ?? true,
        maxRetries: this.executionOptions.maxRetries || 3
      },
      metadata: {
        tags: [],
        version: 1
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new CompiledWorkflow(
      graph,
      this.nodes,
      this.conditionalRoutes,
      this.executionOptions
    )
  }

  /**
   * 验证工作流配置
   */
  private validate(): void {
    if (this.nodes.size === 0) {
      throw new Error('Workflow must have at least one node')
    }

    // 验证边引用的节点存在
    for (const edge of this.edges) {
      if (!this.nodes.has(edge.from)) {
        throw new Error(`Edge references non-existent source node: ${edge.from}`)
      }
      if (!this.nodes.has(edge.to)) {
        throw new Error(`Edge references non-existent target node: ${edge.to}`)
      }
    }

    // 验证条件路由
    for (const [sourceNode, { routes }] of this.conditionalRoutes) {
      if (!this.nodes.has(sourceNode)) {
        throw new Error(`Conditional route references non-existent source node: ${sourceNode}`)
      }
      for (const targetNode of Object.values(routes)) {
        if (!this.nodes.has(targetNode)) {
          throw new Error(`Conditional route references non-existent target node: ${targetNode}`)
        }
      }
    }
  }
}

// ============================================================================
// 编译后的工作流
// ============================================================================

export class CompiledWorkflow {
  constructor(
    public readonly graph: Graph,
    private readonly nodeConfigs: Map<string, WorkflowNodeConfig>,
    private readonly conditionalRoutes: Map<string, {
      routingFn: RoutingFunction
      routes: ConditionalRouteMap
    }>,
    private readonly executionOptions: GraphExecutionOptions
  ) {}

  /**
   * 执行工作流
   */
  async execute(initialState?: any): Promise<any> {
    // 创建节点执行器包装
    const nodeExecutor: NodeExecutor = {
      execute: async (node: EnhancedNode, context: any) => {
        const config = this.nodeConfigs.get(node.id)
        if (!config) {
          throw new Error(`Node configuration not found: ${node.id}`)
        }

        // 检查是否有条件路由
        const conditionalRoute = this.conditionalRoutes.get(node.id)
        if (conditionalRoute) {
          // 执行节点
          const result = await config.handler.execute(node, context)

          // 执行路由函数
          const routeKey = await conditionalRoute.routingFn(result)
          const targetNodeId = conditionalRoute.routes[routeKey]

          if (!targetNodeId) {
            throw new Error(`Routing function returned unknown key: ${routeKey}`)
          }

          // 将路由结果存储到上下文
          context.__nextNodeId = targetNodeId

          return result
        }

        // 普通节点执行
        return config.handler.execute(node, context)
      }
    }

    // 创建节点Map
    const nodeMap = new Map<string, EnhancedNode>()
    for (const [nodeId, config] of this.nodeConfigs) {
      // 创建增强节点（简化版本，实际应该从数据库加载）
      const enhancedNode: EnhancedNode = {
        id: nodeId,
        projectId: this.graph.projectId,
        userId: this.graph.userId,
        content: '',
        position: { x: 0, y: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        enhancementType: 'graph-node',
        relationships: {
          childIds: [],
          dependencyIds: [],
          dependentIds: [],
          referenceIds: [],
          referencedByIds: [],
          siblingIds: []
        }
      }
      nodeMap.set(nodeId, enhancedNode)
    }

    // 执行图
    const executor = new GraphExecutor(nodeExecutor, this.executionOptions)
    const result = await executor.execute(this.graph, nodeMap, this.executionOptions)

    return result
  }

  /**
   * 获取执行计划
   */
  async getExecutionPlan(): Promise<GraphExecutionPlan> {
    const nodeExecutor: NodeExecutor = {
      execute: async () => {}
    }
    const executor = new GraphExecutor(nodeExecutor)
    return executor.createExecutionPlan(this.graph)
  }

  /**
   * 导出为JSON
   */
  toJSON(): any {
    return {
      graph: this.graph,
      nodes: Array.from(this.nodeConfigs.entries()).map(([id, config]) => ({
        id,
        ...config,
        handler: undefined // 不序列化函数
      })),
      conditionalRoutes: Array.from(this.conditionalRoutes.entries()).map(([source, { routes }]) => ({
        source,
        routes
      }))
    }
  }
}
