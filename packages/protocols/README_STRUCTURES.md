# @sker/protocols - 数据结构与执行引擎

## 📋 概述

本模块提供完整的图执行、树执行和链式执行的数据结构与算法支持。

## 🏗️ 核心数据结构

### 1. Chain（链条）

线性执行序列，支持顺序AI任务处理、条件分支、循环控制。

**特性**:
- 顺序/并行/条件执行策略
- 断点续传
- 错误重试
- 条件跳过
- 执行状态追踪

**使用示例**:

```typescript
import { Chain, ChainExecutor } from '@sker/protocols'

// 创建链条
const chain: Chain = {
  id: '...',
  projectId: '...',
  userId: '...',
  name: 'AI处理链',
  nodes: [
    {
      id: '1',
      nodeId: 'node-1',
      order: 0,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    },
    // ...更多节点
  ],
  strategy: 'sequential',
  status: 'idle'
}

// 执行链条
const executor = new ChainExecutor(nodeExecutor)
const result = await executor.execute(chain, nodeMap, {
  enableCheckpoint: true,
  continueOnError: false
})
```

### 2. Graph（图）

DAG图结构，支持拓扑排序、环检测、并行执行优化。

**特性**:
- 拓扑排序和层级划分
- 环检测和验证
- 关键路径分析
- 依赖分析
- 并行执行优化

**使用示例**:

```typescript
import { Graph, GraphExecutor, topologicalSort } from '@sker/protocols'

// 创建图
const graph: Graph = {
  id: '...',
  projectId: '...',
  userId: '...',
  name: 'AI处理图',
  type: 'dag',
  nodeIds: ['n1', 'n2', 'n3'],
  edges: [
    {
      id: 'e1',
      projectId: '...',
      sourceNodeId: 'n1',
      targetNodeId: 'n2',
      type: 'dataflow',
      direction: 'directed',
      weight: 1
    }
  ],
  config: {
    maxParallelNodes: 5,
    enableParallelExecution: true,
    failFast: false
  }
}

// 拓扑排序
const sortResult = topologicalSort({
  nodeIds: graph.nodeIds,
  edges: graph.edges
})

// 执行图
const executor = new GraphExecutor(nodeExecutor)
const result = await executor.execute(graph, nodeMap, {
  enableParallelExecution: true,
  maxParallelNodes: 5
})
```

### 3. Tree（树）

层次结构，支持DFS/BFS遍历、路径查询、子树操作。

**特性**:
- 多种遍历策略（DFS前序/中序/后序、BFS）
- 路径查询和LCA
- 子树提取
- 按层级执行
- 树验证

**使用示例**:

```typescript
import { Tree, TreeExecutor, traverseTree } from '@sker/protocols'

// 创建树
const tree: Tree = {
  id: '...',
  projectId: '...',
  userId: '...',
  name: 'AI处理树',
  rootId: 'root',
  nodes: [
    {
      id: 'root',
      nodeId: 'node-root',
      type: 'root',
      level: 0,
      path: ['root'],
      childIds: ['child1', 'child2']
    }
  ],
  defaultTraversal: 'bfs'
}

// 遍历树
const nodeMap = new Map(tree.nodes.map(n => [n.id, n]))
const result = traverseTree(
  nodeMap.get(tree.rootId)!,
  nodeMap,
  'dfs-preorder'
)

// 执行树
const executor = new TreeExecutor(nodeExecutor)
const execResult = await executor.execute(tree, enhancedNodeMap, {
  strategy: 'bfs',
  maxDepth: 5
})
```

### 4. Edge（边）

连接关系，支持有向/无向、权重、类型标记、条件触发。

**边类型**:
- `dataflow` - 数据流边
- `controlflow` - 控制流边
- `dependency` - 依赖边
- `reference` - 引用边
- `hierarchy` - 层次边

**使用示例**:

```typescript
import { Edge } from '@sker/protocols'

const edge: Edge = {
  id: '...',
  projectId: '...',
  sourceNodeId: 'node1',
  targetNodeId: 'node2',
  type: 'dataflow',
  direction: 'directed',
  weight: 0.8,
  priority: 5,
  condition: {
    enabled: true,
    expression: 'result.score > 0.5'
  },
  metadata: {
    label: '高分传递',
    animated: true
  }
}
```

### 5. EnhancedNode（增强节点）

扩展节点，支持层次化、图结构、执行信息。

**使用示例**:

```typescript
import { enhanceNode, canExecuteNode } from '@sker/protocols'

// 转换为增强节点
const enhanced = enhanceNode(standardNode, 'graph-node')

// 检查是否可执行
const canExec = canExecuteNode(enhanced, completedNodeIds)
```

## 🔧 核心算法

### 图算法

```typescript
import {
  topologicalSort,
  detectCycles,
  findCriticalPath,
  analyzeDependencies,
  validateGraph
} from '@sker/protocols'

// 拓扑排序
const { order, levels } = topologicalSort(graph)

// 环检测
const { hasCycles, cycles } = detectCycles(graph)

// 关键路径
const criticalPath = findCriticalPath(graph, durations)

// 依赖分析
const deps = analyzeDependencies(graph, nodeId)

// 图验证
const validation = validateGraph(graph)
```

### 树算法

```typescript
import {
  traverseTree,
  findPath,
  findLowestCommonAncestor,
  getSubtree,
  calculateTreeStatistics,
  validateTree
} from '@sker/protocols'

// 遍历
const result = traverseTree(root, nodeMap, 'bfs')

// 路径查询
const path = findPath(nodeId1, nodeId2, nodeMap)

// LCA
const lca = findLowestCommonAncestor(nodeId1, nodeId2, nodeMap)

// 子树
const subtree = getSubtree(rootId, nodeMap, maxDepth)

// 统计
const stats = calculateTreeStatistics(root, nodeMap)

// 验证
const validation = validateTree(root, nodeMap)
```

## ⚙️ 执行引擎

### GraphExecutor

```typescript
const executor = new GraphExecutor(nodeExecutor, {
  maxParallelNodes: 5,
  failFast: false,
  onProgress: (completed, total) => {
    console.log(`进度: ${completed}/${total}`)
  }
})

const result = await executor.execute(graph, nodeMap)
```

### TreeExecutor

```typescript
const executor = new TreeExecutor(nodeExecutor)

// 执行整树
await executor.execute(tree, nodeMap, { strategy: 'bfs' })

// 执行子树
await executor.executeSubtree(tree, rootId, nodeMap)

// 执行叶子节点
await executor.executeLeaves(tree, nodeMap)

// 按层级执行
await executor.executeByLevel(tree, nodeMap)
```

### ChainExecutor

```typescript
const executor = new ChainExecutor(nodeExecutor)

// 执行链条
await executor.execute(chain, nodeMap, {
  fromCheckpoint: true,
  maxRetries: 3
})

// 暂停
const checkpoint = await executor.pause(context)

// 恢复
await executor.resume(chain, checkpoint, nodeMap)

// 重试失败节点
await executor.retryFailed(chain, nodeMap)
```

## 📊 类型安全

所有数据结构都提供Zod Schema验证：

```typescript
import {
  GraphSchema,
  ChainSchema,
  TreeSchema,
  EdgeSchema
} from '@sker/protocols'

// 运行时验证
const validGraph = GraphSchema.parse(data)

// 类型守卫
if (isValidGraph(data)) {
  // data 是 Graph 类型
}
```

## 🔄 协议版本

```typescript
import { PROTOCOL_VERSIONS } from '@sker/protocols'

console.log(PROTOCOL_VERSIONS.chain)        // "1.0.0"
console.log(PROTOCOL_VERSIONS.graph)        // "1.0.0"
console.log(PROTOCOL_VERSIONS.tree)         // "1.0.0"
console.log(PROTOCOL_VERSIONS.edge)         // "1.0.0"
console.log(PROTOCOL_VERSIONS.enhancedNode) // "1.0.0"
```

## 📝 最佳实践

### 1. 图执行

- 使用拓扑排序确保执行顺序正确
- 在执行前验证图结构
- 利用层级划分实现并行执行
- 设置合理的 `maxParallelNodes`

### 2. 树执行

- 选择合适的遍历策略
- 使用 `maxDepth` 限制递归深度
- 按层级执行可提升性能
- 验证树结构完整性

### 3. 链执行

- 启用断点续传防止重复执行
- 设置合理的重试次数
- 使用条件跳过优化执行流程
- 处理超时场景

### 4. 错误处理

- 实现 `onNodeError` 回调记录错误
- 使用 `failFast` 控制错误传播
- 通过 `continueOnError` 决定是否继续
- 保存执行上下文用于调试

## 🧪 测试

```typescript
import { validateGraph, validateTree } from '@sker/protocols'

// 图测试
const validation = validateGraph(graph)
expect(validation.isValid).toBe(true)
expect(validation.hasCycles).toBe(false)

// 树测试
const treeValidation = validateTree(root, nodeMap)
expect(treeValidation.isValid).toBe(true)
```

## 📚 相关文档

- [协议优先架构](../../docs/architecture/PROTOCOL_FIRST_ARCHITECTURE.md)
- [系统架构](../../docs/architecture/ARCHITECTURE.md)
- [MVP计划](../../docs/architecture/mvp_plan.md)
