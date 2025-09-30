import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // 集成测试配置
    environment: 'node',
    testTimeout: 60000, // 60秒超时
    hookTimeout: 30000, // 30秒钩子超时

    // 测试文件匹配
    include: [
      'integration/**/*.test.ts',
      'integration/**/*.test.js'
    ],

    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**'
    ],

    // 全局设置
    globals: true,

    // 并发配置
    threads: false, // 禁用多线程以避免资源竞争

    // 重试配置
    retry: 2,

    // 报告配置
    reporter: ['verbose', 'json'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**'
      ]
    }
  },

  resolve: {
    alias: {
      '@sker/broker': resolve(__dirname, '../packages/broker/src'),
      '@sker/engine': resolve(__dirname, '../packages/engine/src'),
      '@sker/models': resolve(__dirname, '../packages/models/src'),
      '@': resolve(__dirname, '../')
    }
  },

  // 环境变量
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.RABBITMQ_TEST_URL': '"amqp://guest:guest@localhost:5672"'
  }
})