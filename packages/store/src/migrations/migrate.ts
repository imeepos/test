import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { databaseManager } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `
    await databaseManager.query(query)
  }

  /**
   * 计算文件校验和
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * 自动发现迁移文件
   */
  private discoverMigrations(): string[] {
    try {
      const files = readdirSync(__dirname)
      return files
        .filter(f => f.endsWith('.sql'))
        .sort() // 按文件名排序
    } catch (error) {
      console.warn('⚠️ 无法自动发现迁移文件，使用默认列表')
      return ['001_initial_schema.sql']
    }
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
  private async recordMigration(filename: string, checksum: string): Promise<void> {
    await databaseManager.query(
      'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
      [filename, checksum]
    )
  }

  /**
   * 验证迁移文件完整性
   */
  private async validateMigration(filename: string, currentChecksum: string): Promise<boolean> {
    try {
      const result = await databaseManager.query<{ checksum: string }>(
        'SELECT checksum FROM migrations WHERE filename = $1',
        [filename]
      )
      if (result.length > 0 && result[0].checksum) {
        return result[0].checksum === currentChecksum
      }
      return true
    } catch {
      return true
    }
  }

  /**
   * 执行单个迁移文件
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = join(__dirname, filename)
    const sql = readFileSync(filePath, 'utf-8')
    const checksum = this.calculateChecksum(sql)

    // 验证文件未被修改
    const isValid = await this.validateMigration(filename, checksum)
    if (!isValid) {
      throw new Error(`迁移文件 ${filename} 已被修改，校验和不匹配！`)
    }

    console.log(`⏳ 执行迁移: ${filename}`)

    // 在事务中执行迁移
    await databaseManager.transaction(async (client) => {
      // 执行迁移 SQL
      await client.query(sql)

      // 记录迁移
      await client.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
        [filename, checksum]
      )
    })

    console.log(`✅ 迁移执行成功: ${filename}`)
  }

  /**
   * 执行所有待处理的迁移
   */
  async migrate(options: { force?: boolean; auto?: boolean } = {}): Promise<void> {
    try {
      console.log('🚀 开始数据库迁移...')

      // 初始化数据库连接
      await databaseManager.initialize()

      // 创建迁移表
      await this.createMigrationsTable()

      // 获取已执行的迁移
      const executed = await this.getExecutedMigrations()

      // 定义所有迁移文件（按顺序）
      let allMigrations: string[]
      if (options.auto) {
        console.log('🔍 自动发现迁移文件...')
        allMigrations = this.discoverMigrations()
        console.log(`📁 发现 ${allMigrations.length} 个迁移文件`)
      } else {
        allMigrations = [
          '001_initial_schema.sql',
          // 在这里添加新的迁移文件
        ]
      }

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
        try {
          await this.executeMigration(migration)
        } catch (error) {
          if (options.force) {
            console.error(`⚠️ 迁移 ${migration} 失败，但继续执行（force模式）:`, error)
          } else {
            throw error
          }
        }
      }

      console.log('🎉 所有迁移执行完成!')

    } catch (error) {
      console.error('❌ 迁移执行失败:', error)
      throw error
    } finally {
      await databaseManager.close()
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
  async getStatus(options: { auto?: boolean } = {}): Promise<{
    executed: string[]
    pending: string[]
    current: string | null
  }> {
    try {
      await databaseManager.initialize()
      await this.createMigrationsTable()

      const executed = await this.getExecutedMigrations()
      let allMigrations: string[]

      if (options.auto) {
        allMigrations = this.discoverMigrations()
      } else {
        allMigrations = [
          '001_initial_schema.sql',
          // 在这里添加新的迁移文件
        ]
      }

      const pending = allMigrations.filter(m => !executed.includes(m))
      const current = executed.length > 0 ? executed[executed.length - 1] : null

      return {
        executed,
        pending,
        current
      }
    } finally {
      await databaseManager.close()
    }
  }
}

// 如果直接运行此文件，执行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrationManager = new MigrationManager()

  const command = process.argv[2] || 'migrate'
  const hasAutoFlag = process.argv.includes('--auto')
  const hasForceFlag = process.argv.includes('--force')

  switch (command) {
    case 'migrate':
      migrationManager.migrate({ auto: hasAutoFlag, force: hasForceFlag })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'status':
      migrationManager.getStatus({ auto: hasAutoFlag })
        .then(status => {
          console.log('\n📊 数据库迁移状态:')
          console.log('━'.repeat(50))
          console.log(`当前迁移: ${status.current || '无'}`)
          console.log(`已执行: ${status.executed.length} 个`)
          console.log(`待执行: ${status.pending.length} 个`)

          if (status.executed.length > 0) {
            console.log('\n✅ 已执行的迁移:')
            status.executed.forEach(m => console.log(`  - ${m}`))
          }

          if (status.pending.length > 0) {
            console.log('\n⏳ 待执行的迁移:')
            status.pending.forEach(m => console.log(`  - ${m}`))
          }
          console.log('━'.repeat(50) + '\n')
        })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'rollback':
      const target = process.argv[3]
      migrationManager.rollback(target)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    default:
      console.log('用法:')
      console.log('  npm run migrate              - 执行所有待处理的迁移')
      console.log('  npm run migrate -- --auto    - 自动发现并执行迁移文件')
      console.log('  npm run migrate -- --force   - 强制执行（忽略错误）')
      console.log('  npm run migrate status       - 查看迁移状态')
      console.log('  npm run migrate rollback [target] - 回滚到指定迁移')
      process.exit(1)
  }
}