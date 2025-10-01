import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/main.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: [
    'amqplib',
    'uuid',
    'events',
    'http',
    '@sker/models',
    '@sker/store'
  ]
})
