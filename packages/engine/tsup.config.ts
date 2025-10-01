import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: [
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
    '@sker/broker',
    '@sker/store'
  ]
})
