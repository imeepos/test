import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SkerGateway',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'express',
        'socket.io',
        'helmet',
        'cors',
        'express-rate-limit',
        'express-validator',
        'jsonwebtoken',
        'compression',
        'uuid',
        'bcrypt',
        'http',
        'events',
        '@sker/broker',
        '@sker/config',
        '@sker/models',
        '@sker/store'
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