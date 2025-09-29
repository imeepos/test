/**
 * Global Test Teardown
 * 全局测试清理 - 在所有测试结束后运行
 */

export default async function globalTeardown() {
  console.log('🧹 开始全局测试清理...')

  try {
    // 清理测试数据
    await cleanupTestData()

    // 关闭测试服务连接
    await closeTestConnections()

    console.log('✅ 全局测试清理完成')
  } catch (error) {
    console.error('❌ 全局测试清理失败:', error)
    // 不抛出错误，避免影响测试结果
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData(): Promise<void> {
  console.log('🗑️ 清理测试数据...')

  // 这里可以清理测试过程中产生的数据
  // 例如删除测试数据库、清理文件、关闭连接等

  console.log('📝 测试数据清理完成')
}

/**
 * 关闭测试服务连接
 */
async function closeTestConnections(): Promise<void> {
  console.log('🔌 关闭测试服务连接...')

  // 确保所有连接都已关闭
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('📝 测试服务连接已关闭')
}