/**
 * UI助手API
 * 提供用户界面操作和组件的接口
 */
export interface UIHelperAPI {
  // ============ 通知和消息 ============

  /**
   * 显示通知消息
   * @param message 消息内容
   * @param type 消息类型
   * @param duration 持续时间（毫秒）
   */
  showNotification(message: string, type?: NotificationType, duration?: number): Promise<void>

  /**
   * 显示成功消息
   * @param message 消息内容
   * @param duration 持续时间
   */
  showSuccess(message: string, duration?: number): Promise<void>

  /**
   * 显示错误消息
   * @param message 消息内容
   * @param duration 持续时间
   */
  showError(message: string, duration?: number): Promise<void>

  /**
   * 显示警告消息
   * @param message 消息内容
   * @param duration 持续时间
   */
  showWarning(message: string, duration?: number): Promise<void>

  /**
   * 显示信息消息
   * @param message 消息内容
   * @param duration 持续时间
   */
  showInfo(message: string, duration?: number): Promise<void>

  // ============ 对话框 ============

  /**
   * 显示确认对话框
   * @param options 对话框选项
   * @returns 用户选择结果
   */
  showConfirm(options: ConfirmOptions): Promise<boolean>

  /**
   * 显示输入对话框
   * @param options 对话框选项
   * @returns 用户输入结果
   */
  showPrompt(options: PromptOptions): Promise<string | null>

  /**
   * 显示选择对话框
   * @param options 对话框选项
   * @returns 用户选择结果
   */
  showSelect(options: SelectOptions): Promise<string | null>

  /**
   * 显示自定义对话框
   * @param options 对话框选项
   * @returns 对话框结果
   */
  showModal(options: ModalOptions): Promise<any>

  // ============ 进度指示 ============

  /**
   * 显示加载指示器
   * @param message 加载消息
   * @returns 加载器ID
   */
  showLoading(message?: string): Promise<string>

  /**
   * 更新加载消息
   * @param loaderId 加载器ID
   * @param message 新消息
   */
  updateLoading(loaderId: string, message: string): Promise<void>

  /**
   * 隐藏加载指示器
   * @param loaderId 加载器ID
   */
  hideLoading(loaderId: string): Promise<void>

  /**
   * 显示进度条
   * @param options 进度条选项
   * @returns 进度条ID
   */
  showProgress(options: ProgressOptions): Promise<string>

  /**
   * 更新进度
   * @param progressId 进度条ID
   * @param progress 进度值（0-100）
   * @param message 进度消息
   */
  updateProgress(progressId: string, progress: number, message?: string): Promise<void>

  /**
   * 隐藏进度条
   * @param progressId 进度条ID
   */
  hideProgress(progressId: string): Promise<void>

  // ============ 工具提示 ============

  /**
   * 显示工具提示
   * @param element 目标元素
   * @param content 提示内容
   * @param options 提示选项
   * @returns 提示ID
   */
  showTooltip(element: HTMLElement, content: string, options?: TooltipOptions): Promise<string>

  /**
   * 更新工具提示
   * @param tooltipId 提示ID
   * @param content 新内容
   */
  updateTooltip(tooltipId: string, content: string): Promise<void>

  /**
   * 隐藏工具提示
   * @param tooltipId 提示ID
   */
  hideTooltip(tooltipId: string): Promise<void>

  /**
   * 隐藏所有工具提示
   */
  hideAllTooltips(): Promise<void>

  // ============ 右键菜单 ============

  /**
   * 显示上下文菜单
   * @param position 菜单位置
   * @param items 菜单项
   * @returns 选择的菜单项
   */
  showContextMenu(position: { x: number; y: number }, items: MenuItem[]): Promise<string | null>

  /**
   * 隐藏上下文菜单
   */
  hideContextMenu(): Promise<void>

  // ============ 侧边栏和面板 ============

  /**
   * 显示侧边栏
   * @param side 侧边栏位置
   * @param content 侧边栏内容
   * @param options 侧边栏选项
   * @returns 侧边栏ID
   */
  showSidebar(side: 'left' | 'right', content: HTMLElement | string, options?: SidebarOptions): Promise<string>

  /**
   * 隐藏侧边栏
   * @param sidebarId 侧边栏ID
   */
  hideSidebar(sidebarId: string): Promise<void>

  /**
   * 显示浮动面板
   * @param content 面板内容
   * @param options 面板选项
   * @returns 面板ID
   */
  showPanel(content: HTMLElement | string, options?: PanelOptions): Promise<string>

  /**
   * 隐藏浮动面板
   * @param panelId 面板ID
   */
  hidePanel(panelId: string): Promise<void>

  // ============ 表单和输入 ============

  /**
   * 创建表单
   * @param fields 表单字段
   * @param options 表单选项
   * @returns 表单元素
   */
  createForm(fields: FormField[], options?: FormOptions): Promise<HTMLFormElement>

  /**
   * 验证表单
   * @param form 表单元素
   * @returns 验证结果
   */
  validateForm(form: HTMLFormElement): Promise<ValidationResult>

  /**
   * 获取表单数据
   * @param form 表单元素
   * @returns 表单数据
   */
  getFormData(form: HTMLFormElement): Promise<Record<string, any>>

  /**
   * 设置表单数据
   * @param form 表单元素
   * @param data 表单数据
   */
  setFormData(form: HTMLFormElement, data: Record<string, any>): Promise<void>

  // ============ 文件操作 ============

  /**
   * 选择文件
   * @param options 文件选择选项
   * @returns 选择的文件
   */
  selectFile(options?: FileSelectOptions): Promise<File | null>

  /**
   * 选择多个文件
   * @param options 文件选择选项
   * @returns 选择的文件列表
   */
  selectFiles(options?: FileSelectOptions): Promise<File[]>

  /**
   * 选择文件夹
   * @returns 选择的文件夹
   */
  selectFolder(): Promise<FileSystemDirectoryHandle | null>

  /**
   * 保存文件
   * @param content 文件内容
   * @param filename 文件名
   * @param mimeType MIME类型
   */
  saveFile(content: string | Blob, filename: string, mimeType?: string): Promise<void>

  // ============ 剪贴板操作 ============

  /**
   * 复制文本到剪贴板
   * @param text 文本内容
   */
  copyToClipboard(text: string): Promise<void>

  /**
   * 从剪贴板读取文本
   * @returns 剪贴板文本
   */
  readFromClipboard(): Promise<string>

  /**
   * 复制图片到剪贴板
   * @param imageData 图片数据
   */
  copyImageToClipboard(imageData: Blob): Promise<void>

  /**
   * 从剪贴板读取图片
   * @returns 图片数据
   */
  readImageFromClipboard(): Promise<Blob | null>

  // ============ 主题和样式 ============

  /**
   * 获取当前主题
   * @returns 主题名称
   */
  getCurrentTheme(): Promise<string>

  /**
   * 设置主题
   * @param theme 主题名称
   */
  setTheme(theme: string): Promise<void>

  /**
   * 获取CSS变量值
   * @param variable CSS变量名
   * @returns 变量值
   */
  getCSSVariable(variable: string): Promise<string>

  /**
   * 设置CSS变量
   * @param variable CSS变量名
   * @param value 变量值
   */
  setCSSVariable(variable: string, value: string): Promise<void>

  // ============ 动画和过渡 ============

  /**
   * 执行动画
   * @param element 目标元素
   * @param animation 动画配置
   * @returns 动画Promise
   */
  animate(element: HTMLElement, animation: AnimationConfig): Promise<void>

  /**
   * 停止动画
   * @param element 目标元素
   */
  stopAnimation(element: HTMLElement): Promise<void>

  /**
   * 高亮元素
   * @param element 目标元素
   * @param options 高亮选项
   */
  highlight(element: HTMLElement, options?: HighlightOptions): Promise<void>

  // ============ 工具函数 ============

  /**
   * 获取元素位置
   * @param element 目标元素
   * @returns 元素位置和大小
   */
  getElementBounds(element: HTMLElement): Promise<DOMRect>

  /**
   * 滚动到元素
   * @param element 目标元素
   * @param options 滚动选项
   */
  scrollToElement(element: HTMLElement, options?: ScrollOptions): Promise<void>

  /**
   * 检查元素是否可见
   * @param element 目标元素
   * @returns 是否可见
   */
  isElementVisible(element: HTMLElement): Promise<boolean>

  /**
   * 等待元素出现
   * @param selector 元素选择器
   * @param timeout 超时时间
   * @returns 元素
   */
  waitForElement(selector: string, timeout?: number): Promise<HTMLElement>
}

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error'
}

/**
 * 输入对话框选项
 */
export interface PromptOptions {
  title: string
  message: string
  defaultValue?: string
  placeholder?: string
  inputType?: 'text' | 'password' | 'email' | 'number'
  validation?: (value: string) => string | null
}

/**
 * 选择对话框选项
 */
export interface SelectOptions {
  title: string
  message: string
  options: Array<{ label: string; value: string }>
  multiple?: boolean
}

/**
 * 模态对话框选项
 */
export interface ModalOptions {
  title: string
  content: HTMLElement | string
  width?: number
  height?: number
  closable?: boolean
  maskClosable?: boolean
  buttons?: ModalButton[]
}

/**
 * 模态对话框按钮
 */
export interface ModalButton {
  text: string
  type?: 'primary' | 'default' | 'danger'
  onClick?: () => void | Promise<void>
}

/**
 * 进度条选项
 */
export interface ProgressOptions {
  title?: string
  message?: string
  cancelable?: boolean
  onCancel?: () => void
}

/**
 * 工具提示选项
 */
export interface TooltipOptions {
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'manual'
  delay?: number
  theme?: 'light' | 'dark'
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[]
  separator?: boolean
}

/**
 * 侧边栏选项
 */
export interface SidebarOptions {
  title?: string
  width?: number
  closable?: boolean
  resizable?: boolean
}

/**
 * 面板选项
 */
export interface PanelOptions {
  title?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
}

/**
 * 表单字段
 */
export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file'
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    custom?: (value: any) => string | null
  }
}

/**
 * 表单选项
 */
export interface FormOptions {
  layout?: 'horizontal' | 'vertical'
  submitText?: string
  cancelText?: string
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
  onCancel?: () => void
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * 文件选择选项
 */
export interface FileSelectOptions {
  accept?: string
  multiple?: boolean
  directory?: boolean
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  keyframes: Keyframe[]
  options?: KeyframeAnimationOptions
}

/**
 * 高亮选项
 */
export interface HighlightOptions {
  color?: string
  duration?: number
  pulse?: boolean
}

/**
 * 滚动选项
 */
export interface ScrollOptions {
  behavior?: 'auto' | 'smooth'
  block?: 'start' | 'center' | 'end' | 'nearest'
  inline?: 'start' | 'center' | 'end' | 'nearest'
}