import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import type { ApiRequest, ApiResponse, ApiResponseBody } from '../types/ApiTypes'

/**
 * 请求增强中间件 - 添加requestId、响应助手等
 */
export class RequestEnhancer {
  /**
   * 增强请求和响应对象
   */
  static enhance() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiReq = req as ApiRequest
      const apiRes = res as ApiResponse

      // 添加请求ID
      apiReq.requestId = uuidv4()
      apiReq.timestamp = new Date()

      // 添加响应助手方法
      apiRes.success = function<T>(data?: T, message?: string): void {
        const response: ApiResponseBody<T> = {
          success: true,
          data,
          message,
          timestamp: new Date(),
          requestId: apiReq.requestId
        }

        this.status(200).json(response)
      }

      apiRes.error = function(error: any, status: number = 500): void {
        const response: ApiResponseBody = {
          success: false,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Internal server error',
            details: error.details,
            timestamp: new Date(),
            requestId: apiReq.requestId
          },
          timestamp: new Date(),
          requestId: apiReq.requestId
        }

        this.status(status).json(response)
      }

      // 记录请求日志
      console.log(`[${apiReq.requestId}] ${req.method} ${req.path} - ${apiReq.timestamp.toISOString()}`)

      next()
    }
  }
}