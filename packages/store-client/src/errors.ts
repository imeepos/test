/**
 * Store Client 错误类型
 */

/**
 * 数据库错误
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * 客户端错误
 */
export class StoreClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'StoreClientError'
  }
}
