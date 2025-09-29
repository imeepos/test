/**
 * Integration Test Setup
 * 集成测试环境设置
 */

import { jest } from '@jest/globals'

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'warn' // 减少测试时的日志输出

// 扩展Jest超时时间
jest.setTimeout(60000)

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('集成测试中发生未处理的Promise拒绝:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('集成测试中发生未捕获的异常:', error)
  process.exit(1)
})

console.log('🧪 集成测试环境已设置')