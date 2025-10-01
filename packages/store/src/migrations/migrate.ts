import { readFileSync } from 'fs'
import { join } from 'path'
import { databaseManager } from '../config/database.js'

/**
 * 迁移记录
 */
interface Migration {
  id: string
  filename: string
  executed_at: Date
}

/**
 * 数据库迁移管理器
 */
export class MigrationManager {
  /**
   * 创建迁移表
   */
  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
    await databaseManager.query(query)
  }

  /**
   * 获取已执行的迁移
   */
  private async getExecutedMigrations(): Promise<string[]> {
    const migrations = await databaseManager.query<Migration>(
      'SELECT filename FROM migrations ORDER BY id'
    )
    return migrations.map(m => m.filename)
  }

  /**
   * 记录迁移执行
   */
  private async recordMigration(filename: string): Promise<void> {
    await databaseManager.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    )
  }

  /**
   * 执行单个迁移文件
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = join(__dirname, filename)
    const sql = readFileSync(filePath, 'utf-8')

    // 在事务中执行迁移
    await databaseManager.transaction(async (client) => {
      // 执行迁移 SQL
      await client.query(sql)

      // 记录迁移
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      )
    })

    console.log(`✅ 迁移执行成功: ${filename}`)
  }

  /**
   * 执行所有待处理的迁移
   */
  async migrate(): Promise<void> {
    try {
      console.log('🚀 开始数据库迁移...')

      // 初始化数据库连接
      await databaseManager.initialize()

      // 创建迁移表
      await this.createMigrationsTable()

      // 获取已执行的迁移
      const executed = await this.getExecutedMigrations()

      // 定义所有迁移文件（按顺序）
      const allMigrations = [
        '001_initial_schema.sql',
        // 在这里添加新的迁移文件
      ]

      // 找出待执行的迁移
      const pending = allMigrations.filter(m => !executed.includes(m))

      if (pending.length === 0) {
        console.log('✅ 所有迁移都已执行，数据库是最新的')
        return
      }

      console.log(`📋 发现 ${pending.length} 个待执行的迁移:`)
      pending.forEach(m => console.log(`   - ${m}`))

      // 执行待处理的迁移
      for (const migration of pending) {
        await this.executeMigration(migration)
      }

      console.log('🎉 所有迁移执行完成!')

    } catch (error) {
      console.error('❌ 迁移执行失败:', error)
      throw error
    }
  }

  /**
   * 回滚迁移（谨慎使用）
   */
  async rollback(targetMigration?: string): Promise<void> {
    console.warn('⚠️  回滚功能需要谨慎使用，可能导致数据丢失!')

    if (!targetMigration) {
      console.log('回滚功能暂未实现，请手动处理数据库回滚')
      return
    }

    // TODO: 实现回滚逻辑
    throw new Error('回滚功能尚未实现')
  }

  /**
   * 获取迁移状态
   */
  async getStatus(): Promise<{
    executed: string[]
    pending: string[]
    current: string | null
  }> {
    await databaseManager.initialize()
    await this.createMigrationsTable()

    const executed = await this.getExecutedMigrations()
    const allMigrations = [
      '001_initial_schema.sql',
      // 在这里添加新的迁移文件
    ]

    const pending = allMigrations.filter(m => !executed.includes(m))
    const current = executed.length > 0 ? executed[executed.length - 1] : null

    return {
      executed,
      pending,
      current
    }
  }
}

// 如果直接运行此文件，执行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrationManager = new MigrationManager()

  const command = process.argv[2] || 'migrate'

  switch (command) {
    case 'migrate':
      migrationManager.migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
      break

    case 'status':
      migrationManager.getStatus()
        .then(status => {
          console.log('数据库迁移状态:')
          console.log(`当前迁移: ${status.current || '无'}`)
          console.log(`已执行: ${status.executed.length} 个`)
          console.log(`待执行: ${status.pending.length} 个`)

          if (status.pending.length > 0) {
            console.log('待执行的迁移:')
            status.pending.forEach(m => console.log(`  - ${m}`))
          }
        })
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
      break

    case 'rollback':
      const target = process.argv[3]
      migrationManager.rollback(target)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
      break

    default:
      console.log('用法:')
      console.log('  npm run migrate        - 执行所有待处理的迁移')
      console.log('  npm run migrate status - 查看迁移状态')
      console.log('  npm run migrate rollback [target] - 回滚到指定迁移')
      process.exit(1)
  }
}