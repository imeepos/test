import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server.ts')
      },
      name: 'SkerGateway',
      fileName: (format, entryName) => `${entryName}.${format}.js`,
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
        '@sker/store',
        '@sker/engine'
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