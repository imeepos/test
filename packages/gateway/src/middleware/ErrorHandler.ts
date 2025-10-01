import { Request, Response, NextFunction } from 'express'
import type { ApiRequest, ApiError } from '../types/ApiTypes.js'

/**
 * 错误处理中间件 - 统一错误处理和响应格式化
 */
export class ErrorHandler {
  /**
   * 全局错误处理中间件
   */
  static handle() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest

      // 记录错误日志
      console.error(`[${apiReq.requestId}] Error:`, error)

      // 构建错误响应
      const apiError: ApiError = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
        details: this.getErrorDetails(error),
        timestamp: new Date(),
        requestId: apiReq.requestId
      }

      // 确定HTTP状态码
      const status = this.getStatusCode(error)

      // 发送错误响应
      res.status(status).json({
        success: false,
        error: apiError,
        timestamp: new Date(),
        requestId: apiReq.requestId
      })
    }
  }

  /**
   * 异步错误处理包装器
   */
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }

  /**
   * 404错误处理
   */
  static notFound() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest

      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
          timestamp: new Date(),
          requestId: apiReq.requestId
        }
      })
    }
  }

  /**
   * 获取错误状态码
   */
  private static getStatusCode(error: any): number {
    // 预定义的错误状态码映射
    const statusCodeMap: Record<string, number> = {
      // 客户端错误 4xx
      'VALIDATION_ERROR': 400,
      'INVALID_REQUEST': 400,
      'MISSING_PARAMETER': 400,
      'UNAUTHORIZED': 401,
      'MISSING_TOKEN': 401,
      'INVALID_TOKEN': 401,
      'TOKEN_EXPIRED': 401,
      'FORBIDDEN': 403,
      'INSUFFICIENT_PERMISSIONS': 403,
      'INSUFFICIENT_ROLE': 403,
      'NOT_FOUND': 404,
      'RESOURCE_NOT_FOUND': 404,
      'METHOD_NOT_ALLOWED': 405,
      'CONFLICT': 409,
      'DUPLICATE_RESOURCE': 409,
      'UNPROCESSABLE_ENTITY': 422,
      'RATE_LIMIT_EXCEEDED': 429,

      // 服务器错误 5xx
      'INTERNAL_ERROR': 500,
      'DATABASE_ERROR': 500,
      'AI_SERVICE_ERROR': 502,
      'EXTERNAL_SERVICE_ERROR': 502,
      'SERVICE_UNAVAILABLE': 503,
      'TIMEOUT': 504
    }

    // 如果错误对象有状态码属性
    if (error.status || error.statusCode) {
      return error.status || error.statusCode
    }

    // 根据错误代码映射
    if (error.code && statusCodeMap[error.code]) {
      return statusCodeMap[error.code]
    }

    // 特殊错误类型处理
    if (error.name === 'ValidationError') {
      return 400
    }

    if (error.name === 'UnauthorizedError') {
      return 401
    }

    if (error.name === 'ForbiddenError') {
      return 403
    }

    if (error.name === 'NotFoundError') {
      return 404
    }

    if (error.name === 'ConflictError') {
      return 409
    }

    if (error.name === 'TimeoutError') {
      return 504
    }

    // 默认为500内部服务器错误
    return 500
  }

  /**
   * 获取错误详细信息
   */
  private static getErrorDetails(error: any): any {
    const details: any = {}

    // 开发环境下包含更多错误信息
    if (process.env.NODE_ENV === 'development') {
      if (error.stack) {
        details.stack = error.stack
      }

      if (error.cause) {
        details.cause = error.cause
      }
    }

    // 验证错误的详细信息
    if (error.errors && Array.isArray(error.errors)) {
      details.validationErrors = error.errors
    }

    // 数据库错误的详细信息
    if (error.constraint) {
      details.constraint = error.constraint
    }

    if (error.table) {
      details.table = error.table
    }

    // AI服务错误的详细信息
    if (error.model) {
      details.model = error.model
    }

    if (error.prompt) {
      details.prompt = error.prompt
    }

    // 外部服务错误
    if (error.service) {
      details.service = error.service
    }

    if (error.endpoint) {
      details.endpoint = error.endpoint
    }

    return Object.keys(details).length > 0 ? details : undefined
  }

  /**
   * 创建标准化错误
   */
  static createError(
    code: string,
    message: string,
    status?: number,
    details?: any
  ): Error {
    const error = new Error(message) as any
    error.code = code
    error.status = status
    error.details = details
    return error
  }

  /**
   * 验证错误
   */
  static validationError(message: string, errors?: any[]): Error {
    const error = new Error(message) as any
    error.code = 'VALIDATION_ERROR'
    error.status = 400
    error.errors = errors
    return error
  }

  /**
   * 认证错误
   */
  static authenticationError(message: string = 'Authentication required'): Error {
    const error = new Error(message) as any
    error.code = 'UNAUTHORIZED'
    error.status = 401
    return error
  }

  /**
   * 权限错误
   */
  static authorizationError(message: string = 'Insufficient permissions'): Error {
    const error = new Error(message) as any
    error.code = 'FORBIDDEN'
    error.status = 403
    return error
  }

  /**
   * 资源未找到错误
   */
  static notFoundError(resource: string = 'Resource'): Error {
    const error = new Error(`${resource} not found`) as any
    error.code = 'NOT_FOUND'
    error.status = 404
    return error
  }

  /**
   * 冲突错误
   */
  static conflictError(message: string = 'Resource already exists'): Error {
    const error = new Error(message) as any
    error.code = 'CONFLICT'
    error.status = 409
    return error
  }

  /**
   * 服务不可用错误
   */
  static serviceUnavailableError(service: string = 'Service'): Error {
    const error = new Error(`${service} is currently unavailable`) as any
    error.code = 'SERVICE_UNAVAILABLE'
    error.status = 503
    error.service = service
    return error
  }

  /**
   * 超时错误
   */
  static timeoutError(operation: string = 'Operation'): Error {
    const error = new Error(`${operation} timed out`) as any
    error.code = 'TIMEOUT'
    error.status = 504
    return error
  }

  /**
   * AI服务错误
   */
  static aiServiceError(message: string, model?: string): Error {
    const error = new Error(message) as any
    error.code = 'AI_SERVICE_ERROR'
    error.status = 502
    error.model = model
    return error
  }

  /**
   * 数据库错误
   */
  static databaseError(message: string, table?: string): Error {
    const error = new Error(message) as any
    error.code = 'DATABASE_ERROR'
    error.status = 500
    error.table = table
    return error
  }
}