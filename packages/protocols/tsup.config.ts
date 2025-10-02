import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/contracts/index.ts', 'src/validators/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist'
})
