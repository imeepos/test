import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AINode, Position, CreateNodeOptions, NodeEdit } from '@/types'

export interface NodeState {
  // 节点数据
  nodes: Map<string, AINode>
  edges: Array<{ id: string; source: string; target: string }>
  
  // 节点操作历史
  history: NodeEdit[]
  
  // 节点创建模板
  templates: Array<{
    name: string
    content: string
    importance: 1 | 2 | 3 | 4 | 5
    tags: string[]
  }>
  
  // Actions
  addNode: (node: Omit<AINode, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNode: (id: string, updates: Partial<AINode>) => void
  deleteNode: (id: string) => void
  getNode: (id: string) => AINode | undefined
  getNodes: () => AINode[]
  
  // 连接管理
  connectNodes: (sourceId: string, targetId: string) => void
  disconnectNodes: (sourceId: string, targetId: string) => void
  getConnections: (nodeId: string) => string[]
  
  // 批量操作
  deleteNodes: (ids: string[]) => void
  duplicateNode: (id: string) => string | undefined
  moveNode: (id: string, position: Position) => void
  
  // 搜索和筛选
  searchNodes: (query: string) => AINode[]
  filterNodesByTags: (tags: string[]) => AINode[]
  filterNodesByImportance: (importance: number[]) => AINode[]
  
  // 统计计算
  getNodeStats: () => {
    total: number
    byImportance: Record<number, number>
    byStatus: Record<string, number>
    averageConfidence: number
  }
  
  // 历史管理
  addToHistory: (edit: Omit<NodeEdit, 'timestamp'>) => void
  clearHistory: () => void
}

const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useNodeStore = create<NodeState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        nodes: new Map(),
        edges: [],
        history: [],
        templates: [
          {
            name: '需求分析',
            content: '请描述具体的需求...',
            importance: 4,
            tags: ['需求', '分析'],
          },
          {
            name: '技术方案',
            content: '技术实现方案...',
            importance: 5,
            tags: ['技术', '方案'],
          },
          {
            name: '任务计划',
            content: '具体的执行计划...',
            importance: 3,
            tags: ['计划', '任务'],
          },
        ],
        
        // 节点CRUD操作
        addNode: (nodeData) => {
          const id = generateId()
          const now = new Date()
          const node: AINode = {
            ...nodeData,
            id,
            version: 1,
            createdAt: now,
            updatedAt: now,
            connections: [],
            metadata: {
              semantic: [],
              editCount: 0,
            },
          }
          
          set((state) => {
            if (!(state.nodes instanceof Map)) {
              state.nodes = new Map()
            }
            
            state.nodes.set(id, node)
            state.history.push({
              id: generateId(),
              type: 'create',
              data: node,
              timestamp: now,
            })
          })
          
          return id
        },
        
        updateNode: (id, updates) => {
          set((state) => {
            const node = state.nodes.get(id)
            if (node) {
              const updatedNode = {
                ...node,
                ...updates,
                updatedAt: new Date(),
                version: updates.content !== node.content ? node.version + 1 : node.version,
                metadata: {
                  ...node.metadata,
                  editCount: node.metadata.editCount + 1,
                },
              }
              state.nodes.set(id, updatedNode)
              state.history.push({
                id: generateId(),
                type: 'update',
                data: updates,
                timestamp: new Date(),
              })
            }
          })
        },
        
        deleteNode: (id) => {
          set((state) => {
            const node = state.nodes.get(id)
            if (node) {
              state.nodes.delete(id)
              // 删除相关连接
              state.edges = state.edges.filter(
                edge => edge.source !== id && edge.target !== id
              )
              state.history.push({
                id: generateId(),
                type: 'delete',
                data: { id },
                timestamp: new Date(),
              })
            }
          })
        },
        
        getNode: (id) => {
          return get().nodes.get(id)
        },
        
        getNodes: () => {
          const state = get()
          const nodesMap = state.nodes
          
          if (!(nodesMap instanceof Map)) {
            return []
          }
          
          return Array.from(nodesMap.values())
        },
        
        // 连接管理
        connectNodes: (sourceId, targetId) => {
          if (sourceId === targetId) return
          
          set((state) => {
            const edgeExists = state.edges.some(
              edge => edge.source === sourceId && edge.target === targetId
            )
            
            if (!edgeExists) {
              const edgeId = `edge-${sourceId}-${targetId}`
              state.edges.push({
                id: edgeId,
                source: sourceId,
                target: targetId,
              })
              
              // 更新节点连接信息
              const sourceNode = state.nodes.get(sourceId)
              const targetNode = state.nodes.get(targetId)
              
              if (sourceNode) {
                sourceNode.connections.push({
                  id: edgeId,
                  sourceId,
                  targetId,
                  type: 'output',
                })
              }
              
              if (targetNode) {
                targetNode.connections.push({
                  id: edgeId,
                  sourceId,
                  targetId,
                  type: 'input',
                })
              }
            }
          })
        },
        
        disconnectNodes: (sourceId, targetId) => {
          set((state) => {
            state.edges = state.edges.filter(
              edge => !(edge.source === sourceId && edge.target === targetId)
            )
            
            // 更新节点连接信息
            const sourceNode = state.nodes.get(sourceId)
            const targetNode = state.nodes.get(targetId)
            
            if (sourceNode) {
              sourceNode.connections = sourceNode.connections.filter(
                conn => !(conn.sourceId === sourceId && conn.targetId === targetId)
              )
            }
            
            if (targetNode) {
              targetNode.connections = targetNode.connections.filter(
                conn => !(conn.sourceId === sourceId && conn.targetId === targetId)
              )
            }
          })
        },
        
        getConnections: (nodeId) => {
          const { edges } = get()
          return edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source)
        },
        
        // 批量操作
        deleteNodes: (ids) => {
          set((state) => {
            ids.forEach(id => {
              state.nodes.delete(id)
              state.edges = state.edges.filter(
                edge => edge.source !== id && edge.target !== id
              )
            })
          })
        },
        
        duplicateNode: (id) => {
          const node = get().nodes.get(id)
          if (!node) return undefined
          
          const duplicatedNode = {
            ...node,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
            title: node.title ? `${node.title} (复制)` : undefined,
            connections: [], // 不复制连接
          }
          
          return get().addNode(duplicatedNode)
        },
        
        moveNode: (id, position) => {
          get().updateNode(id, { position })
        },
        
        // 搜索和筛选
        searchNodes: (query) => {
          if (!query) return get().getNodes()
          
          const nodes = get().getNodes()
          const lowercaseQuery = query.toLowerCase()
          
          return nodes.filter(node =>
            node.content.toLowerCase().includes(lowercaseQuery) ||
            node.title?.toLowerCase().includes(lowercaseQuery) ||
            node.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
          )
        },
        
        filterNodesByTags: (tags) => {
          if (tags.length === 0) return get().getNodes()
          
          return get().getNodes().filter(node =>
            tags.some(tag => node.tags.includes(tag))
          )
        },
        
        filterNodesByImportance: (importance) => {
          if (importance.length === 0) return get().getNodes()
          
          return get().getNodes().filter(node =>
            importance.includes(node.importance)
          )
        },
        
        // 统计计算
        getNodeStats: () => {
          const nodes = get().getNodes()
          const total = nodes.length
          
          const byImportance = nodes.reduce((acc, node) => {
            acc[node.importance] = (acc[node.importance] || 0) + 1
            return acc
          }, {} as Record<number, number>)
          
          const byStatus = nodes.reduce((acc, node) => {
            acc[node.status] = (acc[node.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          
          const averageConfidence = total > 0
            ? nodes.reduce((sum, node) => sum + node.confidence, 0) / total
            : 0
          
          return {
            total,
            byImportance,
            byStatus,
            averageConfidence,
          }
        },
        
        // 历史管理
        addToHistory: (edit) => {
          set((state) => {
            state.history.push({
              ...edit,
              timestamp: new Date(),
            })
            
            // 限制历史记录数量
            if (state.history.length > 100) {
              state.history = state.history.slice(-100)
            }
          })
        },
        
        clearHistory: () => {
          set((state) => {
            state.history = []
          })
        },
      })),
      {
        name: 'node-storage',
        partialize: (state) => ({
          templates: state.templates,
          // 将Map转换为对象数组进行持久化
          nodes: Array.from(state.nodes.entries()).map(([id, node]) => node),
          edges: state.edges,
          history: state.history,
        }),
        // 自定义反序列化逻辑
        merge: (persistedState: any, currentState: NodeState) => {
          const nodes = new Map<string, AINode>()
          
          // 从持久化数据中恢复节点
          if (persistedState?.nodes && Array.isArray(persistedState.nodes)) {
            persistedState.nodes.forEach((node: any) => {
              if (node.id) {
                nodes.set(node.id, node as AINode)
              }
            })
          }
          
          return {
            ...currentState,
            ...persistedState,
            nodes, // 使用恢复的Map
            edges: persistedState?.edges || [],
            history: persistedState?.history || [],
          }
        },
      }
    ),
    {
      name: 'node-store',
    }
  )
)