import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthMiddleware } from '../../middleware/AuthMiddleware'
import type { AuthConfig } from '../../types/GatewayConfig'

// Mock jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    TokenExpiredError: class extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'TokenExpiredError'
      }
    },
    JsonWebTokenError: class extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'JsonWebTokenError'
      }
    }
  }
}))

describe('@sker/gateway - AuthMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let authConfig: AuthConfig

  beforeEach(() => {
    vi.clearAllMocks() // 清理所有 mock
    mockReq = {
      headers: {},
      query: {}, // 添加 query 对象
      cookies: {}, // 添加 cookies 对象
      path: '/api/test'
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
    mockNext = vi.fn()
    authConfig = {
      secret: 'test-secret',
      algorithm: 'HS256',
      expiresIn: '1h'
    }
  })

  describe('authenticate', () => {
    it('应该成功验证有效的token', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)
      const mockUser = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user'
      }

      mockReq.headers = {
        authorization: 'Bearer valid-token'
      }

      vi.mocked(jwt.verify).mockReturnValue(mockUser as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', {
        algorithms: ['HS256'],
        issuer: undefined,
        audience: undefined
      })
      expect((mockReq as any).user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        permissions: []
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该拒绝缺少token的请求', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required'
          })
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该拒绝过期的token', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)

      mockReq.headers = {
        authorization: 'Bearer expired-token'
      }

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired')
      })

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'TOKEN_EXPIRED',
            message: 'Authorization token has expired'
          })
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该拒绝无效的token', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)

      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      }

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token')
      })

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
            message: 'Invalid authorization token'
          })
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该跳过排除路径的验证', () => {
      const middleware = AuthMiddleware.authenticate(authConfig, {
        exclude: ['/api/public']
      })

      mockReq.path = '/api/public/health'

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(jwt.verify).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该支持不同的token格式', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)
      const mockUser = { sub: 'user-123' }

      // 测试 Bearer token
      mockReq.headers = { authorization: 'Bearer token123' }
      vi.mocked(jwt.verify).mockReturnValue(mockUser as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该处理不同的用户ID字段', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)

      // 测试 userId 字段
      mockReq.headers = { authorization: 'Bearer token123' }
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-456' } as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect((mockReq as any).user.id).toBe('user-456')
    })

    it('应该设置默认权限和角色', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)

      mockReq.headers = { authorization: 'Bearer token123' }
      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123' } as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect((mockReq as any).user).toMatchObject({
        id: 'user-123',
        role: 'user',
        permissions: []
      })
    })
  })

  describe('Token提取', () => {
    it('应该从Authorization header提取Bearer token', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)
      mockReq.headers = { authorization: 'Bearer my-token' }

      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123' } as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(jwt.verify).toHaveBeenCalledWith('my-token', expect.any(String), expect.any(Object))
    })

    it('应该处理缺少Bearer前缀的token', () => {
      const middleware = AuthMiddleware.authenticate(authConfig)
      mockReq.headers = { authorization: 'token-without-bearer' }

      middleware(mockReq as Request, mockRes as Response, mockNext)

      // 应该返回401错误
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe('配置选项', () => {
    it('应该使用自定义的issuer和audience', () => {
      const customConfig: AuthConfig = {
        ...authConfig,
        issuer: 'sker-gateway',
        audience: 'sker-app'
      }

      const middleware = AuthMiddleware.authenticate(customConfig)
      mockReq.headers = { authorization: 'Bearer token123' }

      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123' } as any)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(jwt.verify).toHaveBeenCalledWith('token123', customConfig.secret, {
        algorithms: ['HS256'],
        issuer: 'sker-gateway',
        audience: 'sker-app'
      })
    })
  })
})
