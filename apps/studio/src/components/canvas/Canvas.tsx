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
  OnConnectEnd,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useCanvasStore, useNodeStore, useUIStore } from '@/stores'
import { AINode as AINodeComponent } from '../node/AINode'
import { nodeService } from '@/services'
import type { Position, AINodeData } from '@/types'

// 自定义节点类型
const nodeTypes = {
  aiNode: AINodeComponent,
}

export interface CanvasProps {
  onNodeDoubleClick?: (nodeId: string) => void
  onCanvasDoubleClick?: (position: Position) => void
  onNodeCreate?: (position: Position) => void
  onDragExpand?: (sourceNodeId: string, position: Position) => void
}

const Canvas: React.FC<CanvasProps> = ({
  onNodeDoubleClick,
  onCanvasDoubleClick,
  onNodeCreate,
  onDragExpand,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null)

  // 状态管理
  const {
    viewport,
    setViewport,
    selectedNodeIds,
    setSelectedNodes,
  } = useCanvasStore()

  const {
    getNodes,
    edges: storeEdges,
    connectNodes,
    disconnectNodes,
    addNode,
  } = useNodeStore()

  const { preferences } = useUIStore()

  // 转换节点数据格式
  const nodes = React.useMemo(() => {
    return getNodes().map((node): Node<AINodeData> => ({
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
    }))
  }, [getNodes, selectedNodeIds])

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
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges)

  // 同步节点状态
  React.useEffect(() => {
    setRfNodes(nodes)
  }, [nodes, setRfNodes])

  // 同步连接状态
  React.useEffect(() => {
    setRfEdges(edges)
  }, [edges, setRfEdges])

  // 连接处理
  const onConnect: OnConnect = useCallback(
    (params: Connection | Edge) => {
      if (params.source && params.target) {
        connectNodes(params.source, params.target)
      }
    },
    [connectNodes]
  )

  // 连接结束处理 - 拖拽扩展功能
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // 在ReactFlow v11中，连接状态需要通过其他方式管理
      // 暂时简化处理，可以后续根据需要扩展
      console.log('Connection ended', event)
    },
    [reactFlowInstance, onDragExpand]
  )

  // 默认拖拽扩展处理
  const handleDragExpand = useCallback(
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
        
        // 失败时创建简单的空节点
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
      }
    },
    [getNodes, addNode, connectNodes]
  )

  // 画布双击事件
  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      onCanvasDoubleClick?.(position)

      // 创建新节点
      if (onNodeCreate) {
        onNodeCreate(position)
      } else {
        // 默认创建空节点
        addNode({
          content: '请输入内容...',
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
      }
    },
    [reactFlowInstance, onCanvasDoubleClick, onNodeCreate, addNode]
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

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onInit={setReactFlowInstance}
        onDoubleClick={handleCanvasDoubleClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
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