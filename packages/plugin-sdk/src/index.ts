// SKER Plugin SDK
// 为第三方开发者提供完整的插件开发接口

// 导出核心接口
export * from './types'
export * from './context'
export * from './lifecycle'
export * from './apis'
export * from './events'
export * from './utils'

// 导出版本信息
export const SDK_VERSION = '1.0.0'

// 导出默认配置
export const DEFAULT_CONFIG = {
  apiVersion: '1.0',
  supportedFormats: ['esm', 'cjs'],
  minEngineVersion: '1.0.0',
}