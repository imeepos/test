import { Request, Response, NextFunction } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import type { ApiRequest } from '../types/ApiTypes'

/**
 * 验证中间件 - 请求参数验证
 */
export class ValidationMiddleware {
  /**
   * 通用验证中间件
   */
  static validate() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const apiReq = req as ApiRequest

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.array(),
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
      }

      next()
    }
  }

  /**
   * 节点创建验证规则
   */
  static validateCreateNode() {
    return [
      body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ min: 1, max: 10000 })
        .withMessage('Content must be between 1 and 10000 characters'),

      body('position')
        .isObject()
        .withMessage('Position must be an object'),

      body('position.x')
        .isNumeric()
        .withMessage('Position x must be a number'),

      body('position.y')
        .isNumeric()
        .withMessage('Position y must be a number'),

      body('importance')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Importance must be between 1 and 5'),

      body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

      body('tags.*')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters')
    ]
  }

  /**
   * 节点更新验证规则
   */
  static validateUpdateNode() {
    return [
      param('id')
        .notEmpty()
        .withMessage('Node ID is required'),

      body('content')
        .optional()
        .isLength({ min: 1, max: 10000 })
        .withMessage('Content must be between 1 and 10000 characters'),

      body('title')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),

      body('importance')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Importance must be between 1 and 5'),

      body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

      body('position')
        .optional()
        .isObject()
        .withMessage('Position must be an object')
    ]
  }

  /**
   * AI生成验证规则
   */
  static validateAIGenerate() {
    return [
      body('inputs')
        .isArray({ min: 1 })
        .withMessage('Inputs must be a non-empty array'),

      body('inputs.*')
        .isString()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Each input must be between 1 and 5000 characters'),

      body('type')
        .isIn(['generate', 'optimize', 'fusion'])
        .withMessage('Type must be one of: generate, optimize, fusion'),

      body('context')
        .optional()
        .isString()
        .isLength({ max: 2000 })
        .withMessage('Context must not exceed 2000 characters'),

      body('instruction')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Instruction must not exceed 1000 characters')
    ]
  }

  /**
   * 搜索验证规则
   */
  static validateSearch() {
    return [
      query('search')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

      query('pageSize')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Page size must be between 1 and 100'),

      query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'importance', 'confidence'])
        .withMessage('SortBy must be one of: createdAt, updatedAt, importance, confidence'),

      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('SortOrder must be asc or desc')
    ]
  }

  /**
   * 项目创建验证规则
   */
  static validateCreateProject() {
    return [
      body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),

      body('description')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters')
    ]
  }

  /**
   * 用户登录验证规则
   */
  static validateLogin() {
    return [
      body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
    ]
  }

  /**
   * WebSocket认证验证规则
   */
  static validateWebSocketAuth() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Token is required'),

      body('userId')
        .notEmpty()
        .withMessage('User ID is required')
    ]
  }

  /**
   * 节点优化验证规则
   */
  static validateOptimizeNode() {
    return [
      param('id')
        .notEmpty()
        .withMessage('Node ID is required'),

      body('instruction')
        .notEmpty()
        .withMessage('Optimization instruction is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Instruction must be between 1 and 1000 characters'),

      body('context')
        .optional()
        .isString()
        .isLength({ max: 2000 })
        .withMessage('Context must not exceed 2000 characters')
    ]
  }

  /**
   * 版本回滚验证规则
   */
  static validateRollback() {
    return [
      param('id')
        .notEmpty()
        .withMessage('Node ID is required'),

      body('targetVersion')
        .isInt({ min: 1 })
        .withMessage('Target version must be a positive integer')
    ]
  }

  /**
   * UUID验证规则
   */
  static validateUUID(field: string) {
    return param(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`)
  }

  /**
   * 自定义验证规则 - 检查内容是否包含敏感信息
   */
  static validateContent() {
    return body('content')
      .custom((value) => {
        // 基本的敏感信息检测
        const sensitivePatterns = [
          /password\s*[:=]\s*[^\s]+/i,
          /api_key\s*[:=]\s*[^\s]+/i,
          /secret\s*[:=]\s*[^\s]+/i,
          /token\s*[:=]\s*[^\s]+/i
        ]

        for (const pattern of sensitivePatterns) {
          if (pattern.test(value)) {
            throw new Error('Content contains potentially sensitive information')
          }
        }

        return true
      })
  }

  /**
   * 文件大小验证
   */
  static validateFileSize(maxSizeBytes: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.headers['content-length'] || '0')

      if (contentLength > maxSizeBytes) {
        const apiReq = req as ApiRequest

        return res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Request size exceeds limit of ${maxSizeBytes} bytes`,
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
      }

      next()
    }
  }
}