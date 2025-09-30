import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server/index.ts')
      },
      name: 'SkerEngine',
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'events',
        'fs',
        'path',
        'http',
        'https',
        'stream',
        'buffer',
        'zlib',
        'net',
        'crypto',
        'async_hooks',
        'util',
        'url',
        'querystring',
        'node:buffer',
        'node:crypto',
        'node:net',
        'express',
        'express-rate-limit',
        'cors',
        'helmet',
        'compression',
        'dotenv',
        'openai',
        'tiktoken',
        'uuid',
        '@sker/models',
        '@sker/config',
        '@sker/ai',
        '@sker/broker'
      ]
    },
    target: 'node16',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})