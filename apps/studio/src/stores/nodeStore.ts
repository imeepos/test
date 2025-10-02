import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AINode, Position, CreateNodeOptions, NodeEdit, EdgeStyle, EdgeStylePresetName } from '@/types'
import { EdgeStylePresets } from '@/types'
import { nodeAPIService } from '@/services/nodeApiService'
import type { CreateNodeParams, UpdateNodeParams } from '@/services/nodeApiService'
import { useUIStore } from './uiStore'
import { useSyncStore } from './syncStore'

// 扩展的边数据结构
export interface StoreEdge {
  id: string
  source: string
  target: string
  style?: EdgeStyle
}

export interface NodeState {
  // 节点数据
  nodes: Map<string, AINode>
  edges: Array<StoreEdge>

  // 节点操作历史
  history: NodeEdit[]

  // 节点创建模板
  templates: Array<{
    name: string
    content: string
    importance: 1 | 2 | 3 | 4 | 5
    tags: string[]
  }>

  // 当前项目ID
  currentProjectId: string | null

  // Actions
  addNode: (node: Omit<AINode, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNode: (id: string, updates: Partial<AINode>) => void
  deleteNode: (id: string) => void
  getNode: (id: string) => AINode | undefined
  getNodes: () => AINode[]

  // 后端同步Actions
  setCurrentProject: (projectId: string) => void
  syncFromBackend: (projectId: string, options?: { silent?: boolean }) => Promise<void>
  createNodeWithSync: (params: CreateNodeParams) => Promise<AINode>
  updateNodeWithSync: (id: string, updates: UpdateNodeParams) => Promise<void>
  deleteNodeWithSync: (id: string, permanent?: boolean) => Promise<void>
  
  // 连接管理
  connectNodes: (sourceId: string, targetId: string, style?: EdgeStyle) => void
  disconnectNodes: (sourceId: string, targetId: string) => void
  getConnections: (nodeId: string) => string[]
  
  // 连线样式管理
  updateEdgeStyle: (edgeId: string, style: EdgeStyle) => void
  setEdgeStylePreset: (edgeId: string, presetName: EdgeStylePresetName) => void
  getEdge: (edgeId: string) => StoreEdge | undefined
  deleteEdge: (edgeId: string) => void
  
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
        currentProjectId: null,

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
        connectNodes: (sourceId, targetId, style) => {
          if (sourceId === targetId) return
          
          set((state) => {
            const edgeExists = state.edges.some(
              edge => edge.source === sourceId && edge.target === targetId
            )
            
            if (!edgeExists) {
              const edgeId = `edge-${sourceId}-${targetId}`
              const defaultStyle = EdgeStylePresets.solid
              state.edges.push({
                id: edgeId,
                source: sourceId,
                target: targetId,
                style: style || defaultStyle,
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
                  style: style || defaultStyle,
                })
              }
              
              if (targetNode) {
                targetNode.connections.push({
                  id: edgeId,
                  sourceId,
                  targetId,
                  type: 'input',
                  style: style || defaultStyle,
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
        
        // 连线样式管理
        updateEdgeStyle: (edgeId, style) => {
          set((state) => {
            const edge = state.edges.find(e => e.id === edgeId)
            if (edge) {
              edge.style = { ...edge.style, ...style }
              
              // 同步更新节点连接信息中的样式
              const sourceNode = state.nodes.get(edge.source)
              const targetNode = state.nodes.get(edge.target)
              
              if (sourceNode) {
                const connection = sourceNode.connections.find(c => c.id === edgeId)
                if (connection) {
                  connection.style = edge.style
                }
              }
              
              if (targetNode) {
                const connection = targetNode.connections.find(c => c.id === edgeId)
                if (connection) {
                  connection.style = edge.style
                }
              }
            }
          })
        },
        
        setEdgeStylePreset: (edgeId, presetName) => {
          const preset = EdgeStylePresets[presetName]
          if (preset) {
            get().updateEdgeStyle(edgeId, preset)
          }
        },
        
        getEdge: (edgeId) => {
          return get().edges.find(edge => edge.id === edgeId)
        },
        
        deleteEdge: (edgeId) => {
          set((state) => {
            const edgeIndex = state.edges.findIndex(e => e.id === edgeId)
            if (edgeIndex !== -1) {
              const edge = state.edges[edgeIndex]
              state.edges.splice(edgeIndex, 1)

              // 从节点连接信息中移除
              const sourceNode = state.nodes.get(edge.source)
              const targetNode = state.nodes.get(edge.target)

              if (sourceNode) {
                sourceNode.connections = sourceNode.connections.filter(c => c.id !== edgeId)
              }

              if (targetNode) {
                targetNode.connections = targetNode.connections.filter(c => c.id !== edgeId)
              }
            }
          })
        },

        // 后端同步相关方法
        setCurrentProject: (projectId) => {
          set({ currentProjectId: projectId })
        },

        syncFromBackend: async (projectId, options = {}) => {
          const { silent = false } = options
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          if (!silent) {
            startSaving()
          }

          try {
            // 从后端加载节点数据
            const nodes = await nodeAPIService.getNodesByProject(projectId)
            const connections = await nodeAPIService.getProjectConnections(projectId)

            set((state) => {
              // 清空当前节点
              state.nodes.clear()

              // 加载后端节点
              nodes.forEach((node) => {
                state.nodes.set(node.id, node)
              })

              // 重建边数据
              state.edges = connections.map((conn) => ({
                id: `edge-${conn.source_node_id}-${conn.target_node_id}`,
                source: conn.source_node_id,
                target: conn.target_node_id,
                style: conn.style || EdgeStylePresets.solid,
              }))
            })

            if (!silent) {
              savingComplete()
              addToast({
                type: 'success',
                title: '同步完成',
                message: `成功加载 ${nodes.length} 个节点`,
              })
            }
            console.log(`✅ 成功从后端同步 ${nodes.length} 个节点`)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '同步失败'
            if (!silent) {
              savingFailed(errorMessage)
              addToast({
                type: 'error',
                title: '同步失败',
                message: errorMessage,
              })
            }
            console.error('❌ 同步节点数据失败:', error)
            throw error
          }
        },

        createNodeWithSync: async (params) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          startSaving()

          try {
            // 调用后端API创建节点
            const node = await nodeAPIService.createNode(params)

            // 更新本地状态
            set((state) => {
              state.nodes.set(node.id, node)
              state.history.push({
                id: generateId(),
                type: 'create',
                data: node,
                timestamp: new Date(),
              })
            })

            savingComplete()
            addToast({
              type: 'success',
              title: '节点已创建',
              message: node.title || '新节点创建成功',
              duration: 3000,
            })
            console.log('✅ 节点创建成功:', node.id)
            return node
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '创建节点失败'
            savingFailed(errorMessage)
            addToast({
              type: 'error',
              title: '创建失败',
              message: errorMessage,
            })
            console.error('❌ 创建节点失败:', error)
            throw error
          }
        },

        updateNodeWithSync: async (id, updates) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          startSaving()

          try {
            // 调用后端API更新节点
            const updatedNode = await nodeAPIService.updateNode(id, updates)

            // 更新本地状态
            set((state) => {
              state.nodes.set(id, updatedNode)
              state.history.push({
                id: generateId(),
                type: 'update',
                data: updates,
                timestamp: new Date(),
              })
            })

            savingComplete()
            addToast({
              type: 'success',
              title: '节点已更新',
              duration: 2000,
            })
            console.log('✅ 节点更新成功:', id)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新节点失败'
            savingFailed(errorMessage)
            addToast({
              type: 'error',
              title: '更新失败',
              message: errorMessage,
            })
            console.error('❌ 更新节点失败:', error)
            throw error
          }
        },

        deleteNodeWithSync: async (id, permanent = false) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          startSaving()

          try{
            // 调用后端API删除节点
            await nodeAPIService.deleteNode(id, permanent)

            // 更新本地状态
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

            savingComplete()
            addToast({
              type: 'info',
              title: '节点已删除',
              duration: 2000,
            })
            console.log('✅ 节点删除成功:', id)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '删除节点失败'
            savingFailed(errorMessage)
            addToast({
              type: 'error',
              title: '删除失败',
              message: errorMessage,
            })
            console.error('❌ 删除节点失败:', error)
            throw error
          }
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