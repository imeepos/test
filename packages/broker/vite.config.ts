import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SkerBroker',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'amqplib',
        'uuid',
        'events',
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