import { NodeData, NodeStyle } from '../types/index.js'

/**
 * 组件API
 * 提供组件操作和管理的接口
 */
export interface ComponentAPI {
  // ============ 组件注册 ============

  /**
   * 注册自定义组件
   * @param componentType 组件类型
   * @param componentDef 组件定义
   */
  registerComponent(componentType: string, componentDef: ComponentDefinition): Promise<void>

  /**
   * 取消注册组件
   * @param componentType 组件类型
   */
  unregisterComponent(componentType: string): Promise<void>

  /**
   * 获取注册的组件
   * @param componentType 组件类型
   * @returns 组件定义
   */
  getComponent(componentType: string): Promise<ComponentDefinition | null>

  /**
   * 获取所有注册的组件
   * @returns 组件定义映射
   */
  getAllComponents(): Promise<Record<string, ComponentDefinition>>

  // ============ 组件实例操作 ============

  /**
   * 创建组件实例
   * @param componentType 组件类型
   * @param props 组件属性
   * @param position 位置
   * @returns 组件节点
   */
  createComponentInstance(
    componentType: string,
    props: Record<string, any>,
    position: { x: number; y: number }
  ): Promise<NodeData>

  /**
   * 更新组件属性
   * @param nodeId 节点ID
   * @param props 新属性
   * @returns 更新后的节点
   */
  updateComponentProps(nodeId: string, props: Record<string, any>): Promise<NodeData>

  /**
   * 获取组件属性
   * @param nodeId 节点ID
   * @returns 组件属性
   */
  getComponentProps(nodeId: string): Promise<Record<string, any>>

  /**
   * 验证组件属性
   * @param componentType 组件类型
   * @param props 属性
   * @returns 验证结果
   */
  validateProps(componentType: string, props: Record<string, any>): Promise<ValidationResult>

  // ============ 组件样式 ============

  /**
   * 设置组件样式
   * @param nodeId 节点ID
   * @param style 样式
   */
  setComponentStyle(nodeId: string, style: NodeStyle): Promise<void>

  /**
   * 获取组件样式
   * @param nodeId 节点ID
   * @returns 样式
   */
  getComponentStyle(nodeId: string): Promise<NodeStyle>

  /**
   * 应用主题
   * @param nodeId 节点ID
   * @param theme 主题名称
   */
  applyTheme(nodeId: string, theme: string): Promise<void>

  // ============ 组件模板 ============

  /**
   * 创建组件模板
   * @param templateData 模板数据
   * @returns 模板ID
   */
  createTemplate(templateData: ComponentTemplate): Promise<string>

  /**
   * 从模板创建组件
   * @param templateId 模板ID
   * @param position 位置
   * @returns 组件节点
   */
  createFromTemplate(templateId: string, position: { x: number; y: number }): Promise<NodeData>

  /**
   * 获取模板列表
   * @returns 模板列表
   */
  getTemplates(): Promise<ComponentTemplate[]>

  /**
   * 删除模板
   * @param templateId 模板ID
   */
  deleteTemplate(templateId: string): Promise<void>

  // ============ 组件交互 ============

  /**
   * 触发组件事件
   * @param nodeId 节点ID
   * @param eventType 事件类型
   * @param eventData 事件数据
   */
  triggerComponentEvent(nodeId: string, eventType: string, eventData: any): Promise<void>

  /**
   * 监听组件事件
   * @param nodeId 节点ID
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  onComponentEvent(nodeId: string, eventType: string, handler: (data: any) => void): Promise<void>

  /**
   * 取消监听组件事件
   * @param nodeId 节点ID
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  offComponentEvent(nodeId: string, eventType: string, handler: (data: any) => void): Promise<void>
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  /** 组件名称 */
  name: string
  /** 组件描述 */
  description: string
  /** 组件类别 */
  category: string
  /** 组件图标 */
  icon?: string
  /** 组件标签 */
  tags?: string[]
  /** 属性定义 */
  props: PropDefinition[]
  /** 默认属性 */
  defaultProps: Record<string, any>
  /** 默认样式 */
  defaultStyle?: NodeStyle
  /** 渲染函数 */
  render: (props: Record<string, any>) => string | HTMLElement
  /** 配置面板 */
  configPanel?: (props: Record<string, any>, onChange: (props: Record<string, any>) => void) => HTMLElement
  /** 事件定义 */
  events?: EventDefinition[]
  /** 组件大小 */
  size?: { width: number; height: number }
  /** 是否可调整大小 */
  resizable?: boolean
  /** 连接点定义 */
  connectionPoints?: ConnectionPoint[]
}

/**
 * 属性定义
 */
export interface PropDefinition {
  /** 属性名 */
  name: string
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'color' | 'file' | 'select'
  /** 属性标签 */
  label: string
  /** 属性描述 */
  description?: string
  /** 默认值 */
  defaultValue?: any
  /** 是否必需 */
  required?: boolean
  /** 验证规则 */
  validation?: ValidationRule[]
  /** 选项（仅用于 select 类型） */
  options?: Array<{ label: string; value: any }>
  /** 最小值（仅用于 number 类型） */
  min?: number
  /** 最大值（仅用于 number 类型） */
  max?: number
  /** 步长（仅用于 number 类型） */
  step?: number
  /** 是否多行（仅用于 string 类型） */
  multiline?: boolean
  /** 文件类型（仅用于 file 类型） */
  accept?: string
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  /** 规则值 */
  value?: any
  /** 错误消息 */
  message: string
  /** 自定义验证函数 */
  validator?: (value: any) => boolean
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    prop: string
    message: string
  }>
}

/**
 * 事件定义
 */
export interface EventDefinition {
  /** 事件名称 */
  name: string
  /** 事件描述 */
  description: string
  /** 事件数据类型 */
  dataType?: string
}

/**
 * 连接点定义
 */
export interface ConnectionPoint {
  /** 连接点ID */
  id: string
  /** 连接点类型 */
  type: 'input' | 'output'
  /** 连接点位置 */
  position: 'top' | 'right' | 'bottom' | 'left'
  /** 连接点偏移 */
  offset?: { x: number; y: number }
  /** 连接点标签 */
  label?: string
  /** 数据类型 */
  dataType?: string
  /** 是否必需 */
  required?: boolean
}

/**
 * 组件模板
 */
export interface ComponentTemplate {
  /** 模板ID */
  id?: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板类别 */
  category: string
  /** 模板标签 */
  tags: string[]
  /** 模板缩略图 */
  thumbnail?: string
  /** 组件数据 */
  components: Array<{
    type: string
    props: Record<string, any>
    position: { x: number; y: number }
    style?: NodeStyle
  }>
  /** 连接关系 */
  connections: Array<{
    source: string
    target: string
    type?: string
  }>
  /** 模板元数据 */
  metadata?: Record<string, any>
}

/**
 * 组件事件类型
 */
export interface ComponentEvents {
  // 组件注册事件
  'component.registered': { componentType: string; definition: ComponentDefinition }
  'component.unregistered': { componentType: string }

  // 组件实例事件
  'component.created': { nodeId: string; componentType: string; props: Record<string, any> }
  'component.updated': { nodeId: string; props: Record<string, any>; changes: Record<string, any> }
  'component.style_changed': { nodeId: string; style: NodeStyle }

  // 组件交互事件
  'component.clicked': { nodeId: string; event: MouseEvent }
  'component.double_clicked': { nodeId: string; event: MouseEvent }
  'component.hover': { nodeId: string; event: MouseEvent }
  'component.focus': { nodeId: string }
  'component.blur': { nodeId: string }

  // 模板事件
  'template.created': { templateId: string; template: ComponentTemplate }
  'template.deleted': { templateId: string }
}