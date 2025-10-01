/**
 * Canvas 性能优化器
 * 提供节点虚拟化、懒加载、性能监控等功能
 */

import { useEffect, useRef } from 'react'
import { useReactFlow, ReactFlowInstance, Node } from 'reactflow'

interface PerformanceConfig {
  // 虚拟化配置
  enableVirtualization: boolean
  viewportPadding: number // 视口外多少像素开始渲染

  // 性能监控
  enableMonitoring: boolean
  monitoringInterval: number // 监控间隔(ms)

  // 优化阈值
  largeGraphThreshold: number // 超过多少节点算大图
  throttleDelay: number // 节流延迟(ms)
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableVirtualization: true,
  viewportPadding: 500,
  enableMonitoring: true,
  monitoringInterval: 5000,
  largeGraphThreshold: 100,
  throttleDelay: 16,
}

export interface PerformanceMetrics {
  nodeCount: number
  edgeCount: number
  visibleNodeCount: number
  fps: number
  renderTime: number
  isLargeGraph: boolean
}

export const useCanvasPerformance = (config: Partial<PerformanceConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const reactFlow = useReactFlow()

  const metricsRef = useRef<PerformanceMetrics>({
    nodeCount: 0,
    edgeCount: 0,
    visibleNodeCount: 0,
    fps: 60,
    renderTime: 0,
    isLargeGraph: false,
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(performance.now())

  /**
   * 计算节点是否在视口内
   */
  const isNodeInViewport = (
    node: Node,
    viewport: { x: number; y: number; zoom: number },
    viewportWidth: number,
    viewportHeight: number,
    padding: number = fullConfig.viewportPadding
  ): boolean => {
    const { x, y, zoom } = viewport

    // 节点在画布上的实际位置
    const nodeX = node.position.x * zoom + x
    const nodeY = node.position.y * zoom + y

    // 估算节点大小 (假设节点宽高约为300x200)
    const nodeWidth = 300 * zoom
    const nodeHeight = 200 * zoom

    // 检查节点是否在视口内（包含padding）
    return (
      nodeX + nodeWidth > -padding &&
      nodeX < viewportWidth + padding &&
      nodeY + nodeHeight > -padding &&
      nodeY < viewportHeight + padding
    )
  }

  /**
   * 获取视口内的可见节点
   */
  const getVisibleNodes = (): Node[] => {
    const nodes = reactFlow.getNodes()
    const viewport = reactFlow.getViewport()
    const { width, height } = reactFlow.getViewport() as any

    if (!fullConfig.enableVirtualization) {
      return nodes
    }

    return nodes.filter(node =>
      isNodeInViewport(node, viewport, width || window.innerWidth, height || window.innerHeight)
    )
  }

  /**
   * 测量FPS
   */
  const measureFPS = () => {
    const now = performance.now()
    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    frameTimesRef.current.push(delta)

    // 只保留最近30帧
    if (frameTimesRef.current.length > 30) {
      frameTimesRef.current.shift()
    }

    // 计算平均FPS
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
    const fps = 1000 / avgFrameTime

    return Math.round(fps)
  }

  /**
   * 性能监控
   */
  useEffect(() => {
    if (!fullConfig.enableMonitoring) return

    const interval = setInterval(() => {
      const nodes = reactFlow.getNodes()
      const edges = reactFlow.getEdges()
      const visibleNodes = getVisibleNodes()
      const fps = measureFPS()

      metricsRef.current = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        visibleNodeCount: visibleNodes.length,
        fps,
        renderTime: performance.now(),
        isLargeGraph: nodes.length > fullConfig.largeGraphThreshold,
      }

      // 性能警告
      if (fps < 30) {
        console.warn('⚠️ Canvas性能下降: FPS =', fps)
      }

      if (nodes.length > 500) {
        console.warn('⚠️ 节点数量过多:', nodes.length, '建议启用虚拟化')
      }
    }, fullConfig.monitoringInterval)

    return () => clearInterval(interval)
  }, [fullConfig.enableMonitoring, fullConfig.monitoringInterval])

  return {
    metrics: metricsRef.current,
    getVisibleNodes,
    isNodeInViewport,
  }
}

/**
 * 性能优化建议Hook
 */
export const usePerformanceRecommendations = (metrics: PerformanceMetrics) => {
  const recommendations: string[] = []

  if (metrics.nodeCount > 200 && !metrics.isLargeGraph) {
    recommendations.push('建议启用虚拟化渲染以提升性能')
  }

  if (metrics.fps < 30) {
    recommendations.push('FPS过低，建议减少节点数量或简化节点样式')
  }

  if (metrics.visibleNodeCount > 50) {
    recommendations.push('视口内节点过多，建议缩小画布或使用过滤器')
  }

  return recommendations
}

/**
 * React Flow性能配置
 */
export const getOptimizedReactFlowProps = (nodeCount: number) => {
  const isLargeGraph = nodeCount > 100

  return {
    // 基础性能配置
    minZoom: 0.1,
    maxZoom: 2,

    // 大图优化
    nodesDraggable: !isLargeGraph, // 大图禁用拖拽以提升性能
    nodesConnectable: true,
    elementsSelectable: true,

    // 边优化
    defaultEdgeOptions: {
      animated: false, // 禁用动画
      style: { strokeWidth: isLargeGraph ? 1 : 2 },
    },

    // 缩放优化
    zoomOnScroll: true,
    panOnScroll: false,
    zoomOnDoubleClick: false,

    // 选择优化
    selectNodesOnDrag: false, // 禁用拖拽选择

    // 连接优化
    connectionLineStyle: {
      strokeWidth: 2,
      stroke: '#6366f1',
    },

    // 其他优化
    deleteKeyCode: null, // 禁用Delete键删除(使用自定义快捷键)
    multiSelectionKeyCode: 'Shift',
  }
}
