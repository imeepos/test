import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthConfig } from '../types/GatewayConfig.js'
import type { ApiRequest, AuthUser } from '../types/ApiTypes.js'

/**
 * 认证中间件 - JWT Token验证
 */
export class AuthMiddleware {
  /**
   * 创建认证中间件
   */
  static authenticate(config: AuthConfig, options: { exclude?: string[] } = {}) {
    const { exclude = [] } = options

    return (req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest

      // 检查是否是排除的路径
      if (exclude.some(path => req.path.startsWith(path))) {
        return next()
      }

      // 获取Token
      const token = this.extractToken(req)
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required',
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }

      // 验证Token
      try {
        const decoded = jwt.verify(token, config.secret, {
          algorithms: [config.algorithm as jwt.Algorithm || 'HS256'],
          issuer: config.issuer,
          audience: config.audience
        }) as any

        // 设置用户信息
        apiReq.user = {
          id: decoded.sub || decoded.userId || decoded.id,
          email: decoded.email,
          role: decoded.role || 'user',
          permissions: decoded.permissions || []
        }

        next()
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Authorization token has expired',
              timestamp: new Date(),
              requestId: apiReq.requestId
            }
          })
          return
        }

        if (error instanceof jwt.JsonWebTokenError) {
          res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid authorization token',
              timestamp: new Date(),
              requestId: apiReq.requestId
            }
          })
          return
        }

        res.status(500).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed',
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }
    }
  }

  /**
   * 权限检查中间件
   */
  static requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest

      if (!apiReq.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }

      if (!apiReq.user.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Permission '${permission}' is required`,
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }

      next()
    }
  }

  /**
   * 角色检查中间件
   */
  static requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest

      if (!apiReq.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }

      if (apiReq.user.role !== role) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: `Role '${role}' is required`,
            timestamp: new Date(),
            requestId: apiReq.requestId
          }
        })
        return
      }

      next()
    }
  }

  /**
   * 从请求中提取Token
   */
  private static extractToken(req: Request): string | null {
    // 从Authorization头中提取
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // 从查询参数中提取
    const queryToken = req.query.token as string
    if (queryToken) {
      return queryToken
    }

    // 从Cookie中提取
    const cookieToken = req.cookies?.token
    if (cookieToken) {
      return cookieToken
    }

    return null
  }

  /**
   * 生成JWT Token
   */
  static generateToken(payload: any, config: AuthConfig): string {
    const options: jwt.SignOptions = {
      algorithm: (config.algorithm as jwt.Algorithm) || 'HS256'
    }
    
    if (config.expiresIn) {
      options.expiresIn = parseInt(config.expiresIn)
    }
    if (config.issuer) {
      options.issuer = config.issuer
    }
    if (config.audience) {
      options.audience = config.audience
    }
    
    return jwt.sign(payload, config.secret, options)
  }

  /**
   * 验证Token（不作为中间件使用）
   */
  static verifyToken(token: string, config: AuthConfig): any {
    return jwt.verify(token, config.secret, {
      algorithms: [config.algorithm as jwt.Algorithm || 'HS256'],
      issuer: config.issuer,
      audience: config.audience
    })
  }
}