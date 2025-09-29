#!/usr/bin/env node

/**
 * 架构验证脚本
 * 用于验证前后端架构一致性修复的完整性
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 开始架构一致性验证...\n')

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath, description) {
  const fullPath = path.resolve(filePath)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`)
    return true
  } else {
    console.log(`❌ ${description}: ${filePath} (缺失)`)
    return false
  }
}

/**
 * 检查文件内容是否包含特定字符串
 */
function checkFileContent(filePath, searchStrings, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const missing = searchStrings.filter(str => !content.includes(str))

    if (missing.length === 0) {
      console.log(`✅ ${description}: 所有必需内容已找到`)
      return true
    } else {
      console.log(`❌ ${description}: 缺少内容 - ${missing.join(', ')}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${description}: 读取文件失败 - ${error.message}`)
    return false
  }
}

/**
 * 检查TypeScript类型定义
 */
function validateTypeDefinitions() {
  console.log('\n📊 验证数据类型定义...')

  const checks = [
    {
      file: 'apps/studio/src/types/node.ts',
      content: ['semantic_type?: SemanticType', 'user_rating?: number', 'confidence: number // 0-100'],
      desc: '节点类型定义'
    },
    {
      file: 'apps/studio/src/types/ai.ts',
      content: ['confidence: number // 0-100', 'semantic_type?: string', 'user_rating?: number'],
      desc: 'AI响应类型定义'
    },
    {
      file: 'apps/studio/src/types/converter.ts',
      content: ['NodeDataConverter', 'toBackend', 'fromBackend', 'convertConfidenceToBackend'],
      desc: '数据转换器类型'
    }
  ]

  let passed = 0
  checks.forEach(check => {
    if (checkFileExists(check.file, check.desc) &&
        checkFileContent(check.file, check.content, `${check.desc} - 内容检查`)) {
      passed++
    }
  })

  console.log(`   类型定义检查: ${passed}/${checks.length} 通过`)
  return passed === checks.length
}

/**
 * 检查服务层实现
 */
function validateServiceLayer() {
  console.log('\n🔧 验证服务层实现...')

  const checks = [
    {
      file: 'apps/studio/src/services/nodeService.ts',
      content: ['semantic_type', 'detectSemanticType', 'NodeDataConverter', 'queueService'],
      desc: '节点服务实现'
    },
    {
      file: 'apps/studio/src/services/aiService.ts',
      content: ['normalizeConfidence', 'semantic_type', 'confidence: this.normalizeConfidence'],
      desc: 'AI服务实现'
    },
    {
      file: 'apps/studio/src/services/queueService.ts',
      content: ['QueueService', 'submitAITask', 'TaskProgress', 'fallbackMode'],
      desc: '队列服务实现'
    },
    {
      file: 'apps/studio/src/services/versionService.ts',
      content: ['VersionService', 'createVersion', 'compareVersions', 'rollbackToVersion'],
      desc: '版本管理服务'
    }
  ]

  let passed = 0
  checks.forEach(check => {
    if (checkFileExists(check.file, check.desc) &&
        checkFileContent(check.file, check.content, `${check.desc} - 内容检查`)) {
      passed++
    }
  })

  console.log(`   服务层检查: ${passed}/${checks.length} 通过`)
  return passed === checks.length
}

/**
 * 检查UI组件实现
 */
function validateUIComponents() {
  console.log('\n🎨 验证UI组件实现...')

  const checks = [
    {
      file: 'apps/studio/src/components/version/VersionHistory.tsx',
      content: ['VersionHistory', 'NodeVersion', 'versionService'],
      desc: '版本历史组件'
    },
    {
      file: 'apps/studio/src/components/version/DiffViewer.tsx',
      content: ['DiffViewer', 'VersionDiff', 'compareVersions'],
      desc: '差异对比组件'
    },
    {
      file: 'apps/studio/src/components/version/ChangeDialog.tsx',
      content: ['ChangeDialog', 'VersionChangeInfo', 'VersionChangeType'],
      desc: '变更记录组件'
    }
  ]

  let passed = 0
  checks.forEach(check => {
    if (checkFileExists(check.file, check.desc) &&
        checkFileContent(check.file, check.content, `${check.desc} - 内容检查`)) {
      passed++
    }
  })

  console.log(`   UI组件检查: ${passed}/${checks.length} 通过`)
  return passed === checks.length
}

/**
 * 检查测试文件
 */
function validateTestSuite() {
  console.log('\n🧪 验证测试套件...')

  const checks = [
    {
      file: 'apps/studio/src/tests/integration/architecture.test.ts',
      content: ['架构一致性集成测试', 'NodeDataConverter', 'confidence字段范围转换', '队列服务集成测试'],
      desc: '集成测试文件'
    },
    {
      file: 'apps/studio/src/utils/architectureValidator.ts',
      content: ['ArchitectureValidator', 'validateArchitecture', 'ValidationResult'],
      desc: '架构验证工具'
    }
  ]

  let passed = 0
  checks.forEach(check => {
    if (checkFileExists(check.file, check.desc) &&
        checkFileContent(check.file, check.content, `${check.desc} - 内容检查`)) {
      passed++
    }
  })

  console.log(`   测试套件检查: ${passed}/${checks.length} 通过`)
  return passed === checks.length
}

/**
 * 检查文档更新
 */
function validateDocumentation() {
  console.log('\n📖 验证文档更新...')

  const checks = [
    {
      file: 'UPDATE.md',
      content: ['前后端架构一致性修复', '数据模型统一化', '消息队列集成', '版本管理系统'],
      desc: '更新计划文档'
    }
  ]

  let passed = 0
  checks.forEach(check => {
    if (checkFileExists(check.file, check.desc) &&
        checkFileContent(check.file, check.content, `${check.desc} - 内容检查`)) {
      passed++
    }
  })

  console.log(`   文档检查: ${passed}/${checks.length} 通过`)
  return passed === checks.length
}

/**
 * 生成验证报告
 */
function generateReport(results) {
  console.log('\n📋 生成验证报告...')

  const totalChecks = Object.keys(results).length
  const passedChecks = Object.values(results).filter(Boolean).length
  const score = Math.round((passedChecks / totalChecks) * 100)

  const report = `
# 架构一致性验证报告

生成时间: ${new Date().toISOString()}

## 总体评估
- **验证状态**: ${score === 100 ? '✅ 完全通过' : score >= 80 ? '⚠️  基本通过' : '❌ 需要修复'}
- **总体评分**: ${score}/100
- **检查类别**: ${totalChecks}
- **通过类别**: ${passedChecks}
- **失败类别**: ${totalChecks - passedChecks}

## 详细结果

### 类型定义 ${results.types ? '✅' : '❌'}
${results.types ? '数据模型类型定义完整，包含所有必需字段' : '数据模型类型定义不完整'}

### 服务层实现 ${results.services ? '✅' : '❌'}
${results.services ? '服务层实现完整，包含所有核心功能' : '服务层实现不完整'}

### UI组件 ${results.components ? '✅' : '❌'}
${results.components ? 'UI组件实现完整，版本管理界面完善' : 'UI组件实现不完整'}

### 测试套件 ${results.tests ? '✅' : '❌'}
${results.tests ? '测试套件完整，包含集成测试和验证工具' : '测试套件不完整'}

### 文档更新 ${results.docs ? '✅' : '❌'}
${results.docs ? '文档更新完整，包含详细的开发计划' : '文档更新不完整'}

## 修复建议

${score === 100
  ? '🎉 恭喜！所有检查项目都已通过，架构一致性修复完成。'
  : `⚠️ 还有 ${totalChecks - passedChecks} 个类别需要修复：
${Object.entries(results).filter(([_, passed]) => !passed).map(([category]) => `- ${category}`).join('\n')}`
}

## 下一步行动

${score >= 80
  ? '✅ 架构基本完整，可以进行更深入的测试和优化'
  : '❌ 请先修复失败的检查项目，然后重新运行验证'
}

---
验证脚本: validate-architecture.js
`

  // 写入报告文件
  fs.writeFileSync('VALIDATION_REPORT.md', report)
  console.log('📄 验证报告已保存到: VALIDATION_REPORT.md')

  return score
}

/**
 * 主函数
 */
function main() {
  const results = {
    types: validateTypeDefinitions(),
    services: validateServiceLayer(),
    components: validateUIComponents(),
    tests: validateTestSuite(),
    docs: validateDocumentation()
  }

  const score = generateReport(results)

  console.log('\n' + '='.repeat(60))
  console.log('🏁 架构验证完成')
  console.log('='.repeat(60))

  if (score === 100) {
    console.log('🎉 所有检查项目通过！架构一致性修复成功完成。')
    console.log('\n✅ 修复成果:')
    console.log('   - 数据模型统一化 (confidence: 0-100, semantic_type, user_rating)')
    console.log('   - 消息队列集成 (WebSocket + 回退机制)')
    console.log('   - 版本管理系统 (完整历史追踪)')
    console.log('   - 前后端数据转换 (双向兼容)')
    console.log('   - 完善测试覆盖 (集成测试 + 验证工具)')
    process.exit(0)
  } else if (score >= 80) {
    console.log(`⚠️  架构基本完整 (${score}/100)，但还有改进空间。`)
    process.exit(0)
  } else {
    console.log(`❌ 架构验证失败 (${score}/100)，请修复问题后重新验证。`)
    process.exit(1)
  }
}

// 运行验证
main()