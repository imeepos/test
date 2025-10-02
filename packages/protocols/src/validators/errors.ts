/**
 * 验证错误类型定义
 *
 * 提供详细的验证错误信息和格式化工具
 */

import type { ZodError, ZodIssue } from 'zod'

// ============================================================================
// 基础验证错误类
// ============================================================================

/**
 * 验证错误基类
 */
export class ValidationError extends Error {
  readonly code: string
  readonly details?: unknown
  readonly path: string[] | undefined
  readonly timestamp: Date

  constructor(
    message: string,
    options?: {
      code?: string
      details?: unknown
      path?: string[]
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'ValidationError'
    this.code = options?.code || 'VALIDATION_ERROR'
    this.details = options?.details
    this.path = options?.path
    this.timestamp = new Date()

    // 保持堆栈跟踪
    if (options?.cause) {
      this.cause = options.cause
    }

    // 修复 instanceof 检查
    Object.setPrototypeOf(this, ValidationError.prototype)
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      path: this.path,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

// ============================================================================
// 特定验证错误类
// ============================================================================

/**
 * Schema 验证错误
 */
export class SchemaValidationError extends ValidationError {
  readonly zodError: ZodError | undefined
  readonly issues: ValidationIssue[]

  constructor(
    message: string,
    options: {
      zodError?: ZodError
      issues?: ValidationIssue[]
      path?: string[]
    }
  ) {
    super(message, {
      code: 'SCHEMA_VALIDATION_ERROR',
      details: options.zodError?.issues || options.issues,
      ...(options.path ? { path: options.path } : {})
    })
    this.name = 'SchemaValidationError'
    this.zodError = options.zodError
    this.issues = options.issues || (options.zodError ? formatZodIssues(options.zodError) : [])

    Object.setPrototypeOf(this, SchemaValidationError.prototype)
  }

  /**
   * 获取格式化的错误消息
   */
  getFormattedMessage(): string {
    const issueMessages = this.issues.map(issue => {
      const path = issue.path.length > 0 ? `[${issue.path.join('.')}]` : ''
      return `  ${path} ${issue.message}`
    })

    return `Schema validation failed:\n${issueMessages.join('\n')}`
  }
}

/**
 * 协议版本错误
 */
export class ProtocolVersionError extends ValidationError {
  readonly expected: string
  readonly received: string

  constructor(expected: string, received: string) {
    const details = { expected, received }
    super(
      `Protocol version mismatch: expected ${expected}, received ${received}`,
      {
        code: 'PROTOCOL_VERSION_ERROR',
        details
      }
    )
    this.name = 'ProtocolVersionError'
    this.expected = expected
    this.received = received

    Object.setPrototypeOf(this, ProtocolVersionError.prototype)
  }
}

/**
 * 类型不匹配错误
 */
export class TypeMismatchError extends ValidationError {
  readonly expected: string
  readonly received: string

  constructor(expected: string, received: string, path?: string[]) {
    super(
      `Type mismatch: expected ${expected}, received ${received}`,
      {
        code: 'TYPE_MISMATCH_ERROR',
        details: { expected, received },
        ...(path ? { path } : {})
      }
    )
    this.name = 'TypeMismatchError'
    this.expected = expected
    this.received = received

    Object.setPrototypeOf(this, TypeMismatchError.prototype)
  }
}

/**
 * 必需字段缺失错误
 */
export class RequiredFieldError extends ValidationError {
  readonly field: string

  constructor(field: string, path?: string[]) {
    super(
      `Required field missing: ${field}`,
      {
        code: 'REQUIRED_FIELD_ERROR',
        details: { field },
        ...(path ? { path } : {})
      }
    )
    this.name = 'RequiredFieldError'
    this.field = field

    Object.setPrototypeOf(this, RequiredFieldError.prototype)
  }
}

/**
 * 字段值无效错误
 */
export class InvalidFieldError extends ValidationError {
  readonly field: string
  readonly value: unknown
  readonly constraint: string

  constructor(
    field: string,
    value: unknown,
    constraint: string,
    path?: string[]
  ) {
    super(
      `Invalid field value: ${field} (${constraint})`,
      {
        code: 'INVALID_FIELD_ERROR',
        details: { field, value, constraint },
        ...(path ? { path } : {})
      }
    )
    this.name = 'InvalidFieldError'
    this.field = field
    this.value = value
    this.constraint = constraint

    Object.setPrototypeOf(this, InvalidFieldError.prototype)
  }
}

// ============================================================================
// 验证问题接口
// ============================================================================

/**
 * 验证问题
 */
export interface ValidationIssue {
  code: string
  message: string
  path: string[]
  expected?: string | undefined
  received?: string | undefined
}

// ============================================================================
// Zod 错误格式化工具
// ============================================================================

/**
 * 格式化 Zod 错误为验证问题数组
 */
export function formatZodIssues(zodError: ZodError): ValidationIssue[] {
  return zodError.issues.map(formatZodIssue)
}

/**
 * 格式化单个 Zod 问题
 */
export function formatZodIssue(issue: ZodIssue): ValidationIssue {
  return {
    code: issue.code,
    message: issue.message,
    path: issue.path.map(String),
    expected: 'expected' in issue ? String(issue.expected) : undefined,
    received: 'received' in issue ? String(issue.received) : undefined
  }
}

/**
 * 从 Zod 错误创建 SchemaValidationError
 */
export function fromZodError(zodError: ZodError, path?: string[]): SchemaValidationError {
  return new SchemaValidationError(
    'Schema validation failed',
    { zodError, ...(path ? { path } : {}) }
  )
}

// ============================================================================
// 错误工厂函数
// ============================================================================

/**
 * 创建验证错误
 */
export function createValidationError(
  message: string,
  options?: {
    code?: string
    details?: unknown
    path?: string[]
  }
): ValidationError {
  return new ValidationError(message, options)
}

/**
 * 创建协议版本错误
 */
export function createVersionError(
  expected: string,
  received: string
): ProtocolVersionError {
  return new ProtocolVersionError(expected, received)
}

/**
 * 创建类型不匹配错误
 */
export function createTypeMismatchError(
  expected: string,
  received: string,
  path?: string[]
): TypeMismatchError {
  return new TypeMismatchError(expected, received, path)
}

/**
 * 创建必需字段错误
 */
export function createRequiredFieldError(
  field: string,
  path?: string[]
): RequiredFieldError {
  return new RequiredFieldError(field, path)
}

/**
 * 创建无效字段错误
 */
export function createInvalidFieldError(
  field: string,
  value: unknown,
  constraint: string,
  path?: string[]
): InvalidFieldError {
  return new InvalidFieldError(field, value, constraint, path)
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 判断是否为验证错误
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * 判断是否为 Schema 验证错误
 */
export function isSchemaValidationError(error: unknown): error is SchemaValidationError {
  return error instanceof SchemaValidationError
}

/**
 * 判断是否为协议版本错误
 */
export function isProtocolVersionError(error: unknown): error is ProtocolVersionError {
  return error instanceof ProtocolVersionError
}
