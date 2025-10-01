/**
 * 错误处理工具函数
 * 统一的错误处理和提示
 */
import { message, notification } from 'antd'
import { logger } from './logger'

export interface AppError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

/**
 * 创建应用错误
 */
export function createAppError(code: string, message: string, details?: any, statusCode?: number): AppError {
  return {
    code,
    message,
    details,
    statusCode,
  }
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: any): AppError {
  logger.error('API Error:', error)

  // Axios 错误
  if (error.response) {
    const { status, data } = error.response
    const message = data?.message || getDefaultErrorMessage(status)

    // 根据状态码显示不同类型的提示
    switch (status) {
      case 400:
        notification.error({
          message: '请求错误',
          description: message,
        })
        break
      case 401:
        notification.warning({
          message: '未授权',
          description: '请先登录',
        })
        break
      case 403:
        notification.error({
          message: '禁止访问',
          description: message,
        })
        break
      case 404:
        notification.error({
          message: '资源不存在',
          description: message,
        })
        break
      case 500:
        notification.error({
          message: '服务器错误',
          description: '服务器内部错误,请稍后重试',
        })
        break
      default:
        notification.error({
          message: '请求失败',
          description: message,
        })
    }

    return createAppError(
      data?.code || `HTTP_${status}`,
      message,
      data?.details,
      status
    )
  }

  // 网络错误
  if (error.request) {
    notification.error({
      message: '网络错误',
      description: '无法连接到服务器,请检查网络连接',
    })
    return createAppError('NETWORK_ERROR', '网络连接失败', error.request)
  }

  // 其他错误
  const message = error.message || '未知错误'
  notification.error({
    message: '错误',
    description: message,
  })
  return createAppError('UNKNOWN_ERROR', message, error)
}

/**
 * 获取默认错误消息
 */
function getDefaultErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权,请先登录',
    403: '没有权限访问此资源',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
  }
  return messages[statusCode] || `请求失败 (${statusCode})`
}

/**
 * 显示成功消息
 */
export function showSuccess(content: string, duration = 3): void {
  message.success(content, duration)
}

/**
 * 显示错误消息
 */
export function showError(content: string, duration = 3): void {
  message.error(content, duration)
}

/**
 * 显示警告消息
 */
export function showWarning(content: string, duration = 3): void {
  message.warning(content, duration)
}

/**
 * 显示信息消息
 */
export function showInfo(content: string, duration = 3): void {
  message.info(content, duration)
}

/**
 * 显示加载消息
 */
export function showLoading(content = '加载中...', duration = 0): () => void {
  const hide = message.loading(content, duration)
  return hide
}

/**
 * 全局错误处理器
 */
export function setupGlobalErrorHandler(): void {
  // 处理未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection:', event.reason)
    event.preventDefault()

    notification.error({
      message: '未处理的错误',
      description: event.reason?.message || '发生了一个未处理的错误',
    })
  })

  // 处理未捕获的异常
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error:', event.error)
    event.preventDefault()

    notification.error({
      message: '应用错误',
      description: event.error?.message || '应用发生了一个错误',
    })
  })
}

/**
 * 错误边界辅助函数
 */
export function logErrorBoundary(error: Error, errorInfo: React.ErrorInfo): void {
  logger.error('Error Boundary Caught:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  })
}
