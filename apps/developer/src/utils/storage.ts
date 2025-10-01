/**
 * 本地存储工具函数
 * 封装 localStorage 和 sessionStorage
 */

type StorageType = 'local' | 'session'

/**
 * 获取存储对象 (内部工具函数)
 */
function getStorageObject(type: StorageType): Storage {
  return type === 'local' ? localStorage : sessionStorage
}

/**
 * 存储数据
 */
export function setStorage<T>(key: string, value: T, type: StorageType = 'local'): void {
  try {
    const storage = getStorageObject(type)
    const serializedValue = JSON.stringify(value)
    storage.setItem(key, serializedValue)
  } catch (error) {
    console.error('Failed to set storage:', error)
  }
}

/**
 * 获取数据
 */
export function getStorage<T>(key: string, type: StorageType = 'local'): T | null {
  try {
    const storage = getStorageObject(type)
    const serializedValue = storage.getItem(key)
    if (serializedValue === null) {
      return null
    }
    return JSON.parse(serializedValue) as T
  } catch (error) {
    console.error('Failed to get storage:', error)
    return null
  }
}

/**
 * 移除数据
 */
export function removeStorage(key: string, type: StorageType = 'local'): void {
  try {
    const storage = getStorageObject(type)
    storage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove storage:', error)
  }
}

/**
 * 清空所有数据
 */
export function clearStorage(type: StorageType = 'local'): void {
  try {
    const storage = getStorageObject(type)
    storage.clear()
  } catch (error) {
    console.error('Failed to clear storage:', error)
  }
}

/**
 * 获取所有键
 */
export function getAllKeys(type: StorageType = 'local'): string[] {
  try {
    const storage = getStorageObject(type)
    return Object.keys(storage)
  } catch (error) {
    console.error('Failed to get all keys:', error)
    return []
  }
}

/**
 * 检查键是否存在
 */
export function hasKey(key: string, type: StorageType = 'local'): boolean {
  try {
    const storage = getStorageObject(type)
    return storage.getItem(key) !== null
  } catch (error) {
    console.error('Failed to check key:', error)
    return false
  }
}

/**
 * 获取存储大小 (字节)
 */
export function getStorageSize(type: StorageType = 'local'): number {
  try {
    const storage = getStorageObject(type)
    let size = 0
    for (const key in storage) {
      if (Object.prototype.hasOwnProperty.call(storage, key)) {
        size += storage[key].length + key.length
      }
    }
    return size
  } catch (error) {
    console.error('Failed to get storage size:', error)
    return 0
  }
}
