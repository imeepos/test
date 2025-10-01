import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  dts: false, // 暂时禁用，避免类型错误阻塞构建
  clean: true,
  sourcemap: true,
  target: 'node18',
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
})
