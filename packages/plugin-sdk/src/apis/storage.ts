import { StorageItem } from '../types'

/**
 * 存储API
 * 提供数据存储和管理的接口
 */
export interface StorageAPI {
  // ============ 基础存储操作 ============

  /**
   * 存储数据
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  set(key: string, value: any, ttl?: number): Promise<void>

  /**
   * 获取数据
   * @param key 键
   * @param defaultValue 默认值
   * @returns 存储的值
   */
  get<T = any>(key: string, defaultValue?: T): Promise<T>

  /**
   * 删除数据
   * @param key 键
   */
  delete(key: string): Promise<void>

  /**
   * 检查键是否存在
   * @param key 键
   * @returns 是否存在
   */
  has(key: string): Promise<boolean>

  /**
   * 清空存储
   * @param pattern 键模式，可选
   */
  clear(pattern?: string): Promise<void>

  /**
   * 获取所有键
   * @param pattern 键模式，可选
   * @returns 键列表
   */
  keys(pattern?: string): Promise<string[]>

  /**
   * 获取存储大小
   * @returns 存储大小（字节）
   */
  size(): Promise<number>

  // ============ 批量操作 ============

  /**
   * 批量设置
   * @param items 键值对数组
   */
  setMany(items: Array<{ key: string; value: any; ttl?: number }>): Promise<void>

  /**
   * 批量获取
   * @param keys 键数组
   * @returns 值数组
   */
  getMany(keys: string[]): Promise<any[]>

  /**
   * 批量删除
   * @param keys 键数组
   */
  deleteMany(keys: string[]): Promise<void>

  // ============ 高级操作 ============

  /**
   * 原子性增加数值
   * @param key 键
   * @param increment 增量
   * @returns 增加后的值
   */
  increment(key: string, increment?: number): Promise<number>

  /**
   * 原子性减少数值
   * @param key 键
   * @param decrement 减量
   * @returns 减少后的值
   */
  decrement(key: string, decrement?: number): Promise<number>

  /**
   * 设置过期时间
   * @param key 键
   * @param ttl 过期时间（秒）
   */
  expire(key: string, ttl: number): Promise<void>

  /**
   * 获取过期时间
   * @param key 键
   * @returns 剩余时间（秒），-1表示永不过期，-2表示键不存在
   */
  ttl(key: string): Promise<number>

  /**
   * 重命名键
   * @param oldKey 旧键
   * @param newKey 新键
   */
  rename(key: string, newKey: string): Promise<void>

  // ============ 数据结构操作 ============

  /**
   * 列表操作：推入元素到列表末尾
   * @param key 键
   * @param values 值数组
   * @returns 列表长度
   */
  listPush(key: string, ...values: any[]): Promise<number>

  /**
   * 列表操作：从列表末尾弹出元素
   * @param key 键
   * @returns 弹出的元素
   */
  listPop(key: string): Promise<any>

  /**
   * 列表操作：获取列表长度
   * @param key 键
   * @returns 列表长度
   */
  listLength(key: string): Promise<number>

  /**
   * 列表操作：获取列表范围内的元素
   * @param key 键
   * @param start 起始索引
   * @param end 结束索引
   * @returns 元素数组
   */
  listRange(key: string, start: number, end: number): Promise<any[]>

  /**
   * 集合操作：添加元素到集合
   * @param key 键
   * @param members 成员数组
   * @returns 添加的元素数量
   */
  setAdd(key: string, ...members: any[]): Promise<number>

  /**
   * 集合操作：从集合移除元素
   * @param key 键
   * @param members 成员数组
   * @returns 移除的元素数量
   */
  setRemove(key: string, ...members: any[]): Promise<number>

  /**
   * 集合操作：检查元素是否在集合中
   * @param key 键
   * @param member 成员
   * @returns 是否存在
   */
  setContains(key: string, member: any): Promise<boolean>

  /**
   * 集合操作：获取集合大小
   * @param key 键
   * @returns 集合大小
   */
  setSize(key: string): Promise<number>

  /**
   * 集合操作：获取集合所有成员
   * @param key 键
   * @returns 成员数组
   */
  setMembers(key: string): Promise<any[]>

  /**
   * 哈希操作：设置哈希字段
   * @param key 键
   * @param field 字段
   * @param value 值
   */
  hashSet(key: string, field: string, value: any): Promise<void>

  /**
   * 哈希操作：获取哈希字段
   * @param key 键
   * @param field 字段
   * @returns 字段值
   */
  hashGet(key: string, field: string): Promise<any>

  /**
   * 哈希操作：删除哈希字段
   * @param key 键
   * @param fields 字段数组
   * @returns 删除的字段数量
   */
  hashDelete(key: string, ...fields: string[]): Promise<number>

  /**
   * 哈希操作：检查字段是否存在
   * @param key 键
   * @param field 字段
   * @returns 是否存在
   */
  hashExists(key: string, field: string): Promise<boolean>

  /**
   * 哈希操作：获取所有字段
   * @param key 键
   * @returns 字段数组
   */
  hashKeys(key: string): Promise<string[]>

  /**
   * 哈希操作：获取所有值
   * @param key 键
   * @returns 值数组
   */
  hashValues(key: string): Promise<any[]>

  /**
   * 哈希操作：获取所有字段和值
   * @param key 键
   * @returns 字段值映射
   */
  hashGetAll(key: string): Promise<Record<string, any>>

  // ============ 事务操作 ============

  /**
   * 开始事务
   * @returns 事务ID
   */
  beginTransaction(): Promise<string>

  /**
   * 提交事务
   * @param transactionId 事务ID
   */
  commitTransaction(transactionId: string): Promise<void>

  /**
   * 回滚事务
   * @param transactionId 事务ID
   */
  rollbackTransaction(transactionId: string): Promise<void>

  /**
   * 在事务中执行操作
   * @param operations 操作数组
   * @returns 操作结果
   */
  transaction(operations: StorageOperation[]): Promise<any[]>

  // ============ 备份和恢复 ============

  /**
   * 导出数据
   * @param pattern 键模式，可选
   * @returns 导出的数据
   */
  export(pattern?: string): Promise<Record<string, any>>

  /**
   * 导入数据
   * @param data 导入的数据
   * @param overwrite 是否覆盖现有数据
   */
  import(data: Record<string, any>, overwrite?: boolean): Promise<void>

  /**
   * 创建备份
   * @param name 备份名称
   * @returns 备份ID
   */
  createBackup(name: string): Promise<string>

  /**
   * 恢复备份
   * @param backupId 备份ID
   */
  restoreBackup(backupId: string): Promise<void>

  /**
   * 列出备份
   * @returns 备份列表
   */
  listBackups(): Promise<StorageBackup[]>

  /**
   * 删除备份
   * @param backupId 备份ID
   */
  deleteBackup(backupId: string): Promise<void>

  // ============ 监听和通知 ============

  /**
   * 监听键变化
   * @param pattern 键模式
   * @param callback 回调函数
   * @returns 监听器ID
   */
  watch(pattern: string, callback: (event: StorageEvent) => void): Promise<string>

  /**
   * 取消监听
   * @param watchId 监听器ID
   */
  unwatch(watchId: string): Promise<void>

  /**
   * 发布消息
   * @param channel 频道
   * @param message 消息
   */
  publish(channel: string, message: any): Promise<void>

  /**
   * 订阅频道
   * @param channel 频道
   * @param callback 回调函数
   * @returns 订阅ID
   */
  subscribe(channel: string, callback: (message: any) => void): Promise<string>

  /**
   * 取消订阅
   * @param subscriptionId 订阅ID
   */
  unsubscribe(subscriptionId: string): Promise<void>
}

/**
 * 存储操作
 */
export interface StorageOperation {
  /** 操作类型 */
  type: 'set' | 'get' | 'delete' | 'increment' | 'decrement'
  /** 键 */
  key: string
  /** 值（用于set操作） */
  value?: any
  /** 增量（用于increment/decrement操作） */
  amount?: number
  /** 过期时间 */
  ttl?: number
}

/**
 * 存储事件
 */
export interface StorageEvent {
  /** 事件类型 */
  type: 'set' | 'delete' | 'expire'
  /** 键 */
  key: string
  /** 新值（用于set事件） */
  newValue?: any
  /** 旧值 */
  oldValue?: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 存储备份
 */
export interface StorageBackup {
  /** 备份ID */
  id: string
  /** 备份名称 */
  name: string
  /** 创建时间 */
  createdAt: string
  /** 备份大小 */
  size: number
  /** 键数量 */
  keyCount: number
  /** 备份描述 */
  description?: string
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  /** 总键数 */
  keyCount: number
  /** 总大小 */
  totalSize: number
  /** 内存使用量 */
  memoryUsage: number
  /** 过期键数 */
  expiredKeys: number
  /** 最后清理时间 */
  lastCleanup: string
}

/**
 * 存储配置
 */
export interface StorageConfig {
  /** 最大存储大小 */
  maxSize?: number
  /** 默认过期时间 */
  defaultTTL?: number
  /** 自动清理间隔 */
  cleanupInterval?: number
  /** 压缩配置 */
  compression?: {
    enabled: boolean
    threshold: number
    algorithm: 'gzip' | 'lz4' | 'snappy'
  }
  /** 持久化配置 */
  persistence?: {
    enabled: boolean
    interval: number
    location: string
  }
}