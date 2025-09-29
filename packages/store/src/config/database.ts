import { Pool, PoolConfig } from 'pg'
import { createClient, RedisClientType } from 'redis'
import { EventEmitter } from 'events'
import { getConfig, DatabaseConfig as ConfigDatabaseConfig, RedisConfig, CacheConfig } from '@sker/config'

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  postgres: PoolConfig
  redis: {
    url: string
    password?: string
    db?: number
    maxRetriesPerRequest?: number
  }
  cache: {
    ttl: number // 缓存过期时间（秒）
    maxKeys: number // 最大缓存键数量
  }
}

/**
 * 将 @sker/config 的配置转换为 DatabaseConfig
 */
function createDatabaseConfig(): DatabaseConfig {
  const config = getConfig()

  return {
    postgres: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      max: config.database.maxConnections || 20,
      idleTimeoutMillis: config.database.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.database.createTimeoutMillis || 2000,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false
    },
    redis: {
      url: config.redis.url,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest || 3
    },
    cache: {
      ttl: config.cache.ttl,
      maxKeys: config.cache.maxKeys
    }
  }
}

/**
 * 默认数据库配置
 */
export const defaultDatabaseConfig: DatabaseConfig = createDatabaseConfig()

/**
 * 数据库连接管理器
 */
export class DatabaseManager extends EventEmitter {
  private pgPool?: Pool
  private redisClient?: RedisClientType
  private config: DatabaseConfig

  constructor(config: DatabaseConfig = defaultDatabaseConfig) {
    super()
    this.config = config
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    try {
      // 初始化 PostgreSQL 连接池
      this.pgPool = new Pool(this.config.postgres)

      // 测试 PostgreSQL 连接
      const pgClient = await this.pgPool.connect()
      await pgClient.query('SELECT NOW()')
      pgClient.release()
      console.log('PostgreSQL 连接成功')

      // 初始化 Redis 连接
      this.redisClient = createClient({
        url: this.config.redis.url,
        password: this.config.redis.password,
        database: this.config.redis.db,
        socket: {
          reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000)
        }
      })

      this.redisClient.on('error', (err) => {
        console.error('Redis 连接错误:', err)
      })

      this.redisClient.on('connect', () => {
        console.log('Redis 连接成功')
      })

      await this.redisClient.connect()

      // 发射连接成功事件
      this.emit('connected')

    } catch (error) {
      console.error('数据库初始化失败:', error)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * 获取 PostgreSQL 连接池
   */
  getPostgresPool(): Pool {
    if (!this.pgPool) {
      throw new Error('PostgreSQL 连接未初始化')
    }
    return this.pgPool
  }

  /**
   * 获取 Redis 客户端
   */
  getRedisClient(): RedisClientType {
    if (!this.redisClient) {
      throw new Error('Redis 连接未初始化')
    }
    return this.redisClient
  }

  /**
   * 执行 PostgreSQL 查询
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL 连接未初始化')
    }

    const client = await this.pgPool.connect()
    try {
      const result = await client.query(text, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  /**
   * 执行事务
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL 连接未初始化')
    }

    const client = await this.pgPool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 缓存操作 - 获取
   */
  async getCache(key: string): Promise<string | null> {
    if (!this.redisClient) {
      return null
    }

    try {
      return await this.redisClient.get(key)
    } catch (error) {
      console.error('缓存获取失败:', error)
      return null
    }
  }

  /**
   * 缓存操作 - 设置
   */
  async setCache(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.redisClient) {
      return false
    }

    try {
      const expireTime = ttl || this.config.cache.ttl
      await this.redisClient.setEx(key, expireTime, value)
      return true
    } catch (error) {
      console.error('缓存设置失败:', error)
      return false
    }
  }

  /**
   * 缓存操作 - 删除
   */
  async deleteCache(key: string): Promise<boolean> {
    if (!this.redisClient) {
      return false
    }

    try {
      await this.redisClient.del(key)
      return true
    } catch (error) {
      console.error('缓存删除失败:', error)
      return false
    }
  }

  /**
   * 缓存操作 - 批量删除
   */
  async deleteCachePattern(pattern: string): Promise<boolean> {
    if (!this.redisClient) {
      return false
    }

    try {
      const keys = await this.redisClient.keys(pattern)
      if (keys.length > 0) {
        await this.redisClient.del(keys)
      }
      return true
    } catch (error) {
      console.error('缓存批量删除失败:', error)
      return false
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): {
    postgres: boolean
    redis: boolean
  } {
    return {
      postgres: this.pgPool ? !this.pgPool.ended : false,
      redis: this.redisClient ? this.redisClient.isReady : false
    }
  }

  /**
   * 关闭所有连接
   */
  async close(): Promise<void> {
    try {
      if (this.pgPool) {
        await this.pgPool.end()
        console.log('PostgreSQL 连接已关闭')
      }

      if (this.redisClient) {
        await this.redisClient.disconnect()
        console.log('Redis 连接已关闭')
      }

      // 发射断开连接事件
      this.emit('disconnected')
    } catch (error) {
      console.error('关闭数据库连接时出错:', error)
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    postgres: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }
    redis: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }
  }> {
    const result: {
      postgres: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }
      redis: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }
    } = {
      postgres: { status: 'unhealthy' },
      redis: { status: 'unhealthy' }
    }

    // 检查 PostgreSQL
    try {
      const start = Date.now()
      await this.query('SELECT 1')
      result.postgres = {
        status: 'healthy',
        latency: Date.now() - start
      }
    } catch (error) {
      result.postgres.error = error instanceof Error ? error.message : String(error)
    }

    // 检查 Redis
    try {
      const start = Date.now()
      await this.redisClient?.ping()
      result.redis = {
        status: 'healthy',
        latency: Date.now() - start
      }
    } catch (error) {
      result.redis.error = error instanceof Error ? error.message : String(error)
    }

    return result
  }
}

// 导出单例实例
export const databaseManager = new DatabaseManager()