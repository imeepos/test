import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: [
    'express',
    'pg',
    'redis',
    'winston',
    '@sker/models',
    '@sker/config'
  ]
})
