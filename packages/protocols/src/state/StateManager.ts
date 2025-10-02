/**
 * 状态管理器
 *
 * 提供类似LangGraph的状态管理能力
 */

// ============================================================================
// 状态归约器类型
// ============================================================================

export type StateReducer<T = any> = (prev: T, next: T) => T

export type BuiltinReducerType =
  | 'replace'      // 替换
  | 'append'       // 追加（数组）
  | 'merge'        // 合并（对象）
  | 'max'          // 最大值
  | 'min'          // 最小值
  | 'sum'          // 求和
  | 'concat'       // 拼接（字符串）

// ============================================================================
// 状态字段配置
// ============================================================================

export interface StateFieldConfig<T = any> {
  reducer: BuiltinReducerType | StateReducer<T>
  initialValue?: T
  validate?: (value: T) => boolean
  transform?: (value: T) => T
}

// ============================================================================
// 状态模式定义
// ============================================================================

export type StateSchema = Record<string, StateFieldConfig>

// ============================================================================
// 状态快照
// ============================================================================

export interface StateSnapshot {
  version: number
  timestamp: Date
  data: Record<string, any>
  metadata?: {
    nodeId?: string
    operation?: string
  }
}

// ============================================================================
// 内置归约器
// ============================================================================

export const BuiltinReducers = {
  /**
   * 替换策略
   */
  replace: <T>(_prev: T, next: T): T => next,

  /**
   * 追加策略（数组）
   */
  append: <T>(prev: T[], next: T | T[]): T[] => {
    const prevArray = Array.isArray(prev) ? prev : []
    const nextArray = Array.isArray(next) ? next : [next]
    return [...prevArray, ...nextArray]
  },

  /**
   * 合并策略（对象）
   */
  merge: <T extends object>(prev: T, next: Partial<T>): T => {
    if (typeof prev !== 'object' || typeof next !== 'object') {
      return next as T
    }
    return { ...prev, ...next }
  },

  /**
   * 最大值策略
   */
  max: (prev: number, next: number): number => Math.max(prev ?? -Infinity, next),

  /**
   * 最小值策略
   */
  min: (prev: number, next: number): number => Math.min(prev ?? Infinity, next),

  /**
   * 求和策略
   */
  sum: (prev: number, next: number): number => (prev ?? 0) + next,

  /**
   * 拼接策略（字符串）
   */
  concat: (prev: string, next: string): string => (prev ?? '') + next
}

// ============================================================================
// 状态管理器
// ============================================================================

export class StateManager<TSchema extends StateSchema = StateSchema> {
  private schema: TSchema
  private currentState: Record<string, any> = {}
  private history: StateSnapshot[] = []
  private maxHistorySize: number

  constructor(schema: TSchema, options?: {
    maxHistorySize?: number
    enableHistory?: boolean
  }) {
    this.schema = schema
    this.maxHistorySize = options?.maxHistorySize || 100

    // 初始化状态
    for (const [key, config] of Object.entries(schema)) {
      if (config.initialValue !== undefined) {
        this.currentState[key] = config.initialValue
      }
    }

    // 保存初始快照
    if (options?.enableHistory !== false) {
      this.saveSnapshot('init')
    }
  }

  /**
   * 获取当前状态
   */
  getState(): Readonly<Record<string, any>> {
    return { ...this.currentState }
  }

  /**
   * 获取特定字段的值
   */
  get<K extends keyof TSchema>(key: K): any {
    return this.currentState[key as string]
  }

  /**
   * 更新状态
   */
  update(updates: Partial<Record<string, any>>, metadata?: {
    nodeId?: string
    operation?: string
  }): void {
    for (const [key, value] of Object.entries(updates)) {
      this.updateField(key, value)
    }

    // 保存快照
    this.saveSnapshot(metadata?.operation || 'update', metadata)
  }

  /**
   * 更新单个字段
   */
  private updateField(key: string, value: any): void {
    const config = this.schema[key]

    if (!config) {
      // 允许动态字段
      this.currentState[key] = value
      return
    }

    // 验证
    if (config.validate && !config.validate(value)) {
      throw new Error(`Validation failed for field: ${key}`)
    }

    // 转换
    const transformedValue = config.transform ? config.transform(value) : value

    // 应用归约器
    const reducer = this.getReducer(config.reducer)
    const prevValue = this.currentState[key]
    this.currentState[key] = reducer(prevValue, transformedValue)
  }

  /**
   * 获取归约器函数
   */
  private getReducer(reducer: BuiltinReducerType | StateReducer): StateReducer {
    if (typeof reducer === 'function') {
      return reducer
    }

    const builtinReducer = BuiltinReducers[reducer]
    if (!builtinReducer) {
      throw new Error(`Unknown builtin reducer: ${reducer}`)
    }

    return builtinReducer as StateReducer
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.currentState = {}

    // 重新应用初始值
    for (const [key, config] of Object.entries(this.schema)) {
      if (config.initialValue !== undefined) {
        this.currentState[key] = config.initialValue
      }
    }

    this.saveSnapshot('reset')
  }

  /**
   * 保存快照
   */
  private saveSnapshot(operation: string, metadata?: {
    nodeId?: string
    operation?: string
  }): void {
    const snapshot: StateSnapshot = {
      version: this.history.length + 1,
      timestamp: new Date(),
      data: { ...this.currentState },
      metadata: {
        ...metadata,
        operation
      }
    }

    this.history.push(snapshot)

    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }
  }

  /**
   * 获取历史快照
   */
  getHistory(): ReadonlyArray<StateSnapshot> {
    return [...this.history]
  }

  /**
   * 回滚到指定版本
   */
  rollback(version: number): void {
    const snapshot = this.history.find(s => s.version === version)

    if (!snapshot) {
      throw new Error(`Snapshot version ${version} not found`)
    }

    this.currentState = { ...snapshot.data }
    this.saveSnapshot(`rollback_to_v${version}`)
  }

  /**
   * 回滚到上一个状态
   */
  undo(): void {
    if (this.history.length < 2) {
      throw new Error('No previous state to undo to')
    }

    const previousSnapshot = this.history[this.history.length - 2]
    this.currentState = { ...previousSnapshot.data }

    // 不添加新快照，只移除最后一个
    this.history.pop()
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    const currentSnapshot = this.history[this.history.length - 1]
    this.history = currentSnapshot ? [currentSnapshot] : []
  }

  /**
   * 导出为JSON
   */
  toJSON(): any {
    return {
      schema: Object.entries(this.schema).map(([key, config]) => ({
        key,
        reducer: typeof config.reducer === 'string' ? config.reducer : 'custom',
        initialValue: config.initialValue
      })),
      currentState: this.currentState,
      historySize: this.history.length
    }
  }

  /**
   * 克隆状态管理器
   */
  clone(): StateManager<TSchema> {
    const cloned = new StateManager(this.schema, {
      maxHistorySize: this.maxHistorySize,
      enableHistory: false
    })

    cloned.currentState = { ...this.currentState }
    cloned.history = [...this.history]

    return cloned
  }
}

// ============================================================================
// 便捷工厂函数
// ============================================================================

/**
 * 创建状态管理器
 */
export function createStateManager<TSchema extends StateSchema>(
  schema: TSchema,
  options?: {
    maxHistorySize?: number
    enableHistory?: boolean
  }
): StateManager<TSchema> {
  return new StateManager(schema, options)
}

/**
 * 创建简单的消息状态
 */
export function createMessageState() {
  return createStateManager({
    messages: {
      reducer: 'append',
      initialValue: []
    }
  })
}

/**
 * 创建Agent状态
 */
export function createAgentState() {
  return createStateManager({
    messages: {
      reducer: 'append',
      initialValue: []
    },
    next: {
      reducer: 'replace',
      initialValue: null
    },
    iterations: {
      reducer: 'sum',
      initialValue: 0
    },
    maxIterations: {
      reducer: 'replace',
      initialValue: 10
    }
  })
}
