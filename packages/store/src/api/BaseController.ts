import type { Request, Response, NextFunction } from 'express'
import { DatabaseError, ValidationError, NotFoundError } from '../models'

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

/**
 * 基础控制器类 - 提供通用的HTTP处理方法
 */
export abstract class BaseController {
  /**
   * 成功响应
   */
  protected success<T>(res: Response, data?: T, pagination?: any): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }

    if (pagination) {
      response.pagination = pagination
    }

    res.status(200).json(response)
  }

  /**
   * 创建成功响应
   */
  protected created<T>(res: Response, data: T): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }

    res.status(201).json(response)
  }

  /**
   * 无内容响应
   */
  protected noContent(res: Response): void {
    res.status(204).send()
  }

  /**
   * 错误响应
   */
  protected error(res: Response, error: Error, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: this.getErrorCode(error),
        message: error.message,
        details: this.getErrorDetails(error)
      },
      timestamp: new Date().toISOString()
    }

    res.status(statusCode).json(response)
  }

  /**
   * 验证错误响应
   */
  protected validationError(res: Response, errors: string[]): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      },
      timestamp: new Date().toISOString()
    }

    res.status(400).json(response)
  }

  /**
   * 未找到响应
   */
  protected notFound(res: Response, resource: string = 'Resource'): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`
      },
      timestamp: new Date().toISOString()
    }

    res.status(404).json(response)
  }

  /**
   * 未授权响应
   */
  protected unauthorized(res: Response, message: string = 'Unauthorized'): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message
      },
      timestamp: new Date().toISOString()
    }

    res.status(401).json(response)
  }

  /**
   * 禁止访问响应
   */
  protected forbidden(res: Response, message: string = 'Forbidden'): void {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message
      },
      timestamp: new Date().toISOString()
    }

    res.status(403).json(response)
  }

  /**
   * 处理异步路由错误
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }

  /**
   * 获取错误代码
   */
  private getErrorCode(error: Error): string {
    if (error instanceof DatabaseError) {
      return error.code || 'DATABASE_ERROR'
    }
    if (error instanceof ValidationError) {
      return error.code || 'VALIDATION_ERROR'
    }
    if (error instanceof NotFoundError) {
      return error.code || 'NOT_FOUND'
    }
    return 'INTERNAL_ERROR'
  }

  /**
   * 获取错误详情
   */
  private getErrorDetails(error: Error): any {
    if (error instanceof DatabaseError) {
      return error.details
    }
    if (error instanceof ValidationError) {
      return error.details
    }
    if (error instanceof NotFoundError) {
      return error.details
    }
    return undefined
  }

  /**
   * 解析查询参数
   */
  protected parseQueryOptions(req: Request): {
    page: number
    limit: number
    offset: number
    sort?: string
    order?: 'ASC' | 'DESC'
  } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const offset = (page - 1) * limit
    const sort = req.query.sort as string
    const order = (req.query.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    return { page, limit, offset, sort, order }
  }

  /**
   * 创建分页信息
   */
  protected createPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  }

  /**
   * 验证必需字段
   */
  protected validateRequired(data: any, requiredFields: string[]): string[] {
    const errors: string[] = []

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0 && data[field] !== false) {
        errors.push(`${field} is required`)
      }
    }

    return errors
  }

  /**
   * 清理输入数据
   */
  protected sanitizeInput(data: any, allowedFields: string[]): any {
    const sanitized: any = {}

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field]
      }
    }

    return sanitized
  }
}

/**
 * 错误处理中间件助手类
 */
class ErrorHandlerController extends BaseController {
  public handleError(res: Response, error: Error, statusCode: number = 500): void {
    this.error(res, error, statusCode)
  }
}

/**
 * 错误处理中间件
 */
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('API Error:', error)

  // 已经发送响应的情况
  if (res.headersSent) {
    return next(error)
  }

  const controller = new ErrorHandlerController()

  if (error instanceof DatabaseError) {
    controller.handleError(res, error, 500)
  } else if (error instanceof ValidationError) {
    controller.handleError(res, error, 400)
  } else if (error instanceof NotFoundError) {
    controller.handleError(res, error, 404)
  } else {
    controller.handleError(res, error, 500)
  }
}