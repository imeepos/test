import type { EngineConfig } from '@/types'
import { AIEngine } from '@/core/AIEngine'
import { PromptTemplate } from '@/core/PromptTemplate'
import { validateConfig } from '@/utils/ConfigValidator'

/**
 * 引擎创建选项
 */
export interface CreateEngineOptions extends Partial<EngineConfig> {
  // 必需字段
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  defaultModel: string

  // 预设模板
  includeDefaultTemplates?: boolean
  customTemplates?: PromptTemplate[]
}

/**
 * 引擎工厂类
 * 提供便利的引擎创建和配置方法
 */
export class EngineFactory {
  /**
   * 创建AI引擎实例
   */
  static async create(options: CreateEngineOptions): Promise<AIEngine> {
    // 构建完整配置
    const config = this.buildConfig(options)

    // 验证配置
    const validation = validateConfig(config)
    if (!validation.valid) {
      const errors = validation.errors.map(e => e.message).join('; ')
      throw new Error(`配置验证失败: ${errors}`)
    }

    // 创建引擎实例
    const engine = new AIEngine(config)

    // 添加默认模板
    if (options.includeDefaultTemplates !== false) {
      this.addDefaultTemplates(engine)
    }

    // 添加自定义模板
    if (options.customTemplates) {
      options.customTemplates.forEach(template => {
        engine.addTemplate(template)
      })
    }

    return engine
  }

  /**
   * 创建开发环境配置
   */
  static createDevelopmentConfig(apiKey: string, model: string = 'gpt-3.5-turbo'): EngineConfig {
    return {
      provider: 'openai',
      apiKey,
      models: {
        generation: model,
        optimization: model,
        analysis: model,
        fusion: model
      },
      defaultModel: model,
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 60000,
      retryConfig: {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        retryableErrors: ['rate_limit_exceeded', 'timeout', 'server_error']
      },
      costOptimization: {
        enabled: true,
        maxCostPerRequest: 0.1,
        preferredModels: ['gpt-3.5-turbo']
      }
    }
  }

  /**
   * 创建生产环境配置
   */
  static createProductionConfig(apiKey: string): EngineConfig {
    return {
      provider: 'openai',
      apiKey,
      models: {
        generation: 'gpt-4',
        optimization: 'gpt-3.5-turbo',
        analysis: 'gpt-4',
        fusion: 'gpt-4'
      },
      defaultModel: 'gpt-4',
      temperature: 0.5,
      maxTokens: 4000,
      timeout: 120000,
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        retryableErrors: ['rate_limit_exceeded', 'timeout', 'server_error', 'network_error']
      },
      costOptimization: {
        enabled: true,
        maxCostPerRequest: 0.5,
        preferredModels: ['gpt-4', 'gpt-3.5-turbo']
      }
    }
  }

  /**
   * 创建高性能配置
   */
  static createHighPerformanceConfig(apiKey: string): EngineConfig {
    return {
      provider: 'openai',
      apiKey,
      models: {
        generation: 'gpt-4-turbo',
        optimization: 'gpt-4-turbo',
        analysis: 'gpt-4-turbo',
        fusion: 'gpt-4-turbo'
      },
      defaultModel: 'gpt-4-turbo',
      temperature: 0.6,
      maxTokens: 8000,
      timeout: 180000,
      retryConfig: {
        maxRetries: 5,
        backoffMultiplier: 2.5,
        retryableErrors: ['rate_limit_exceeded', 'timeout', 'server_error', 'network_error']
      },
      costOptimization: {
        enabled: false, // 高性能模式不限制成本
        maxCostPerRequest: 2.0,
        preferredModels: ['gpt-4-turbo', 'gpt-4']
      }
    }
  }

  /**
   * 创建低成本配置
   */
  static createLowCostConfig(apiKey: string): EngineConfig {
    return {
      provider: 'openai',
      apiKey,
      models: {
        generation: 'gpt-3.5-turbo',
        optimization: 'gpt-3.5-turbo',
        analysis: 'gpt-3.5-turbo',
        fusion: 'gpt-3.5-turbo'
      },
      defaultModel: 'gpt-3.5-turbo',
      temperature: 0.8,
      maxTokens: 1500,
      timeout: 45000,
      retryConfig: {
        maxRetries: 1,
        backoffMultiplier: 1.2,
        retryableErrors: ['rate_limit_exceeded']
      },
      costOptimization: {
        enabled: true,
        maxCostPerRequest: 0.05,
        preferredModels: ['gpt-3.5-turbo']
      }
    }
  }

  /**
   * 从环境变量创建配置
   */
  static createFromEnvironment(): EngineConfig {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('环境变量 OPENAI_API_KEY 未设置')
    }

    const environment = process.env.NODE_ENV || 'development'
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'

    const baseConfig = {
      provider: 'openai' as const,
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
      organization: process.env.OPENAI_ORGANIZATION,
      defaultModel: model,
      temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
      maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 2000,
      timeout: Number(process.env.OPENAI_TIMEOUT) || 60000
    }

    // 根据环境选择不同的配置策略
    switch (environment) {
      case 'production':
        return { ...this.createProductionConfig(apiKey), ...baseConfig }
      case 'test':
        return { ...this.createLowCostConfig(apiKey), ...baseConfig, timeout: 30000 }
      default:
        return { ...this.createDevelopmentConfig(apiKey, model), ...baseConfig }
    }
  }

  /**
   * 构建完整配置
   */
  private static buildConfig(options: CreateEngineOptions): EngineConfig {
    return {
      provider: options.provider,
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      organization: options.organization,
      models: options.models || {
        generation: options.defaultModel,
        optimization: options.defaultModel,
        analysis: options.defaultModel,
        fusion: options.defaultModel
      },
      defaultModel: options.defaultModel,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
      timeout: options.timeout ?? 60000,
      retryConfig: options.retryConfig || {
        maxRetries: 3,
        backoffMultiplier: 2,
        retryableErrors: ['rate_limit_exceeded', 'timeout', 'server_error']
      },
      costOptimization: options.costOptimization
    }
  }

  /**
   * 添加默认模板
   */
  private static addDefaultTemplates(engine: AIEngine): void {
    const templates = this.createDefaultTemplates()
    templates.forEach(template => {
      engine.addTemplate(template)
    })
  }

  /**
   * 创建默认模板集合
   */
  private static createDefaultTemplates(): PromptTemplate[] {
    return [
      // 商业分析模板
      new PromptTemplate({
        name: 'business_analysis',
        description: '商业分析报告生成模板',
        category: 'business',
        template: `
作为专业的商业分析师，请基于以下信息进行分析：

输入内容：
{inputs}

上下文：
{context}

分析指导：
{instruction}

请从以下角度进行分析：
1. 市场机会与挑战
2. 技术可行性评估
3. 资源需求分析
4. 风险评估与应对
5. 投资回报预期

请提供结构化的分析报告，确保逻辑清晰、数据支撑充分。
        `.trim(),
        variables: ['inputs', 'context', 'instruction']
      }),

      // 技术文档模板
      new PromptTemplate({
        name: 'technical_documentation',
        description: '技术文档生成模板',
        category: 'technical',
        template: `
请基于以下技术信息生成专业的技术文档：

技术内容：
{inputs}

文档类型：{docType}
目标受众：{audience}

请包含以下部分：
1. 概述与目标
2. 技术架构
3. 实现细节
4. 使用说明
5. 最佳实践
6. 常见问题

确保文档结构清晰、易于理解和维护。
        `.trim(),
        variables: ['inputs', 'docType', 'audience']
      }),

      // 内容优化模板
      new PromptTemplate({
        name: 'content_optimization',
        description: '内容优化专用模板',
        category: 'optimization',
        template: `
请优化以下内容，提升其质量和效果：

原始内容：
{inputs}

优化目标：
{instruction}

优化要求：
- 提高可读性和吸引力
- 确保逻辑清晰连贯
- 保持核心信息不变
- 适应目标受众需求

请提供优化后的内容及改进说明。
        `.trim(),
        variables: ['inputs', 'instruction']
      }),

      // 创意写作模板
      new PromptTemplate({
        name: 'creative_writing',
        description: '创意内容生成模板',
        category: 'creative',
        template: `
请基于以下元素创作内容：

创作素材：
{inputs}

创作风格：{style}
内容长度：{length}
特殊要求：{requirements}

创作要求：
1. 保持原创性和独特性
2. 符合指定风格和长度
3. 内容生动有趣，引人入胜
4. 结构完整，逻辑清晰

请发挥创意，提供高质量的原创内容。
        `.trim(),
        variables: ['inputs', 'style', 'length', 'requirements']
      }),

      // 数据分析模板
      new PromptTemplate({
        name: 'data_analysis',
        description: '数据分析报告模板',
        category: 'analysis',
        template: `
请对以下数据进行专业分析：

数据内容：
{inputs}

分析维度：
{dimensions}

请提供：
1. 数据概览与趋势
2. 关键指标分析
3. 异常情况识别
4. 相关性分析
5. 结论与建议

确保分析客观准确，结论有数据支撑。
        `.trim(),
        variables: ['inputs', 'dimensions']
      })
    ]
  }
}

/**
 * 便利函数：创建引擎实例
 */
export async function createEngine(options: CreateEngineOptions): Promise<AIEngine> {
  return EngineFactory.create(options)
}

/**
 * 便利函数：从环境变量创建引擎
 */
export async function createEngineFromEnv(): Promise<AIEngine> {
  const config = EngineFactory.createFromEnvironment()
  return new AIEngine(config)
}

/**
 * 便利函数：创建开发环境引擎
 */
export async function createDevelopmentEngine(apiKey: string, model?: string): Promise<AIEngine> {
  return EngineFactory.create({
    ...EngineFactory.createDevelopmentConfig(apiKey, model),
    includeDefaultTemplates: true
  })
}

/**
 * 便利函数：创建生产环境引擎
 */
export async function createProductionEngine(apiKey: string): Promise<AIEngine> {
  return EngineFactory.create({
    ...EngineFactory.createProductionConfig(apiKey),
    includeDefaultTemplates: true
  })
}