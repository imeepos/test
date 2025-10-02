/**
 * 图算法实现
 *
 * 包含拓扑排序、环检测、依赖分析等核心算法
 */

import type { Edge } from '../edge.js'
import type { GraphValidationResult } from '../graph.js'

// ============================================================================
// 图表示接口
// ============================================================================

export interface GraphRepresentation {
  nodeIds: string[]
  edges: Edge[]
}

// ============================================================================
// 拓扑排序结果
// ============================================================================

export interface TopologicalSortResult {
  success: boolean
  order: string[]
  levels: string[][]              // 层级划分，同层可并行执行
  error?: string
}

// ============================================================================
// 环检测结果
// ============================================================================

export interface CycleDetectionResult {
  hasCycles: boolean
  cycles: string[][]              // 所有检测到的环
}

// ============================================================================
// 拓扑排序（Kahn算法）
// ============================================================================

export function topologicalSort(graph: GraphRepresentation): TopologicalSortResult {
  const { nodeIds, edges } = graph

  // 构建邻接表和入度表
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  // 初始化
  nodeIds.forEach(id => {
    adjacency.set(id, [])
    inDegree.set(id, 0)
  })

  // 构建图结构
  edges.forEach(edge => {
    if (!edge.isActive) return

    const from = edge.sourceNodeId
    const to = edge.targetNodeId

    adjacency.get(from)?.push(to)
    inDegree.set(to, (inDegree.get(to) || 0) + 1)
  })

  // Kahn算法
  const queue: string[] = []
  const order: string[] = []
  const levels: string[][] = []

  // 找出所有入度为0的节点
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })

  while (queue.length > 0) {
    const currentLevel: string[] = [...queue]
    levels.push(currentLevel)
    queue.length = 0

    for (const node of currentLevel) {
      order.push(node)

      // 减少相邻节点的入度
      adjacency.get(node)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)

        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }
  }

  // 检查是否所有节点都已排序（无环）
  if (order.length !== nodeIds.length) {
    return {
      success: false,
      order: [],
      levels: [],
      error: 'Graph contains cycles'
    }
  }

  return {
    success: true,
    order,
    levels
  }
}

// ============================================================================
// 环检测（DFS）
// ============================================================================

export function detectCycles(graph: GraphRepresentation): CycleDetectionResult {
  const { nodeIds, edges } = graph

  // 构建邻接表
  const adjacency = new Map<string, string[]>()
  nodeIds.forEach(id => adjacency.set(id, []))

  edges.forEach(edge => {
    if (edge.isActive) {
      adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId)
    }
  })

  const visited = new Set<string>()
  const recStack = new Set<string>()
  const cycles: string[][] = []

  function dfs(node: string, path: string[]): void {
    visited.add(node)
    recStack.add(node)
    path.push(node)

    const neighbors = adjacency.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path])
      } else if (recStack.has(neighbor)) {
        // 找到环
        const cycleStart = path.indexOf(neighbor)
        const cycle = path.slice(cycleStart)
        cycles.push([...cycle, neighbor])
      }
    }

    recStack.delete(node)
  }

  // 对所有未访问节点执行DFS
  nodeIds.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, [])
    }
  })

  return {
    hasCycles: cycles.length > 0,
    cycles
  }
}

// ============================================================================
// 关键路径分析（最长路径）
// ============================================================================

export function findCriticalPath(graph: GraphRepresentation, durations: Map<string, number>): string[] {
  const sortResult = topologicalSort(graph)
  if (!sortResult.success) return []

  const { order } = sortResult
  const { edges } = graph

  // 构建邻接表
  const adjacency = new Map<string, string[]>()
  order.forEach(id => adjacency.set(id, []))

  edges.forEach(edge => {
    if (edge.isActive) {
      adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId)
    }
  })

  // 计算最早开始时间
  const earliestStart = new Map<string, number>()
  order.forEach(node => {
    earliestStart.set(node, 0)
  })

  for (const node of order) {
    const currentStart = earliestStart.get(node) || 0
    const duration = durations.get(node) || 0
    const finishTime = currentStart + duration

    adjacency.get(node)?.forEach(neighbor => {
      const neighborStart = earliestStart.get(neighbor) || 0
      earliestStart.set(neighbor, Math.max(neighborStart, finishTime))
    })
  }

  // 反向计算最晚开始时间
  const latestStart = new Map<string, number>()
  const reverseOrder = [...order].reverse()

  // 初始化终点节点
  const endNodes = order.filter(node => (adjacency.get(node) || []).length === 0)
  endNodes.forEach(node => {
    latestStart.set(node, earliestStart.get(node) || 0)
  })

  for (const node of reverseOrder) {
    if (!latestStart.has(node)) {
      const neighbors = adjacency.get(node) || []
      const minLatest = Math.min(
        ...neighbors.map(n => (latestStart.get(n) || 0) - (durations.get(node) || 0))
      )
      latestStart.set(node, minLatest)
    }
  }

  // 找出关键路径（松弛度为0的节点）
  const criticalNodes = order.filter(node => {
    const earliest = earliestStart.get(node) || 0
    const latest = latestStart.get(node) || 0
    return earliest === latest
  })

  return criticalNodes
}

// ============================================================================
// 依赖分析
// ============================================================================

export interface DependencyAnalysisResult {
  nodeId: string
  directDependencies: string[]
  allDependencies: string[]       // 包括间接依赖
  directDependents: string[]
  allDependents: string[]
  level: number                   // 拓扑层级
}

export function analyzeDependencies(
  graph: GraphRepresentation,
  targetNodeId: string
): DependencyAnalysisResult {
  const { nodeIds, edges } = graph

  // 构建双向邻接表
  const outgoing = new Map<string, Set<string>>()
  const incoming = new Map<string, Set<string>>()

  nodeIds.forEach(id => {
    outgoing.set(id, new Set())
    incoming.set(id, new Set())
  })

  edges.forEach(edge => {
    if (edge.isActive) {
      outgoing.get(edge.sourceNodeId)?.add(edge.targetNodeId)
      incoming.get(edge.targetNodeId)?.add(edge.sourceNodeId)
    }
  })

  // 查找所有依赖（DFS）
  function findAllDependencies(nodeId: string): Set<string> {
    const deps = new Set<string>()
    const stack = [nodeId]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)

      incoming.get(current)?.forEach(dep => {
        deps.add(dep)
        stack.push(dep)
      })
    }

    return deps
  }

  // 查找所有被依赖节点
  function findAllDependents(nodeId: string): Set<string> {
    const dependents = new Set<string>()
    const stack = [nodeId]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue
      visited.add(current)

      outgoing.get(current)?.forEach(dependent => {
        dependents.add(dependent)
        stack.push(dependent)
      })
    }

    return dependents
  }

  const directDeps = Array.from(incoming.get(targetNodeId) || [])
  const allDeps = Array.from(findAllDependencies(targetNodeId))
  const directDependents = Array.from(outgoing.get(targetNodeId) || [])
  const allDependents = Array.from(findAllDependents(targetNodeId))

  // 计算拓扑层级
  const sortResult = topologicalSort(graph)
  let level = 0
  if (sortResult.success) {
    level = sortResult.levels.findIndex(l => l.includes(targetNodeId))
  }

  return {
    nodeId: targetNodeId,
    directDependencies: directDeps,
    allDependencies: allDeps,
    directDependents,
    allDependents,
    level
  }
}

// ============================================================================
// 图验证
// ============================================================================

export function validateGraph(graph: GraphRepresentation): GraphValidationResult {
  const { nodeIds, edges } = graph

  // 检查环
  const cycleResult = detectCycles(graph)

  // 检查孤立节点
  const connectedNodes = new Set<string>()
  edges.forEach(edge => {
    connectedNodes.add(edge.sourceNodeId)
    connectedNodes.add(edge.targetNodeId)
  })

  const isolatedNodes = nodeIds.filter(id => !connectedNodes.has(id))

  // 检查是否为DAG
  const sortResult = topologicalSort(graph)
  const isDAG = sortResult.success

  // 收集警告
  const warnings: string[] = []
  if (isolatedNodes.length > 0) {
    warnings.push(`Found ${isolatedNodes.length} isolated nodes`)
  }

  // 收集错误
  const errors: string[] = []
  if (cycleResult.hasCycles) {
    errors.push(`Graph contains ${cycleResult.cycles.length} cycles`)
  }

  return {
    isValid: isDAG && errors.length === 0,
    isDAG,
    hasCycles: cycleResult.hasCycles,
    cycles: cycleResult.cycles,
    isolatedNodes,
    warnings,
    errors
  }
}

// ============================================================================
// 并行执行分组
// ============================================================================

export function groupParallelNodes(graph: GraphRepresentation, maxParallel: number = 5): string[][] {
  const sortResult = topologicalSort(graph)
  if (!sortResult.success) return []

  const groups: string[][] = []

  for (const level of sortResult.levels) {
    if (level.length <= maxParallel) {
      groups.push(level)
    } else {
      // 拆分大层级
      for (let i = 0; i < level.length; i += maxParallel) {
        groups.push(level.slice(i, i + maxParallel))
      }
    }
  }

  return groups
}
