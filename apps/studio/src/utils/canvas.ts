import type { Position, AINode } from '@/types'

/**
 * 计算两点之间的距离
 */
export function calculateDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算画布中心点
 */
export function getCanvasCenter(canvasElement: HTMLElement): Position {
  const rect = canvasElement.getBoundingClientRect()
  return {
    x: rect.width / 2,
    y: rect.height / 2
  }
}

/**
 * 将屏幕坐标转换为画布坐标
 */
export function screenToCanvas(
  screenPosition: Position,
  canvasElement: HTMLElement,
  viewport: { x: number; y: number; zoom: number }
): Position {
  const rect = canvasElement.getBoundingClientRect()
  return {
    x: (screenPosition.x - rect.left - viewport.x) / viewport.zoom,
    y: (screenPosition.y - rect.top - viewport.y) / viewport.zoom
  }
}

/**
 * 将画布坐标转换为屏幕坐标
 */
export function canvasToScreen(
  canvasPosition: Position,
  viewport: { x: number; y: number; zoom: number }
): Position {
  return {
    x: canvasPosition.x * viewport.zoom + viewport.x,
    y: canvasPosition.y * viewport.zoom + viewport.y
  }
}

/**
 * 检查两个矩形是否相交
 */
export function rectIntersects(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

/**
 * 计算节点的包围盒
 */
export function getNodeBounds(nodes: AINode[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const nodeWidth = 280 // AINode的默认宽度
  const nodeHeight = 120 // AINode的默认高度

  let minX = nodes[0].position.x
  let maxX = nodes[0].position.x + nodeWidth
  let minY = nodes[0].position.y
  let maxY = nodes[0].position.y + nodeHeight

  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x)
    maxX = Math.max(maxX, node.position.x + nodeWidth)
    minY = Math.min(minY, node.position.y)
    maxY = Math.max(maxY, node.position.y + nodeHeight)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 生成网格吸附位置
 */
export function snapToGrid(position: Position, gridSize: number = 20): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

/**
 * 检查位置是否在画布可视区域内
 */
export function isPositionInViewport(
  position: Position,
  viewport: { x: number; y: number; zoom: number },
  canvasSize: { width: number; height: number }
): boolean {
  const screenPos = canvasToScreen(position, viewport)
  return (
    screenPos.x >= 0 &&
    screenPos.y >= 0 &&
    screenPos.x <= canvasSize.width &&
    screenPos.y <= canvasSize.height
  )
}

/**
 * 自动布局节点位置
 */
export function autoLayoutNodes(nodes: AINode[], layoutType: 'grid' | 'circle' | 'tree' = 'grid'): AINode[] {
  if (nodes.length === 0) return nodes

  const spacing = 320 // 节点间距
  const nodeWidth = 280
  const nodeHeight = 120

  switch (layoutType) {
    case 'grid': {
      const cols = Math.ceil(Math.sqrt(nodes.length))
      return nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % cols) * spacing,
          y: Math.floor(index / cols) * spacing
        }
      }))
    }

    case 'circle': {
      const radius = Math.max(200, nodes.length * 50)
      const angleStep = (2 * Math.PI) / nodes.length

      return nodes.map((node, index) => ({
        ...node,
        position: {
          x: Math.cos(index * angleStep) * radius,
          y: Math.sin(index * angleStep) * radius
        }
      }))
    }

    case 'tree': {
      // 简化的树状布局，根据重要性分层
      const levels = Array.from(new Set(nodes.map(n => n.importance))).sort()
      const levelHeight = 200

      return nodes.map(node => {
        const levelIndex = levels.indexOf(node.importance)
        const nodesInLevel = nodes.filter(n => n.importance === node.importance)
        const indexInLevel = nodesInLevel.indexOf(node)

        return {
          ...node,
          position: {
            x: (indexInLevel - (nodesInLevel.length - 1) / 2) * spacing,
            y: levelIndex * levelHeight
          }
        }
      })
    }

    default:
      return nodes
  }
}