import { PluginContext } from '../context/index.js'

/**
 * 插件生命周期接口
 * 所有插件都必须实现这个接口
 */
export interface PluginLifecycle {
  /**
   * 插件安装时调用
   * 用于初始化插件资源、注册服务等
   */
  onInstall(): Promise<void>

  /**
   * 插件激活时调用
   * 用于启动插件功能、注册事件监听器等
   * @param context 插件上下文，提供所有API访问
   */
  onActivate(context: PluginContext): Promise<void>

  /**
   * 插件停用时调用
   * 用于清理资源、取消事件监听器等
   */
  onDeactivate(): Promise<void>

  /**
   * 插件卸载时调用
   * 用于完全清理插件相关数据和资源
   */
  onUninstall(): Promise<void>

  /**
   * 插件更新时调用（可选）
   * @param oldVersion 旧版本号
   * @param newVersion 新版本号
   */
  onUpdate?(oldVersion: string, newVersion: string): Promise<void>

  /**
   * 插件配置变更时调用（可选）
   * @param config 新的配置数据
   */
  onConfigChange?(config: Record<string, any>): Promise<void>

  /**
   * 插件错误处理（可选）
   * @param error 错误信息
   */
  onError?(error: Error): Promise<void>
}

/**
 * 插件状态
 */
export enum PluginState {
  /** 已安装但未激活 */
  INSTALLED = 'installed',
  /** 已激活 */
  ACTIVE = 'active',
  /** 已停用 */
  INACTIVE = 'inactive',
  /** 正在安装 */
  INSTALLING = 'installing',
  /** 正在卸载 */
  UNINSTALLING = 'uninstalling',
  /** 错误状态 */
  ERROR = 'error',
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
  /**
   * 安装插件
   * @param pluginId 插件ID
   * @param pluginCode 插件代码
   */
  install(pluginId: string, pluginCode: string): Promise<void>

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  uninstall(pluginId: string): Promise<void>

  /**
   * 激活插件
   * @param pluginId 插件ID
   */
  activate(pluginId: string): Promise<void>

  /**
   * 停用插件
   * @param pluginId 插件ID
   */
  deactivate(pluginId: string): Promise<void>

  /**
   * 获取插件状态
   * @param pluginId 插件ID
   */
  getState(pluginId: string): PluginState

  /**
   * 获取所有插件
   */
  getAllPlugins(): string[]

  /**
   * 获取激活的插件
   */
  getActivePlugins(): string[]
}

/**
 * 基础插件类
 * 提供了插件生命周期的默认实现
 */
export abstract class BasePlugin implements PluginLifecycle {
  protected context?: PluginContext

  /**
   * 获取插件上下文
   */
  protected getContext(): PluginContext {
    if (!this.context) {
      throw new Error('Plugin context is not available. Make sure the plugin is activated.')
    }
    return this.context
  }

  /**
   * 安装插件
   */
  async onInstall(): Promise<void> {
    // 默认空实现
  }

  /**
   * 激活插件
   */
  async onActivate(context: PluginContext): Promise<void> {
    this.context = context
    context.log('info', 'Plugin activated')
  }

  /**
   * 停用插件
   */
  async onDeactivate(): Promise<void> {
    if (this.context) {
      this.context.log('info', 'Plugin deactivated')
      this.context.destroy()
      this.context = undefined
    }
  }

  /**
   * 卸载插件
   */
  async onUninstall(): Promise<void> {
    // 默认空实现
  }

  /**
   * 错误处理
   */
  async onError(error: Error): Promise<void> {
    if (this.context) {
      this.context.log('error', 'Plugin error', error)
    } else {
      console.error('Plugin error:', error)
    }
  }
}

/**
 * 创建插件装饰器
 * 用于标记和配置插件类
 */
export function Plugin(metadata: Partial<import('../types').PluginMetadata>) {
  return function <T extends new (...args: any[]) => PluginLifecycle>(constructor: T) {
    // 将元数据附加到构造函数
    ;(constructor as any).__pluginMetadata = metadata
    return constructor
  }
}

/**
 * 获取插件元数据
 */
export function getPluginMetadata(constructor: any): Partial<import('../types').PluginMetadata> | undefined {
  return constructor.__pluginMetadata
}