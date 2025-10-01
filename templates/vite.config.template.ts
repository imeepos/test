import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // 插件配置
  plugins: [react()],

  // CSS配置
  css: {
    postcss: './postcss.config.js',
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },

  // 开发服务器配置
  server: {
    port: 3000, // 根据应用调整端口
    host: true, // 监听所有网络接口
  },

  // 生产构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // chunk大小警告阈值(KB)

    rollupOptions: {
      output: {
        // 手动配置代码分包
        // 根据应用实际依赖修改此配置
        manualChunks: {
          // React核心
          'react-vendor': ['react', 'react-dom'],

          // 状态管理
          'state-management': ['zustand', '@tanstack/react-query'],

          // 根据应用添加其他分包
          // 示例：
          // 'ui-icons': ['lucide-react'],
          // 'reactflow': ['reactflow'],
          // 'antd-core': ['antd'],
          // 'monaco-editor': ['monaco-editor', '@monaco-editor/react'],
        },
      },
    },
  },

  // 依赖预优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      // 根据应用添加需要预优化的依赖
      // 'zustand',
    ],
  },
})
