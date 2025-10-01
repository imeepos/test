#!/usr/bin/env node
/**
 * 数据库迁移 CLI 入口
 * 用于生产环境执行数据库迁移
 */
import { MigrationManager } from './migrations/migrate.js'

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
    console.log('  node cli-migrate.js              - 执行所有待处理的迁移')
    console.log('  node cli-migrate.js -- --auto    - 自动发现并执行迁移文件')
    console.log('  node cli-migrate.js -- --force   - 强制执行（忽略错误）')
    console.log('  node cli-migrate.js status       - 查看迁移状态')
    console.log('  node cli-migrate.js rollback [target] - 回滚到指定迁移')
    process.exit(1)
}
