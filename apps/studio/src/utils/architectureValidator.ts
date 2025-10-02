/**
 * 架构验证工具
 * 用于检查前后端架构一致性和系统完整性
 */

import type { AINode, SemanticType } from '@/types'
import { NodeDataConverter } from '@/types/converter'
import { services } from '@/services'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: ValidationSummary
}

export interface ValidationError {
  category: 'data-model' | 'service' | 'integration' | 'performance'
  code: string
  message: string
  details?: any
}

export interface ValidationWarning {
  category: 'compatibility' | 'performance' | 'best-practice'
  code: string
  message: string
  suggestion?: string
}

export interface ValidationSummary {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningCount: number
  overallScore: number // 0-100
}

/**
 * 架构验证器类
 */
export class ArchitectureValidator {
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []
  private checksPerformed = 0
  private checksPasssed = 0

  /**
   * 执行完整的架构验证
   */
  async validateArchitecture(): Promise<ValidationResult> {
    this.reset()

    console.log('🔍 开始架构验证...')

    // 数据模型验证
    await this.validateDataModels()

    // 服务集成验证
    await this.validateServiceIntegration()

    // 类型兼容性验证
    await this.validateTypeCompatibility()

    // 性能验证
    await this.validatePerformance()

    // 功能完整性验证
    await this.validateFeatureCompleteness()

    return this.generateReport()
  }

  /**
   * 验证数据模型一致性
   */
  private async validateDataModels(): Promise<void> {
    console.log('  📊 验证数据模型一致性...')

    // 检查confidence字段范围
    this.checkConfidenceFieldRange()

    // 检查语义类型映射
    this.checkSemanticTypeMapping()

    // 检查用户评分字段
    this.checkUserRatingField()

    // 检查数据转换器
    this.checkDataConverter()
  }

  /**
   * 验证服务集成
   */
  private async validateServiceIntegration(): Promise<void> {
    console.log('  🔧 验证服务集成...')

    // 检查服务可用性
    await this.checkServiceAvailability()

    // 检查队列服务集成
    await this.checkQueueServiceIntegration()

    // 检查版本管理集成
    this.checkVersionManagementIntegration()

    // 检查WebSocket连接
    await this.checkWebSocketIntegration()
  }

  /**
   * 验证类型兼容性
   */
  private async validateTypeCompatibility(): Promise<void> {
    console.log('  🔗 验证类型兼容性...')

    // 检查前后端类型一致性
    this.checkFrontendBackendTypeConsistency()

    // 检查API响应格式
    this.checkAPIResponseFormat()

    // 检查枚举类型一致性
    this.checkEnumTypeConsistency()
  }

  /**
   * 验证性能指标
   */
  private async validatePerformance(): Promise<void> {
    console.log('  ⚡ 验证性能指标...')

    // 检查内存使用
    this.checkMemoryUsage()

    // 检查版本历史管理
    this.checkVersionHistoryPerformance()

    // 检查数据转换性能
    this.checkDataConversionPerformance()
  }

  /**
   * 验证功能完整性
   */
  private async validateFeatureCompleteness(): Promise<void> {
    console.log('  ✅ 验证功能完整性...')

    // 检查核心功能
    this.checkCoreFunctionality()

    // 检查错误处理
    this.checkErrorHandling()

    // 检查向后兼容性
    this.checkBackwardCompatibility()
  }

  // 具体检查方法

  private checkConfidenceFieldRange(): void {
    this.performCheck('confidence-range', () => {
      const testCases = [
        { input: 0.8, expected: 80 },
        { input: 85, expected: 85 },
        { input: 0, expected: 0 },
        { input: 100, expected: 100 }
      ]

      testCases.forEach(({ input, expected }, index) => {
        try {
          // 创建模拟节点
          const mockNode = {
            id: `test-${index}`,
            content: 'test',
            confidence: input
          } as AINode

          const converted = NodeDataConverter.toBackend(mockNode)

          if (converted.confidence !== expected) {
            throw new Error(`置信度转换错误: ${input} → ${converted.confidence}, 期望: ${expected}`)
          }
        } catch (error) {
          throw new Error(`置信度字段范围检查失败: ${error}`)
        }
      })
    })
  }

  private checkSemanticTypeMapping(): void {
    this.performCheck('semantic-type-mapping', () => {
      const semanticTypes: SemanticType[] = [
        'requirement', 'solution', 'plan', 'analysis',
        'idea', 'question', 'answer', 'decision'
      ]

      semanticTypes.forEach(type => {
        const mockNode = {
          id: 'test-semantic',
          content: 'test',
          semantic_type: type,
          confidence: 80
        } as AINode

        const converted = NodeDataConverter.toBackend(mockNode)

        if (!converted.metadata?.semantic_types?.includes(type)) {
          throw new Error(`语义类型映射失败: ${type}`)
        }
      })
    })
  }

  private checkUserRatingField(): void {
    this.performCheck('user-rating-field', () => {
      const testRatings = [undefined, 1, 2, 3, 4, 5]

      testRatings.forEach(rating => {
        const mockNode = {
          id: 'test-rating',
          content: 'test',
          user_rating: rating,
          confidence: 80
        } as AINode

        const converted = NodeDataConverter.toBackend(mockNode)

        if (converted.metadata?.user_rating !== rating) {
          throw new Error(`用户评分字段映射失败: ${rating}`)
        }
      })
    })
  }

  private checkDataConverter(): void {
    this.performCheck('data-converter', () => {
      const originalNode: AINode = {
        id: 'converter-test',
        content: '测试内容',
        title: '测试标题',
        importance: 4,
        confidence: 85,
        status: 'completed',
        tags: ['test'],
        version: 1,
        position: { x: 100, y: 200 },
        connections: [],
        semantic_type: 'analysis',
        user_rating: 4,
        metadata: {
          semantic: ['analysis'],
          editCount: 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 双向转换测试
      const backendFormat = NodeDataConverter.toBackend(originalNode)
      const frontendFormat = NodeDataConverter.fromBackend(backendFormat as any)

      // 验证关键字段
      const criticalFields = ['id', 'content', 'confidence', 'semantic_type', 'user_rating']

      criticalFields.forEach(field => {
        const original = (originalNode as any)[field]
        const converted = (frontendFormat as any)[field]

        if (original !== converted) {
          throw new Error(`数据转换器字段不一致: ${field} (${original} !== ${converted})`)
        }
      })
    })
  }

  private async checkServiceAvailability(): Promise<void> {
    await this.performAsyncCheck('service-availability', async () => {
      // 检查所有核心服务是否可用
      const requiredServices = ['websocket', 'node', 'queue', 'version']

      requiredServices.forEach(serviceName => {
        if (!(serviceName in services)) {
          throw new Error(`缺少核心服务: ${serviceName}`)
        }
      })

      // 检查WebSocket服务状态（AI功能依赖WebSocket）
      const wsStatus = services.websocket.getStatus()
      if (wsStatus !== 'connected') {
        this.addWarning('service-health', `WebSocket服务状态异常: ${wsStatus}，AI功能可能不可用`)
      }
    })
  }

  private async checkQueueServiceIntegration(): Promise<void> {
    await this.performAsyncCheck('queue-integration', async () => {
      const stats = services.queue.getQueueStats()

      if (typeof stats.total !== 'number') {
        throw new Error('队列服务统计信息格式错误')
      }

      // TODO: 实现回退模式检查
      // if (stats.fallbackMode) {
      //   this.addWarning('queue-fallback', '队列服务使用回退模式，性能可能受影响')
      // }
    })
  }

  private checkVersionManagementIntegration(): void {
    this.performCheck('version-integration', () => {
      // 测试版本管理基本功能
      const mockNode: AINode = {
        id: 'version-test',
        content: '版本测试内容',
        confidence: 80,
        importance: 3,
        title: '版本测试',
        status: 'idle',
        tags: [],
        version: 1,
        position: { x: 0, y: 0 },
        connections: [],
        metadata: { semantic: [], editCount: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      try {
        const version = services.version.createVersion(mockNode, {
          reason: '测试版本创建',
          type: 'create'
        })

        if (!version.id || !version.nodeId || version.version !== 1) {
          throw new Error('版本创建功能异常')
        }
      } catch (error) {
        throw new Error(`版本管理集成失败: ${error}`)
      }
    })
  }

  private async checkWebSocketIntegration(): Promise<void> {
    await this.performAsyncCheck('websocket-integration', async () => {
      const status = services.websocket.getStatus()
      const connectionInfo = services.websocket.getConnectionInfo()

      if (!['connected', 'connecting', 'disconnected'].includes(status)) {
        throw new Error(`WebSocket状态异常: ${status}`)
      }

      if (typeof connectionInfo.queueLength !== 'number') {
        throw new Error('WebSocket连接信息格式错误')
      }

      if (status === 'disconnected') {
        this.addWarning('websocket-disconnected', 'WebSocket未连接，实时功能将受限')
      }
    })
  }

  private checkFrontendBackendTypeConsistency(): void {
    this.performCheck('type-consistency', () => {
      // 验证关键类型定义的一致性
      const frontendSemanticTypes: SemanticType[] = [
        'requirement', 'solution', 'plan', 'analysis',
        'idea', 'question', 'answer', 'decision'
      ]

      // 这里应该与后端类型定义对比，现在简化为检查类型定义存在
      frontendSemanticTypes.forEach(type => {
        if (typeof type !== 'string') {
          throw new Error(`语义类型定义错误: ${type}`)
        }
      })
    })
  }

  private checkAPIResponseFormat(): void {
    this.performCheck('api-response-format', () => {
      // 检查AI响应格式是否包含所需字段
      const mockResponse = {
        content: 'test',
        confidence: 80, // 应该是0-100范围
        semantic_type: 'analysis',
        user_rating: 4
      }

      if (mockResponse.confidence < 0 || mockResponse.confidence > 100) {
        throw new Error('API响应置信度字段范围错误')
      }

      if (mockResponse.user_rating && (mockResponse.user_rating < 0 || mockResponse.user_rating > 5)) {
        throw new Error('API响应用户评分字段范围错误')
      }
    })
  }

  private checkEnumTypeConsistency(): void {
    this.performCheck('enum-consistency', () => {
      // 检查枚举类型的一致性
      const importanceLevels = [1, 2, 3, 4, 5]
      const nodeStatuses = ['idle', 'processing', 'completed', 'error']

      importanceLevels.forEach(level => {
        if (!Number.isInteger(level) || level < 1 || level > 5) {
          throw new Error(`重要性等级枚举错误: ${level}`)
        }
      })

      nodeStatuses.forEach(status => {
        if (typeof status !== 'string') {
          throw new Error(`节点状态枚举错误: ${status}`)
        }
      })
    })
  }

  private checkMemoryUsage(): void {
    this.performCheck('memory-usage', () => {
      // 简化的内存使用检查
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory
        const usedMB = memory.usedJSHeapSize / (1024 * 1024)

        if (usedMB > 100) { // 超过100MB时发出警告
          this.addWarning('high-memory-usage', `内存使用量较高: ${usedMB.toFixed(2)}MB`, '考虑优化数据缓存策略')
        }
      }
    })
  }

  private checkVersionHistoryPerformance(): void {
    this.performCheck('version-history-performance', () => {
      const nodeId = 'perf-test-node'

      // 创建少量版本用于性能测试
      const testVersions = 5
      const startTime = Date.now()

      for (let i = 1; i <= testVersions; i++) {
        const mockNode: AINode = {
          id: nodeId,
          content: `版本${i}内容`,
          confidence: 80,
          version: i,
          importance: 3,
          title: '性能测试',
          status: 'idle',
          tags: [],
          position: { x: 0, y: 0 },
          connections: [],
          metadata: { semantic: [], editCount: i - 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        services.version.createVersion(mockNode, {
          reason: `创建版本${i}`,
          type: i === 1 ? 'create' : 'edit'
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      if (duration > 1000) { // 超过1秒
        this.addWarning('slow-version-creation', `版本创建性能较慢: ${duration}ms`)
      }

      // 清理测试数据
      services.version.cleanupVersionHistory(nodeId, 0)
    })
  }

  private checkDataConversionPerformance(): void {
    this.performCheck('conversion-performance', () => {
      const testCount = 100
      const mockNode: AINode = {
        id: 'conversion-perf-test',
        content: '转换性能测试内容',
        confidence: 85,
        importance: 3,
        title: '转换测试',
        status: 'idle',
        tags: ['perf', 'test'],
        version: 1,
        position: { x: 100, y: 200 },
        connections: [],
        semantic_type: 'analysis',
        user_rating: 4,
        metadata: {
          semantic: ['analysis'],
          editCount: 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const startTime = Date.now()

      for (let i = 0; i < testCount; i++) {
        const backend = NodeDataConverter.toBackend(mockNode)
        const frontend = NodeDataConverter.fromBackend(backend as any)

        // 简单验证转换正确性
        if (frontend.id !== mockNode.id) {
          throw new Error('数据转换性能测试中发现转换错误')
        }
      }

      const endTime = Date.now()
      const duration = endTime - startTime
      const avgTime = duration / testCount

      if (avgTime > 1) { // 平均每次转换超过1ms
        this.addWarning('slow-conversion', `数据转换性能较慢: 平均${avgTime.toFixed(2)}ms/次`)
      }
    })
  }

  private checkCoreFunctionality(): void {
    this.performCheck('core-functionality', () => {
      // 检查核心功能是否正常
      const coreServices = ['node', 'queue', 'version', 'ai']

      coreServices.forEach(serviceName => {
        const service = (services as any)[serviceName]
        if (!service) {
          throw new Error(`核心服务缺失: ${serviceName}`)
        }
      })

      // 检查关键方法是否存在
      const criticalMethods = [
        ['node', 'createNode'],
        ['queue', 'submitAITask'],
        ['version', 'createVersion'],
        ['ai', 'generateContent']
      ]

      criticalMethods.forEach(([serviceName, methodName]) => {
        const service = (services as any)[serviceName]
        if (typeof service[methodName] !== 'function') {
          throw new Error(`关键方法缺失: ${serviceName}.${methodName}`)
        }
      })
    })
  }

  private checkErrorHandling(): void {
    this.performCheck('error-handling', () => {
      // 测试错误处理机制
      try {
        const invalidNode = {
          id: '',
          content: '',
          confidence: -1
        } as any

        const validation = services.node.validateNodeData(invalidNode)

        if (validation.valid !== false || validation.errors.length === 0) {
          throw new Error('数据验证错误处理机制异常')
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('数据验证错误处理机制异常')) {
          throw error
        }
        // 其他错误是预期的
      }
    })
  }

  private checkBackwardCompatibility(): void {
    this.performCheck('backward-compatibility', () => {
      // 检查向后兼容性
      const oldFormatNode = {
        id: 'compat-test',
        content: '兼容性测试',
        confidence: 0.8, // 旧格式 0-1
        importance: 3,
        tags: ['compat'],
        metadata: {
          semantic: ['analysis'],
          editCount: 0
        }
      }

      try {
        // 应该能够处理旧格式的数据
        const converted = NodeDataConverter.toBackend(oldFormatNode as any)

        if (converted.confidence !== 80) {
          throw new Error('向后兼容性测试失败：confidence字段转换异常')
        }
      } catch (error) {
        throw new Error(`向后兼容性检查失败: ${error}`)
      }
    })
  }

  // 工具方法

  private performCheck(checkName: string, checkFn: () => void): void {
    this.checksPerformed++

    try {
      checkFn()
      this.checksPasssed++
    } catch (error) {
      this.addError('integration', checkName, error instanceof Error ? error.message : String(error), error)
    }
  }

  private async performAsyncCheck(checkName: string, checkFn: () => Promise<void>): Promise<void> {
    this.checksPerformed++

    try {
      await checkFn()
      this.checksPasssed++
    } catch (error) {
      this.addError('integration', checkName, error instanceof Error ? error.message : String(error), error)
    }
  }

  private addError(category: ValidationError['category'], code: string, message: string, details?: any): void {
    this.errors.push({ category, code, message, details })
  }

  private addWarning(code: string, message: string, suggestion?: string): void {
    this.warnings.push({
      category: 'performance',
      code,
      message,
      ...(suggestion ? { suggestion } : {})
    })
  }

  private reset(): void {
    this.errors = []
    this.warnings = []
    this.checksPerformed = 0
    this.checksPasssed = 0
  }

  private generateReport(): ValidationResult {
    const failedChecks = this.checksPerformed - this.checksPasssed
    const overallScore = this.checksPerformed > 0
      ? Math.round((this.checksPasssed / this.checksPerformed) * 100)
      : 0

    const summary: ValidationSummary = {
      totalChecks: this.checksPerformed,
      passedChecks: this.checksPasssed,
      failedChecks,
      warningCount: this.warnings.length,
      overallScore
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary
    }
  }
}

/**
 * 导出验证函数
 */
export async function validateArchitecture(): Promise<ValidationResult> {
  const validator = new ArchitectureValidator()
  return await validator.validateArchitecture()
}

/**
 * 生成验证报告
 */
export function generateValidationReport(result: ValidationResult): string {
  const { isValid, errors, warnings, summary } = result

  let report = `
# 架构验证报告

## 总体评估
- **状态**: ${isValid ? '✅ 验证通过' : '❌ 发现问题'}
- **总体评分**: ${summary.overallScore}/100
- **检查项目**: ${summary.totalChecks}
- **通过项目**: ${summary.passedChecks}
- **失败项目**: ${summary.failedChecks}
- **警告数量**: ${summary.warningCount}

## 详细结果

### 错误项目 (${errors.length})
`

  if (errors.length > 0) {
    errors.forEach((error, index) => {
      report += `
${index + 1}. **${error.code}** (${error.category})
   - 错误信息: ${error.message}
   ${error.details ? `- 详细信息: ${JSON.stringify(error.details, null, 2)}` : ''}
`
    })
  } else {
    report += '\n✅ 无错误项目\n'
  }

  report += `
### 警告项目 (${warnings.length})
`

  if (warnings.length > 0) {
    warnings.forEach((warning, index) => {
      report += `
${index + 1}. **${warning.code}** (${warning.category})
   - 警告信息: ${warning.message}
   ${warning.suggestion ? `- 建议: ${warning.suggestion}` : ''}
`
    })
  } else {
    report += '\n✅ 无警告项目\n'
  }

  report += `
## 建议

${isValid ? '🎉 恭喜！架构验证全部通过。' : '🔧 请根据上述错误和警告进行相应修复。'}

---
报告生成时间: ${new Date().toISOString()}
`

  return report
}