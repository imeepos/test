/**
 * 缓存管理器
 */

/**
 * 缓存策略
 */
export type CacheStrategy = 'lru' | 'fifo' | 'ttl'

/**
 * 缓存存储类型
 */
export type CacheStorageType = 'memory' | 'localStorage' | 'indexedDB'

/**
 * 缓存项
 */
export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl?: number
  tags?: string[]
  metadata?: any
}

/**
 * 缓存配置
 */
export interface CacheManagerConfig {
  strategy?: CacheStrategy
  maxSize?: number
  defaultTTL?: number
  storage?: CacheStorageType
  compression?: boolean
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  entries: number
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  private config: Required<CacheManagerConfig>
  private cache: Map<string, CacheItem> = new Map()
  private accessOrder: string[] = [] // LRU访问顺序
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    entries: 0
  }

  constructor(config: CacheManagerConfig = {}) {
    this.config = {
      strategy: config.strategy || 'lru',
      maxSize: config.maxSize || 100,
      defaultTTL: config.defaultTTL || 300000, // 5分钟
      storage: config.storage || 'memory',
      compression: config.compression || false
    }
  }

  /**
   * 设置缓存
   */
  async set<T = any>(
    key: string,
    data: T,
    options?: {
      ttl?: number
      tags?: string[]
      metadata?: any
    }
  ): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || this.config.defaultTTL,
      tags: options?.tags,
      metadata: options?.metadata
    }

    // 检查容量
    if (this.cache.size >= this.config.maxSize) {
      this.evict()
    }

    this.cache.set(key, item)
    this.updateAccessOrder(key)
    this.updateStats()
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<CacheItem<T> | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined

    if (!item) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    if (this.isExpired(item)) {
      await this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    this.updateAccessOrder(key)

    return item
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    const result = this.cache.delete(key)
    this.removeFromAccessOrder(key)
    this.updateStats()
    return result
  }

  /**
   * 根据标签删除缓存
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let count = 0

    for (const [key, item] of this.cache.entries()) {
      if (item.tags && item.tags.some((tag) => tags.includes(tag))) {
        await this.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      entries: 0
    }
  }

  /**
   * 检查是否过期
   */
  isExpired(item: CacheItem): boolean {
    if (!item.ttl) {
      return false
    }

    return Date.now() - item.timestamp > item.ttl
  }

  /**
   * 缓存淘汰
   */
  private evict(): void {
    if (this.cache.size === 0) return

    let keyToEvict: string

    switch (this.config.strategy) {
      case 'lru':
        // 淘汰最少使用的
        keyToEvict = this.accessOrder[0]
        break

      case 'fifo':
        // 淘汰最早的
        keyToEvict = this.cache.keys().next().value
        break

      case 'ttl':
        // 淘汰最快过期的
        keyToEvict = this.findEarliestExpiring()
        break

      default:
        keyToEvict = this.accessOrder[0]
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict)
      this.removeFromAccessOrder(keyToEvict)
    }
  }

  /**
   * 找到最快过期的键
   */
  private findEarliestExpiring(): string {
    let earliestKey = ''
    let earliestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      const expiryTime = item.timestamp + (item.ttl || 0)
      if (expiryTime < earliestTime) {
        earliestTime = expiryTime
        earliestKey = key
      }
    }

    return earliestKey
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  /**
   * 从访问顺序中移除
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size
    this.stats.size = this.calculateSize()
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 计算缓存大小(简化版)
   */
  private calculateSize(): number {
    let size = 0
    for (const item of this.cache.values()) {
      size += JSON.stringify(item.data).length
    }
    return size
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }
}
