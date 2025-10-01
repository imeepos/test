import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes.js'
import { ResponseMapper } from '../adapters/ResponseMapper.js'
import { QueueManager } from '../messaging/QueueManager.js'
import { AIEngine } from '@sker/engine'
import { StoreClient } from '@sker/store-client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface RouterDependencies {
  aiEngine?: AIEngine
  storeClient?: StoreClient
  queueManager?: QueueManager
}

export interface JWTPayload {
  id: string
  username: string
  email: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  iat?: number
  exp?: number
}

/**
 * 基础路由器抽象类 - 提供通用功能和依赖注入
 */
export abstract class BaseRouter {
  protected router: Router
  protected aiEngine?: AIEngine
  protected storeClient?: StoreClient
  protected queueManager?: QueueManager

  constructor(dependencies?: RouterDependencies) {
    this.router = Router()
    this.aiEngine = dependencies?.aiEngine
    this.storeClient = dependencies?.storeClient
    this.queueManager = dependencies?.queueManager
  }

  /**
   * 获取Express路由器实例
   */
  getRouter(): Router {
    return this.router
  }

  /**
   * 生成任务ID
   */
  protected generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证密码
   */
  protected async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  /**
   * 生成JWT令牌
   */
  protected generateJWTToken(payload: JWTPayload): string {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key'

    return jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn: '24h',
        issuer: 'sker-gateway',
        audience: 'sker-client'
      }
    )
  }

  /**
   * 生成刷新令牌
   */
  protected generateRefreshToken(userId: string): string {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret'

    return jwt.sign(
      { userId },
      refreshSecret,
      {
        expiresIn: '7d',
        issuer: 'sker-gateway',
        audience: 'sker-client'
      }
    )
  }

  /**
   * 验证刷新令牌
   */
  protected verifyRefreshToken(refreshToken: string): RefreshTokenPayload | null {
    try {
      const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret'

      const decoded = jwt.verify(refreshToken, refreshSecret, {
        issuer: 'sker-gateway',
        audience: 'sker-client'
      }) as RefreshTokenPayload

      return decoded
    } catch (error) {
      console.error('刷新令牌验证失败:', error)
      return null
    }
  }

  /**
   * 检查存储服务可用性
   */
  protected checkStoreService(req: ApiRequest, res: ApiResponse): boolean {
    if (!this.storeClient) {
      res.error({
        code: 'STORE_SERVICE_UNAVAILABLE',
        message: '存储服务不可用',
        timestamp: new Date(),
        requestId: req.requestId
      })
      return false
    }
    return true
  }

  /**
   * 检查AI引擎可用性
   */
  protected checkAIEngine(req: ApiRequest, res: ApiResponse): boolean {
    if (!this.aiEngine) {
      res.error(ResponseMapper.toAPIError(
        { message: 'AI引擎不可用' },
        req.requestId
      ))
      return false
    }
    return true
  }

  /**
   * 检查队列管理器可用性
   */
  protected checkQueueManager(req: ApiRequest, res: ApiResponse): boolean {
    if (!this.queueManager) {
      res.error(ResponseMapper.toAPIError(
        { message: '队列管理器不可用' },
        req.requestId
      ))
      return false
    }
    return true
  }

  /**
   * 抽象方法：设置路由
   */
  protected abstract setupRoutes(): void
}