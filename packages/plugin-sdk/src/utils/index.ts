/**
 * SDK工具函数
 */

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}

/**
 * 深度合并对象
 * @param target 目标对象
 * @param sources 源对象数组
 * @returns 合并后的对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target

  const source = sources.shift()
  if (!source) return target

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (isObject(sourceValue) && isObject(targetValue)) {
        target[key] = deepMerge(targetValue, sourceValue)
      } else {
        target[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * 检查是否为对象
 * @param item 要检查的项
 * @returns 是否为对象
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 延迟执行
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 * @param fn 要重试的函数
 * @param maxAttempts 最大尝试次数
 * @param delayMs 重试间隔（毫秒）
 * @returns Promise
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxAttempts) {
        throw lastError
      }
      await delay(delayMs * attempt)
    }
  }

  throw lastError!
}

/**
 * 并行执行多个Promise，限制并发数
 * @param tasks 任务数组
 * @param concurrency 并发数
 * @returns Promise
 */
export async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const [index, task] of tasks.entries()) {
    const promise = task().then(result => {
      results[index] = result
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化时间差
 * @param timestamp 时间戳
 * @returns 格式化后的时间差
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return `${seconds}秒前`
}

/**
 * 验证邮箱地址
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证URL
 * @param url URL字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 生成颜色
 * @param seed 种子字符串
 * @returns 十六进制颜色
 */
export function generateColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const color = Math.abs(hash).toString(16).substring(0, 6)
  return '#' + '000000'.substring(0, 6 - color.length) + color
}

/**
 * 计算两点间距离
 * @param point1 点1
 * @param point2 点2
 * @returns 距离
 */
export function distance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算角度
 * @param center 中心点
 * @param point 目标点
 * @returns 角度（弧度）
 */
export function angle(
  center: { x: number; y: number },
  point: { x: number; y: number }
): number {
  return Math.atan2(point.y - center.y, point.x - center.x)
}

/**
 * 检查点是否在矩形内
 * @param point 点
 * @param rect 矩形
 * @returns 是否在内部
 */
export function pointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/**
 * 检查两个矩形是否相交
 * @param rect1 矩形1
 * @param rect2 矩形2
 * @returns 是否相交
 */
export function rectIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/**
 * 限制数值范围
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的数值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 线性插值
 * @param start 起始值
 * @param end 结束值
 * @param t 插值参数 (0-1)
 * @returns 插值结果
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * 缓动函数 - 缓入
 * @param t 时间参数 (0-1)
 * @returns 缓动值
 */
export function easeIn(t: number): number {
  return t * t
}

/**
 * 缓动函数 - 缓出
 * @param t 时间参数 (0-1)
 * @returns 缓动值
 */
export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/**
 * 缓动函数 - 缓入缓出
 * @param t 时间参数 (0-1)
 * @returns 缓动值
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * 解析查询字符串
 * @param queryString 查询字符串
 * @returns 解析后的对象
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(queryString)

  for (const [key, value] of searchParams) {
    params[key] = value
  }

  return params
}

/**
 * 构建查询字符串
 * @param params 参数对象
 * @returns 查询字符串
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * 转义HTML
 * @param html HTML字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * 解转义HTML
 * @param html 转义的HTML字符串
 * @returns 解转义后的字符串
 */
export function unescapeHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * 下载文件
 * @param content 文件内容
 * @param filename 文件名
 * @param mimeType MIME类型
 */
export function downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * 读取文件内容
 * @param file 文件对象
 * @returns Promise<string>
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * 读取文件为DataURL
 * @param file 文件对象
 * @returns Promise<string>
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * 类型守卫 - 检查是否为字符串
 */
export function isString(value: any): value is string {
  return typeof value === 'string'
}

/**
 * 类型守卫 - 检查是否为数字
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 类型守卫 - 检查是否为布尔值
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 类型守卫 - 检查是否为数组
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value)
}

/**
 * 类型守卫 - 检查是否为函数
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function'
}

/**
 * 创建事件发射器
 */
export function createEventEmitter<T extends Record<string, any>>() {
  const listeners: Partial<{ [K in keyof T]: Array<(data: T[K]) => void> }> = {}

  return {
    on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
      if (!listeners[event]) {
        listeners[event] = []
      }
      listeners[event]!.push(listener)
    },

    off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
      if (listeners[event]) {
        const index = listeners[event]!.indexOf(listener)
        if (index > -1) {
          listeners[event]!.splice(index, 1)
        }
      }
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      if (listeners[event]) {
        listeners[event]!.forEach(listener => listener(data))
      }
    },

    removeAllListeners<K extends keyof T>(event?: K): void {
      if (event) {
        delete listeners[event]
      } else {
        Object.keys(listeners).forEach(key => delete listeners[key as K])
      }
    }
  }
}