import rateLimit from 'express-rate-limit'
import type { RateLimitConfig } from '../types/GatewayConfig.js'

/**
 * 限流中间件 - 防止API滥用
 */
export class RateLimitMiddleware {
  /**
   * 创建基础限流中间件
   */
  static createBasicLimiter(config: RateLimitConfig) {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          timestamp: new Date()
        }
      },
      standardHeaders: config.standardHeaders !== false,
      legacyHeaders: config.legacyHeaders !== false,
      keyGenerator: (req) => {
        // 优先使用用户ID，否则使用IP
        const user = (req as any).user
        return user?.id || req.ip
      }
    })
  }

  /**
   * AI服务专用限流（更严格）
   */
  static createAILimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 10, // 每15分钟最多10次AI请求
      message: {
        success: false,
        error: {
          code: 'AI_RATE_LIMIT_EXCEEDED',
          message: 'Too many AI requests, please wait before trying again',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        const user = (req as any).user
        return `ai:${user?.id || req.ip}`
      }
    })
  }

  /**
   * 登录限流（防止暴力破解）
   */
  static createLoginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 5, // 每15分钟最多5次登录尝试
      message: {
        success: false,
        error: {
          code: 'LOGIN_RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts, please try again later',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        return `login:${req.ip}`
      }
    })
  }

  /**
   * 注册限流
   */
  static createRegistrationLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 3, // 每小时最多3次注册
      message: {
        success: false,
        error: {
          code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
          message: 'Too many registration attempts, please try again later',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        return `register:${req.ip}`
      }
    })
  }

  /**
   * 创建操作限流（防止恶意创建）
   */
  static createCreationLimiter() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5分钟
      max: 20, // 每5分钟最多20次创建操作
      message: {
        success: false,
        error: {
          code: 'CREATION_RATE_LIMIT_EXCEEDED',
          message: 'Too many creation requests, please slow down',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        const user = (req as any).user
        return `create:${user?.id || req.ip}`
      }
    })
  }

  /**
   * 搜索限流
   */
  static createSearchLimiter() {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1分钟
      max: 30, // 每分钟最多30次搜索
      message: {
        success: false,
        error: {
          code: 'SEARCH_RATE_LIMIT_EXCEEDED',
          message: 'Too many search requests, please slow down',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        const user = (req as any).user
        return `search:${user?.id || req.ip}`
      }
    })
  }

  /**
   * 上传限流
   */
  static createUploadLimiter() {
    return rateLimit({
      windowMs: 10 * 60 * 1000, // 10分钟
      max: 5, // 每10分钟最多5次上传
      message: {
        success: false,
        error: {
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          message: 'Too many upload requests, please try again later',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        const user = (req as any).user
        return `upload:${user?.id || req.ip}`
      }
    })
  }

  /**
   * 动态限流（根据用户类型调整）
   */
  static createDynamicLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: (req) => {
        const user = (req as any).user

        // 根据用户角色设置不同的限制
        switch (user?.role) {
          case 'admin':
            return 1000 // 管理员更高限制
          case 'premium':
            return 500  // 付费用户更高限制
          case 'user':
            return 100  // 普通用户标准限制
          default:
            return 20   // 未认证用户严格限制
        }
      },
      keyGenerator: (req) => {
        const user = (req as any).user
        return `dynamic:${user?.id || req.ip}`
      }
    })
  }

  /**
   * WebSocket连接限流
   */
  static createWebSocketLimiter() {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1分钟
      max: 10, // 每分钟最多10次WebSocket连接尝试
      message: {
        success: false,
        error: {
          code: 'WEBSOCKET_RATE_LIMIT_EXCEEDED',
          message: 'Too many WebSocket connection attempts',
          timestamp: new Date()
        }
      },
      keyGenerator: (req) => {
        return `ws:${req.ip}`
      }
    })
  }
}