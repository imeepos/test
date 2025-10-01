import { CanvasAPI } from '../apis/canvas.js'
import { ComponentAPI } from '../apis/component.js'
import { AIServiceAPI } from '../apis/ai.js'
import { StorageAPI } from '../apis/storage.js'
import { UIHelperAPI } from '../apis/ui.js'
import { EventSystemAPI } from '../events/index.js'
import { PluginMetadata } from '../types/index.js'

/**
 * 插件上下文
 * 提供插件运行时所需的所有API和服务
 */
export class PluginContext {
  /** 插件元数据 */
  public readonly metadata: PluginMetadata

  /** 画布API */
  public readonly canvas: CanvasAPI

  /** 组件API */
  public readonly components: ComponentAPI

  /** AI服务API */
  public readonly ai: AIServiceAPI

  /** 存储API */
  public readonly storage: StorageAPI

  /** UI助手API */
  public readonly ui: UIHelperAPI

  /** 事件系统API */
  public readonly events: EventSystemAPI

  constructor(
    metadata: PluginMetadata,
    apis: {
      canvas: CanvasAPI
      components: ComponentAPI
      ai: AIServiceAPI
      storage: StorageAPI
      ui: UIHelperAPI
      events: EventSystemAPI
    }
  ) {
    this.metadata = metadata
    this.canvas = apis.canvas
    this.components = apis.components
    this.ai = apis.ai
    this.storage = apis.storage
    this.ui = apis.ui
    this.events = apis.events
  }

  /**
   * 获取插件配置
   */
  async getConfig<T = any>(key: string, defaultValue?: T): Promise<T> {
    return this.storage.get(`plugin:${this.metadata.id}:config:${key}`, defaultValue)
  }

  /**
   * 设置插件配置
   */
  setConfig(key: string, value: any): Promise<void> {
    return this.storage.set(`plugin:${this.metadata.id}:config:${key}`, value)
  }

  /**
   * 获取插件数据
   */
  async getData<T = any>(key: string, defaultValue?: T): Promise<T> {
    return this.storage.get(`plugin:${this.metadata.id}:data:${key}`, defaultValue)
  }

  /**
   * 设置插件数据
   */
  setData(key: string, value: any): Promise<void> {
    return this.storage.set(`plugin:${this.metadata.id}:data:${key}`, value)
  }

  /**
   * 记录日志
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logData = {
      plugin: this.metadata.id,
      level,
      message,
      data,
      timestamp: Date.now(),
    }

    // 发送日志事件
    this.events.emit('plugin.log', logData)

    // 同时输出到控制台
    switch (level) {
      case 'info':
        console.info(`[${this.metadata.name}]`, message, data)
        break
      case 'warn':
        console.warn(`[${this.metadata.name}]`, message, data)
        break
      case 'error':
        console.error(`[${this.metadata.name}]`, message, data)
        break
    }
  }

  /**
   * 检查权限
   */
  hasPermission(permission: string): boolean {
    return this.metadata.permissions.includes(permission as any)
  }

  /**
   * 请求权限
   */
  async requestPermission(permission: string): Promise<boolean> {
    // 发送权限请求事件
    return new Promise((resolve) => {
      this.events.emit('plugin.permission.request', {
        plugin: this.metadata.id,
        permission,
        callback: resolve,
      })
    })
  }

  /**
   * 销毁上下文
   */
  destroy(): void {
    // 清理事件监听器
    this.events.removeAllListeners(`plugin:${this.metadata.id}`)

    // 清理临时数据
    this.storage.clear(`plugin:${this.metadata.id}:temp`)
  }
}