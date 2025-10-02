/**
 * 协议消息验证器
 *
 * 提供统一的消息验证接口，集成 Zod schema 验证
 */

import type { ZodSchema } from 'zod'
import { type Result, ok, err } from './result.js'
import {
  ValidationError,
  SchemaValidationError,
  fromZodError
} from './errors.js'

// ============================================================================
// 验证器配置
// ============================================================================

export interface ValidatorConfig {
  /**
   * 是否启用严格模式（不允许未知字段）
   */
  strict?: boolean

  /**
   * 是否记录验证日志
   */
  logValidation?: boolean

  /**
   * 自定义错误处理器
   */
  onError?: (error: ValidationError) => void
}

// ============================================================================
// 协议验证器类
// ============================================================================

/**
 * 协议验证器
 *
 * 使用 Zod schema 进行运行时验证，返回 Result 类型
 */
export class ProtocolValidator {
  private config: ValidatorConfig

  constructor(config: ValidatorConfig = {}) {
    this.config = {
      strict: true,
      logValidation: false,
      ...config
    }
  }

  /**
   * 验证消息
   *
   * @param schema - Zod schema
   * @param data - 待验证数据
   * @param context - 验证上下文（用于错误消息）
   * @returns Result<T, SchemaValidationError>
   */
  validate<T>(
    schema: ZodSchema<T>,
    data: unknown,
    context?: string
  ): Result<T, SchemaValidationError> {
    if (this.config.logValidation) {
      console.log(`[Validator] Validating ${context || 'data'}:`, data)
    }

    const result = schema.safeParse(data)

    if (result.success) {
      if (this.config.logValidation) {
        console.log(`[Validator] Validation succeeded for ${context || 'data'}`)
      }
      return ok(result.data)
    }

    const error = fromZodError(result.error, context ? [context] : undefined)

    if (this.config.onError) {
      this.config.onError(error)
    }

    if (this.config.logValidation) {
      console.error(`[Validator] Validation failed for ${context || 'data'}:`, error.getFormattedMessage())
    }

    return err(error)
  }

  /**
   * 异步验证消息
   *
   * @param schema - Zod schema
   * @param data - 待验证数据
   * @param context - 验证上下文
   * @returns Promise<Result<T, SchemaValidationError>>
   */
  async validateAsync<T>(
    schema: ZodSchema<T>,
    data: unknown,
    context?: string
  ): Promise<Result<T, SchemaValidationError>> {
    return this.validate(schema, data, context)
  }

  /**
   * 批量验证
   *
   * @param schema - Zod schema
   * @param dataArray - 待验证数据数组
   * @param context - 验证上下文
   * @returns Result<T[], SchemaValidationError> - 全部成功或第一个失败
   */
  validateBatch<T>(
    schema: ZodSchema<T>,
    dataArray: unknown[],
    context?: string
  ): Result<T[], SchemaValidationError> {
    const results: T[] = []

    for (let i = 0; i < dataArray.length; i++) {
      const result = this.validate(schema, dataArray[i], `${context}[${i}]`)

      if (result.success) {
        results.push(result.value)
      } else {
        return err(result.error)
      }
    }

    return ok(results)
  }

  /**
   * 部分验证（返回所有结果）
   *
   * @param schema - Zod schema
   * @param dataArray - 待验证数据数组
   * @param context - 验证上下文
   * @returns Array<Result<T, SchemaValidationError>>
   */
  validatePartial<T>(
    schema: ZodSchema<T>,
    dataArray: unknown[],
    context?: string
  ): Array<Result<T, SchemaValidationError>> {
    return dataArray.map((data, i) =>
      this.validate(schema, data, `${context}[${i}]`)
    )
  }

  /**
   * 验证并抛出异常（用于非 Result 代码）
   *
   * @param schema - Zod schema
   * @param data - 待验证数据
   * @param context - 验证上下文
   * @throws SchemaValidationError
   */
  validateOrThrow<T>(
    schema: ZodSchema<T>,
    data: unknown,
    context?: string
  ): T {
    const result = this.validate(schema, data, context)

    if (result.success) {
      return result.value
    }

    throw result.error
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ValidatorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取配置
   */
  getConfig(): ValidatorConfig {
    return { ...this.config }
  }
}

// ============================================================================
// 默认验证器实例
// ============================================================================

/**
 * 默认协议验证器实例
 */
export const defaultValidator = new ProtocolValidator({
  strict: true,
  logValidation: false
})

/**
 * 开发环境验证器（启用日志）
 */
export const devValidator = new ProtocolValidator({
  strict: true,
  logValidation: true
})

// ============================================================================
// 便捷验证函数
// ============================================================================

/**
 * 验证数据（使用默认验证器）
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): Result<T, SchemaValidationError> {
  return defaultValidator.validate(schema, data, context)
}

/**
 * 异步验证数据（使用默认验证器）
 */
export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): Promise<Result<T, SchemaValidationError>> {
  return defaultValidator.validateAsync(schema, data, context)
}

/**
 * 批量验证（使用默认验证器）
 */
export function validateBatch<T>(
  schema: ZodSchema<T>,
  dataArray: unknown[],
  context?: string
): Result<T[], SchemaValidationError> {
  return defaultValidator.validateBatch(schema, dataArray, context)
}

/**
 * 验证并抛出异常（使用默认验证器）
 */
export function validateOrThrow<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  return defaultValidator.validateOrThrow(schema, data, context)
}

// ============================================================================
// 类型工具
// ============================================================================

/**
 * 从 Schema 提取类型
 */
export type InferSchema<S> = S extends ZodSchema<infer T> ? T : never
