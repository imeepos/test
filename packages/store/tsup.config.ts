import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: [
    'express',
    'pg',
    'redis',
    'bcryptjs',
    'jsonwebtoken',
    'joi',
    'dotenv',
    'cors',
    'uuid',
    '@sker/models',
    '@sker/config'
  ]
})
