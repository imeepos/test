import React, { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  EdgeChange,
  Node,
  ReactFlowInstance,
  MarkerType,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  OnConnectStart,
  OnConnectEnd,
  useReactFlow,
  SelectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useCanvasStore, useNodeStore, useUIStore } from '@/stores'
import { useSyncStore } from '@/stores/syncStore'
import type { StoreEdge } from '@/stores/nodeStore'
import { AINode as AINodeComponent } from '../node/AINode'
import { ContextMenu } from './ContextMenu'
import { ShortcutHandler } from '../interactions/ShortcutHandler'
import { getOptimizedReactFlowProps } from './PerformanceOptimizer'
import { nodeService } from '@/services'
import type { Position, AINodeData, AINode } from '@/types'
import { DragCreateMenu } from './DragCreateMenu'

// 自定义节点类型 - 在组件外部定义，避免每次渲染都重新创建
const nodeTypes = {
  aiNode: AINodeComponent,
}

export interface CanvasProps {
  onNodeDoubleClick?: (nodeId: string) => void
  onCanvasDoubleClick?: (position: Position) => void
  onNodeCreate?: (position: Position) => void
  onDragExpand?: (sourceNodeId: string, position: Position) => void
  onFusionCreate?: (selectedNodeIds: string[], fusionType: 'summary' | 'synthesis' | 'comparison', position: Position) => void
}

interface DragCreateMenuState {
  isOpen: boolean
  sourceNodeId: string | null
  canvasPosition: Position | null
  screenPosition: { x: number; y: number } | null
}

const createInitialDragMenuState = (): DragCreateMenuState => ({
  isOpen: false,
  sourceNodeId: null,
  canvasPosition: null,
  screenPosition: null,
})

const Canvas: React.FC<CanvasProps> = ({
  onNodeDoubleClick,
  onCanvasDoubleClick,
  onNodeCreate,
  onDragExpand,
  onFusionCreate,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null)
  const [connectStartPosition, setConnectStartPosition] = useState<{ x: number; y: number } | null>(null)

  // 双击检测状态
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef<number>(0)
  const lastClickEventRef = useRef<React.MouseEvent | null>(null)
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: Position
    targetType: 'canvas' | 'node' | 'edge'
    targetId?: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetType: 'canvas'
  })

  const [dragCreateMenu, setDragCreateMenu] = useState<DragCreateMenuState>(() => createInitialDragMenuState())
  const dragMenuRef = React.useRef<HTMLDivElement | null>(null)

  // 状态管理
  const {
    viewport,
    setViewport,
    interactionMode,
    selectedNodeIds,
    setSelectedNodes,
  } = useCanvasStore()

  // 直接订阅store中的nodes Map
  const nodesMap = useNodeStore(state => state.nodes)
  const storeEdges = useNodeStore(state => state.edges)
  const getNodes = useNodeStore(state => state.getNodes)
  const getNode = useNodeStore(state => state.getNode)
  const connectNodes = useNodeStore(state => state.connectNodes)
  const connectNodesWithSync = useNodeStore(state => state.connectNodesWithSync)
  const disconnectNodesWithSync = useNodeStore(state => state.disconnectNodesWithSync)
  const templates = useNodeStore(state => state.templates)
  const addNode = useNodeStore(state => state.addNode)
  const updateNode = useNodeStore(state => state.updateNode)
  const updateNodeWithSync = useNodeStore(state => state.updateNodeWithSync)
  
  // 直接从Map获取节点数组
  const storeNodes = React.useMemo(() => {
    if (!(nodesMap instanceof Map)) {
      return []
    }
    
    return Array.from(nodesMap.values())
  }, [nodesMap])
  
  // 强制订阅store变化
  const [forceRender, setForceRender] = React.useState(0)

  // 监听store的真实状态变化
  React.useEffect(() => {
    const unsubscribe = useNodeStore.subscribe((state) => {
      setForceRender(prev => prev + 1)
    })
    
    return unsubscribe
  }, [])

  const { preferences, addToast } = useUIStore()

  const closeDragCreateMenu = useCallback(() => {
    setDragCreateMenu(createInitialDragMenuState())
  }, [])

  React.useEffect(() => {
    if (!dragCreateMenu.isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (dragMenuRef.current && target && !dragMenuRef.current.contains(target)) {
        closeDragCreateMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDragCreateMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDragCreateMenu, dragCreateMenu.isOpen])

  // 转换节点数据格式
  const nodes = React.useMemo(() => {
    return storeNodes.map((node): Node<AINodeData> => {
      return {
        id: node.id,
        type: 'aiNode',
        position: node.position,
        data: {
          id: node.id,
          content: node.content,
          title: node.title,
          importance: node.importance,
          confidence: node.confidence,
          status: node.status,
          tags: node.tags,
          version: node.version,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        },
        selected: selectedNodeIds.includes(node.id),
      }
    })
  }, [storeNodes, selectedNodeIds, forceRender])

  // 转换连接数据格式
  const edges = React.useMemo(() => {
    return storeEdges.map((edge): Edge => {
      const defaultStyle = {
        stroke: '#6366f1',
        strokeWidth: 2,
        type: 'smoothstep' as const,
        animated: false,
        strokeDasharray: undefined
      }
      const edgeStyle = edge.style || {}
      const strokeColor = edgeStyle.stroke || defaultStyle.stroke
      const markerConfig = {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: strokeColor,
      } as const
      const isBidirectional = edge.metadata.bidirectional === true

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edgeStyle.type || defaultStyle.type,
        style: {
          stroke: strokeColor,
          strokeWidth: edgeStyle.strokeWidth || defaultStyle.strokeWidth,
          strokeDasharray: edgeStyle.strokeDasharray,
        },
        animated: edgeStyle.animated ?? defaultStyle.animated,
        markerEnd: markerConfig,
        markerStart: isBidirectional ? markerConfig : undefined,
      }
    })
  }, [storeEdges])

  // 性能优化配置
  const performanceProps = React.useMemo(
    () => getOptimizedReactFlowProps(storeNodes.length),
    [storeNodes.length]
  )

  // React Flow状态
  const [rfNodes, setRfNodes, originalOnNodesChange] = useNodesState(nodes)
  const [rfEdges, setRfEdges, originalOnEdgesChange] = useEdgesState(edges)

  // 防抖定时器引用和RAF引用
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)
  const movedNodeIdsRef = useRef<Set<string>>(new Set())
  const pendingPositionChangesRef = useRef<Map<string, Position>>(new Map())

  // Ctrl+拖拽复制状态
  const [isDraggingWithCtrl, setIsDraggingWithCtrl] = useState(false)
  const [copiedNodeIds, setCopiedNodeIds] = useState<Set<string>>(new Set())
  const originalNodePositionsRef = useRef<Map<string, Position>>(new Map())
  const startSaving = useSyncStore(state => state.startSaving)
  const savingComplete = useSyncStore(state => state.savingComplete)

  // 自定义节点变化处理器 - 使用RAF优化性能
  const flushPendingPositionChanges = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    if (pendingPositionChangesRef.current.size === 0) {
      return
    }

    pendingPositionChangesRef.current.forEach((position, nodeId) => {
      updateNode(nodeId, { position })
      movedNodeIdsRef.current.add(nodeId)
    })
    pendingPositionChangesRef.current.clear()
  }, [updateNode])

  const handleNodesChange = useCallback((changes: any[]) => {
    // 先调用原始的onNodesChange处理器
    originalOnNodesChange(changes)

    // 处理位置变化，同步到store
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)

    if (positionChanges.length > 0) {
      positionChanges.forEach(change => {
        const position = change.position as Position
        pendingPositionChangesRef.current.set(
          change.id,
          { x: position.x, y: position.y }
        )
      })

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }

      rafRef.current = requestAnimationFrame(() => {
        debounceTimeoutRef.current = setTimeout(() => {
          flushPendingPositionChanges()
        }, 150) // 150ms防抖延迟（从300ms优化）
      })
    }
  }, [originalOnNodesChange, flushPendingPositionChanges])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const edgeToRemove = storeEdges.find((edge) => edge.id === change.id)
        if (edgeToRemove) {
          void disconnectNodesWithSync(edgeToRemove.source, edgeToRemove.target).catch((error) => {
            console.error('同步删除连线失败:', error)
          })
        }
      }
    })

    originalOnEdgesChange(changes)
  }, [disconnectNodesWithSync, originalOnEdgesChange, storeEdges])

  // 同步节点状态
  React.useEffect(() => {
    setRfNodes(nodes)
  }, [nodes, setRfNodes])

  // 在节点加载完成后自动调整视图以包含所有节点
  React.useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // 使用 requestAnimationFrame 确保在 DOM 更新后执行
      requestAnimationFrame(() => {
        reactFlowInstance.fitView({
          padding: 0.1,
          includeHiddenNodes: false,
          duration: 400, // 添加过渡动画
        })
      })
    }
  }, [reactFlowInstance, nodes.length])

  // 同步连接状态
  React.useEffect(() => {
    setRfEdges(edges)
  }, [edges, setRfEdges])


  // 连接开始处理
  const onConnectStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, params: any) => {
      // params可能包含nodeId: string | null，需要检查
      if (params.nodeId) {
        setConnectingNodeId(params.nodeId)
        if (reactFlowWrapper.current) {
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
          
          // 处理鼠标和触摸事件的坐标差异
          const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX
          const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY
          
          setConnectStartPosition({
            x: clientX - reactFlowBounds.left,
            y: clientY - reactFlowBounds.top,
          })
        }
      }
    },
    []
  )

  // 连接处理
  const onConnect: OnConnect = useCallback(
    (params: Connection | Edge) => {
      if (params.source && params.target) {
        void connectNodesWithSync(params.source, params.target).catch((error) => {
          console.error('同步连接失败:', error)
        })
      }
      // 清理连接状态
      setConnectingNodeId(null)
      setConnectStartPosition(null)
    },
    [connectNodesWithSync]
  )

  // 连接结束处理 - 拖拽扩展功能
  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if (!reactFlowInstance || !reactFlowWrapper.current || !connectingNodeId) {
        // 清理状态
        setConnectingNodeId(null)
        setConnectStartPosition(null)
        return
      }

      // 检查是否拖拽到了现有节点上
      const target = event.target as Element
      const isValidConnection = target?.closest('.react-flow__node')
      
      // 如果没有连接到现有节点（即拖拽到空白处），创建新节点
      if (!isValidConnection) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY

        const canvasPosition = reactFlowInstance.project({
          x: clientX - reactFlowBounds.left,
          y: clientY - reactFlowBounds.top,
        })

        if (onDragExpand) {
          onDragExpand(connectingNodeId, canvasPosition)
        } else {
          setDragCreateMenu({
            isOpen: true,
            sourceNodeId: connectingNodeId,
            canvasPosition,
            screenPosition: {
              x: clientX - reactFlowBounds.left,
              y: clientY - reactFlowBounds.top,
            },
          })
        }
      }
      
      // 清理连接状态
      setConnectingNodeId(null)
      setConnectStartPosition(null)
    },
    [reactFlowInstance, connectingNodeId, onDragExpand]
  )

  // 默认拖拽扩展处理
  const defaultHandleDragExpand = useCallback(
    async (sourceNodeId: string, position: Position): Promise<boolean> => {
      try {
        const sourceNode = getNodes().find(node => node.id === sourceNodeId)
        if (!sourceNode) {
          return false
        }

        const newNode = await nodeService.dragExpandGenerate(sourceNode, position)

        const newNodeId = addNode({
          id: newNode.id,
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          confidence: newNode.confidence,
          status: newNode.status,
          tags: newNode.tags,
          position: newNode.position,
          connections: newNode.connections,
          version: newNode.version,
          metadata: newNode.metadata,
          createdAt: newNode.createdAt,
          updatedAt: newNode.updatedAt,
          semantic_type: newNode.semantic_type,
          user_rating: newNode.user_rating,
          size: newNode.size,
        })

        if (newNodeId) {
          connectNodes(sourceNodeId, newNodeId)
        }

        return true
      } catch (error) {
        const newNodeId = addNode({
          content: '请输入内容...',
          title: '扩展节点',
          importance: 3,
          confidence: 0.5,
          status: 'idle',
          tags: [],
          position,
          connections: [],
          version: 1,
          metadata: {
            semantic: [],
            editCount: 0,
          },
        })

        if (newNodeId) {
          connectNodes(sourceNodeId, newNodeId)
        }

        addToast({
          type: 'warning',
          title: 'AI扩展未成功',
          message: '已创建空节点，请手动完善内容',
          duration: 3000,
        })
        console.error('AI扩展失败:', error)
        return false
      }
    },
    [addNode, addToast, connectNodes, getNodes]
  )

  const handleCreateBlankNode = useCallback(() => {
    const sourceNodeId = dragCreateMenu.sourceNodeId
    const canvasPosition = dragCreateMenu.canvasPosition

    if (!sourceNodeId || !canvasPosition) {
      closeDragCreateMenu()
      return
    }

    const newNodeId = addNode({
      content: '',
      title: '空节点',
      importance: 3,
      confidence: 0.5,
      status: 'idle',
      tags: [],
      position: canvasPosition,
      connections: [],
      version: 1,
      metadata: {
        semantic: [],
        editCount: 0,
      },
    })

    if (newNodeId) {
      connectNodes(sourceNodeId, newNodeId, {
        metadata: { status: 'pending' },
      })
    }

    addToast({
      type: 'info',
      title: '已创建空节点',
      message: '请补充节点内容',
      duration: 2500,
    })

    closeDragCreateMenu()
  }, [
    addNode,
    addToast,
    closeDragCreateMenu,
    connectNodes,
    dragCreateMenu.canvasPosition,
    dragCreateMenu.sourceNodeId,
  ])

  const handleCreateTemplateNode = useCallback((templateName: string) => {
    const template = templates.find((item) => item.name === templateName)
    if (!template) {
      addToast({
        type: 'error',
        title: '模板不存在',
        message: '请选择有效的模板',
      })
      return
    }

    const sourceNodeId = dragCreateMenu.sourceNodeId
    const canvasPosition = dragCreateMenu.canvasPosition

    if (!sourceNodeId || !canvasPosition) {
      closeDragCreateMenu()
      return
    }

    const newNodeId = addNode({
      content: template.content,
      title: template.name,
      importance: template.importance,
      confidence: 0.7,
      status: 'idle',
      tags: template.tags,
      position: canvasPosition,
      connections: [],
      version: 1,
      metadata: {
        semantic: [],
        editCount: 0,
      },
    })

    if (newNodeId) {
      connectNodes(sourceNodeId, newNodeId, {
        metadata: {
          status: 'pending',
          type: template.name,
        },
      })
    }

    addToast({
      type: 'success',
      title: '模板节点已创建',
      message: `已使用模板「${template.name}」`,
      duration: 2500,
    })

    closeDragCreateMenu()
  }, [
    addNode,
    addToast,
    closeDragCreateMenu,
    connectNodes,
    dragCreateMenu.canvasPosition,
    dragCreateMenu.sourceNodeId,
    templates,
  ])

  const handleCreateAiExpand = useCallback(async () => {
    const sourceNodeId = dragCreateMenu.sourceNodeId
    const canvasPosition = dragCreateMenu.canvasPosition

    if (!sourceNodeId || !canvasPosition) {
      closeDragCreateMenu()
      return
    }

    addToast({
      type: 'info',
      title: 'AI扩展中',
      message: '正在基于当前节点生成延展内容...',
      duration: 2000,
    })

    const success = await defaultHandleDragExpand(sourceNodeId, canvasPosition)
    closeDragCreateMenu()

    if (success) {
      addToast({
        type: 'success',
        title: 'AI扩展完成',
        message: '新节点已生成并连接',
        duration: 2500,
      })
    }
  }, [
    addToast,
    closeDragCreateMenu,
    defaultHandleDragExpand,
    dragCreateMenu.canvasPosition,
    dragCreateMenu.sourceNodeId,
  ])

  // 画布双击事件
  const handleCanvasDoubleClick = useCallback(
    async (event: React.MouseEvent) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      // 如果提供了回调，则由父组件处理，不在这里创建节点
      if (onCanvasDoubleClick) {
        onCanvasDoubleClick(position)
        return
      }

      // 创建新节点（仅当没有提供回调时）
      if (onNodeCreate) {
        onNodeCreate(position)
      } else {
        // 检查是否按住了 Ctrl/Cmd 键来启用AI生成
        const useAI = event.ctrlKey || event.metaKey
        
        try {
          if (useAI) {
            // 显示AI生成提示
            addToast({
              type: 'info',
              title: 'AI创建中',
              message: '正在生成节点内容...'
            })

            // 使用nodeService创建AI生成的节点
            const aiNode = await nodeService.createNode({
              position,
              content: '',
              useAI: true,
              context: ['开始新的思维创作'],
            })

            const newNodeId = addNode({
              id: aiNode.id,
              content: aiNode.content,
              title: aiNode.title,
              importance: aiNode.importance,
              confidence: aiNode.confidence,
              status: aiNode.status,
              tags: aiNode.tags,
              position: aiNode.position,
              connections: aiNode.connections,
              version: aiNode.version,
              metadata: aiNode.metadata,
              createdAt: aiNode.createdAt,
              updatedAt: aiNode.updatedAt,
              semantic_type: aiNode.semantic_type,
              user_rating: aiNode.user_rating,
              size: aiNode.size,
            })

            if (newNodeId) {
              addToast({
                type: 'success',
                title: 'AI节点创建成功',
                message: 'AI已为您生成了初始内容'
              })
            }
          } else {
            // 创建空节点，用户手动编辑
            const newNodeId = addNode({
              content: '请输入内容...',
              title: '',
              importance: 3,
              confidence: 0.5,
              status: 'idle',
              tags: [],
              position,
              connections: [],
              version: 1,
              metadata: {
                semantic: [],
                editCount: 0,
              },
            })

            if (newNodeId) {
              addToast({
                type: 'success',
                title: '节点已创建',
                message: '双击节点开始编辑，Ctrl+双击可使用AI生成'
              })
            }
          }
        } catch (error) {
          
          // AI失败时回退到空节点
          const fallbackNodeId = addNode({
            content: '请输入内容...',
            title: '',
            importance: 3,
            confidence: 0.5,
            status: 'idle',
            tags: [],
            position,
            connections: [],
            version: 1,
            metadata: {
              semantic: [],
              editCount: 0,
            },
          })


          addToast({
            type: 'warning',
            title: 'AI生成失败',
            message: '已创建空节点，请手动编辑内容'
          })
        }
      }
    },
    [reactFlowInstance, onCanvasDoubleClick, onNodeCreate, addNode, addToast]
  )

  // 节点双击事件
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node<AINodeData>) => {
      onNodeDoubleClick?.(node.id)
    },
    [onNodeDoubleClick]
  )

  // 节点选择变化
  const handleSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      const nodeIds = params.nodes.map(node => node.id)
      setSelectedNodes(nodeIds)
    },
    [setSelectedNodes]
  )

  // 监听Ctrl键按下/释放 - 用于复制拖拽功能
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsDraggingWithCtrl(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsDraggingWithCtrl(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 节点拖拽开始处理 - 检测Ctrl键并复制节点
  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (isDraggingWithCtrl) {
        // 保存原始节点位置
        const nodesToCopy = selectedNodeIds.includes(node.id)
          ? selectedNodeIds
          : [node.id]

        const originalPositions = new Map<string, Position>()
        const newCopiedIds = new Set<string>()

        nodesToCopy.forEach(nodeId => {
          const originalNode = getNodes().find(n => n.id === nodeId)
          if (originalNode) {
            originalPositions.set(nodeId, { ...originalNode.position })

            // 创建节点副本
            const copiedNodeId = addNode({
              content: originalNode.content,
              title: originalNode.title ? `${originalNode.title} (副本)` : '',
              importance: originalNode.importance,
              confidence: originalNode.confidence,
              status: originalNode.status,
              tags: [...(originalNode.tags || [])],
              position: { ...originalNode.position }, // 初始位置相同
              connections: [], // 不复制连接
              version: 1,
              metadata: {
                semantic: [...(originalNode.metadata?.semantic || [])],
                editCount: 0,
              },
            })

            if (copiedNodeId) {
              newCopiedIds.add(copiedNodeId)
            }
          }
        })

        originalNodePositionsRef.current = originalPositions
        setCopiedNodeIds(newCopiedIds)

        // 将选择切换到复制的节点
        setTimeout(() => {
          setSelectedNodes(Array.from(newCopiedIds))
        }, 0)

        addToast({
          type: 'success',
          title: '节点已复制',
          message: `已复制 ${newCopiedIds.size} 个节点`,
          duration: 2000
        })
      }
    },
    [isDraggingWithCtrl, selectedNodeIds, getNodes, addNode, setSelectedNodes, addToast]
  )

  // 节点拖拽结束处理 - 清理状态
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, _node: Node) => {
      // 清理复制状态
      flushPendingPositionChanges()

      originalNodePositionsRef.current.clear()
      setCopiedNodeIds(new Set())

      if (movedNodeIdsRef.current.size === 0) {
        return
      }

      const movedNodeIds = Array.from(movedNodeIdsRef.current)
      movedNodeIdsRef.current.clear()

      const nodesToPersist = movedNodeIds.filter(nodeId => !!getNode(nodeId))
      if (nodesToPersist.length === 0) {
        return
      }

      void (async () => {
        startSaving()
        let hasError = false

        for (const nodeId of nodesToPersist) {
          const latestNode = getNode(nodeId)
          if (!latestNode) {
            continue
          }

          try {
            await updateNodeWithSync(nodeId, { position: latestNode.position }, { silent: true })
          } catch (error) {
            hasError = true
            console.error('❌ 节点位置保存失败:', nodeId, error)
          }
        }

        if (!hasError) {
          savingComplete()
        }
      })()
    },
    [getNode, updateNodeWithSync, startSaving, savingComplete, flushPendingPositionChanges]
  )

  // 视图变化
  const handleViewportChange = useCallback(
    (newViewport: { x: number; y: number; zoom: number }) => {
      setViewport(newViewport)
    },
    [setViewport]
  )

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        targetType: 'canvas'
      })
    },
    []
  )

  // 节点右键菜单
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<AINodeData>) => {
      event.preventDefault()
      event.stopPropagation()
      
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        targetType: 'node',
        targetId: node.id
      })
    },
    []
  )

  // 连线右键菜单
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      event.stopPropagation()
      
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        targetType: 'edge',
        targetId: edge.id
      })
    },
    []
  )

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

  // 右键菜单操作处理器
  const projectToCanvasPosition = useCallback(
    (screenPosition: Position): Position => {
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return screenPosition
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      return reactFlowInstance.project({
        x: screenPosition.x - bounds.left,
        y: screenPosition.y - bounds.top,
      })
    },
    [reactFlowInstance]
  )

  const handleCreateNodeFromMenu = useCallback(
    (screenPosition: Position) => {
      const canvasPosition = projectToCanvasPosition(screenPosition)

      if (onNodeCreate) {
        onNodeCreate(canvasPosition)
      } else {
        // 默认创建节点逻辑
        addNode({
          content: '请输入内容...',
          title: '',
          importance: 3,
          confidence: 0.5,
          status: 'idle',
          tags: [],
          position: canvasPosition,
          connections: [],
          version: 1,
          metadata: {
            semantic: [],
            editCount: 0,
          },
        })

        addToast({
          type: 'success',
          title: '节点已创建',
          message: '新节点已添加到画布'
        })
      }
    },
    [onNodeCreate, addNode, addToast, projectToCanvasPosition]
  )

  const handleEditNodeFromMenu = useCallback(
    (nodeId: string) => {
      setSelectedNodes([nodeId])
      window.dispatchEvent(new CustomEvent('open-node-editor', { detail: { nodeId } }))
      onNodeDoubleClick?.(nodeId)
    },
    [setSelectedNodes, onNodeDoubleClick]
  )

  const handleOptimizeNodeFromMenu = useCallback(
    async (nodeId: string) => {
      const node = getNodes().find(n => n.id === nodeId)
      if (!node) return

      try {
        addToast({
          type: 'info',
          title: 'AI优化中',
          message: '正在优化节点内容...'
        })

        // 使用nodeService优化节点
        const updates = await nodeService.updateNode(nodeId, node, {
          content: node.content,
          useAI: true,
        })

        // 更新节点
        if (updates.content || updates.title || updates.tags) {
          updateNode(nodeId, updates)
          addToast({
            type: 'success',
            title: 'AI优化完成',
            message: '节点内容已优化'
          })
        } else {
          addToast({
            type: 'info',
            title: '无需优化',
            message: '节点内容已经很好了'
          })
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'AI优化失败',
          message: '请稍后重试'
        })
      }
    },
    [getNodes, addToast, updateNode]
  )

  // 自定义双击检测处理器
  const handlePaneClickWithDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // 增加点击计数
      clickCountRef.current += 1
      lastClickEventRef.current = event
      
      // 如果已有计时器，清除它
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      
      // 设置新的计时器
      clickTimeoutRef.current = setTimeout(() => {
        if (clickCountRef.current === 2) {
          // 双击处理
          if (lastClickEventRef.current) {
            handleCanvasDoubleClick(lastClickEventRef.current)
          }
        }
        
        // 重置计数器
        clickCountRef.current = 0
        lastClickEventRef.current = null
        clickTimeoutRef.current = null
      }, 300) // 300ms 内的点击被认为是双击
    },
    [handleCanvasDoubleClick]
  )

  // 多输入融合处理
  const handleFusionCreate = useCallback(
    async (selectedNodeIds: string[], fusionType: 'summary' | 'synthesis' | 'comparison', position: Position) => {
      try {
        // 获取选中的节点
        const inputNodes = selectedNodeIds.map(id => getNodes().find(node => node.id === id)).filter(Boolean) as AINode[]

        if (inputNodes.length < 2) {
          addToast({
            type: 'warning',
            title: '融合失败',
            message: '至少需要选择2个节点进行融合'
          })
          return
        }

        addToast({
          type: 'info',
          title: 'AI融合中',
          message: `正在对${inputNodes.length}个节点进行${fusionType === 'synthesis' ? '智能融合' : fusionType === 'summary' ? '总结汇总' : '对比分析'}...`
        })

        // 使用nodeService的融合生成功能
        const fusionNode = await nodeService.fusionGenerate(inputNodes, fusionType, position)

        // 添加融合节点到store
        const newNodeId = addNode({
          id: fusionNode.id,
          content: fusionNode.content,
          title: fusionNode.title,
          importance: fusionNode.importance,
          confidence: fusionNode.confidence,
          status: fusionNode.status,
          tags: fusionNode.tags,
          position: fusionNode.position,
          connections: fusionNode.connections,
          version: fusionNode.version,
          metadata: fusionNode.metadata,
          createdAt: fusionNode.createdAt,
          updatedAt: fusionNode.updatedAt,
          semantic_type: fusionNode.semantic_type,
          user_rating: fusionNode.user_rating,
          size: fusionNode.size,
        })

        if (newNodeId) {
          // 创建从输入节点到融合节点的连接
          inputNodes.forEach(inputNode => {
            connectNodes(inputNode.id, newNodeId)
          })

          // 清除选择状态
          setSelectedNodes([])

          addToast({
            type: 'success',
            title: '融合成功',
            message: `已成功融合${inputNodes.length}个节点，生成新的${fusionType === 'synthesis' ? '综合' : fusionType === 'summary' ? '总结' : '对比分析'}节点`
          })
        }

      } catch (error) {
        addToast({
          type: 'error',
          title: '融合失败',
          message: error instanceof Error ? error.message : '请稍后重试'
        })
      }
    },
    [getNodes, addNode, connectNodes, setSelectedNodes, addToast]
  )

  // 清理定时器和RAF
  React.useEffect(() => {
    return () => {
      pendingPositionChangesRef.current.clear()

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])


  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={setReactFlowInstance}
        onPaneClick={handlePaneClickWithDoubleClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onSelectionChange={handleSelectionChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        onContextMenu={handleContextMenu}
        // 框选 / 拖拽模式配置
        selectionOnDrag={interactionMode === 'select'}
        panOnDrag={interactionMode === 'pan' ? [0, 1, 2] : [1, 2]}
        selectionMode={SelectionMode.Partial} // Partial: 节点部分在选区内即可选中
        // 性能优化配置
        {...performanceProps}
      >
        <Background
          color="#1a1b23"
          gap={preferences.gridSnap ? 20 : 0}
          size={1}
          variant={preferences.showGrid ? 'dots' as any : undefined}
        />
        
        <Controls
          className="bg-sidebar-surface border-sidebar-border"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        
        {preferences.showMinimap && (
          <MiniMap
            nodeColor="#252631"
            nodeStrokeColor="#343640"
            nodeBorderRadius={8}
            maskColor="rgba(15, 16, 21, 0.6)"
            className="bg-sidebar-surface border-sidebar-border"
            zoomable
            pannable
          />
        )}
      </ReactFlow>

      {dragCreateMenu.isOpen && dragCreateMenu.screenPosition && (
        <DragCreateMenu
          ref={dragMenuRef}
          position={dragCreateMenu.screenPosition}
          onClose={closeDragCreateMenu}
          onCreateAi={handleCreateAiExpand}
          onCreateBlank={handleCreateBlankNode}
          onCreateTemplate={handleCreateTemplateNode}
          templates={templates}
        />
      )}

      {/* 右键菜单 */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        targetType={contextMenu.targetType}
        targetId={contextMenu.targetId}
        onClose={closeContextMenu}
        onCreateNode={handleCreateNodeFromMenu}
        onEditNode={handleEditNodeFromMenu}
        onOptimizeNode={handleOptimizeNodeFromMenu}
        onDeleteNode={(nodeId) => {
          // TODO: 实现删除节点功能
        }}
        onCopyNode={(nodeId) => {
          // TODO: 实现复制节点功能
        }}
        onFusionCreate={onFusionCreate || handleFusionCreate}
        selectedNodeIds={selectedNodeIds}
      />

      {/* 全局快捷键处理器 */}
      <ShortcutHandler
        onCreateNode={() => {
          // 在画布中央创建节点
          if (reactFlowInstance && reactFlowWrapper.current) {
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
            const centerPosition = reactFlowInstance.project({
              x: reactFlowBounds.width / 2,
              y: reactFlowBounds.height / 2
            })
            handleCreateNodeFromMenu(centerPosition)
          }
        }}
        onPaste={() => {
          // 粘贴功能通过右键菜单实现
          if (reactFlowInstance && reactFlowWrapper.current) {
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
            const centerPosition = reactFlowInstance.project({
              x: reactFlowBounds.width / 2,
              y: reactFlowBounds.height / 2
            })
            // 触发粘贴逻辑
          }
        }}
        onSelectAll={() => {
          const allNodeIds = getNodes().map(node => node.id)
          setSelectedNodes(allNodeIds)
        }}
        onOptimize={() => {
          if (selectedNodeIds.length === 1) {
            handleOptimizeNodeFromMenu(selectedNodeIds[0])
          }
        }}
        onEdit={() => {
          if (selectedNodeIds.length === 1) {
            handleEditNodeFromMenu(selectedNodeIds[0])
          }
        }}
      />
    </div>
  )
}

// 使用Provider包装的Canvas组件
const CanvasWithProvider: React.FC<CanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

export { CanvasWithProvider as Canvas }
