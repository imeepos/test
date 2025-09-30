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
  Node,
  ReactFlowInstance,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  OnConnectStart,
  OnConnectEnd,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useCanvasStore, useNodeStore, useUIStore } from '@/stores'
import { AINode as AINodeComponent } from '../node/AINode'
import { ContextMenu } from './ContextMenu'
import { ShortcutHandler } from '../interactions/ShortcutHandler'
import { nodeService } from '@/services'
import type { Position, AINodeData, AINode } from '@/types'

// 自定义节点类型
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

  // 状态管理
  const {
    viewport,
    setViewport,
    selectedNodeIds,
    setSelectedNodes,
  } = useCanvasStore()

  // 直接订阅store中的nodes Map
  const nodesMap = useNodeStore(state => state.nodes)
  const storeEdges = useNodeStore(state => state.edges)
  const getNodes = useNodeStore(state => state.getNodes)
  const connectNodes = useNodeStore(state => state.connectNodes)
  const disconnectNodes = useNodeStore(state => state.disconnectNodes)
  const addNode = useNodeStore(state => state.addNode)
  const updateNode = useNodeStore(state => state.updateNode)
  
  // 直接从Map获取节点数组
  const storeNodes = React.useMemo(() => {
    console.log('🗂️ Canvas: 直接从Map获取节点')
    console.log('📊 Canvas: nodesMap类型:', nodesMap instanceof Map)
    console.log('📈 Canvas: nodesMap大小:', nodesMap?.size || 0)
    
    if (!(nodesMap instanceof Map)) {
      console.error('❌ Canvas: nodesMap不是Map类型!', typeof nodesMap)
      return []
    }
    
    const nodes = Array.from(nodesMap.values())
    console.log('✅ Canvas: 从Map转换的节点数组:', nodes.length)
    return nodes
  }, [nodesMap])
  
  // 强制订阅store变化
  const [forceRender, setForceRender] = React.useState(0)
  
  // 监听store的真实状态变化
  React.useEffect(() => {
    console.log('🔔 Canvas: 监听store变化')
    const unsubscribe = useNodeStore.subscribe((state) => {
      console.log('📢 Canvas: Store状态变化通知', state.nodes.size)
      setForceRender(prev => prev + 1)
    })
    
    return unsubscribe
  }, [])

  const { preferences, addToast } = useUIStore()

  // 转换节点数据格式
  const nodes = React.useMemo(() => {
    console.log('🔍 Canvas: useMemo 重新执行 - 使用storeNodes')
    console.log('📊 Canvas: storeNodes数量:', storeNodes.length)
    console.log('📋 Canvas: storeNodes详情:', storeNodes)
    
    if (storeNodes.length === 0) {
      console.log('⚠️ Canvas: storeNodes中没有节点')
    }
    
    const reactFlowNodes = storeNodes.map((node): Node<AINodeData> => {
      console.log(`🔄 Canvas: 转换节点 ${node.id}:`, {
        id: node.id,
        position: node.position,
        content: node.content?.substring(0, 50) + '...',
        type: 'aiNode'
      })
      
      // 验证节点位置
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        console.warn(`⚠️ Canvas: 节点 ${node.id} 位置无效:`, node.position)
      } else if (node.position.x < -10000 || node.position.x > 10000 || node.position.y < -10000 || node.position.y > 10000) {
        console.warn(`⚠️ Canvas: 节点 ${node.id} 位置可能超出可视范围:`, node.position)
      }
      
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
    
    console.log('✅ Canvas: 转换后的ReactFlow节点数量:', reactFlowNodes.length)
    console.log('📝 Canvas: ReactFlow节点详情:', reactFlowNodes)
    
    if (reactFlowNodes.length !== storeNodes.length) {
      console.error('❌ Canvas: 节点转换数量不匹配!', { 
        store: storeNodes.length, 
        reactFlow: reactFlowNodes.length 
      })
    }
    
    return reactFlowNodes
  }, [storeNodes, selectedNodeIds, forceRender])

  // 转换连接数据格式
  const edges = React.useMemo(() => {
    return storeEdges.map((edge): Edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: { stroke: '#6366f1', strokeWidth: 2 },
      animated: true,
    }))
  }, [storeEdges])

  // React Flow状态
  const [rfNodes, setRfNodes, originalOnNodesChange] = useNodesState(nodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges)

  // 防抖定时器引用
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 自定义节点变化处理器 - 处理位置同步
  const handleNodesChange = useCallback((changes: any[]) => {
    console.log('🎯 Canvas: handleNodesChange 被调用', changes)
    
    // 先调用原始的onNodesChange处理器
    originalOnNodesChange(changes)
    
    // 处理位置变化，同步到store
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)
    
    if (positionChanges.length > 0) {
      console.log('📍 Canvas: 检测到位置变化', positionChanges)
      
      // 清除之前的防抖定时器
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      // 使用防抖，避免拖拽过程中频繁更新store
      debounceTimeoutRef.current = setTimeout(() => {
        positionChanges.forEach(change => {
          const nodeId = change.id
          const newPosition = change.position
          
          console.log(`🔄 Canvas: 同步节点 ${nodeId} 位置到store:`, newPosition)
          
          // 更新store中的节点位置
          updateNode(nodeId, { position: newPosition })
        })
        
        console.log('✅ Canvas: 位置同步完成')
      }, 300) // 300ms防抖延迟
    }
  }, [originalOnNodesChange, updateNode])

  // 同步节点状态
  React.useEffect(() => {
    console.log('🔄 Canvas: 同步节点状态到ReactFlow')
    console.log('📥 Canvas: 传入的nodes:', nodes.length, nodes)
    console.log('📤 Canvas: 当前rfNodes:', rfNodes.length, rfNodes)
    
    if (nodes.length !== rfNodes.length) {
      console.log('🔃 Canvas: 节点数量变化，更新ReactFlow状态')
      setRfNodes(nodes)
    } else if (JSON.stringify(nodes) !== JSON.stringify(rfNodes)) {
      console.log('🔃 Canvas: 节点内容变化，更新ReactFlow状态')
      setRfNodes(nodes)
    } else {
      console.log('✅ Canvas: 节点状态一致，无需更新')
    }
  }, [nodes, setRfNodes])

  // 同步连接状态
  React.useEffect(() => {
    console.log('🔗 Canvas: 同步连接状态到ReactFlow:', edges.length)
    setRfEdges(edges)
  }, [edges, setRfEdges])

  // 监听store变化的额外effect
  React.useEffect(() => {
    console.log('🔍 Canvas: Store变化监听 - 检查getNodes方法')
    const storeNodes = getNodes()
    console.log('🏪 Canvas: 直接调用getNodes()结果:', storeNodes.length, storeNodes)
  }, [getNodes])

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
        connectNodes(params.source, params.target)
      }
      // 清理连接状态
      setConnectingNodeId(null)
      setConnectStartPosition(null)
    },
    [connectNodes]
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
        
        const position = reactFlowInstance.project({
          x: clientX - reactFlowBounds.left,
          y: clientY - reactFlowBounds.top,
        })

        console.log('Drag expand triggered:', connectingNodeId, position)
        
        // 调用拖拽扩展处理器
        if (onDragExpand) {
          onDragExpand(connectingNodeId, position)
        } else {
          // 使用默认处理器
          defaultHandleDragExpand(connectingNodeId, position)
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
    async (sourceNodeId: string, position: Position) => {
      try {
        // 获取源节点数据
        const sourceNode = getNodes().find(node => node.id === sourceNodeId)
        if (!sourceNode) return

        // 使用nodeService创建扩展节点
        const newNode = await nodeService.dragExpandGenerate(sourceNode, position)
        
        // 添加新节点到store
        const newNodeId = addNode({
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          confidence: newNode.confidence,
          status: newNode.status,
          tags: newNode.tags,
          position: newNode.position,
          connections: [],
          version: newNode.version,
          metadata: newNode.metadata,
        })

        // 创建连接
        if (newNodeId) {
          connectNodes(sourceNodeId, newNodeId)
        }

      } catch (error) {
        console.error('拖拽扩展失败:', error)
        
        // 失败时创建简单的空节点，用户可以手动编辑
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
          
          // 显示提示信息
          console.log('创建了空节点，请手动编辑内容')
        }
      }
    },
    [getNodes, addNode, connectNodes]
  )

  // 画布双击事件
  const handleCanvasDoubleClick = useCallback(
    async (event: React.MouseEvent) => {
      console.log('画布双击事件触发:', event.target)
      
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        console.log('reactFlowInstance 或 reactFlowWrapper 未准备好')
        return
      }

      console.log('确认是空白画布区域的双击事件 (onPaneDoubleClick)')

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      console.log('计算的位置:', position)

      onCanvasDoubleClick?.(position)

      // 创建新节点
      if (onNodeCreate) {
        console.log('使用自定义的 onNodeCreate 处理器')
        onNodeCreate(position)
      } else {
        console.log('使用默认的节点创建逻辑')
        // 检查是否按住了 Ctrl/Cmd 键来启用AI生成
        const useAI = event.ctrlKey || event.metaKey
        
        try {
          if (useAI) {
            console.log('创建AI生成的节点')
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
            })

            if (newNodeId) {
              console.log('AI节点创建成功, ID:', newNodeId)
              addToast({
                type: 'success',
                title: 'AI节点创建成功',
                message: 'AI已为您生成了初始内容'
              })
            }
          } else {
            console.log('创建空白节点')
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
              console.log('空白节点创建成功, ID:', newNodeId)
              addToast({
                type: 'success',
                title: '节点已创建',
                message: '双击节点开始编辑，Ctrl+双击可使用AI生成'
              })
            }
          }
        } catch (error) {
          console.error('创建节点失败:', error)
          
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

          if (fallbackNodeId) {
            console.log('回退到空白节点创建成功, ID:', fallbackNodeId)
          }

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

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

  // 右键菜单操作处理器
  const handleCreateNodeFromMenu = useCallback(
    (position: Position) => {
      if (onNodeCreate) {
        onNodeCreate(position)
      } else {
        // 默认创建节点逻辑
        addNode({
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
          type: 'success',
          title: '节点已创建',
          message: '新节点已添加到画布'
        })
      }
    },
    [onNodeCreate, addNode, addToast]
  )

  const handleEditNodeFromMenu = useCallback(
    (nodeId: string) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(nodeId)
      } else {
        // 默认编辑逻辑 - 可以触发节点编辑器
        console.log('Edit node:', nodeId)
        addToast({
          type: 'info',
          title: '编辑节点',
          message: '双击节点可以快速编辑'
        })
      }
    },
    [onNodeDoubleClick, addToast]
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
        console.error('AI优化失败:', error)
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
      console.log('画布点击事件:', event)
      
      // 增加点击计数
      clickCountRef.current += 1
      lastClickEventRef.current = event
      
      // 如果已有计时器，清除它
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      
      // 设置新的计时器
      clickTimeoutRef.current = setTimeout(() => {
        if (clickCountRef.current === 1) {
          // 单击处理
          console.log('识别为单击事件')
          // 这里可以添加单击逻辑，当前只是日志记录
        } else if (clickCountRef.current === 2) {
          // 双击处理
          console.log('识别为双击事件，触发双击处理器')
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
          content: fusionNode.content,
          title: fusionNode.title,
          importance: fusionNode.importance,
          confidence: fusionNode.confidence,
          status: fusionNode.status,
          tags: fusionNode.tags,
          position: fusionNode.position,
          connections: [],
          version: fusionNode.version,
          metadata: fusionNode.metadata,
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
        console.error('融合生成失败:', error)
        addToast({
          type: 'error',
          title: '融合失败',
          message: error instanceof Error ? error.message : '请稍后重试'
        })
      }
    },
    [getNodes, addNode, connectNodes, setSelectedNodes, addToast]
  )

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // 额外的渲染调试
  React.useEffect(() => {
    console.log('🎨 Canvas: 组件重新渲染')
    console.log('📊 Canvas: 当前rfNodes数量:', rfNodes.length)
    console.log('📝 Canvas: 当前rfNodes详情:', rfNodes)
  })

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      {/* 添加开发模式的调试信息显示 */}
      {import.meta.env.DEV && (
        <div className="absolute top-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Store节点: {getNodes().length}</div>
          <div>ReactFlow节点: {rfNodes.length}</div>
          <div>转换节点: {nodes.length}</div>
          <div>直接Map: {storeNodes.length}</div>
          <button 
            onClick={() => {
              console.log('🧹 清除localStorage缓存')
              localStorage.removeItem('node-storage')
              window.location.reload()
            }}
            className="bg-red-600 hover:bg-red-700 px-1 py-0.5 rounded text-xs"
          >
            清除缓存
          </button>
          <button 
            onClick={() => {
              console.log('📊 当前store状态:')
              console.log('nodesMap:', nodesMap)
              console.log('storeNodes:', storeNodes)
              console.log('nodes:', nodes)
              console.log('rfNodes:', rfNodes)
            }}
            className="bg-blue-600 hover:bg-blue-700 px-1 py-0.5 rounded text-xs"
          >
            调试状态
          </button>
          <button 
            onClick={() => {
              console.log('🧪 测试创建节点')
              const testNode = addNode({
                content: '测试节点内容',
                title: '测试节点',
                importance: 3,
                confidence: 0.8,
                status: 'idle',
                tags: ['test'],
                position: { x: 100, y: 100 },
                connections: [],
                version: 1,
                metadata: { semantic: [], editCount: 0 }
              })
              console.log('✅ 测试节点创建完成:', testNode)
            }}
            className="bg-green-600 hover:bg-green-700 px-1 py-0.5 rounded text-xs"
          >
            测试创建
          </button>
        </div>
      )}
      
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={setReactFlowInstance}
        onPaneClick={handlePaneClickWithDoubleClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        onContextMenu={handleContextMenu}
        deleteKeyCode={null}
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
          console.log('Delete node from menu:', nodeId)
        }}
        onCopyNode={(nodeId) => {
          console.log('Copy node from menu:', nodeId)
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