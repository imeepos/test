import { startGatewayFromEnvironment } from './factory/createGatewayWithStore'

// 启动Gateway服务器
async function main() {
  try {
    console.log('Starting Gateway server...')
    const server = await startGatewayFromEnvironment()
    
    // 优雅关闭处理
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...')
      try {
        await server.stop()
        console.log('Gateway server closed.')
        process.exit(0)
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    })

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...')
      try {
        await server.stop()
        console.log('Gateway server closed.')
        process.exit(0)
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    })

    console.log('Gateway server started successfully')
  } catch (error) {
    console.error('Failed to start Gateway server:', error)
    process.exit(1)
  }
}

main()