import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],

  // 输出格式：ESM和CJS双格式
  format: ['esm', 'cjs'],

  // 生成TypeScript类型声明文件
  dts: true,

  // 构建前清理输出目录
  clean: true,

  // 生成sourcemap便于调试
  sourcemap: true,

  // 启用tree-shaking优化
  treeshake: true,

  // 外部依赖（不打包的依赖）
  // 根据实际情况修改此列表
  external: [
    // 示例：排除第三方库
    // 'zod',
    // '@sker/config',

    // 示例：排除所有@sker/*包
    // /^@sker\/.*/

    // Node.js后端包还可以排除runtime依赖
    // 'express',
    // 'pg',
    // 'redis',
  ],

  // Node.js后端包配置（如果是纯Node环境运行）
  // 取消注释以下配置：
  // target: 'node18',
  // format: ['esm'], // 后端可只输出ESM
})
