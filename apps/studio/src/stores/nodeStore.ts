import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AINode, Position, CreateNodeOptions, NodeEdit, EdgeStyle, EdgeStylePresetName } from '@/types'
import { EdgeStylePresets } from '@/types'
import { nodeAPIService } from '@/services/nodeApiService'
import type { CreateNodeParams, UpdateNodeParams } from '@/services/nodeApiService'
import { useUIStore } from './uiStore'
import { useSyncStore } from './syncStore'

// 连接元信息
export interface ConnectionMetadata {
  remoteId?: string
  type?: string
  weight?: number
  bidirectional?: boolean
  status: 'pending' | 'synced' | 'error'
  error?: string
  createdAt?: string
  updatedAt?: string
}

// 连接配置选项
export interface ConnectionOptions {
  style?: EdgeStyle
  type?: string
  weight?: number
  bidirectional?: boolean
  metadata?: Partial<ConnectionMetadata>
  sourceHandle?: string
  targetHandle?: string
}

// 扩展的边数据结构
export interface StoreEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  style?: EdgeStyle
  metadata: ConnectionMetadata
}

type AddNodeInput = Omit<AINode, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: Date
  updatedAt?: Date
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
  addNode: (node: AddNodeInput) => string
  updateNode: (id: string, updates: Partial<AINode>) => void
  deleteNode: (id: string) => void
  getNode: (id: string) => AINode | undefined
  getNodes: () => AINode[]

  // 后端同步Actions
  setCurrentProject: (projectId: string) => void
  syncFromBackend: (projectId: string, options?: { silent?: boolean }) => Promise<void>
  createNodeWithSync: (params: CreateNodeParams) => Promise<AINode>
  updateNodeWithSync: (id: string, updates: UpdateNodeParams, options?: { silent?: boolean }) => Promise<void>
  deleteNodeWithSync: (id: string, permanent?: boolean) => Promise<void>
  
  // 连接管理
  connectNodes: (sourceId: string, targetId: string, options?: ConnectionOptions) => string | null
  connectNodesWithSync: (sourceId: string, targetId: string, options?: ConnectionOptions) => Promise<void>
  disconnectNodes: (sourceId: string, targetId: string) => void
  disconnectNodesWithSync: (sourceId: string, targetId: string) => Promise<void>
  getConnections: (nodeId: string) => string[]
  setEdgeMetadata: (edgeId: string, metadata: Partial<ConnectionMetadata>) => void
  
  // 连线样式管理
  updateEdgeStyle: (edgeId: string, style: EdgeStyle) => void
  setEdgeStylePreset: (edgeId: string, presetName: EdgeStylePresetName) => void
  getEdge: (edgeId: string) => StoreEdge | undefined
  deleteEdge: (edgeId: string) => void
  
  // 批量操作
  deleteNodes: (ids: string[]) => void
  deleteErrorNodes: () => Promise<void>
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
          const now = new Date()
          const id = nodeData.id ?? generateId()
          const createdAt = nodeData.createdAt ?? now
          const updatedAt = nodeData.updatedAt ?? createdAt
          const version = typeof nodeData.version === 'number' && !Number.isNaN(nodeData.version)
            ? nodeData.version
            : 1

          const metadataSource = nodeData.metadata ?? {}
          const metadata: AINode['metadata'] = {
            ...metadataSource,
            semantic: Array.isArray(metadataSource.semantic) ? metadataSource.semantic : [],
            editCount: typeof metadataSource.editCount === 'number' ? metadataSource.editCount : 0,
          }

          const node: AINode = {
            ...nodeData,
            id,
            version,
            createdAt,
            updatedAt,
            connections: nodeData.connections ?? [],
            tags: nodeData.tags ?? [],
            metadata,
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
            if (!node) {
              return
            }

            const { metadata: updatesMetadata, ...restUpdates } = updates as typeof updates & { metadata?: AINode['metadata'] }

            const mergedMetadataBase: AINode['metadata'] = {
              ...node.metadata,
              ...(updatesMetadata ?? {}),
            }

            const nextEditCount = typeof updatesMetadata?.editCount === 'number'
              ? updatesMetadata.editCount
              : (node.metadata?.editCount ?? 0) + 1

            const contentChanged = restUpdates.content !== undefined && restUpdates.content !== node.content

            const updatedNode: AINode = {
              ...node,
              ...restUpdates,
              updatedAt: new Date(),
              version: contentChanged ? node.version + 1 : node.version,
              metadata: {
                ...mergedMetadataBase,
                editCount: nextEditCount,
              },
            }

            state.nodes.set(id, updatedNode)
            state.history.push({
              id: generateId(),
              type: 'update',
              data: updates,
              timestamp: new Date(),
            })
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
        connectNodes: (sourceId, targetId, options = {}) => {
          if (sourceId === targetId) return null

          const {
            style,
            type = 'related',
            weight = 1,
            bidirectional = false,
            metadata: incomingMetadata = {},
            sourceHandle,
            targetHandle,
          } = options

          let createdEdgeId: string | null = null

          set((state) => {
            const existingEdge = state.edges.find(
              (edge) => edge.source === sourceId && edge.target === targetId
            )

            const defaultStyle = EdgeStylePresets.solid

            if (existingEdge) {
              if (style) {
                existingEdge.style = { ...existingEdge.style, ...style }
              }

              existingEdge.metadata = {
                ...existingEdge.metadata,
                type: incomingMetadata.type ?? existingEdge.metadata.type ?? type,
                weight: incomingMetadata.weight ?? existingEdge.metadata.weight ?? weight,
                bidirectional: incomingMetadata.bidirectional ?? existingEdge.metadata.bidirectional ?? bidirectional,
                status: incomingMetadata.status ?? existingEdge.metadata.status ?? 'synced',
                remoteId: incomingMetadata.remoteId ?? existingEdge.metadata.remoteId,
                error: incomingMetadata.error ?? existingEdge.metadata.error,
                createdAt: incomingMetadata.createdAt ?? existingEdge.metadata.createdAt,
                updatedAt: incomingMetadata.updatedAt ?? existingEdge.metadata.updatedAt,
              }

              existingEdge.sourceHandle = sourceHandle || existingEdge.sourceHandle || `output-${existingEdge.id}`
              existingEdge.targetHandle = targetHandle || existingEdge.targetHandle || `input-${existingEdge.id}`

              const sourceNode = state.nodes.get(sourceId)
              const targetNode = state.nodes.get(targetId)

              if (sourceNode) {
                const connection = sourceNode.connections.find((conn) => conn.id === existingEdge.id)
                if (connection) {
                  connection.style = style || existingEdge.style
                  connection.metadata = {
                    ...connection.metadata,
                    remoteId: existingEdge.metadata.remoteId,
                    status: existingEdge.metadata.status,
                    type: existingEdge.metadata.type,
                    weight: existingEdge.metadata.weight,
                    bidirectional: existingEdge.metadata.bidirectional,
                  }
                }
              }

              if (targetNode) {
                const connection = targetNode.connections.find((conn) => conn.id === existingEdge.id)
                if (connection) {
                  connection.style = style || existingEdge.style
                  connection.metadata = {
                    ...connection.metadata,
                    remoteId: existingEdge.metadata.remoteId,
                    status: existingEdge.metadata.status,
                    type: existingEdge.metadata.type,
                    weight: existingEdge.metadata.weight,
                    bidirectional: existingEdge.metadata.bidirectional,
                  }
                }
              }

              createdEdgeId = existingEdge.id
              return
            }

            const edgeId = `edge-${sourceId}-${targetId}-${Date.now()}`
            const edgeStyle = style || defaultStyle
            const resolvedSourceHandle = sourceHandle || `output-${edgeId}`
            const resolvedTargetHandle = targetHandle || `input-${edgeId}`

            const metadata = {
              remoteId: incomingMetadata.remoteId,
              type: incomingMetadata.type ?? type,
              weight: incomingMetadata.weight ?? weight,
              bidirectional: incomingMetadata.bidirectional ?? bidirectional,
              status: incomingMetadata.status ?? 'pending',
              error: incomingMetadata.error,
              createdAt: incomingMetadata.createdAt ?? new Date().toISOString(),
              updatedAt: incomingMetadata.updatedAt ?? new Date().toISOString(),
            }

            state.edges.push({
              id: edgeId,
              source: sourceId,
              target: targetId,
              sourceHandle: resolvedSourceHandle,
              targetHandle: resolvedTargetHandle,
              style: edgeStyle,
              metadata,
            })

            const connectionMetadata = {
              remoteId: metadata.remoteId,
              status: metadata.status,
              type: metadata.type,
              weight: metadata.weight,
              bidirectional: metadata.bidirectional,
            }

            const sourceNode = state.nodes.get(sourceId)
            const targetNode = state.nodes.get(targetId)

            if (sourceNode) {
              const existing = sourceNode.connections.find((conn) => conn.id === edgeId)
              if (existing) {
                existing.style = edgeStyle
                existing.metadata = { ...existing.metadata, ...connectionMetadata }
              } else {
                sourceNode.connections.push({
                  id: edgeId,
                  sourceId,
                  targetId,
                  type: 'output',
                  style: edgeStyle,
                  metadata: connectionMetadata,
                })
              }
            }

            if (targetNode) {
              const existing = targetNode.connections.find((conn) => conn.id === edgeId)
              if (existing) {
                existing.style = edgeStyle
                existing.metadata = { ...existing.metadata, ...connectionMetadata }
              } else {
                targetNode.connections.push({
                  id: edgeId,
                  sourceId,
                  targetId,
                  type: 'input',
                  style: edgeStyle,
                  metadata: connectionMetadata,
                })
              }
            }

            createdEdgeId = edgeId
          })

          return createdEdgeId
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

        setEdgeMetadata: (edgeId, metadata) => {
          set((state) => {
            const edge = state.edges.find((e) => e.id === edgeId)
            if (!edge) {
              return
            }

            edge.metadata = {
              ...edge.metadata,
              ...metadata,
              status: metadata.status ?? edge.metadata.status,
            }

            const updateConnectionMetadata = (node?: AINode) => {
              if (!node) return
              const connection = node.connections.find((conn) => conn.id === edgeId)
              if (!connection) return
              connection.metadata = {
                ...(connection.metadata ?? {}),
                ...metadata,
                status: metadata.status ?? connection.metadata?.status ?? edge.metadata.status,
              }
            }

            updateConnectionMetadata(state.nodes.get(edge.source))
            updateConnectionMetadata(state.nodes.get(edge.target))
          })
        },

        connectNodesWithSync: async (sourceId, targetId, options = {}) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          const projectId = get().currentProjectId
          const edgeId = get().connectNodes(sourceId, targetId, {
            ...options,
            metadata: {
              status: 'pending',
              ...(options.metadata ?? {}),
            },
          })

          if (!edgeId) {
            return
          }

          if (!projectId) {
            get().setEdgeMetadata(edgeId, {
              status: 'error',
              error: '缺少当前项目ID，无法同步连接',
            })
            addToast({
              type: 'error',
              title: '连接同步失败',
              message: '请先选择或加载项目后再创建连线',
            })
            return
          }

          startSaving()

          try {
            const payload = {
              project_id: projectId,
              source_node_id: sourceId,
              target_node_id: targetId,
              type: options.type ?? 'related',
              weight: options.weight ?? 1,
              bidirectional: options.bidirectional ?? false,
              style: options.style,
              metadata: {
                ...(options.metadata ?? {}),
                status: undefined,
              },
            }

            const connection = await nodeAPIService.createConnection(payload)

            get().setEdgeMetadata(edgeId, {
              remoteId: connection.id,
              status: 'synced',
              type: connection.type ?? payload.type,
              weight: connection.weight ?? payload.weight,
              bidirectional: connection.bidirectional ?? payload.bidirectional,
              error: undefined,
              createdAt: connection.created_at ? new Date(connection.created_at).toISOString() : undefined,
              updatedAt: connection.updated_at ? new Date(connection.updated_at).toISOString() : new Date().toISOString(),
            })

            savingComplete()
            addToast({
              type: 'success',
              title: '连线已同步',
              message: '连接创建成功并已同步到后端',
              duration: 2500,
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '创建连接失败'

            get().disconnectNodes(sourceId, targetId)
            savingFailed(errorMessage)
            addToast({
              type: 'error',
              title: '连线创建失败',
              message: errorMessage,
            })
            throw error
          }
        },

        disconnectNodesWithSync: async (sourceId, targetId) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          const edge = get().edges.find((e) => e.source === sourceId && e.target === targetId)
          if (!edge) {
            return
          }

          const clonedEdge: StoreEdge = {
            ...edge,
            metadata: { ...edge.metadata },
          }

          const sourceConnectionsSnapshot = get()
            .getNode(sourceId)?.connections
            ?.map((conn) => ({
              ...conn,
              metadata: { ...(conn.metadata ?? {}) },
            })) ?? []

          const targetConnectionsSnapshot = get()
            .getNode(targetId)?.connections
            ?.map((conn) => ({
              ...conn,
              metadata: { ...(conn.metadata ?? {}) },
            })) ?? []

          get().disconnectNodes(sourceId, targetId)

          if (!clonedEdge.metadata.remoteId) {
            addToast({
              type: 'info',
              title: '本地连线已删除',
              message: '该连线尚未同步到后端，仅本地删除',
              duration: 2000,
            })
            return
          }

          startSaving()

          try {
            await nodeAPIService.deleteConnection(clonedEdge.metadata.remoteId)
            savingComplete()
            addToast({
              type: 'success',
              title: '连线已删除',
              message: '后端连接删除成功',
              duration: 2000,
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '删除连接失败'

            set((state) => {
              state.edges.push(clonedEdge)

              const restoreConnection = (node?: AINode, template?: typeof sourceConnectionsSnapshot) => {
                if (!node) return
                const exists = node.connections.some((conn) => conn.id === clonedEdge.id)
                if (exists) return

                const templateConn = template?.find((conn) => conn.id === clonedEdge.id)

                node.connections.push({
                  id: clonedEdge.id,
                  sourceId: clonedEdge.source,
                  targetId: clonedEdge.target,
                  type: node.id === clonedEdge.source ? 'output' : 'input',
                  style: clonedEdge.style,
                  metadata: {
                    remoteId: clonedEdge.metadata.remoteId,
                    status: clonedEdge.metadata.status,
                    type: clonedEdge.metadata.type,
                    weight: clonedEdge.metadata.weight,
                    bidirectional: clonedEdge.metadata.bidirectional,
                    ...(templateConn?.metadata ?? {}),
                  },
                })
              }

              restoreConnection(state.nodes.get(clonedEdge.source), sourceConnectionsSnapshot)
              restoreConnection(state.nodes.get(clonedEdge.target), targetConnectionsSnapshot)
            })

            savingFailed(errorMessage)
            addToast({
              type: 'error',
              title: '删除失败',
              message: errorMessage,
            })
            throw error
          }
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

        deleteErrorNodes: async () => {
          const { nodes, deleteNodeWithSync } = get()
          const errorNodes = Array.from(nodes.values()).filter(
            node => node.status === 'error'
          )

          if (errorNodes.length === 0) {
            return
          }

          // 批量删除失败节点
          for (const node of errorNodes) {
            try {
              await deleteNodeWithSync(node.id, true)
            } catch (error) {
              console.error(`删除失败节点 ${node.id} 时出错:`, error)
            }
          }
        },

        duplicateNode: (id) => {
          const node = get().nodes.get(id)
          if (!node) return undefined

          const now = new Date()
          const duplicatedMetadata: AINode['metadata'] = {
            ...node.metadata,
            semantic: Array.isArray(node.metadata?.semantic) ? [...node.metadata.semantic] : [],
            processingHistory: node.metadata?.processingHistory
              ? [...node.metadata.processingHistory]
              : [],
            statistics: node.metadata?.statistics
              ? { ...node.metadata.statistics }
              : undefined,
            editCount: 0,
          }

          return get().addNode({
            content: node.content,
            title: node.title ? `${node.title} (复制)` : undefined,
            importance: node.importance,
            confidence: node.confidence,
            status: node.status,
            tags: [...node.tags],
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
            size: node.size ? { ...node.size } : undefined,
            connections: [],
            version: 1,
            metadata: duplicatedMetadata,
            semantic_type: node.semantic_type,
            user_rating: node.user_rating,
            createdAt: now,
            updatedAt: now,
          })
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
                state.nodes.set(node.id, {
                  ...node,
                  connections: Array.isArray(node.connections) ? node.connections : [],
                })
              })

              // 先清空节点的连接信息，避免重复累积
              state.nodes.forEach((node) => {
                node.connections = []
              })

              // 重建边数据并同步节点连接
              state.edges = connections.map((conn) => {
                const edgeId = conn.id || `edge-${conn.source_node_id}-${conn.target_node_id}`
                const edgeStyle = conn.style || EdgeStylePresets.solid
                const metadata = {
                  remoteId: conn.id,
                  type: conn.type,
                  weight: typeof conn.weight === 'number' ? conn.weight : 1,
                  bidirectional: Boolean(conn.bidirectional),
                  status: 'synced' as const,
                  createdAt: conn.created_at ? new Date(conn.created_at).toISOString() : undefined,
                  updatedAt: conn.updated_at ? new Date(conn.updated_at).toISOString() : undefined,
                  error: undefined,
                }

                const sourceNode = state.nodes.get(conn.source_node_id)
                const targetNode = state.nodes.get(conn.target_node_id)

                const connectionMetadata = {
                  remoteId: metadata.remoteId,
                  status: metadata.status,
                  type: metadata.type,
                  weight: metadata.weight,
                  bidirectional: metadata.bidirectional,
                }

                if (sourceNode) {
                  const existing = sourceNode.connections.find((item) => item.id === edgeId)
                  if (existing) {
                    existing.style = edgeStyle
                    existing.metadata = { ...existing.metadata, ...connectionMetadata }
                  } else {
                    sourceNode.connections.push({
                      id: edgeId,
                      sourceId: conn.source_node_id,
                      targetId: conn.target_node_id,
                      type: 'output',
                      style: edgeStyle,
                      metadata: connectionMetadata,
                    })
                  }
                }

                if (targetNode) {
                  const existing = targetNode.connections.find((item) => item.id === edgeId)
                  if (existing) {
                    existing.style = edgeStyle
                    existing.metadata = { ...existing.metadata, ...connectionMetadata }
                  } else {
                    targetNode.connections.push({
                      id: edgeId,
                      sourceId: conn.source_node_id,
                      targetId: conn.target_node_id,
                      type: 'input',
                      style: edgeStyle,
                      metadata: connectionMetadata,
                    })
                  }
                }

                return {
                  id: edgeId,
                  source: conn.source_node_id,
                  target: conn.target_node_id,
                  sourceHandle: `output-${edgeId}`,
                  targetHandle: `input-${edgeId}`,
                  style: edgeStyle,
                  metadata,
                }
              })
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

        updateNodeWithSync: async (id, updates, options = {}) => {
          const { addToast } = useUIStore.getState()
          const { startSaving, savingComplete, savingFailed } = useSyncStore.getState()

          const silent = options?.silent === true

          if (!silent) {
            startSaving()
          }

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

            if (!silent) {
              savingComplete()
              addToast({
                type: 'success',
                title: '节点已更新',
                duration: 2000,
              })
            }

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
          
          const edges = Array.isArray(persistedState?.edges)
            ? persistedState.edges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle ?? edge.source_handle ?? (edge.id ? `output-${edge.id}` : undefined),
                targetHandle: edge.targetHandle ?? edge.target_handle ?? (edge.id ? `input-${edge.id}` : undefined),
                style: edge.style,
                metadata: {
                  remoteId: edge.metadata?.remoteId ?? edge.metadata?.remote_id,
                  type: edge.metadata?.type,
                  weight: typeof edge.metadata?.weight === 'number' ? edge.metadata.weight : 1,
                  bidirectional: Boolean(edge.metadata?.bidirectional),
                  status: edge.metadata?.status ?? 'synced',
                  error: edge.metadata?.error,
                  createdAt: edge.metadata?.createdAt ?? edge.metadata?.created_at,
                  updatedAt: edge.metadata?.updatedAt ?? edge.metadata?.updated_at,
                },
              }))
            : []

          return {
            ...currentState,
            ...persistedState,
            nodes, // 使用恢复的Map
            edges,
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
