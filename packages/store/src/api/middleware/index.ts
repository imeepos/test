import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

/**
 * JWT认证中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required'
      },
      timestamp: new Date().toISOString()
    })
    return
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'sker-default-secret'
    const decoded = jwt.verify(token, jwtSecret) as any

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username
    }

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      },
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 可选认证中间件 - 如果有token则验证，没有则跳过
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return next()
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'sker-default-secret'
    const decoded = jwt.verify(token, jwtSecret) as any

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username
    }
  } catch (error) {
    // 忽略错误，继续处理请求
  }

  next()
}

/**
 * 请求日志中间件
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url, ip } = req
    const { statusCode } = res
    const userAgent = req.get('User-Agent')
    const userId = req.user?.id || 'anonymous'

    console.log(`[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userId} - ${userAgent}`)
  })

  next()
}

/**
 * CORS中间件
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  const origin = req.get('Origin')

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}

/**
 * 限流中间件
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * 严格限流中间件（用于敏感操作）
 */
export const strictRateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW || '900000'), // 15分钟
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10'), // 限制每个IP 15分钟内最多10个请求
  message: {
    success: false,
    error: {
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      message: 'Too many sensitive operations, please try again later'
    },
    timestamp: new Date().toISOString()
  }
})

/**
 * 请求体大小限制中间件配置
 */
export const bodyLimitConfig = {
  json: { limit: process.env.BODY_LIMIT || '10mb' },
  urlencoded: { limit: process.env.BODY_LIMIT || '10mb', extended: true }
}

/**
 * 错误处理中间件（在路由文件中已定义，这里导出供引用）
 */
export { errorHandler } from '../BaseController'

/**
 * 健康检查中间件 - 绕过认证和限流
 */
export function healthCheckBypass(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health' || req.path === '/api/system/version') {
    return next()
  }
  next()
}

/**
 * API版本中间件
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 设置API版本头
  res.setHeader('X-API-Version', 'v1')
  next()
}

/**
 * 内容类型验证中间件
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type')

    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
  }

  next()
}

/**
 * 扩展Request接口以包含用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        username: string
      }
    }
  }
}