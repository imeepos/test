import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { websocketService } from '@/services'
import { useNodeStore } from './nodeStore'
import type {
  AIProcessingState,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModel,
  WebSocketStatus
} from '@/types'

export interface AIState {
  // AI处理状态
  processingNodes: Map<string, AIProcessingState>
  recentResults: Map<string, AIGenerateResponse>
  
  // WebSocket连接状态
  connectionStatus: WebSocketStatus
  lastConnectionTime?: Date
  reconnectAttempts: number
  
  // AI配置
  currentModel: AIModel
  isAvailable: boolean
  
  // 性能指标
  metrics: {
    requestCount: number
    successCount: number
    errorCount: number
    averageResponseTime: number
    totalResponseTime: number
  }
  
  // 请求队列
  requestQueue: Array<{
    id: string
    request: AIGenerateRequest
    priority: number
    createdAt: Date
  }>
  
  // Actions
  startProcessing: (nodeId: string, request: AIGenerateRequest) => void
  updateProcessingStatus: (nodeId: string, status: Partial<AIProcessingState>) => void
  completeProcessing: (nodeId: string, result: AIGenerateResponse) => void
  failProcessing: (nodeId: string, error: string) => void
  
  // WebSocket管理
  setConnectionStatus: (status: WebSocketStatus) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  connectWebSocket: () => Promise<void>
  disconnectWebSocket: () => void
  initializeWebSocket: () => Promise<(() => void) | void>
  
  // 配置管理
  setModel: (model: AIModel) => void
  setAvailable: (available: boolean) => void
  
  // 指标更新
  recordRequest: () => void
  recordSuccess: (responseTime: number) => void
  recordError: () => void
  
  // 队列管理
  addToQueue: (request: AIGenerateRequest, priority?: number) => string
  removeFromQueue: (id: string) => void
  getNextInQueue: () => { id: string; request: AIGenerateRequest } | undefined
  clearQueue: () => void
  
  // 结果缓存
  cacheResult: (inputs: string[], result: AIGenerateResponse) => void
  getCachedResult: (inputs: string[]) => AIGenerateResponse | undefined
  clearCache: () => void

  // 队列请求处理
  processQueuedRequests: () => Promise<void>
}

const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useAIStore = create<AIState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      processingNodes: new Map(),
      recentResults: new Map(),
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
      currentModel: 'gpt-3.5-turbo',
      isAvailable: false,
      metrics: {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
      },
      requestQueue: [],
      
      // AI处理管理
      startProcessing: (nodeId, request) => {
        console.log('🚀 startProcessing called:', { nodeId, request })

        const processingState: AIProcessingState = {
          nodeId,
          status: 'queued',
          startTime: new Date(),
        }

        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          newProcessingNodes.set(nodeId, processingState)
          return { processingNodes: newProcessingNodes }
        })

        // 将请求添加到队列，确保断线重连后可以继续处理
        const queueId = get().addToQueue(request, 1)
        console.log('📥 Request added to queue:', { queueId, queueLength: get().requestQueue.length })

        // 如果已连接，立即处理队列
        const connectionStatus = get().connectionStatus
        console.log('🔌 Connection status:', connectionStatus)

        if (connectionStatus === 'connected') {
          console.log('✅ Connection is ready, processing queue immediately')
          get().processQueuedRequests()
        } else {
          console.warn('⚠️ Connection not ready, request queued until connection is established')
        }
      },
      
      updateProcessingStatus: (nodeId, updates) => {
        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const current = newProcessingNodes.get(nodeId)
          if (current) {
            newProcessingNodes.set(nodeId, { ...current, ...updates })
          }
          return { processingNodes: newProcessingNodes }
        })
      },
      
      completeProcessing: (nodeId, result) => {
        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const newRecentResults = new Map(state.recentResults)

          const processingState = newProcessingNodes.get(nodeId)
          if (processingState) {
            const responseTime = Date.now() - processingState.startTime.getTime()
            get().recordSuccess(responseTime)

            newProcessingNodes.set(nodeId, {
              ...processingState,
              status: 'completed',
              endTime: new Date(),
            })
          }

          newRecentResults.set(nodeId, result)

          // 限制缓存大小
          if (newRecentResults.size > 50) {
            const firstKey = newRecentResults.keys().next().value
            if (firstKey) {
              newRecentResults.delete(firstKey)
            }
          }

          return {
            processingNodes: newProcessingNodes,
            recentResults: newRecentResults,
          }
        })

        // 更新nodeStore中的节点状态
        const nodeStore = useNodeStore.getState()
        const node = nodeStore.getNode(nodeId)
        if (node) {
          console.log('✅ 更新节点状态为completed:', nodeId, result)
          nodeStore.updateNode(nodeId, {
            content: result.content,
            title: result.title || node.title,
            confidence: (result.confidence || 80) / 100, // 转换为0-1范围
            status: 'completed',
            tags: result.tags || node.tags,
          })
        }
      },
      
      failProcessing: (nodeId, error) => {
        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const processingState = newProcessingNodes.get(nodeId)

          if (processingState) {
            newProcessingNodes.set(nodeId, {
              ...processingState,
              status: 'failed',
              endTime: new Date(),
              error,
            })
          }

          return { processingNodes: newProcessingNodes }
        })

        get().recordError()

        // 更新nodeStore中的节点状态
        const nodeStore = useNodeStore.getState()
        const node = nodeStore.getNode(nodeId)
        if (node) {
          console.log('❌ 更新节点状态为error:', nodeId, error)
          nodeStore.updateNode(nodeId, {
            content: `AI生成失败: ${error}`,
            status: 'error',
          })
        }
      },
      
      // WebSocket连接管理
      setConnectionStatus: (connectionStatus) => {
        set({
          connectionStatus,
          lastConnectionTime: connectionStatus === 'connected' ? new Date() : get().lastConnectionTime,
          isAvailable: connectionStatus === 'connected',
        })

        if (connectionStatus === 'connected') {
          get().resetReconnectAttempts()
          // 连接恢复后，处理队列中的请求
          get().processQueuedRequests()
        } else if (connectionStatus === 'disconnected') {
          // 断线时，将处理中的任务标记为等待重连
          const state = get()
          state.processingNodes.forEach((node, nodeId) => {
            if (node.status === 'processing') {
              get().updateProcessingStatus(nodeId, { status: 'queued' })
            }
          })
        }
      },
      
      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        }))
      },
      
      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 })
      },

      // WebSocket服务集成
      connectWebSocket: async () => {
        try {
          get().setConnectionStatus('connecting')
          await websocketService.connect()
          get().setConnectionStatus('connected')
        } catch (error) {
          console.error('WebSocket连接失败:', error)
          get().setConnectionStatus('disconnected')
          get().incrementReconnectAttempts()
          throw error
        }
      },

      disconnectWebSocket: () => {
        websocketService.disconnect()
        get().setConnectionStatus('disconnected')
      },

      initializeWebSocket: async () => {
        // 监听WebSocket状态变化
        const statusUnsubscribe = websocketService.onStatusChange((status) => {
          get().setConnectionStatus(status)
        })

        // 监听AI生成响应
        const responseUnsubscribe = websocketService.subscribe('AI_GENERATE_RESPONSE', (message) => {
          console.log('📥 收到AI_GENERATE_RESPONSE:', message)
          const { nodeId, result, taskId, requestId } = message.payload
          const effectiveNodeId = nodeId || taskId || requestId
          if (effectiveNodeId && result) {
            get().completeProcessing(effectiveNodeId, result)
          }
        })

        // 监听AI任务结果（从Gateway发送的消息）
        const taskResultUnsubscribe = websocketService.subscribe('ai_task_result', (message) => {
          console.log('📥 收到ai_task_result:', message)
          const { taskId, requestId, status, result, error } = message.payload
          const effectiveNodeId = taskId || requestId

          if (!effectiveNodeId) {
            console.warn('⚠️ ai_task_result缺少taskId/requestId')
            return
          }

          if (status === 'completed' && result) {
            get().completeProcessing(effectiveNodeId, result)
          } else if (status === 'error' && error) {
            get().failProcessing(effectiveNodeId, error.message || error)
          } else if (status === 'processing') {
            get().updateProcessingStatus(effectiveNodeId, { status: 'processing' })
          }
        })

        // 监听AI生成错误
        const errorUnsubscribe = websocketService.subscribe('AI_GENERATE_ERROR', (message) => {
          console.log('📥 收到AI_GENERATE_ERROR:', message)
          const { nodeId, error, taskId, requestId } = message.payload
          const effectiveNodeId = nodeId || taskId || requestId
          if (effectiveNodeId && error) {
            get().failProcessing(effectiveNodeId, error)
          }
        })

        // 监听节点状态更新
        const updateUnsubscribe = websocketService.subscribe('NODE_UPDATE', (message) => {
          const { nodeId, status } = message.payload
          if (nodeId && status) {
            get().updateProcessingStatus(nodeId, status)
          }
        })

        // 尝试连接
        try {
          await get().connectWebSocket()
        } catch (error) {
          console.warn('初始WebSocket连接失败，将在后台重试')
        }

        // 返回清理函数
        return () => {
          statusUnsubscribe()
          responseUnsubscribe()
          taskResultUnsubscribe()
          errorUnsubscribe()
          updateUnsubscribe()
          get().disconnectWebSocket()
        }
      },
      
      // 配置管理
      setModel: (currentModel) => {
        set({ currentModel })
      },
      
      setAvailable: (isAvailable) => {
        set({ isAvailable })
      },
      
      // 指标记录
      recordRequest: () => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            requestCount: state.metrics.requestCount + 1,
          },
        }))
      },
      
      recordSuccess: (responseTime) => {
        set((state) => {
          const newTotalTime = state.metrics.totalResponseTime + responseTime
          const newSuccessCount = state.metrics.successCount + 1
          
          return {
            metrics: {
              ...state.metrics,
              successCount: newSuccessCount,
              totalResponseTime: newTotalTime,
              averageResponseTime: newTotalTime / newSuccessCount,
            },
          }
        })
      },
      
      recordError: () => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            errorCount: state.metrics.errorCount + 1,
          },
        }))
      },
      
      // 队列管理
      addToQueue: (request, priority = 0) => {
        const id = generateRequestId()
        
        set((state) => ({
          requestQueue: [
            ...state.requestQueue,
            {
              id,
              request,
              priority,
              createdAt: new Date(),
            },
          ].sort((a, b) => b.priority - a.priority), // 高优先级在前
        }))
        
        return id
      },
      
      removeFromQueue: (id) => {
        set((state) => ({
          requestQueue: state.requestQueue.filter(item => item.id !== id),
        }))
      },
      
      getNextInQueue: () => {
        const queue = get().requestQueue
        return queue.length > 0 ? queue[0] : undefined
      },
      
      clearQueue: () => {
        set({ requestQueue: [] })
      },
      
      // 结果缓存
      cacheResult: (inputs, result) => {
        // 简单的基于输入的缓存key
        const cacheKey = inputs.join('|')
        set((state) => {
          const newRecentResults = new Map(state.recentResults)
          newRecentResults.set(cacheKey, result)
          return { recentResults: newRecentResults }
        })
      },
      
      getCachedResult: (inputs) => {
        const cacheKey = inputs.join('|')
        return get().recentResults.get(cacheKey)
      },
      
      clearCache: () => {
        set({
          recentResults: new Map(),
          processingNodes: new Map(),
        })
      },

      // 处理队列中的请求
      processQueuedRequests: async () => {
        const queue = get().requestQueue
        console.log(`🔄 processQueuedRequests called, queue length: ${queue.length}`)

        if (queue.length === 0) {
          console.log('📭 Queue is empty, nothing to process')
          return
        }

        console.log(`🔄 处理队列中的 ${queue.length} 个AI请求`)

        // 逐个处理队列中的请求
        for (const item of queue) {
          const nodeId = item.request.nodeId
          console.log(`📤 Processing queued request:`, { id: item.id, nodeId, request: item.request })

          if (!nodeId) {
            console.warn('队列请求缺少 nodeId，跳过')
            get().removeFromQueue(item.id)
            continue
          }

          try {
            get().updateProcessingStatus(nodeId, { status: 'processing' })
            console.log(`🚀 Calling websocketService.generateContent for nodeId: ${nodeId}`)
            const result = await websocketService.generateContent(item.request)
            console.log(`✅ generateContent completed:`, result)
            get().completeProcessing(nodeId, result)
            get().removeFromQueue(item.id)
          } catch (error) {
            console.error(`❌ 处理队列请求失败 (${nodeId}):`, error)
            get().failProcessing(nodeId, error instanceof Error ? error.message : '请求失败')
            get().removeFromQueue(item.id)
          }
        }
      },
    }),
    {
      name: 'ai-store',
    }
  )
)