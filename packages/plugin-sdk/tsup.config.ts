import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  dts: true,
  clean: true,
  sourcemap: true,
  globalName: 'SkerPluginSDK',
  minify: true,
  platform: 'browser',
  external: ['eventemitter3']
})
