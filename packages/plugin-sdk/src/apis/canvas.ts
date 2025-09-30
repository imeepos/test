import { NodeData, EdgeData, CanvasData, Position } from '../types'

/**
 * 画布API
 * 提供画布操作的核心接口
 */
export interface CanvasAPI {
  // ============ 节点操作 ============

  /**
   * 创建新节点
   * @param nodeData 节点数据
   * @returns 创建的节点
   */
  createNode(nodeData: Omit<NodeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<NodeData>

  /**
   * 更新节点
   * @param nodeId 节点ID
   * @param updates 更新数据
   * @returns 更新后的节点
   */
  updateNode(nodeId: string, updates: Partial<NodeData>): Promise<NodeData>

  /**
   * 删除节点
   * @param nodeId 节点ID
   */
  deleteNode(nodeId: string): Promise<void>

  /**
   * 获取节点
   * @param nodeId 节点ID
   * @returns 节点数据
   */
  getNode(nodeId: string): Promise<NodeData | null>

  /**
   * 获取所有节点
   * @returns 所有节点
   */
  getAllNodes(): Promise<NodeData[]>

  /**
   * 获取选中的节点
   * @returns 选中的节点列表
   */
  getSelectedNodes(): Promise<NodeData[]>

  /**
   * 选中节点
   * @param nodeIds 节点ID列表
   */
  selectNodes(nodeIds: string[]): Promise<void>

  /**
   * 取消选中所有节点
   */
  clearSelection(): Promise<void>

  // ============ 连接线操作 ============

  /**
   * 创建连接线
   * @param edgeData 连接线数据
   * @returns 创建的连接线
   */
  createEdge(edgeData: Omit<EdgeData, 'id'>): Promise<EdgeData>

  /**
   * 更新连接线
   * @param edgeId 连接线ID
   * @param updates 更新数据
   * @returns 更新后的连接线
   */
  updateEdge(edgeId: string, updates: Partial<EdgeData>): Promise<EdgeData>

  /**
   * 删除连接线
   * @param edgeId 连接线ID
   */
  deleteEdge(edgeId: string): Promise<void>

  /**
   * 获取连接线
   * @param edgeId 连接线ID
   * @returns 连接线数据
   */
  getEdge(edgeId: string): Promise<EdgeData | null>

  /**
   * 获取所有连接线
   * @returns 所有连接线
   */
  getAllEdges(): Promise<EdgeData[]>

  /**
   * 获取节点的连接线
   * @param nodeId 节点ID
   * @param direction 方向：'in' | 'out' | 'both'
   * @returns 连接线列表
   */
  getNodeEdges(nodeId: string, direction?: 'in' | 'out' | 'both'): Promise<EdgeData[]>

  // ============ 画布操作 ============

  /**
   * 获取画布数据
   * @returns 画布数据
   */
  getCanvasData(): Promise<CanvasData>

  /**
   * 设置画布数据
   * @param canvasData 画布数据
   */
  setCanvasData(canvasData: CanvasData): Promise<void>

  /**
   * 清空画布
   */
  clearCanvas(): Promise<void>

  /**
   * 获取画布视图状态
   * @returns 视图状态
   */
  getViewport(): Promise<{ zoom: number; offset: Position }>

  /**
   * 设置画布视图状态
   * @param zoom 缩放比例
   * @param offset 偏移位置
   */
  setViewport(zoom: number, offset: Position): Promise<void>

  /**
   * 适应画布内容
   */
  fitView(): Promise<void>

  /**
   * 居中显示节点
   * @param nodeIds 节点ID列表
   */
  centerNodes(nodeIds: string[]): Promise<void>

  // ============ 查询操作 ============

  /**
   * 根据位置查找节点
   * @param position 位置
   * @param radius 搜索半径
   * @returns 节点列表
   */
  getNodesAtPosition(position: Position, radius?: number): Promise<NodeData[]>

  /**
   * 根据区域查找节点
   * @param topLeft 左上角位置
   * @param bottomRight 右下角位置
   * @returns 节点列表
   */
  getNodesInRegion(topLeft: Position, bottomRight: Position): Promise<NodeData[]>

  /**
   * 查找相邻节点
   * @param nodeId 节点ID
   * @param depth 深度
   * @returns 相邻节点列表
   */
  getNeighborNodes(nodeId: string, depth?: number): Promise<NodeData[]>

  /**
   * 查找两节点间的路径
   * @param startNodeId 起始节点ID
   * @param endNodeId 结束节点ID
   * @returns 路径上的节点和连接线
   */
  getPath(startNodeId: string, endNodeId: string): Promise<{
    nodes: NodeData[]
    edges: EdgeData[]
  }>

  // ============ 布局操作 ============

  /**
   * 自动布局
   * @param algorithm 布局算法
   * @param options 布局选项
   */
  autoLayout(algorithm: 'force' | 'hierarchy' | 'circular' | 'grid', options?: any): Promise<void>

  /**
   * 对齐节点
   * @param nodeIds 节点ID列表
   * @param alignment 对齐方式
   */
  alignNodes(nodeIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Promise<void>

  /**
   * 分布节点
   * @param nodeIds 节点ID列表
   * @param direction 分布方向
   */
  distributeNodes(nodeIds: string[], direction: 'horizontal' | 'vertical'): Promise<void>

  // ============ 导入导出 ============

  /**
   * 导出画布
   * @param format 导出格式
   * @param options 导出选项
   * @returns 导出数据
   */
  exportCanvas(format: 'json' | 'svg' | 'png' | 'pdf', options?: any): Promise<string | Blob>

  /**
   * 导入画布
   * @param data 导入数据
   * @param format 数据格式
   */
  importCanvas(data: string | File, format: 'json' | 'svg'): Promise<void>

  // ============ 历史操作 ============

  /**
   * 撤销操作
   */
  undo(): Promise<void>

  /**
   * 重做操作
   */
  redo(): Promise<void>

  /**
   * 获取历史记录
   * @returns 历史记录
   */
  getHistory(): Promise<Array<{ action: string; timestamp: number; data: any }>>

  /**
   * 清空历史记录
   */
  clearHistory(): Promise<void>
}

/**
 * 画布事件类型
 */
export interface CanvasEvents {
  // 节点事件
  'node.created': { node: NodeData }
  'node.updated': { node: NodeData; changes: Partial<NodeData> }
  'node.deleted': { nodeId: string }
  'node.selected': { nodeIds: string[] }
  'node.moved': { nodeId: string; oldPosition: Position; newPosition: Position }

  // 连接线事件
  'edge.created': { edge: EdgeData }
  'edge.updated': { edge: EdgeData; changes: Partial<EdgeData> }
  'edge.deleted': { edgeId: string }

  // 画布事件
  'canvas.changed': { canvasData: CanvasData }
  'canvas.cleared': {}
  'viewport.changed': { zoom: number; offset: Position }

  // 选择事件
  'selection.changed': { selectedNodes: string[]; selectedEdges: string[] }

  // 交互事件
  'canvas.clicked': { position: Position; event: MouseEvent }
  'canvas.double_clicked': { position: Position; event: MouseEvent }
  'canvas.right_clicked': { position: Position; event: MouseEvent }
}