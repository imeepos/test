/**
 * WebSocket实时通信客户端
 */

import { io, Socket } from 'socket.io-client'
import type { WebSocketConfig, WSEvent, WSConnectionEvent, WSRoomEvent } from '../types/index.js'
import { WebSocketError } from '../errors/index.js'

/**
 * 事件监听器类型
 */
type EventListener = (...args: any[]) => void

/**
 * WebSocket客户端类
 */
export class WebSocketClient {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private listeners: Map<string, Set<EventListener>> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectAttempt: number = 0
  private isManualDisconnect: boolean = false
  private rooms: Set<string> = new Set()

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        backoff: 'exponential'
      },
      heartbeat: {
        enabled: true,
        interval: 30000
      },
      ...config
    }
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualDisconnect = false

        this.socket = io(this.config.url, {
          auth: this.config.auth,
          reconnection: false, // 手动处理重连
          transports: ['websocket', 'polling']
        })

        this.setupSocketListeners()

        // 连接成功
        this.socket.once('connect', () => {
          this.log('✅ WebSocket连接已建立')
          this.reconnectAttempt = 0
          this.startHeartbeat()
          this.emitConnectionEvent('connected')
          resolve()
        })

        // 连接错误
        this.socket.once('connect_error', (error) => {
          this.log('❌ WebSocket连接失败:', error.message)
          reject(new WebSocketError('连接失败', undefined, error.message))
        })

        // 连接超时
        setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new WebSocketError('连接超时'))
          }
        }, 10000)
      } catch (error: any) {
        reject(new WebSocketError(error.message))
      }
    })
  }

  /**
   * 设置Socket事件监听
   */
  private setupSocketListeners(): void {
    if (!this.socket) return

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      this.log('WebSocket断开连接:', reason)
      this.stopHeartbeat()
      this.emitConnectionEvent('disconnected', reason)

      // 自动重连
      if (!this.isManualDisconnect && this.config.reconnect?.enabled) {
        this.attemptReconnect()
      }
    })

    // 错误事件
    this.socket.on('error', (error) => {
      this.log('WebSocket错误:', error)
      this.emitConnectionEvent('error', error)
    })

    // 重新注册所有事件监听器
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback)
      })
    })
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    const maxAttempts = this.config.reconnect?.maxAttempts || 5

    if (this.reconnectAttempt >= maxAttempts) {
      this.log(`❌ 达到最大重连次数(${maxAttempts})`)
      this.emitConnectionEvent('error', `重连失败,已达到最大尝试次数`)
      return
    }

    this.reconnectAttempt++
    const delay = this.calculateReconnectDelay()

    this.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempt}次重连...`)
    this.emitConnectionEvent('reconnecting', undefined, this.reconnectAttempt)

    setTimeout(() => {
      this.connect().catch((error) => {
        this.log(`第${this.reconnectAttempt}次重连失败:`, error.message)
      })
    }, delay)
  }

  /**
   * 计算重连延迟
   */
  private calculateReconnectDelay(): number {
    const backoff = this.config.reconnect?.backoff || 'exponential'

    if (backoff === 'exponential') {
      // 指数退避: 1s, 2s, 4s, 8s, 16s...
      return Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1), 30000)
    } else {
      // 线性退避: 1s, 2s, 3s, 4s, 5s...
      return Math.min(1000 * this.reconnectAttempt, 30000)
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeat?.enabled) return

    const interval = this.config.heartbeat.interval || 30000

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() })
        this.log('💓 心跳发送')
      }
    }, interval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 发出连接事件
   */
  private emitConnectionEvent(
    status: 'connected' | 'disconnected' | 'reconnecting' | 'error',
    message?: string,
    attempt?: number
  ): void {
    const event: WSConnectionEvent = {
      status,
      message,
      attempt
    }

    // 触发内部监听器
    const internalEvent = status === 'connected' ? 'connected' : 'disconnected'
    this.emitToListeners(internalEvent, event)
  }

  /**
   * 触发监听器
   */
  private emitToListeners(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(...args)
        } catch (error) {
          this.log(`事件监听器错误 (${event}):`, error)
        }
      })
    }
  }

  // ==================== 公共API方法 ====================

  /**
   * 监听事件
   */
  on(event: string, callback: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(callback)

    // 如果socket已连接,立即注册
    if (this.socket?.connected) {
      this.socket.on(event, callback)
    }
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback?: EventListener): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback)
      this.socket?.off(event, callback)
    } else {
      this.listeners.delete(event)
      this.socket?.off(event)
    }
  }

  /**
   * 一次性事件监听
   */
  once(event: string, callback: EventListener): void {
    const wrapper = (...args: any[]) => {
      callback(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  /**
   * 发送消息
   */
  async send(event: string, data: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new WebSocketError('WebSocket未连接')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit(event, data, (response: any) => {
        if (response?.error) {
          reject(new WebSocketError(response.error))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 加入房间
   */
  async joinRoom(roomId: string, metadata?: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new WebSocketError('WebSocket未连接')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-room', { roomId, ...metadata }, (response: any) => {
        if (response?.success) {
          this.rooms.add(roomId)
          this.log(`✅ 加入房间: ${roomId}`)
          resolve()
        } else {
          reject(new WebSocketError(response?.error || '加入房间失败'))
        }
      })
    })
  }

  /**
   * 离开房间
   */
  async leaveRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new WebSocketError('WebSocket未连接')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('leave-room', { roomId }, (response: any) => {
        if (response?.success) {
          this.rooms.delete(roomId)
          this.log(`👋 离开房间: ${roomId}`)
          resolve()
        } else {
          reject(new WebSocketError(response?.error || '离开房间失败'))
        }
      })
    })
  }

  /**
   * 广播消息到房间
   */
  async broadcast(roomId: string, event: string, data: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new WebSocketError('WebSocket未连接')
    }

    if (!this.rooms.has(roomId)) {
      throw new WebSocketError(`未加入房间: ${roomId}`)
    }

    return this.send('broadcast', { roomId, event, data })
  }

  /**
   * 断开连接
   */
  async close(): Promise<void> {
    this.isManualDisconnect = true
    this.stopHeartbeat()

    // 离开所有房间
    const leavePromises = Array.from(this.rooms).map((roomId) =>
      this.leaveRoom(roomId).catch(() => {})
    )
    await Promise.all(leavePromises)

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.listeners.clear()
    this.rooms.clear()

    this.log('👋 WebSocket已关闭')
  }

  /**
   * 获取连接状态
   */
  get connected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * 获取加入的房间列表
   */
  getRooms(): string[] {
    return Array.from(this.rooms)
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args)
    }
  }
}
