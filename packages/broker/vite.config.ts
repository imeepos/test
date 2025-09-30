import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false
    })
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.ts'),
        main: resolve(__dirname, 'src/main.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs'
      },
      external: [
        'amqplib',
        'uuid',
        'events',
        'http',
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