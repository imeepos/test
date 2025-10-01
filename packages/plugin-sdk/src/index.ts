// SKER Plugin SDK
// 为第三方开发者提供完整的插件开发接口

// 导出核心接口
export * from './types/index.js'
export * from './context/index.js'
export * from './lifecycle/index.js'
export * from './apis/index.js'
export * from './events/index.js'
export * from './utils/index.js'

// 导出版本信息
export const SDK_VERSION = '1.0.0'

// 导出默认配置
export const DEFAULT_CONFIG = {
  apiVersion: '1.0',
  supportedFormats: ['esm', 'cjs'],
  minEngineVersion: '1.0.0',
}