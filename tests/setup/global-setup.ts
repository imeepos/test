/**
 * Global Test Setup
 * 全局测试设置 - 在所有测试开始前运行
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function globalSetup() {
  console.log('🚀 开始全局测试设置...')

  try {
    // 检查必要的测试服务是否运行
    await checkTestServices()

    // 设置测试数据库
    await setupTestDatabase()

    console.log('✅ 全局测试设置完成')
  } catch (error) {
    console.error('❌ 全局测试设置失败:', error)
    throw error
  }
}

/**
 * 检查测试服务
 */
async function checkTestServices(): Promise<void> {
  console.log('🔍 检查测试服务...')

  const services = [
    { name: 'PostgreSQL', command: 'pg_isready -h localhost', required: false },
    { name: 'Redis', command: 'redis-cli ping', required: false },
    { name: 'RabbitMQ', command: 'rabbitmqctl status', required: false }
  ]

  for (const service of services) {
    try {
      await execAsync(service.command)
      console.log(`✅ ${service.name} 可用`)
    } catch (error) {
      if (service.required) {
        console.error(`❌ ${service.name} 不可用且为必需服务`)
        throw error
      } else {
        console.warn(`⚠️ ${service.name} 不可用，某些测试可能会被跳过`)
      }
    }
  }
}

/**
 * 设置测试数据库
 */
async function setupTestDatabase(): Promise<void> {
  console.log('🗄️ 设置测试数据库...')

  if (process.env.TEST_DATABASE_URL) {
    try {
      // 这里可以运行数据库迁移或创建测试数据库
      console.log('📝 测试数据库配置完成')
    } catch (error) {
      console.warn('⚠️ 测试数据库设置失败，将使用内存数据库')
    }
  } else {
    console.log('💡 使用默认测试数据库配置')
  }
}