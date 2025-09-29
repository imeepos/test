import type { EngineConfig } from '@/types'

/**
 * 配置验证错误
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: ConfigValidationError[]
  warnings: string[]
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  /**
   * 验证引擎配置
   */
  static validate(config: EngineConfig): ValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: string[] = []

    // 验证基本字段
    this.validateProvider(config.provider, errors)
    this.validateApiKey(config.apiKey, errors)
    this.validateModels(config.models, errors, warnings)
    this.validateDefaultModel(config.defaultModel, config.models, errors)
    this.validateTemperature(config.temperature, errors, warnings)
    this.validateMaxTokens(config.maxTokens, errors, warnings)
    this.validateTimeout(config.timeout, errors, warnings)
    this.validateRetryConfig(config.retryConfig, errors, warnings)

    // 验证可选字段
    if (config.baseURL) {
      this.validateBaseURL(config.baseURL, errors)
    }

    if (config.organization) {
      this.validateOrganization(config.organization, errors)
    }

    if (config.costOptimization) {
      this.validateCostOptimization(config.costOptimization, errors, warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证提供者
   */
  private static validateProvider(
    provider: any,
    errors: ConfigValidationError[]
  ): void {
    if (!provider) {
      errors.push(new ConfigValidationError(
        'provider 字段是必需的',
        'provider',
        provider
      ))
      return
    }

    if (typeof provider !== 'string') {
      errors.push(new ConfigValidationError(
        'provider 必须是字符串',
        'provider',
        provider
      ))
      return
    }

    const validProviders = ['openai', 'anthropic', 'custom']
    if (!validProviders.includes(provider)) {
      errors.push(new ConfigValidationError(
        `provider 必须是以下之一: ${validProviders.join(', ')}`,
        'provider',
        provider
      ))
    }
  }

  /**
   * 验证API密钥
   */
  private static validateApiKey(
    apiKey: any,
    errors: ConfigValidationError[]
  ): void {
    if (!apiKey) {
      errors.push(new ConfigValidationError(
        'apiKey 字段是必需的',
        'apiKey',
        apiKey
      ))
      return
    }

    if (typeof apiKey !== 'string') {
      errors.push(new ConfigValidationError(
        'apiKey 必须是字符串',
        'apiKey',
        typeof apiKey
      ))
      return
    }

    if (apiKey.trim().length === 0) {
      errors.push(new ConfigValidationError(
        'apiKey 不能为空',
        'apiKey',
        apiKey
      ))
    }
  }

  /**
   * 验证模型配置
   */
  private static validateModels(
    models: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (!models) {
      errors.push(new ConfigValidationError(
        'models 字段是必需的',
        'models',
        models
      ))
      return
    }

    if (typeof models !== 'object' || models === null) {
      errors.push(new ConfigValidationError(
        'models 必须是对象',
        'models',
        typeof models
      ))
      return
    }

    // 验证各个模型字段
    const modelFields = ['generation', 'optimization', 'analysis', 'fusion']
    for (const field of modelFields) {
      if (models[field] && typeof models[field] !== 'string') {
        errors.push(new ConfigValidationError(
          `models.${field} 必须是字符串`,
          `models.${field}`,
          typeof models[field]
        ))
      }
    }

    // 检查是否至少配置了一个模型
    const configuredModels = modelFields.filter(field => models[field])
    if (configuredModels.length === 0) {
      warnings.push('未配置任何具体模型，将使用默认模型')
    }
  }

  /**
   * 验证默认模型
   */
  private static validateDefaultModel(
    defaultModel: any,
    models: any,
    errors: ConfigValidationError[]
  ): void {
    if (!defaultModel) {
      errors.push(new ConfigValidationError(
        'defaultModel 字段是必需的',
        'defaultModel',
        defaultModel
      ))
      return
    }

    if (typeof defaultModel !== 'string') {
      errors.push(new ConfigValidationError(
        'defaultModel 必须是字符串',
        'defaultModel',
        typeof defaultModel
      ))
      return
    }

    if (defaultModel.trim().length === 0) {
      errors.push(new ConfigValidationError(
        'defaultModel 不能为空',
        'defaultModel',
        defaultModel
      ))
    }
  }

  /**
   * 验证温度参数
   */
  private static validateTemperature(
    temperature: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (temperature === undefined || temperature === null) {
      errors.push(new ConfigValidationError(
        'temperature 字段是必需的',
        'temperature',
        temperature
      ))
      return
    }

    if (typeof temperature !== 'number') {
      errors.push(new ConfigValidationError(
        'temperature 必须是数字',
        'temperature',
        typeof temperature
      ))
      return
    }

    if (temperature < 0 || temperature > 2) {
      errors.push(new ConfigValidationError(
        'temperature 必须在 0-2 之间',
        'temperature',
        temperature
      ))
    } else if (temperature > 1.5) {
      warnings.push('temperature 值较高，可能导致输出不稳定')
    }
  }

  /**
   * 验证最大token数
   */
  private static validateMaxTokens(
    maxTokens: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (maxTokens === undefined || maxTokens === null) {
      errors.push(new ConfigValidationError(
        'maxTokens 字段是必需的',
        'maxTokens',
        maxTokens
      ))
      return
    }

    if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens)) {
      errors.push(new ConfigValidationError(
        'maxTokens 必须是整数',
        'maxTokens',
        maxTokens
      ))
      return
    }

    if (maxTokens <= 0) {
      errors.push(new ConfigValidationError(
        'maxTokens 必须大于 0',
        'maxTokens',
        maxTokens
      ))
    } else if (maxTokens > 4000) {
      warnings.push('maxTokens 值较高，请确保模型支持')
    }
  }

  /**
   * 验证超时时间
   */
  private static validateTimeout(
    timeout: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (timeout === undefined || timeout === null) {
      errors.push(new ConfigValidationError(
        'timeout 字段是必需的',
        'timeout',
        timeout
      ))
      return
    }

    if (typeof timeout !== 'number' || !Number.isInteger(timeout)) {
      errors.push(new ConfigValidationError(
        'timeout 必须是整数（毫秒）',
        'timeout',
        timeout
      ))
      return
    }

    if (timeout <= 0) {
      errors.push(new ConfigValidationError(
        'timeout 必须大于 0',
        'timeout',
        timeout
      ))
    } else if (timeout < 10000) {
      warnings.push('timeout 值较小，可能导致请求超时')
    } else if (timeout > 300000) {
      warnings.push('timeout 值较大，可能影响用户体验')
    }
  }

  /**
   * 验证重试配置
   */
  private static validateRetryConfig(
    retryConfig: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (!retryConfig) {
      errors.push(new ConfigValidationError(
        'retryConfig 字段是必需的',
        'retryConfig',
        retryConfig
      ))
      return
    }

    if (typeof retryConfig !== 'object' || retryConfig === null) {
      errors.push(new ConfigValidationError(
        'retryConfig 必须是对象',
        'retryConfig',
        typeof retryConfig
      ))
      return
    }

    // 验证 maxRetries
    if (typeof retryConfig.maxRetries !== 'number' || !Number.isInteger(retryConfig.maxRetries)) {
      errors.push(new ConfigValidationError(
        'retryConfig.maxRetries 必须是整数',
        'retryConfig.maxRetries',
        retryConfig.maxRetries
      ))
    } else if (retryConfig.maxRetries < 0) {
      errors.push(new ConfigValidationError(
        'retryConfig.maxRetries 必须大于等于 0',
        'retryConfig.maxRetries',
        retryConfig.maxRetries
      ))
    } else if (retryConfig.maxRetries > 5) {
      warnings.push('重试次数较多，可能导致响应延迟')
    }

    // 验证 backoffMultiplier
    if (typeof retryConfig.backoffMultiplier !== 'number') {
      errors.push(new ConfigValidationError(
        'retryConfig.backoffMultiplier 必须是数字',
        'retryConfig.backoffMultiplier',
        retryConfig.backoffMultiplier
      ))
    } else if (retryConfig.backoffMultiplier <= 0) {
      errors.push(new ConfigValidationError(
        'retryConfig.backoffMultiplier 必须大于 0',
        'retryConfig.backoffMultiplier',
        retryConfig.backoffMultiplier
      ))
    }

    // 验证 retryableErrors
    if (!Array.isArray(retryConfig.retryableErrors)) {
      errors.push(new ConfigValidationError(
        'retryConfig.retryableErrors 必须是数组',
        'retryConfig.retryableErrors',
        retryConfig.retryableErrors
      ))
    }
  }

  /**
   * 验证基础URL
   */
  private static validateBaseURL(
    baseURL: any,
    errors: ConfigValidationError[]
  ): void {
    if (typeof baseURL !== 'string') {
      errors.push(new ConfigValidationError(
        'baseURL 必须是字符串',
        'baseURL',
        typeof baseURL
      ))
      return
    }

    try {
      new URL(baseURL)
    } catch {
      errors.push(new ConfigValidationError(
        'baseURL 必须是有效的URL',
        'baseURL',
        baseURL
      ))
    }
  }

  /**
   * 验证组织ID
   */
  private static validateOrganization(
    organization: any,
    errors: ConfigValidationError[]
  ): void {
    if (typeof organization !== 'string') {
      errors.push(new ConfigValidationError(
        'organization 必须是字符串',
        'organization',
        typeof organization
      ))
      return
    }

    if (organization.trim().length === 0) {
      errors.push(new ConfigValidationError(
        'organization 不能为空',
        'organization',
        organization
      ))
    }
  }

  /**
   * 验证成本优化配置
   */
  private static validateCostOptimization(
    costOptimization: any,
    errors: ConfigValidationError[],
    warnings: string[]
  ): void {
    if (typeof costOptimization !== 'object' || costOptimization === null) {
      errors.push(new ConfigValidationError(
        'costOptimization 必须是对象',
        'costOptimization',
        typeof costOptimization
      ))
      return
    }

    // 验证 enabled
    if (typeof costOptimization.enabled !== 'boolean') {
      errors.push(new ConfigValidationError(
        'costOptimization.enabled 必须是布尔值',
        'costOptimization.enabled',
        costOptimization.enabled
      ))
    }

    // 验证 maxCostPerRequest
    if (typeof costOptimization.maxCostPerRequest !== 'number') {
      errors.push(new ConfigValidationError(
        'costOptimization.maxCostPerRequest 必须是数字',
        'costOptimization.maxCostPerRequest',
        costOptimization.maxCostPerRequest
      ))
    } else if (costOptimization.maxCostPerRequest <= 0) {
      errors.push(new ConfigValidationError(
        'costOptimization.maxCostPerRequest 必须大于 0',
        'costOptimization.maxCostPerRequest',
        costOptimization.maxCostPerRequest
      ))
    }

    // 验证 preferredModels
    if (!Array.isArray(costOptimization.preferredModels)) {
      errors.push(new ConfigValidationError(
        'costOptimization.preferredModels 必须是数组',
        'costOptimization.preferredModels',
        costOptimization.preferredModels
      ))
    } else {
      for (const model of costOptimization.preferredModels) {
        if (typeof model !== 'string') {
          errors.push(new ConfigValidationError(
            'costOptimization.preferredModels 中的所有元素必须是字符串',
            'costOptimization.preferredModels',
            model
          ))
        }
      }
    }
  }
}

/**
 * 验证配置的快捷函数
 */
export function validateConfig(config: EngineConfig): ValidationResult {
  return ConfigValidator.validate(config)
}

/**
 * 检查配置是否有效
 */
export function isValidConfig(config: EngineConfig): boolean {
  return ConfigValidator.validate(config).valid
}

/**
 * 获取配置错误信息
 */
export function getConfigErrors(config: EngineConfig): string[] {
  const result = ConfigValidator.validate(config)
  return result.errors.map(error => `${error.field}: ${error.message}`)
}

/**
 * 获取配置警告信息
 */
export function getConfigWarnings(config: EngineConfig): string[] {
  const result = ConfigValidator.validate(config)
  return result.warnings
}