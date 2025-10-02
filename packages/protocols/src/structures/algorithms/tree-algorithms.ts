/**
 * 树算法实现
 *
 * 包含DFS/BFS遍历、路径查询、子树操作等
 */

import type { TreeNode, TreePath, Subtree, TraversalStrategy } from '../tree.js'

// ============================================================================
// 树遍历结果
// ============================================================================

export interface TraversalResult {
  nodes: TreeNode[]
  visitOrder: string[]
}

// ============================================================================
// 深度优先遍历 - 前序
// ============================================================================

export function traverseDFSPreorder(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): TraversalResult {
  const nodes: TreeNode[] = []
  const visitOrder: string[] = []

  function dfs(node: TreeNode, depth: number): void {
    if (maxDepth !== undefined && depth > maxDepth) return

    // 访问节点（前序）
    nodes.push(node)
    visitOrder.push(node.id)

    // 递归访问子节点
    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) dfs(child, depth + 1)
    })
  }

  dfs(root, 0)

  return { nodes, visitOrder }
}

// ============================================================================
// 深度优先遍历 - 后序
// ============================================================================

export function traverseDFSPostorder(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): TraversalResult {
  const nodes: TreeNode[] = []
  const visitOrder: string[] = []

  function dfs(node: TreeNode, depth: number): void {
    if (maxDepth !== undefined && depth > maxDepth) return

    // 递归访问子节点
    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) dfs(child, depth + 1)
    })

    // 访问节点（后序）
    nodes.push(node)
    visitOrder.push(node.id)
  }

  dfs(root, 0)

  return { nodes, visitOrder }
}

// ============================================================================
// 深度优先遍历 - 中序（二叉树）
// ============================================================================

export function traverseDFSInorder(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): TraversalResult {
  const nodes: TreeNode[] = []
  const visitOrder: string[] = []

  function dfs(node: TreeNode, depth: number): void {
    if (maxDepth !== undefined && depth > maxDepth) return

    const children = node.childIds.map(id => nodeMap.get(id)).filter(Boolean) as TreeNode[]

    // 访问左子节点
    const leftChild = children[0]
    if (leftChild) {
      dfs(leftChild, depth + 1)
    }

    // 访问节点（中序）
    nodes.push(node)
    visitOrder.push(node.id)

    // 访问右子节点
    const rightChild = children[1]
    if (rightChild) {
      dfs(rightChild, depth + 1)
    }

    // 其他子节点
    for (let i = 2; i < children.length; i++) {
      const child = children[i]
      if (child) dfs(child, depth + 1)
    }
  }

  dfs(root, 0)

  return { nodes, visitOrder }
}

// ============================================================================
// 广度优先遍历
// ============================================================================

export function traverseBFS(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): TraversalResult {
  const nodes: TreeNode[] = []
  const visitOrder: string[] = []
  const queue: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }]

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!

    if (maxDepth !== undefined && depth > maxDepth) continue

    // 访问节点
    nodes.push(node)
    visitOrder.push(node.id)

    // 加入子节点
    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) {
        queue.push({ node: child, depth: depth + 1 })
      }
    })
  }

  return { nodes, visitOrder }
}

// ============================================================================
// 统一遍历接口
// ============================================================================

export function traverseTree(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>,
  strategy: TraversalStrategy,
  maxDepth?: number
): TraversalResult {
  switch (strategy) {
    case 'dfs-preorder':
      return traverseDFSPreorder(root, nodeMap, maxDepth)
    case 'dfs-inorder':
      return traverseDFSInorder(root, nodeMap, maxDepth)
    case 'dfs-postorder':
      return traverseDFSPostorder(root, nodeMap, maxDepth)
    case 'bfs':
      return traverseBFS(root, nodeMap, maxDepth)
    default:
      return traverseBFS(root, nodeMap, maxDepth)
  }
}

// ============================================================================
// 路径查询
// ============================================================================

export function findPath(
  fromNodeId: string,
  toNodeId: string,
  nodeMap: Map<string, TreeNode>
): TreePath | null {
  const fromNode = nodeMap.get(fromNodeId)
  const toNode = nodeMap.get(toNodeId)

  if (!fromNode || !toNode) return null

  // 找到共同祖先
  const fromPath = fromNode.path
  const toPath = toNode.path

  let commonAncestorId: string | undefined
  let commonIndex = -1

  for (let i = 0; i < Math.min(fromPath.length, toPath.length); i++) {
    if (fromPath[i] === toPath[i]) {
      commonAncestorId = fromPath[i]
      commonIndex = i
    } else {
      break
    }
  }

  // 构建完整路径
  const path: string[] = []

  // 从起点到共同祖先
  for (let i = fromPath.length - 1; i > commonIndex; i--) {
    const nodeId = fromPath[i]
    if (nodeId) path.push(nodeId)
  }

  // 共同祖先
  if (commonAncestorId) {
    path.push(commonAncestorId)
  }

  // 从共同祖先到终点
  for (let i = commonIndex + 1; i < toPath.length; i++) {
    const nodeId = toPath[i]
    if (nodeId) path.push(nodeId)
  }

  return {
    fromNodeId,
    toNodeId,
    path,
    length: path.length,
    commonAncestorId
  }
}

// ============================================================================
// 查找最近公共祖先
// ============================================================================

export function findLowestCommonAncestor(
  nodeId1: string,
  nodeId2: string,
  nodeMap: Map<string, TreeNode>
): string | null {
  const node1 = nodeMap.get(nodeId1)
  const node2 = nodeMap.get(nodeId2)

  if (!node1 || !node2) return null

  const path1 = node1.path
  const path2 = node2.path

  let lca: string | null = null

  for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
    const p1 = path1[i]
    const p2 = path2[i]
    if (p1 && p2 && p1 === p2) {
      lca = p1
    } else {
      break
    }
  }

  return lca
}

// ============================================================================
// 获取子树
// ============================================================================

export function getSubtree(
  rootNodeId: string,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): Subtree | null {
  const rootNode = nodeMap.get(rootNodeId)
  if (!rootNode) return null

  const nodes: TreeNode[] = []
  let actualMaxDepth = 0
  let branchCount = 0
  let leafCount = 0

  function collectNodes(node: TreeNode, depth: number): void {
    if (maxDepth !== undefined && depth > maxDepth) return

    nodes.push(node)
    actualMaxDepth = Math.max(actualMaxDepth, depth)

    if (node.childIds.length === 0) {
      leafCount++
    } else {
      branchCount++
    }

    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) collectNodes(child, depth + 1)
    })
  }

  collectNodes(rootNode, 0)

  return {
    rootNodeId,
    nodes,
    depth: actualMaxDepth,
    stats: {
      totalNodes: nodes.length,
      branchNodes: branchCount,
      leafNodes: leafCount,
      maxDepth: actualMaxDepth
    }
  }
}

// ============================================================================
// 查找所有叶子节点
// ============================================================================

export function findLeafNodes(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>
): TreeNode[] {
  const leafNodes: TreeNode[] = []

  function findLeaves(node: TreeNode): void {
    if (node.childIds.length === 0) {
      leafNodes.push(node)
    } else {
      node.childIds.forEach(childId => {
        const child = nodeMap.get(childId)
        if (child) findLeaves(child)
      })
    }
  }

  findLeaves(root)
  return leafNodes
}

// ============================================================================
// 查找所有祖先
// ============================================================================

export function findAncestors(
  nodeId: string,
  nodeMap: Map<string, TreeNode>
): TreeNode[] {
  const node = nodeMap.get(nodeId)
  if (!node) return []

  const ancestors: TreeNode[] = []

  for (const ancestorId of node.path.slice(0, -1)) { // 排除自己
    const ancestor = nodeMap.get(ancestorId)
    if (ancestor) ancestors.push(ancestor)
  }

  return ancestors
}

// ============================================================================
// 查找所有后代
// ============================================================================

export function findDescendants(
  nodeId: string,
  nodeMap: Map<string, TreeNode>,
  maxDepth?: number
): TreeNode[] {
  const node = nodeMap.get(nodeId)
  if (!node) return []

  const descendants: TreeNode[] = []

  function collectDescendants(current: TreeNode, depth: number): void {
    if (maxDepth !== undefined && depth >= maxDepth) return

    current.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) {
        descendants.push(child)
        collectDescendants(child, depth + 1)
      }
    })
  }

  collectDescendants(node, 0)
  return descendants
}

// ============================================================================
// 计算树的统计信息
// ============================================================================

export interface TreeStatistics {
  totalNodes: number
  maxDepth: number
  avgDepth: number
  branchCount: number
  leafCount: number
  avgBranchingFactor: number
  balanceFactor: number        // 平衡因子（0-1，越接近1越平衡）
}

export function calculateTreeStatistics(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>
): TreeStatistics {
  const nodes: TreeNode[] = []
  let totalDepth = 0
  let maxDepth = 0
  let branchCount = 0
  let leafCount = 0
  const childCounts: number[] = []

  function analyze(node: TreeNode, depth: number): void {
    nodes.push(node)
    totalDepth += depth
    maxDepth = Math.max(maxDepth, depth)

    const childCount = node.childIds.length
    if (childCount > 0) {
      branchCount++
      childCounts.push(childCount)
    } else {
      leafCount++
    }

    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) analyze(child, depth + 1)
    })
  }

  analyze(root, 0)

  const avgBranchingFactor = childCounts.length > 0
    ? childCounts.reduce((a, b) => a + b, 0) / childCounts.length
    : 0

  // 计算平衡因子（理想深度 vs 实际深度）
  const idealDepth = nodes.length > 1 ? Math.log2(nodes.length) : 0
  const balanceFactor = idealDepth > 0 ? Math.min(1, idealDepth / maxDepth) : 1

  return {
    totalNodes: nodes.length,
    maxDepth,
    avgDepth: nodes.length > 0 ? totalDepth / nodes.length : 0,
    branchCount,
    leafCount,
    avgBranchingFactor,
    balanceFactor
  }
}

// ============================================================================
// 树验证
// ============================================================================

export interface TreeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateTree(
  root: TreeNode,
  nodeMap: Map<string, TreeNode>
): TreeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const visited = new Set<string>()

  function validate(node: TreeNode, expectedPath: string[]): void {
    // 检查重复访问（环路）
    if (visited.has(node.id)) {
      errors.push(`Cycle detected at node ${node.id}`)
      return
    }
    visited.add(node.id)

    // 检查路径一致性
    if (JSON.stringify(node.path) !== JSON.stringify(expectedPath)) {
      errors.push(`Path mismatch for node ${node.id}`)
    }

    // 检查层级一致性
    if (node.level !== expectedPath.length - 1) {
      errors.push(`Level mismatch for node ${node.id}`)
    }

    // 检查子节点
    node.childIds.forEach(childId => {
      const child = nodeMap.get(childId)
      if (!child) {
        errors.push(`Missing child node ${childId}`)
        return
      }

      // 检查父子关系
      if (child.parentId !== node.id) {
        errors.push(`Parent-child relationship broken for ${childId}`)
      }

      validate(child, [...expectedPath, childId])
    })
  }

  validate(root, [root.id])

  // 检查孤立节点
  const connectedNodes = visited
  const allNodes = Array.from(nodeMap.keys())
  const orphanNodes = allNodes.filter(id => !connectedNodes.has(id))

  if (orphanNodes.length > 0) {
    warnings.push(`Found ${orphanNodes.length} orphan nodes not connected to root`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
